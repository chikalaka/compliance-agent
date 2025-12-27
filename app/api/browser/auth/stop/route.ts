import { NextResponse } from "next/server"
import { stopAuthBrowser } from "@/lib/browser-session"

export async function POST() {
  try {
    const result = await stopAuthBrowser()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Authentication session saved and browser closed.",
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error || "Failed to stop auth browser",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Stop auth browser error:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to stop auth browser",
      },
      { status: 500 },
    )
  }
}

