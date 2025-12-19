import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const TEMPLATE_FILE = path.join(process.cwd(), "data", "todos", "template.json")

export async function GET() {
  try {
    const content = await fs.readFile(TEMPLATE_FILE, "utf-8")
    const data = JSON.parse(content)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error reading template todos:", error)
    return NextResponse.json({ todos: [] })
  }
}
