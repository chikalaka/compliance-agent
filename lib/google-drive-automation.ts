import { Browser, BrowserContext, Page } from "playwright"
import * as path from "path"
import { getAuthenticatedBrowser, getSessionStatus } from "./browser-session"

export interface CreateFoldersResult {
  success: boolean
  foldersCreated: string[]
  foldersFailed: Array<{ id: string; error: string }>
  totalCreated: number
  totalFailed: number
  error?: string
}

/**
 * Custom error class for authentication-related errors
 */
export class AuthRequiredError extends Error {
  code = "AUTH_REQUIRED"
  constructor(message: string) {
    super(message)
    this.name = "AuthRequiredError"
  }
}

/**
 * Validates that a URL is a valid Google Drive folder URL
 */
function validateDriveFolderUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.hostname === "drive.google.com" &&
      parsed.pathname.includes("/folders/")
    )
  } catch {
    return false
  }
}

/**
 * Creates multiple folders in a Google Drive folder
 * @param folderUrl - The URL of the Google Drive folder to create subfolders in
 * @param folderNames - Array of folder names to create
 * @returns Result object with created/failed folders
 */
export async function createFoldersInDrive(
  folderUrl: string,
  folderNames: string[],
): Promise<CreateFoldersResult> {
  // Check authentication status
  const sessionStatus = getSessionStatus()
  if (!sessionStatus.services.googleWorkspace) {
    throw new AuthRequiredError(
      "Google Workspace authentication required. Please authenticate via the Browser Auth page.",
    )
  }

  // Validate folder URL
  if (!validateDriveFolderUrl(folderUrl)) {
    return {
      success: false,
      foldersCreated: [],
      foldersFailed: folderNames.map((id) => ({
        id,
        error: "Invalid Google Drive folder URL",
      })),
      totalCreated: 0,
      totalFailed: folderNames.length,
      error: "Invalid Google Drive folder URL format",
    }
  }

  let browser: Browser | null = null
  let context: BrowserContext | null = null
  const foldersCreated: string[] = []
  const foldersFailed: Array<{ id: string; error: string }> = []

  try {
    // Get authenticated browser
    const browserSession = await getAuthenticatedBrowser()
    if (!browserSession) {
      throw new AuthRequiredError(
        "Failed to create authenticated browser session",
      )
    }

    browser = browserSession.browser
    context = browserSession.context

    // Create a new page
    const page = await context.newPage()

    // Add webdriver bypass
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      })
    })

    console.log(`Navigating to Google Drive folder: ${folderUrl}`)
    await page.goto(folderUrl, {
      waitUntil: "networkidle",
      timeout: 60000,
    })

    // Wait for Drive UI to load - try multiple selectors with generous timeout
    console.log("Waiting for Google Drive UI to load...")
    const driveSelectors = [
      '[data-target="doc-list"]',
      '[role="main"]',
      '[aria-label="Files"]',
      "div[data-id]", // Drive file list items
      "c-wiz", // Google's custom web component
    ]

    let uiLoaded = false
    for (const selector of driveSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 })
        console.log(`Google Drive UI loaded (matched: ${selector})`)
        uiLoaded = true
        break
      } catch {
        continue
      }
    }

    if (!uiLoaded) {
      console.log(
        "Warning: Could not detect Drive UI with known selectors, taking debug screenshot...",
      )
      // Take a screenshot for debugging
      try {
        const debugPath = path.join(
          process.cwd(),
          "user-data",
          "screenshots",
          "debug-drive-ui.png",
        )
        await page.screenshot({ path: debugPath, fullPage: false })
        console.log(`Debug screenshot saved to: ${debugPath}`)
      } catch (err) {
        console.error("Could not save debug screenshot:", err)
      }
    }

    // Additional wait for any animations/loading
    await page.waitForTimeout(3000)

    // Create each folder
    for (const folderName of folderNames) {
      try {
        console.log(`Creating folder: ${folderName}`)
        const created = await createSingleFolder(page, folderName)

        if (created) {
          foldersCreated.push(folderName)
          console.log(`✓ Successfully created folder: ${folderName}`)
        } else {
          foldersFailed.push({
            id: folderName,
            error: "Failed to create folder (may already exist)",
          })
          console.log(`⚠ Skipped folder (may already exist): ${folderName}`)
        }

        // Small delay between folder creations
        await page.waitForTimeout(1500)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"
        foldersFailed.push({
          id: folderName,
          error: errorMessage,
        })
        console.error(`✗ Failed to create folder ${folderName}:`, errorMessage)
      }
    }

    // Close the page
    await page.close()

    return {
      success: foldersCreated.length > 0,
      foldersCreated,
      foldersFailed,
      totalCreated: foldersCreated.length,
      totalFailed: foldersFailed.length,
    }
  } catch (error) {
    console.error("Error in createFoldersInDrive:", error)

    if (error instanceof AuthRequiredError) {
      throw error
    }

    return {
      success: false,
      foldersCreated,
      foldersFailed:
        foldersFailed.length > 0
          ? foldersFailed
          : folderNames.map((id) => ({
              id,
              error: error instanceof Error ? error.message : "Unknown error",
            })),
      totalCreated: foldersCreated.length,
      totalFailed: folderNames.length - foldersCreated.length,
      error:
        error instanceof Error ? error.message : "Failed to create folders",
    }
  } finally {
    // Clean up browser
    if (browser?.isConnected()) {
      await browser.close().catch((err) => {
        console.error("Error closing browser:", err)
      })
    }
  }
}

