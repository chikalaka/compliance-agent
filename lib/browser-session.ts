import { chromium, Browser, BrowserContext } from "playwright"
import * as fs from "fs"
import * as path from "path"
import { SessionStatus } from "@/types/browser-auth.types"

const SESSION_ID = "compliance-agent-browser"
const SESSIONS_DIR = ".sessions"

// Module-level state to hold the active auth browser session
let activeBrowser: Browser | null = null
let activeContext: BrowserContext | null = null

export interface AuthBrowserOptions {
  timeout?: number // Max time to wait for auth (ms)
}

/**
 * Gets the path to the session JSON file.
 */
export function getSessionPath(): string {
  return path.join(process.cwd(), SESSIONS_DIR, `${SESSION_ID}.json`)
}

/**
 * Ensures the sessions directory exists.
 */
function ensureSessionsDir(): void {
  const dir = path.join(process.cwd(), SESSIONS_DIR)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * Checks if the session file exists.
 */
export function sessionExists(): boolean {
  return fs.existsSync(getSessionPath())
}

/**
 * Reads the session file and checks for cookies from specified domains.
 */
export function hasValidCookies(domains: string[]): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  domains.forEach((domain) => (result[domain] = false))

  if (!sessionExists()) {
    return result
  }

  try {
    const sessionData = JSON.parse(fs.readFileSync(getSessionPath(), "utf-8"))
    const cookies = sessionData.cookies || []

    for (const domain of domains) {
      // Check for cookies that match the domain
      const hasCookie = cookies.some((cookie: { domain: string }) => {
        const cookieDomain = cookie.domain.replace(/^\./, "") // Remove leading dot
        return cookieDomain.includes(domain) || domain.includes(cookieDomain)
      })
      result[domain] = hasCookie
    }
  } catch (error) {
    console.error("Error reading session file:", error)
  }

  return result
}

interface CookieData {
  domain: string
  name: string
  value: string
  expires?: number
}

/**
 * Helper to check if a cookie is valid (has non-empty value and is not expired).
 */
function isValidCookie(cookie: CookieData): boolean {
  // Check that value is not empty or just whitespace
  if (!cookie.value || cookie.value.trim() === "") {
    return false
  }

  // Check if cookie has expired (expires is in seconds since epoch, -1 means session cookie)
  if (cookie.expires && cookie.expires !== -1) {
    const expiresMs = cookie.expires * 1000
    if (expiresMs < Date.now()) {
      return false
    }
  }

  return true
}

/**
 * Gets the current session status for GitHub, Linear, Google Workspace, and AWS.
 * Checks for specific authentication cookies with strict validation.
 */
