import { NextRequest, NextResponse } from "next/server"
import {
  takeTicketScreenshots,
  AuthRequiredError,
  ScreenshotConfig,
} from "@/lib/screenshot-tickets"

interface RepositoryInput {
  repoName: string
  commitHashes: string
}

interface RequestBody {
  repositories: RepositoryInput[]
  ticketPattern: string
  linearCompanyName: string
}

interface ScreenshotResult {
  ticketId: string
  success: boolean
  error?: string
  repoName?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()

    // Validate required fields
    const { repositories, ticketPattern, linearCompanyName } = body

    if (!repositories || !Array.isArray(repositories)) {
      return NextResponse.json(
        { error: "Repositories array is required" },
        { status: 400 },
      )
    }

    if (repositories.length === 0) {
      return NextResponse.json(
        { error: "At least one repository is required" },
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

    // Process each repository
    const allResults: ScreenshotResult[] = []

    for (const repo of repositories) {
      if (!repo.repoName || typeof repo.repoName !== "string") {
        console.warn("Skipping invalid repository entry:", repo)
        continue
      }

      if (!repo.commitHashes || typeof repo.commitHashes !== "string") {
        console.warn(`Skipping repository ${repo.repoName}: no commit hashes`)
        continue
      }

      // Validate commit hashes format
      const commitHashesArray = repo.commitHashes
        .split(",")
        .map((h) => h.trim())
        .filter((h) => /^[a-f0-9]{7,40}$/i.test(h))

      if (commitHashesArray.length === 0) {
        console.warn(
          `Skipping repository ${repo.repoName}: invalid commit hash format`
        )
        continue
      }

      const config: ScreenshotConfig = {
        repoName: repo.repoName.trim(),
        commitHashes: repo.commitHashes.trim(),
        ticketPattern: ticketPattern.trim(),
        linearCompanyName: linearCompanyName.trim(),
      }

      // Execute the screenshot automation for this repository
      const results = await takeTicketScreenshots(config)

      // Add repoName to each result for grouping in UI
      const resultsWithRepo = results.map((r) => ({
        ...r,
        repoName: repo.repoName,
      }))

      allResults.push(...resultsWithRepo)
    }

    return NextResponse.json({
      success: true,
      results: allResults,
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
