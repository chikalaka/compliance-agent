import { NextResponse } from "next/server"
import { launchAuthBrowser } from "@/lib/browser-session"

export async function POST() {
  try {
    const result = await launchAuthBrowser({
      timeout: 5 * 60 * 1000, // 5 minutes
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Authentication completed successfully",
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error || "Authentication was not completed",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Auth browser error:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to launch authentication browser",
      },
      { status: 500 },
    )
  }
}

