import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DOCUMENTS_DIR = path.join(process.cwd(), "user-data", "documents")

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateFile, fileName } = body

    if (!fileName) {
      return NextResponse.json({ error: "Missing fileName" }, { status: 400 })
    }

    if (!templateFile) {
      return NextResponse.json(
        { error: "Missing templateFile" },
        { status: 400 },
      )
    }

    // Ensure the documents directory exists
    await fs.mkdir(DOCUMENTS_DIR, { recursive: true })

    // Read template from file
    const templatePath = path.join(process.cwd(), templateFile)
    let templateContent: string

    try {
      templateContent = await fs.readFile(templatePath, "utf-8")
    } catch {
      return NextResponse.json(
        { error: `Template file not found: ${templateFile}` },
        { status: 404 },
      )
    }

    // Write the template content directly to the documents folder
    const filePath = path.join(DOCUMENTS_DIR, fileName)
    await fs.writeFile(filePath, templateContent, "utf-8")

    return NextResponse.json({
      success: true,
      fileName,
      filePath: `user-data/documents/${fileName}`,
    })
  } catch (error) {
    console.error("Error copying template:", error)
    return NextResponse.json(
      { error: "Failed to copy template" },
      { status: 500 },
    )
  }
}
