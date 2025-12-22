import { NextRequest, NextResponse } from "next/server"
import {
  captureScreenshot,
  captureCalendarEvents,
  AuthRequiredError,
  CaptureConfig,
  CalendarCaptureConfig,
} from "@/lib/screenshot-capture"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if this is a calendar search capture
    const { calendarSearch, fileNamePrefix, maxCount, url, fileName } = body

    if (calendarSearch) {
      // Calendar event capture mode
      if (!calendarSearch || typeof calendarSearch !== "string") {
        return NextResponse.json(
          { error: "Calendar search term is required" },
          { status: 400 },
        )
      }

      if (!fileNamePrefix || typeof fileNamePrefix !== "string") {
        return NextResponse.json(
          { error: "File name prefix is required" },
          { status: 400 },
        )
      }

      const calendarConfig: CalendarCaptureConfig = {
        searchTerm: calendarSearch.trim(),
        fileNamePrefix: fileNamePrefix.trim(),
        maxCount: typeof maxCount === "number" ? Math.min(maxCount, 4) : 4,
      }

      // Execute the calendar capture
      const result = await captureCalendarEvents(calendarConfig)

      if (result.success) {
        return NextResponse.json({
          success: true,
          searchTerm: result.searchTerm,
          eventsFound: result.eventsFound,
          screenshots: result.screenshots,
        })
      } else {
        return NextResponse.json(
          {
            error: result.error || "Failed to capture calendar events",
            eventsFound: result.eventsFound,
          },
          { status: result.eventsFound === 0 ? 404 : 500 },
        )
      }
    } else {
      // Regular URL capture mode
      if (!url || typeof url !== "string") {
        return NextResponse.json({ error: "URL is required" }, { status: 400 })
      }

      if (!fileName || typeof fileName !== "string") {
        return NextResponse.json(
          { error: "File name is required" },
          { status: 400 },
        )
      }

      // Validate URL format
      try {
        new URL(url)
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 },
        )
      }

      // Validate file name (must end with .png or .jpg)
      if (!fileName.endsWith(".png") && !fileName.endsWith(".jpg")) {
        return NextResponse.json(
          { error: "File name must end with .png or .jpg" },
          { status: 400 },
        )
      }

      const config: CaptureConfig = {
        url: url.trim(),
        fileName: fileName.trim(),
      }

      // Execute the screenshot capture
      const result = await captureScreenshot(config)

      if (result.success) {
        return NextResponse.json({
          success: true,
          fileName: result.fileName,
          filePath: result.filePath,
        })
      } else {
        return NextResponse.json(
          { error: result.error || "Failed to capture screenshot" },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("Screenshot capture API error:", error)

    if (error instanceof AuthRequiredError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: 401 },
      )
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to capture screenshot",
      },
      { status: 500 },
    )
  }
}
