import { NextRequest, NextResponse } from "next/server"
import {
  takeTicketScreenshots,
  AuthRequiredError,
  ScreenshotConfig,
} from "@/lib/screenshot-tickets"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { repoName, count, ticketPattern, linearCompanyName } = body

    if (!repoName || typeof repoName !== "string") {
      return NextResponse.json(
        { error: "Repository name is required" },
        { status: 400 },
      )
    }

    if (!ticketPattern || typeof ticketPattern !== "string") {
      return NextResponse.json(
        { error: "Ticket pattern is required" },
        { status: 400 },
      )
    }

    if (!linearCompanyName || typeof linearCompanyName !== "string") {
      return NextResponse.json(
        { error: "Linear company name is required" },
        { status: 400 },
      )
    }

    const parsedCount = typeof count === "number" ? count : parseInt(count, 10)
    if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 50) {
      return NextResponse.json(
        { error: "Count must be a number between 1 and 50" },
        { status: 400 },
      )
    }

    const config: ScreenshotConfig = {
      repoName: repoName.trim(),
      count: parsedCount,
      ticketPattern: ticketPattern.trim(),
      linearCompanyName: linearCompanyName.trim(),
    }

    // Execute the screenshot automation
    const results = await takeTicketScreenshots(config)

    return NextResponse.json({
      success: true,
      results,
      outputDir: `user-data/screenshots/tickets/${repoName.replace("/", "-")}`,
    })
  } catch (error) {
    console.error("Screenshot API error:", error)

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
          error instanceof Error ? error.message : "Failed to take screenshots",
      },
      { status: 500 },
    )
  }
}
