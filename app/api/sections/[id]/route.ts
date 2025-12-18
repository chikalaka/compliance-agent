import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { generateSectionMarkdown, mergeSectionMarkdown } from "@/lib/ai"
import { getSectionById } from "@/lib/sections"

const COMPLIANCE_DATA_DIR = path.join(process.cwd(), "compliance-data")

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const section = getSectionById(id)

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    const filePath = path.join(COMPLIANCE_DATA_DIR, section.fileName)

    try {
      const content = await fs.readFile(filePath, "utf-8")
      return NextResponse.json({ content, exists: true })
    } catch {
      return NextResponse.json({ content: "", exists: false })
    }
  } catch (error) {
    console.error("Error reading section:", error)
    return NextResponse.json(
      { error: "Failed to read section" },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const section = getSectionById(id)

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    const body = await request.json()
    const { formData, existingContent } = body

    // Generate markdown using AI - merge if existing content provided
    let markdown: string
    if (existingContent) {
      markdown = await mergeSectionMarkdown(id, formData, existingContent)
    } else {
      markdown = await generateSectionMarkdown(id, formData)
    }

    // Ensure directory exists
    await fs.mkdir(COMPLIANCE_DATA_DIR, { recursive: true })

    // Write the markdown file
    const filePath = path.join(COMPLIANCE_DATA_DIR, section.fileName)
    await fs.writeFile(filePath, markdown, "utf-8")

    return NextResponse.json({
      success: true,
      message: `Saved ${section.fileName}`,
      filePath: section.fileName,
    })
  } catch (error) {
    console.error("Error saving section:", error)
    return NextResponse.json(
      { error: "Failed to save section" },
      { status: 500 },
    )
  }
}
