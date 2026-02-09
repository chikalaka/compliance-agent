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
    const { repoName, commitHashes, ticketPattern, linearCompanyName } = body

    if (!repoName || typeof repoName !== "string") {
      return NextResponse.json(
        { error: "Repository name is required" },
        { status: 400 },
      )
    }

    if (!commitHashes || typeof commitHashes !== "string") {
      return NextResponse.json(
        { error: "Commit hashes are required" },
        { status: 400 },
      )
    }

    // Validate commit hashes format
    const commitHashesArray = commitHashes
      .split(",")
      .map((h) => h.trim())
      .filter((h) => /^[a-f0-9]{7,40}$/i.test(h))

    if (commitHashesArray.length === 0) {
      return NextResponse.json(
        {
          error:
            "Invalid commit hash format. Please provide comma-separated commit hashes (e.g., 5320fd0,0c6190a,306382a)",
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
      commitHashes: commitHashes.trim(),
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
