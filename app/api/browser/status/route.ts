import { NextResponse } from "next/server"
import { getSessionStatus } from "@/lib/browser-session"

export async function GET() {
  try {
    const status = getSessionStatus()

    return NextResponse.json(status)
  } catch (error) {
    console.error("Session status error:", error)
    return NextResponse.json(
      {
        authenticated: false,
        services: {
          github: false,
          linear: false,
        },
        error:
          error instanceof Error ? error.message : "Failed to check session status",
      },
      { status: 500 },
    )
  }
}