export function getSessionStatus(): SessionStatus {
  if (!sessionExists()) {
    return {
      authenticated: false,
      services: {
        github: false,
        linear: false,
        googleWorkspace: false,
        aws: false,
      },
    }
  }

  try {
    const sessionData = JSON.parse(fs.readFileSync(getSessionPath(), "utf-8"))
    const cookies: CookieData[] = sessionData.cookies || []

    // Check for GitHub authentication
    // GitHub sets `user_session` cookie when logged in, and `logged_in=yes`
    const hasGithubAuth = cookies.some((cookie) => {
      const domain = cookie.domain.replace(/^\./, "")
      const isGithubDomain = domain.includes("github.com")
      if (!isGithubDomain || !isValidCookie(cookie)) return false

      // Primary indicator: user_session cookie with substantial value
      if (cookie.name === "user_session" && cookie.value.length > 20) {
        return true
      }
      // Secondary indicator: logged_in cookie explicitly set to "yes"
      if (cookie.name === "logged_in" && cookie.value === "yes") {
        return true
      }
      return false
    })

    // Check for Linear authentication
    // Linear uses cookies with "linear" prefix for auth
    const hasLinearAuth = cookies.some((cookie) => {
      const domain = cookie.domain.replace(/^\./, "")
      const isLinearDomain = domain.includes("linear.app")
      if (!isLinearDomain || !isValidCookie(cookie)) return false

      const name = cookie.name.toLowerCase()
      // Look for Linear-specific auth cookies
      // Linear typically uses cookies like `linear-xxx` or session tokens
      if (name.startsWith("linear") && cookie.value.length > 10) {
        return true
      }
      // Also check for common session/token patterns with substantial values
      if (
        (name.includes("session") || name.includes("token")) &&
        cookie.value.length > 20
      ) {
        return true
      }
      return false
    })

    // Check for Google Workspace authentication
    // Google uses SAPISID, SSID, SID, HSID, APISID for auth
    const hasGoogleAuth = cookies.some((cookie) => {
      const domain = cookie.domain.replace(/^\./, "")
      const isGoogleDomain = domain.includes("google.com")
      if (!isGoogleDomain || !isValidCookie(cookie)) return false

      // These are the core Google auth cookies
      const googleAuthCookies = ["SAPISID", "SSID", "SID", "HSID", "APISID"]
      if (googleAuthCookies.includes(cookie.name) && cookie.value.length > 10) {
        return true
      }
      return false
    })

    // Check for AWS authentication
    const hasAwsAuth = cookies.some((cookie) => {
      const domain = cookie.domain.replace(/^\./, "")
      const isAwsDomain =
        domain.includes("aws.amazon.com") ||
        domain.includes("signin.aws.amazon.com")
      if (!isAwsDomain || !isValidCookie(cookie)) return false

      const name = cookie.name.toLowerCase()
      // AWS auth cookies with meaningful values
      if (
        (name.includes("aws-userinfo") ||
          name.includes("aws-creds") ||
          name.includes("noflush_") ||
          cookie.name === "aws-account-alias") &&
        cookie.value.length > 5
      ) {
        return true
      }
      return false
    })

    return {
      authenticated: hasGithubAuth && hasLinearAuth,
      services: {
        github: hasGithubAuth,
        linear: hasLinearAuth,
        googleWorkspace: hasGoogleAuth,
        aws: hasAwsAuth,
      },
    }
  } catch (error) {
    console.error("Error reading session status:", error)
    return {
      authenticated: false,
      services: {
        github: false,
        linear: false,
        googleWorkspace: false,
        aws: false,
      },
    }
  }
}

/**
 * Checks if there's an active auth browser session.
 */
export function isAuthBrowserOpen(): boolean {
  return activeBrowser !== null && activeBrowser.isConnected()
}

/**
 * Starts the auth browser - opens Chrome with tabs for unauthenticated services.
 * Returns immediately after opening the browser (non-blocking).
 * Call stopAuthBrowser() when user is done to save session and close.
 */
export async function startAuthBrowser(): Promise<{
  success: boolean
  error?: string
}> {
  // If browser is already open, return error
  if (isAuthBrowserOpen()) {
    return {
      success: false,
      error: "Auth browser is already open. Click Done when finished.",
    }
  }

  ensureSessionsDir()

  // Check current authentication status to determine which tabs to open
  const currentStatus = getSessionStatus()
  const unauthenticatedServices = {
    github: !currentStatus.services.github,
    linear: !currentStatus.services.linear,
    googleWorkspace: !currentStatus.services.googleWorkspace,
    aws: !currentStatus.services.aws,
  }

  // Check if all services are already authenticated
  const allAuthenticated = Object.values(unauthenticatedServices).every(
    (v) => !v,
  )
  if (allAuthenticated) {
    return {
      success: true,
      error: "All services are already authenticated. No browser needed.",
    }
  }

  const servicesToAuth = Object.entries(unauthenticatedServices)
    .filter(([, needsAuth]) => needsAuth)
    .map(([service]) => service)

  console.log("Services needing authentication:", servicesToAuth.join(", "))

  try {
    // Launch a visible browser using installed Chrome
    activeBrowser = await chromium.launch({
      headless: false,
      channel: "chrome",
      args: [
        "--start-maximized",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    })

    // Load existing session if available
    const existingSession = loadSession()
    const contextOptions: {
      viewport: null
      userAgent: string
      bypassCSP: boolean
      storageState?: string
    } = {
      viewport: null,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      bypassCSP: true,
    }

    if (existingSession) {
      contextOptions.storageState = existingSession
      console.log("Loading existing session into auth browser...")
    }

    const context = await activeBrowser.newContext(contextOptions)
    activeContext = context

    // Helper to add webdriver bypass to a page
    const addWebdriverBypass = async (
      page: Awaited<ReturnType<typeof context.newPage>>,
    ) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => undefined,
        })
      })
    }

    // Track first page for focusing
    let firstPage: Awaited<ReturnType<typeof context.newPage>> | null = null

    // Only open tabs for unauthenticated services
    if (unauthenticatedServices.github) {
      const githubPage = await context.newPage()
      await addWebdriverBypass(githubPage)
      await githubPage.goto("https://github.com/login")
      if (!firstPage) firstPage = githubPage
      console.log("Opened GitHub login tab")
    }

    if (unauthenticatedServices.linear) {
      const linearPage = await context.newPage()
      await addWebdriverBypass(linearPage)
      await linearPage.goto("https://linear.app/login")
      if (!firstPage) firstPage = linearPage
      console.log("Opened Linear login tab")
    }

    if (unauthenticatedServices.googleWorkspace) {
      const googlePage = await context.newPage()
      await addWebdriverBypass(googlePage)
      await googlePage.goto("https://accounts.google.com")
      if (!firstPage) firstPage = googlePage
      console.log("Opened Google login tab")
    }

    if (unauthenticatedServices.aws) {
      const awsPage = await context.newPage()
      await addWebdriverBypass(awsPage)
      await awsPage.goto("https://signin.aws.amazon.com")
      if (!firstPage) firstPage = awsPage
      console.log("Opened AWS login tab")
    }

    // Bring first tab to focus
    if (firstPage) {
      await firstPage.bringToFront()
    }

    console.log(
      "Browser opened for authentication. Click Done when finished logging in.",
    )

    return { success: true }
  } catch (error) {
    // Clean up on error
    if (activeBrowser?.isConnected()) {
      await activeBrowser.close()
    }
    activeBrowser = null
    activeContext = null

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to launch auth browser",
    }
  }
}

