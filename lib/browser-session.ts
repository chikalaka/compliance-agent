import { chromium, Browser, BrowserContext } from "playwright"
import * as fs from "fs"
import * as path from "path"

const SESSION_ID = "compliance-agent-browser"
const SESSIONS_DIR = ".sessions"

export interface SessionStatus {
  authenticated: boolean
  services: {
    github: boolean
    linear: boolean
  }
}

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

/**
 * Gets the current session status for GitHub and Linear.
 * Checks for specific authentication cookies.
 */
export function getSessionStatus(): SessionStatus {
  if (!sessionExists()) {
    return {
      authenticated: false,
      services: { github: false, linear: false },
    }
  }

  try {
    const sessionData = JSON.parse(fs.readFileSync(getSessionPath(), "utf-8"))
    const cookies = sessionData.cookies || []

    // Check for GitHub authentication
    const hasGithubAuth = cookies.some(
      (cookie: { domain: string; name: string; value: string }) => {
        const domain = cookie.domain.replace(/^\./, "")
        const isGithubDomain = domain.includes("github.com")
        return (
          isGithubDomain &&
          (cookie.name === "user_session" ||
            (cookie.name === "logged_in" && cookie.value === "yes"))
        )
      },
    )

    // Check for Linear authentication
    const hasLinearAuth = cookies.some(
      (cookie: { domain: string; name: string }) => {
        const domain = cookie.domain.replace(/^\./, "")
        const isLinearDomain = domain.includes("linear.app")
        const name = cookie.name.toLowerCase()
        return (
          isLinearDomain &&
          (name.includes("auth") ||
            name.includes("session") ||
            name.includes("token"))
        )
      },
    )

    return {
      authenticated: hasGithubAuth && hasLinearAuth,
      services: {
        github: hasGithubAuth,
        linear: hasLinearAuth,
      },
    }
  } catch (error) {
    console.error("Error reading session status:", error)
    return {
      authenticated: false,
      services: { github: false, linear: false },
    }
  }
}

/**
 * Launches a visible browser for the user to authenticate.
 * Opens tabs for GitHub and Linear login pages.
 * Returns when the user closes the browser or timeout is reached.
 */
export async function launchAuthBrowser(
  options: AuthBrowserOptions = {},
): Promise<{ success: boolean; error?: string }> {
  const { timeout = 5 * 60 * 1000 } = options // Default 5 minutes

  ensureSessionsDir()

  let browser: Browser | null = null

  try {
    // Launch a visible browser using installed Chrome (not Playwright's Chromium)
    // This is required for Google SSO to work - Google blocks automated browsers
    browser = await chromium.launch({
      headless: false,
      channel: "chrome", // Use installed Chrome instead of Chromium
      args: [
        "--start-maximized",
        "--disable-blink-features=AutomationControlled", // Hide automation
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    })

    // Load existing session if available so user doesn't have to re-login from scratch
    const existingSession = loadSession()
    const contextOptions: {
      viewport: null
      userAgent: string
      bypassCSP: boolean
      storageState?: string
    } = {
      viewport: null, // Use full window size
      // Set a realistic user agent
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      // Remove webdriver property
      bypassCSP: true,
    }

    // If we have an existing session, load it
    if (existingSession) {
      contextOptions.storageState = existingSession
      console.log("Loading existing session into auth browser...")
    }

    const context = await browser.newContext(contextOptions)

    // Open GitHub - go to login page or home page depending on session
    const githubPage = await context.newPage()

    // Remove webdriver property to bypass automation detection
    await githubPage.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      })
    })

    // If we have existing session, go to home page to check auth, otherwise login page
    const githubUrl = existingSession
      ? "https://github.com"
      : "https://github.com/login"
    await githubPage.goto(githubUrl)

    // Open Linear - go to login page or home page depending on session
    const linearPage = await context.newPage()

    // Remove webdriver property on Linear page too
    await linearPage.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      })
    })

    // If we have existing session, go to home page to check auth, otherwise login page
    const linearUrl = existingSession
      ? "https://linear.app"
      : "https://linear.app/login"
    await linearPage.goto(linearUrl)

    // Bring GitHub tab to focus
    await githubPage.bringToFront()

    console.log(
      "Browser opened for authentication. Waiting for user to log in...",
    )

    // Wait for the user to authenticate and close the browser,
    // or for cookies to appear on both sites
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Check if browser was closed by user
      if (!browser.isConnected()) {
        break
      }

      // Check if we have cookies for both services
      const githubCookies = await context.cookies("https://github.com")
      const linearCookies = await context.cookies("https://linear.app")

      const hasGithubAuth = githubCookies.some(
        (c) =>
          c.name === "user_session" ||
          (c.name === "logged_in" && c.value === "yes"),
      )
      const hasLinearAuth = linearCookies.some(
        (c) =>
          c.name.toLowerCase().includes("auth") ||
          c.name.toLowerCase().includes("session") ||
          c.name.toLowerCase().includes("token"),
      )

      if (hasGithubAuth && hasLinearAuth) {
        console.log("Authentication detected for both services!")
        // Wait a bit to ensure cookies are fully set
        await new Promise((resolve) => setTimeout(resolve, 2000))
        // Save session state
        await saveSession(context)
        await browser.close()
        return { success: true }
      }
    }

    // If we got here and browser is still connected, save whatever state we have
    if (browser.isConnected()) {
      await saveSession(context)
      await browser.close()
    }

    // Check final status
    const status = getSessionStatus()
    if (status.authenticated) {
      return { success: true }
    }

    const missing: string[] = []
    if (!status.services.github) missing.push("GitHub")
    if (!status.services.linear) missing.push("Linear")

    return {
      success: false,
      error: `Authentication incomplete. Missing: ${missing.join(", ")}`,
    }
  } catch (error) {
    if (browser?.isConnected()) {
      await browser.close()
    }
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
 * Saves the browser context's storage state to the session file.
 */
export async function saveSession(context: BrowserContext): Promise<void> {
  ensureSessionsDir()
  const sessionPath = getSessionPath()
  await context.storageState({ path: sessionPath })
  console.log(`Session saved to: ${sessionPath}`)
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
