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
    const { repoName, prNumbers, ticketPattern, linearCompanyName } = body

    if (!repoName || typeof repoName !== "string") {
      return NextResponse.json(
        { error: "Repository name is required" },
        { status: 400 },
      )
    }

    if (!prNumbers || typeof prNumbers !== "string") {
      return NextResponse.json(
        { error: "PR numbers are required" },
        { status: 400 },
      )
    }

    // Validate PR numbers format
    const prNumbersArray = prNumbers
      .split(",")
      .map((n) => n.trim())
      .filter((n) => /^\d+$/.test(n))

    if (prNumbersArray.length === 0) {
      return NextResponse.json(
        {
          error:
            "Invalid PR numbers format. Please provide comma-separated numbers (e.g., 123, 456, 789)",
        },
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

    const config: ScreenshotConfig = {
      repoName: repoName.trim(),
      prNumbers: prNumbers.trim(),
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
