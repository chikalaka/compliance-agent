import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { sections } from "@/lib/sections"

const COMPLIANCE_DATA_DIR = path.join(
  process.cwd(),
  "user-data",
  "compliance-data",
)

export async function GET() {
  try {
    const statuses: Record<string, { exists: boolean; size: number }> = {}

    for (const section of sections) {
      const filePath = path.join(COMPLIANCE_DATA_DIR, section.fileName)
      try {
        const stats = await fs.stat(filePath)
        statuses[section.id] = { exists: true, size: stats.size }
      } catch {
        statuses[section.id] = { exists: false, size: 0 }
      }
    }

    return NextResponse.json(statuses)
  } catch (error) {
    console.error("Error checking statuses:", error)
    return NextResponse.json(
      { error: "Failed to check statuses" },
      { status: 500 },
    )
  }
}
