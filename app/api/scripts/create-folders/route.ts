import { NextRequest, NextResponse } from "next/server"
import {
  createFoldersInDrive,
  AuthRequiredError,
} from "@/lib/google-drive-automation"
import * as fs from "fs"
import * as path from "path"

interface TemplateJson {
  todos: Array<{ id: string; title: string; description?: string }>
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { folderUrl } = body

    // Validate folderUrl parameter
    if (!folderUrl || typeof folderUrl !== "string") {
      return NextResponse.json(
        { error: "folderUrl parameter is required and must be a string" },
        { status: 400 },
      )
    }

    // Validate URL format
    try {
      const url = new URL(folderUrl)
      if (
        url.hostname !== "drive.google.com" ||
        !url.pathname.includes("/folders/")
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid Google Drive folder URL. Must be a drive.google.com/folders/ URL",
          },
          { status: 400 },
        )
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Read template.json to get todo IDs
    const templatePath = path.join(
      process.cwd(),
      "data",
      "todos",
      "template.json",
    )

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: "Template file not found" },
        { status: 500 },
      )
    }

    const templateContent = fs.readFileSync(templatePath, "utf-8")
    const templateData: TemplateJson = JSON.parse(templateContent)

    // Extract unique todo IDs
    const todoIds = templateData.todos
      .map((todo) => todo.id)
      .filter((id) => id !== "00") // Exclude id "00" since it's the instruction todo
      .sort() // Sort to ensure consistent ordering

    if (todoIds.length === 0) {
      return NextResponse.json(
        { error: "No todo IDs found in template" },
        { status: 500 },
      )
    }

    console.log(`Creating ${todoIds.length} folders in Google Drive...`)

    // Call the folder creation function
    const result = await createFoldersInDrive(folderUrl, todoIds)

    if (result.success) {
      return NextResponse.json({
        success: true,
        foldersCreated: result.foldersCreated,
        foldersFailed: result.foldersFailed,
        totalCreated: result.totalCreated,
        totalFailed: result.totalFailed,
        message: `Successfully created ${result.totalCreated} folders${
          result.totalFailed > 0
            ? ` (${result.totalFailed} failed or skipped)`
            : ""
        }`,
      })
    } else {
      return NextResponse.json(
        {
          error: result.error || "Failed to create folders",
          foldersCreated: result.foldersCreated,
          foldersFailed: result.foldersFailed,
          totalCreated: result.totalCreated,
          totalFailed: result.totalFailed,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Create folders API error:", error)

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
          error instanceof Error ? error.message : "Failed to create folders",
      },
      { status: 500 },
    )
  }
}
