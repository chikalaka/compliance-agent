import { NextResponse } from "next/server"
import { access } from "fs/promises"
import { join } from "path"
import { policies } from "@/lib/policies"

const POLICIES_DIR = join(process.cwd(), "policies")

export async function GET() {
  const statuses: Record<string, boolean> = {}

  for (const policy of policies) {
    try {
      console.log("Checking policy:", policy.fileName)
      await access(join(POLICIES_DIR, policy.fileName))
      statuses[policy.id] = true
    } catch {
      statuses[policy.id] = false
    }
  }

  return NextResponse.json(statuses)
}
