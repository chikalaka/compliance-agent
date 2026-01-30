import { Browser, BrowserContext, Page } from "playwright"
import * as fs from "fs"
import * as path from "path"
import { getAuthenticatedBrowser, getSessionStatus } from "./browser-session"

export interface ScreenshotConfig {
  repoName: string
  count: number
  ticketPattern: string
  linearCompanyName: string
}

interface ScreenshotResult {
  ticketId: string
  prUrl: string
  linearUrl: string
  success: boolean
  error?: string
}

interface PRInfo {
  url: string
  title: string
}

export class AuthRequiredError extends Error {
  code = "AUTH_REQUIRED" as const
  constructor(message: string) {
    super(message)
    this.name = "AuthRequiredError"
  }
}

/**
 * Converts a glob-like pattern (e.g., "PRJ-*") to a regex that captures the ticket ID.
 * The pattern can contain a project prefix followed by -* or -\d+.
 */
function patternToRegex(pattern: string): RegExp {
  // Extract the prefix (everything before the last dash or asterisk)
  // e.g., "PRJ-*" -> captures "PRJ-123", "PROJ-*" -> captures "PROJ-456"
  const escaped = pattern.replace(/[-\/\\^$+?.()|[\]{}]/g, "\\$&")
  const regexPattern = escaped.replace(/\*/g, "(\\d+)")
  return new RegExp(regexPattern, "i")
}

/**
 * Extracts ticket ID from PR title using the provided pattern.
 */
function extractTicketId(
  title: string,
  pattern: string,
): { ticketId: string; fullMatch: string } | null {
  const regex = patternToRegex(pattern)
  const match = title.match(regex)
  if (match) {
    return {
      fullMatch: match[0],
      ticketId: match[1] || match[0],
    }
  }
  return null
}

/**
 * Injects a timestamp overlay at the bottom right of the page before taking a screenshot.
 */
async function injectTimestampOverlay(page: Page): Promise<void> {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19)
  await page.evaluate((ts) => {
    const overlay = document.createElement("div")
    overlay.id = "screenshot-timestamp"
    overlay.textContent = ts
    overlay.style.cssText = `
      position: fixed;
      bottom: 12px;
      right: 12px;
      background: rgba(0, 0, 0, 0.75);
      color: white;
      padding: 6px 12px;
      font-family: monospace;
      font-size: 12px;
      border-radius: 4px;
      z-index: 999999;
    `
    document.body.appendChild(overlay)
  }, timestamp)
}

/**
 * Main function to take screenshots of GitHub PRs and their linked Linear tickets.
 * Uses the saved browser session for authentication.
 */