/**
 * Stops the auth browser - saves the session and closes the browser.
 * Call this when the user clicks "Done".
 */
export async function stopAuthBrowser(): Promise<{
  success: boolean
  error?: string
}> {
  if (!activeBrowser || !activeContext) {
    return {
      success: false,
      error: "No auth browser is currently open.",
    }
  }

  try {
    // Save the session before closing
    if (activeBrowser.isConnected()) {
      await saveSession(activeContext)
      await activeBrowser.close()
    }

    // Clear the module-level references
    activeBrowser = null
    activeContext = null

    // Check final status
    const status = getSessionStatus()
    console.log("Auth browser closed. Session saved.")

    return { success: status.authenticated }
  } catch (error) {
    // Force cleanup even on error
    try {
      if (activeBrowser?.isConnected()) {
        await activeBrowser.close()
      }
    } catch {
      // Ignore close errors
    }
    activeBrowser = null
    activeContext = null

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to stop auth browser",
    }
  }
}

/**
 * Saves the browser context's storage state to the session file.
 * @param context - The browser context to save
 * @param verbose - Whether to log the save (default: true)
 */
export async function saveSession(
  context: BrowserContext,
  verbose = true,
): Promise<void> {
  ensureSessionsDir()
  const sessionPath = getSessionPath()
  await context.storageState({ path: sessionPath })
  if (verbose) {
    console.log(`Session saved to: ${sessionPath}`)
  }
}

/**
 * Loads the session storage state from file.
 */
export function loadSession(): string | undefined {
  const sessionPath = getSessionPath()
  if (fs.existsSync(sessionPath)) {
    return sessionPath
  }
  return undefined
}

/**
 * Creates a browser context with the saved session.
 * Launches a new headless browser and returns both the browser and context.
 */
export async function getAuthenticatedBrowser(): Promise<{
  browser: Browser
  context: BrowserContext
} | null> {
  const sessionPath = loadSession()

  if (!sessionPath) {
    console.error("No session file found")
    return null
  }

  try {
    // Use installed Chrome for consistency and better compatibility
    const browser = await chromium.launch({
      headless: true,
      channel: "chrome",
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    })

    const context = await browser.newContext({
      storageState: sessionPath,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      bypassCSP: true,
    })

    return { browser, context }
  } catch (error) {
    console.error("Failed to create authenticated browser:", error)
    return null
  }
}

/**
 * Clears the saved session.
 */
export function clearSession(): void {
  const sessionPath = getSessionPath()
  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath)
    console.log("Session cleared")
  }
}
