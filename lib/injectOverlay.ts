import { Page } from "playwright"

export async function injectTimestampOverlay(page: Page): Promise<void> {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19)
  const url = page.url()
  await page.evaluate(
    ({ ts, url }) => {
      const overlay = document.createElement("div")
      overlay.id = "screenshot-timestamp"
      overlay.innerHTML = `<div style="margin-bottom: 4px;">${ts}</div><div style="font-size: 14px; opacity: 0.9; word-break: break-all;">${url}</div>`
      overlay.style.cssText = `
      position: fixed;
      bottom: 12px;
      right: 12px;
      background: rgba(0, 0, 0, 0.75);
      color: white;
      padding: 6px 12px;
      font-family: monospace;
      font-size: 16px;
      border-radius: 4px;
      z-index: 999999;
      max-width: 400px;
    `
      document.body.appendChild(overlay)
    },
    { ts: timestamp, url },
  )
}