export async function takeTicketScreenshots(
  config: ScreenshotConfig,
): Promise<ScreenshotResult[]> {
  const { repoName, count, ticketPattern, linearCompanyName } = config
  const results: ScreenshotResult[] = []

  // Check if we have valid authentication
  const status = getSessionStatus()
  if (!status.authenticated) {
    const missing: string[] = []
    if (!status.services.github) missing.push("GitHub")
    if (!status.services.linear) missing.push("Linear")
    throw new AuthRequiredError(
      `Authentication required. Please authenticate to: ${missing.join(", ")}`,
    )
  }

  // Ensure screenshots directory exists
  const repoSlug = repoName.replace("/", "-")
  const baseScreenshotDir = path.join(
    process.cwd(),
    "user-data",
    "screenshots",
    "tickets",
    repoSlug,
  )

  // Get authenticated browser
  const browserSession = await getAuthenticatedBrowser()
  if (!browserSession) {
    throw new AuthRequiredError(
      "Could not create authenticated browser session. Please re-authenticate.",
    )
  }

  const { browser, context }: { browser: Browser; context: BrowserContext } =
    browserSession
  const page: Page = await context.newPage()

  // Remove webdriver property to bypass automation detection
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    })
  })

  try {
    // Debug: Check if we have cookies
    const githubCookies = await context.cookies("https://github.com")
    console.log(`Found ${githubCookies.length} GitHub cookies`)

    // Navigate to the closed PRs page
    const prListUrl = `https://github.com/${repoName}/pulls?q=is%3Apr+is%3Aclosed`
    console.log(`Navigating to: ${prListUrl}`)
    await page.goto(prListUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    })
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      console.log("Network idle timeout - continuing anyway")
    })

    // Debug: Check if we're logged in by looking for GitHub UI elements
    const isLoggedIn = await page.evaluate(() => {
      // Check for the user menu which only appears when logged in
      return (
        !!document.querySelector("[data-login]") ||
        !!document.querySelector('meta[name="user-login"]')
      )
    })
    console.log(
      `GitHub login status: ${isLoggedIn ? "Logged in" : "NOT logged in"}`,
    )

    if (!isLoggedIn) {
      throw new Error("Not logged in to GitHub. Please re-authenticate.")
    }

    // Wait for PR list to load
    await page
      .waitForSelector('[data-testid="issue-row"]', { timeout: 10000 })
      .catch(() => {
        // Alternative selector for older GitHub UI
        return page.waitForSelector(".js-issue-row", { timeout: 5000 })
      })

    // Get the latest closed PRs
    const prElements = await page.$$('[data-testid="issue-row"], .js-issue-row')
    const prsToProcess: PRInfo[] = []

    for (let i = 0; i < Math.min(count, prElements.length); i++) {
      const prElement = prElements[i]
      const linkElement = await prElement.$(
        'a[data-hovercard-type="pull_request"], .js-navigation-open',
      )
      if (linkElement) {
        const href = await linkElement.getAttribute("href")
        const title = await linkElement.textContent()
        if (href && title) {
          prsToProcess.push({
            url: `https://github.com${href}`,
            title: title.trim(),
          })
        }
      }
    }

    console.log(`Found ${prsToProcess.length} PRs to process`)

    // Process each PR
    for (const pr of prsToProcess) {
      const ticketInfo = extractTicketId(pr.title, ticketPattern)

      if (!ticketInfo) {
        console.log(`Skipping PR (no ticket match): ${pr.title}`)
        continue
      }

      const { fullMatch } = ticketInfo
      const linearUrl = `https://linear.app/${linearCompanyName}/issue/${fullMatch}`
      const ticketDir = path.join(baseScreenshotDir, fullMatch)

      // Ensure ticket directory exists
      fs.mkdirSync(ticketDir, { recursive: true })

      const result: ScreenshotResult = {
        ticketId: fullMatch,
        prUrl: pr.url,
        linearUrl,
        success: false,
      }

      try {
        // 1. Navigate to GitHub PR and take screenshot
        console.log(`Processing PR: ${pr.url}`)
        await page.goto(pr.url, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        })
        await page
          .waitForLoadState("networkidle", { timeout: 10000 })
          .catch(() => {
            console.log("Network idle timeout - continuing anyway")
          })

        // Scroll to bottom of PR page
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        )
        await page.waitForTimeout(1000) // Wait for any lazy-loaded content

        // Inject timestamp overlay before taking screenshot
        await injectTimestampOverlay(page)

        // Take GitHub screenshot
        const githubScreenshotPath = path.join(ticketDir, "github-ss.png")
        await page.screenshot({ path: githubScreenshotPath, fullPage: false })
        console.log(`GitHub screenshot saved: ${githubScreenshotPath}`)

        // 2. Navigate to Linear ticket and take screenshot
        console.log(`Navigating to Linear: ${linearUrl}`)
        await page.goto(linearUrl, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        })
        await page
          .waitForLoadState("networkidle", { timeout: 10000 })
          .catch(() => {
            console.log("Network idle timeout - continuing anyway")
          })

        // Wait for Linear page to fully load
        await page.waitForTimeout(2000)

        // Inject timestamp overlay before taking screenshot
        await injectTimestampOverlay(page)

        // Take Linear screenshot
        const linearScreenshotPath = path.join(ticketDir, "linear-ss.png")
        await page.screenshot({ path: linearScreenshotPath, fullPage: false })
        console.log(`Linear screenshot saved: ${linearScreenshotPath}`)

        result.success = true
      } catch (error) {
        result.error =
          error instanceof Error ? error.message : "Unknown error occurred"
        console.error(`Error processing ${fullMatch}:`, error)
      }

      results.push(result)
    }
  } finally {
    // Close the page and browser
    await page.close()
    await browser.close()
  }

  return results
}