/**
 * Creates a single folder in Google Drive
 * @param page - The Playwright page instance
 * @param folderName - Name of the folder to create
 * @returns true if created successfully, false otherwise
 */
async function createSingleFolder(
  page: Page,
  folderName: string,
): Promise<boolean> {
  try {
    // Click the "New" button - try multiple selectors
    const newButtonSelectors = [
      'button[aria-label="New"]',
      'button[guidedhelpid="new_menu_button"]',
      'div[data-target="create"] button',
      '[aria-label*="New"]',
      'button:has-text("New")',
    ]

    let newButtonClicked = false
    for (const selector of newButtonSelectors) {
      try {
        const button = page.locator(selector).first()
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click()
          newButtonClicked = true
          console.log(`  ✓ Clicked New button (selector: ${selector})`)
          break
        }
      } catch {
        continue
      }
    }

    if (!newButtonClicked) {
      throw new Error("Could not find New button")
    }

    // Wait for the dropdown menu to appear
    await page.waitForTimeout(1500)

    // Click "New folder" or "Folder" option - try multiple approaches
    const folderOptionSelectors = [
      '[role="menuitem"]:has-text("Folder")',
      '[data-action-id="new_folder"]',
      'div[role="menuitem"]:has-text("New folder")',
      '[role="menuitem"]', // Try to find any menu item
    ]

    let folderOptionClicked = false
    for (const selector of folderOptionSelectors) {
      try {
        if (selector === '[role="menuitem"]') {
          // Special handling: find all menu items and look for "Folder" text
          const menuItems = await page.locator('[role="menuitem"]').all()
          for (const item of menuItems) {
            const text = await item.textContent()
            if (text && text.toLowerCase().includes("folder")) {
              await item.click()
              folderOptionClicked = true
              console.log(`  ✓ Clicked Folder menu item`)
              break
            }
          }
          if (folderOptionClicked) break
        } else {
          const option = page.locator(selector).first()
          if (await option.isVisible({ timeout: 2000 })) {
            await option.click()
            folderOptionClicked = true
            console.log(`  ✓ Clicked Folder option (selector: ${selector})`)
            break
          }
        }
      } catch {
        continue
      }
    }

    if (!folderOptionClicked) {
      throw new Error("Could not find Folder option in menu")
    }

    // Wait for the folder name input dialog
    await page.waitForTimeout(2000)

    // Simple approach: just type the folder name directly
    // The input should be focused automatically when the dialog opens
    await page.keyboard.type(folderName, { delay: 50 })
    console.log(`  ✓ Typed folder name: ${folderName}`)

    // Wait a moment for the text to be registered
    await page.waitForTimeout(500)

    // Submit by pressing Enter
    await page.keyboard.press("Enter")
    console.log(`  ✓ Pressed Enter to create folder`)

    // Wait for the folder creation to complete
    await page.waitForTimeout(2000)

    return true
  } catch (error) {
    console.error(`  ✗ Error creating folder ${folderName}:`, error)

    // Try to close any open dialogs by pressing Escape
    try {
      await page.keyboard.press("Escape")
      await page.waitForTimeout(500)
    } catch {
      // Ignore errors when closing dialogs
    }

    return false
  }
}
