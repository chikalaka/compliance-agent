import { Browser, BrowserContext, Page } from "playwright"
import * as fs from "fs"
import * as path from "path"
import { getAuthenticatedBrowser, getSessionStatus } from "./browser-session"

export interface ScreenshotConfig {
  repoName: string
  commitHashes: string
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
  prUrl: string
  title: string
  commitHash: string
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
  const { repoName, commitHashes, ticketPattern, linearCompanyName } = config
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

  // Parse commit hashes from comma-separated string
  const commitHashesArray = commitHashes
    .split(",")
    .map((h) => h.trim())
    .filter((h) => /^[a-f0-9]{7,40}$/i.test(h))

  if (commitHashesArray.length === 0) {
    throw new Error("No valid commit hashes provided")
  }

  // Ensure screenshots directory exists
  // Extract repo name only (after the slash)
  const repoNameOnly = repoName.split("/")[1] || repoName
  const baseScreenshotDir = path.join(
    process.cwd(),
    "user-data",
    "screenshots",
    "tickets",
    repoNameOnly,
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

    // Build list of PRs to process by directly navigating to each PR
    const prsToProcess: PRInfo[] = []

    for (const commitHash of commitHashesArray) {
      const commitUrl = `https://github.com/${repoName}/commit/${commitHash}`
      console.log(`Fetching Commit ${commitHash}: ${commitUrl}`)

      try {
        await page.goto(commitUrl, {
          waitUntil: "domcontentloaded",
          timeout: 2000,
        })
        await page
          .waitForLoadState("networkidle", { timeout: 1000 })
          .catch(() => {
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

        if (!isLoggedIn) {
          throw new Error("Not logged in to GitHub. Please re-authenticate.")
        }

        // Wait for content to load
        await page.waitForTimeout(1000)

        // Find the PR link from the commit page
        const prUrl = await page.evaluate(() => {
          // Look for PR link in the commit page - typically in the header area
          // Pattern: "Pull request: #123"
          const prLinks = Array.from(
            document.querySelectorAll('a[href*="/pull/"]'),
          )
          for (const link of prLinks) {
            const href = (link as HTMLAnchorElement).href
            const match = href.match(/\/pull\/(\d+)/)
            if (match) {
              return href
            }
          }
          return null
        })

        if (prUrl) {
          console.log(`  Found PR: ${prUrl}`)

          // Now navigate to the PR page to get the actual title
          await page.goto(prUrl, {
            waitUntil: "domcontentloaded",
            timeout: 5000,
          })
          await page
            .waitForLoadState("networkidle", { timeout: 2000 })
            .catch(() => {
              console.log("Network idle timeout - continuing anyway")
            })

          // Wait for PR page to load
          await page.waitForTimeout(1000)

          // Extract PR title from the PR page
          const title = await page.evaluate(() => {
            // Method 1: Look for js-issue-title class
            const issueTitle = document.querySelector(".js-issue-title")
            if (issueTitle && issueTitle.textContent?.trim()) {
              return issueTitle.textContent.trim()
            }

            // Method 2: Look for bdi element in header
            const bdiElement = document.querySelector("bdi")
            if (bdiElement && bdiElement.textContent?.trim()) {
              return bdiElement.textContent.trim()
            }

            // Method 3: Get from page title meta
            const titleMeta = document.querySelector(
              'meta[property="og:title"]',
            )
            if (titleMeta) {
              const content = titleMeta.getAttribute("content")
              if (content) {
                // Extract just the title part (before " by ")
                const match = content.match(/^([^·]+)/)
                if (match) {
                  return match[1].trim()
                }
              }
            }

            return "Unknown Title"
          })

          prsToProcess.push({
            prUrl: prUrl,
            title: title,
            commitHash: commitHash,
          })
          console.log(`  Title: ${title}`)
        } else {
          console.log(`  Warning: Could not find PR for Commit ${commitHash}`)
        }
      } catch (error) {
        console.error(`Error fetching Commit ${commitHash}:`, error)
        // Continue with other commits
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
      const prDir = path.join(baseScreenshotDir, pr.commitHash)

      // Ensure PR directory exists
      fs.mkdirSync(prDir, { recursive: true })

      const result: ScreenshotResult = {
        ticketId: fullMatch,
        prUrl: pr.prUrl,
        linearUrl,
        success: false,
      }

      try {
        // 1. Navigate to GitHub PR and take screenshot
        console.log(`Processing PR: ${pr.prUrl}`)
        await page.goto(pr.prUrl, {
          waitUntil: "domcontentloaded",
          timeout: 10000, // 15 seconds
        })
        await page
          .waitForLoadState("networkidle", { timeout: 3000 })
          .catch(() => {
            console.log("Network idle timeout - continuing anyway")
          })

        // Scroll to bottom, then up 200px
        await page.evaluate(() => {
          const scrollHeight = document.body.scrollHeight
          const viewportHeight = window.innerHeight
          const bottomPosition = scrollHeight - viewportHeight
          const scrollPosition = Math.max(0, bottomPosition - 200)
          window.scrollTo(0, scrollPosition)
        })
        await page.waitForTimeout(1000) // Wait for any lazy-loaded content

        // // Zoom out to 67% to capture more content
        // await page.evaluate(() => {
        //   document.body.style.zoom = "0.9"
        // })
        // await page.waitForTimeout(500) // Wait for zoom to apply

        // Inject timestamp overlay before taking screenshot
        await injectTimestampOverlay(page)

        // Take GitHub screenshot - capture only the viewport (bottom portion)
        const githubScreenshotPath = path.join(prDir, "github.png")
        await page.screenshot({ path: githubScreenshotPath, fullPage: true })
        console.log(`GitHub screenshot saved: ${githubScreenshotPath}`)

        // Reset zoom
        await page.evaluate(() => {
          document.body.style.zoom = "1"
        })

        // 2. Navigate to Linear ticket and take screenshot
        console.log(`Navigating to Linear: ${linearUrl}`)
        await page.goto(linearUrl, {
          waitUntil: "domcontentloaded",
          timeout: 10000, // 30 seconds - Linear can be slow to load
        })

        // Wait for Linear to fully render (it's an SPA)
        await page.waitForTimeout(3000)

        // Try to wait for network idle, but don't fail if it times out
        await page
          .waitForLoadState("networkidle", { timeout: 2000 })
          .catch(() => {
            console.log("Network idle timeout - continuing anyway")
          })

        // Inject timestamp overlay before taking screenshot
        await injectTimestampOverlay(page)

        // Take Linear screenshot
        const linearScreenshotPath = path.join(prDir, "linear.png")
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
