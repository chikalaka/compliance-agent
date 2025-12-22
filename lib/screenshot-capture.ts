import { Browser, BrowserContext, Page } from "playwright"
import * as fs from "fs"
import * as path from "path"
import { getAuthenticatedBrowser, getSessionStatus } from "./browser-session"

export interface CaptureConfig {
  url: string
  fileName: string
}

export interface CalendarCaptureConfig {
  searchTerm: string
  fileNamePrefix: string
  maxCount?: number // defaults to 4
}

export interface CaptureResult {
  url: string
  fileName: string
  filePath: string
  success: boolean
  error?: string
}

export interface CalendarCaptureResult {
  searchTerm: string
  screenshots: {
    fileName: string
    filePath: string
    eventDate?: string
  }[]
  eventsFound: number
  success: boolean
  error?: string
}

export class AuthRequiredError extends Error {
  code = "AUTH_REQUIRED" as const
  constructor(message: string) {
    super(message)
    this.name = "AuthRequiredError"
  }
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
 * Main function to capture a screenshot of a URL.
 * Uses the saved browser session for authentication.
 */
export async function captureScreenshot(
  config: CaptureConfig,
): Promise<CaptureResult> {
  const { url, fileName } = config

  const result: CaptureResult = {
    url,
    fileName,
    filePath: "",
    success: false,
  }

  // Check if we have valid authentication
  const status = getSessionStatus()
  if (!status.authenticated) {
    throw new AuthRequiredError(
      "Authentication required. Please authenticate first.",
    )
  }

  // Ensure screenshots directory exists
  const screenshotDir = path.join(process.cwd(), "user-data", "screenshots")
  fs.mkdirSync(screenshotDir, { recursive: true })

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
    console.log(`Navigating to: ${url}`)
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    })
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
      console.log("Network idle timeout - continuing anyway")
    })

    // Wait a bit for page to fully render
    await page.waitForTimeout(2000)

    // Inject timestamp overlay before taking screenshot
    await injectTimestampOverlay(page)

    // Take screenshot
    const screenshotPath = path.join(screenshotDir, fileName)
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`Screenshot saved: ${screenshotPath}`)

    result.filePath = screenshotPath
    result.success = true
  } catch (error) {
    result.error =
      error instanceof Error ? error.message : "Unknown error occurred"
    console.error(`Error capturing screenshot:`, error)
  } finally {
    // Close the page and browser
    await page.close()
    await browser.close()
  }

  return result
}

/**
 * Capture screenshots of Google Calendar events by searching for a specific term.
 * Searches from now going backwards, capturing up to maxCount events.
 */
export async function captureCalendarEvents(
  config: CalendarCaptureConfig,
): Promise<CalendarCaptureResult> {
  const { searchTerm, fileNamePrefix, maxCount = 4 } = config

  const result: CalendarCaptureResult = {
    searchTerm,
    screenshots: [],
    eventsFound: 0,
    success: false,
  }

  // Check if we have valid authentication
  const status = getSessionStatus()
  if (!status.authenticated) {
    throw new AuthRequiredError(
      "Authentication required. Please authenticate first.",
    )
  }

  // Ensure screenshots directory exists
  const screenshotDir = path.join(
    process.cwd(),
    "user-data",
    "screenshots",
    "calendar",
  )
  fs.mkdirSync(screenshotDir, { recursive: true })

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
    // Navigate directly to Google Calendar search URL with the search term
    const searchUrl = `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(
      searchTerm,
    )}`
    console.log(`Navigating to Google Calendar search: ${searchUrl}`)
    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    })
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {
      console.log("Network idle timeout - continuing anyway")
    })

    // Wait for search results to load
    await page.waitForTimeout(3000)

    // Find event elements in search results
    // Google Calendar search results show events in a list/grid
    console.log("Looking for search results...")

    // Wait a bit more for results to render
    await page.waitForTimeout(2000)

    const eventSelectors = [
      "[data-eventid]", // Event elements with data-eventid attribute
      "[data-eventchip]", // Event chip elements
      '[role="button"][data-eventid]', // Clickable event buttons
      '[role="listitem"]', // List items in search results
      "[jscontroller] [data-eventid]", // Events within controllers
    ]

    let eventElements: Awaited<ReturnType<Page["$$"]>> = []
    for (const selector of eventSelectors) {
      eventElements = await page.$$(selector)
      console.log(
        `Selector "${selector}" found ${eventElements.length} elements`,
      )
      if (eventElements.length > 0) {
        break
      }
    }

    // If no specific event elements found, try finding clickable elements in search results
    if (eventElements.length === 0) {
      // Try to find any clickable search result items
      const searchResultContainer = await page.$('[role="main"]')
      if (searchResultContainer) {
        // Look for any elements that look like event entries
        eventElements = await page.$$(
          '[role="main"] [tabindex="0"][data-eventid], [role="main"] [role="button"]',
        )
        console.log(
          `Found ${eventElements.length} clickable elements in main area`,
        )
      }
    }

    if (eventElements.length === 0) {
      // Take a debug screenshot to see what's on the page
      const debugPath = path.join(
        screenshotDir,
        `debug-no-results-${Date.now()}.png`,
      )
      await page.screenshot({ path: debugPath, fullPage: false })
      console.log(`Debug screenshot saved: ${debugPath}`)

      result.error = `No events found with title "${searchTerm}"`
      result.success = false
      return result
    }

    result.eventsFound = eventElements.length
    console.log(`Found ${eventElements.length} events matching "${searchTerm}"`)

    // Take screenshots of up to maxCount events (most recent first)
    const eventsToCapture = Math.min(maxCount, eventElements.length)

    for (let i = 0; i < eventsToCapture; i++) {
      try {
        // Re-query events each time as DOM might have changed
        let currentEvents = await page.$$(
          '[data-eventid], [data-eventchip], [role="button"][data-eventid]',
        )
        if (currentEvents.length === 0) {
          // Navigate back to search results
          const searchUrl = `https://calendar.google.com/calendar/u/0/r/search?q=${encodeURIComponent(
            searchTerm,
          )}`
          await page.goto(searchUrl, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          })
          await page.waitForTimeout(3000)
          currentEvents = await page.$$(
            '[data-eventid], [data-eventchip], [role="button"][data-eventid]',
          )
        }

        if (i >= currentEvents.length) {
          console.log(`Event ${i + 1} no longer available`)
          break
        }

        console.log(`Clicking event ${i + 1} of ${eventsToCapture}...`)
        await currentEvents[i].click()
        await page.waitForTimeout(2000)

        // Wait for event details to load
        await page
          .waitForLoadState("networkidle", { timeout: 5000 })
          .catch(() => {})

        // Inject timestamp overlay
        await injectTimestampOverlay(page)

        // Take screenshot
        const fileName = `${fileNamePrefix}-${i + 1}.png`
        const screenshotPath = path.join(screenshotDir, fileName)
        await page.screenshot({ path: screenshotPath, fullPage: false })
        console.log(`Screenshot saved: ${screenshotPath}`)

        result.screenshots.push({
          fileName,
          filePath: screenshotPath,
        })

        // Close the event popup/dialog if open
        await page.keyboard.press("Escape")
        await page.waitForTimeout(1000)
      } catch (eventError) {
        console.error(`Error capturing event ${i + 1}:`, eventError)
        // Continue to next event
      }
    }

    result.success = result.screenshots.length > 0
  } catch (error) {
    result.error =
      error instanceof Error ? error.message : "Unknown error occurred"
    console.error(`Error capturing calendar events:`, error)
  } finally {
    // Close the page and browser
    await page.close()
    await browser.close()
  }

  return result
}
