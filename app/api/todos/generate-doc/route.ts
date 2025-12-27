import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

const DOCUMENTS_DIR = path.join(process.cwd(), "user-data", "documents")
const COMPLIANCE_DATA_DIR = path.join(
  process.cwd(),
  "user-data",
  "compliance-data",
)
const TEMPLATES_DIR = path.join(process.cwd(), "data", "templates")

async function loadAllComplianceData(): Promise<string> {
  try {
    await fs.mkdir(COMPLIANCE_DATA_DIR, { recursive: true })
    const files = await fs.readdir(COMPLIANCE_DATA_DIR)
    const mdFiles = files.filter((f) => f.endsWith(".md"))

    if (mdFiles.length === 0) {
      return "No company data available yet. Use reasonable defaults and placeholders where needed."
    }

    const contents: string[] = []

    for (const file of mdFiles) {
      try {
        const filePath = path.join(COMPLIANCE_DATA_DIR, file)
        const content = await fs.readFile(filePath, "utf-8")
        const sectionName = file.replace(".md", "").replace(/-/g, " ")
        contents.push(`## ${sectionName}\n\n${content}`)
      } catch {
        // Skip files that can't be read
      }
    }

    return contents.length > 0
      ? contents.join("\n\n---\n\n")
      : "No company data available yet. Use reasonable defaults and placeholders where needed."
  } catch {
    return "No company data available yet. Use reasonable defaults and placeholders where needed."
  }
}

function buildPrompt(
  template: string,
  companyContext: string,
  systemInstructions?: string,
): string {
  const now = new Date()
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const userInstructionsSection = systemInstructions
    ? `\n## Additional Instructions from User\n${systemInstructions}\n`
    : ""

  return `You are generating a compliance document for a company. Use the company context provided to fill in the template accurately and professionally.

## Current Date
${dateStr}

## Company Context
${companyContext}

## Template to Fill
${template}

## Instructions
1. Replace all placeholders (like {{DATE}}, {{COMPANY_NAME}}, {{OWNER}}, etc.) with appropriate values based on the company context
2. If the template has sections marked for generation (like "[generate here]" or "[to be filled]"), create professional, realistic content based on the company context
3. Maintain the markdown formatting of the template
4. If specific information is not available in the company context, use reasonable professional defaults
5. For meeting minutes, create realistic but generic agenda items and action items
6. For organizational charts, use the personnel information if available, otherwise create a reasonable startup structure
7. Keep the tone professional and suitable for SOC 2 compliance documentation
${userInstructionsSection}
Output ONLY the filled document in markdown format, nothing else.`
}

function buildSection3Prompt(template: string, companyContext: string): string {
  const now = new Date()
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return `You are customizing a SOC 2 Section 3 template for a specific company. The template is EXCELLENT and should be preserved AS-IS with only MINIMAL substitutions.

## CRITICAL RULES - READ CAREFULLY:
1. DO NOT rewrite, rephrase, or restructure ANY part of the template
2. DO NOT add new sections or remove existing sections
3. DO NOT change the wording, tone, or style of the template
4. ONLY substitute the following placeholders with company-specific values:
   - [company] → the company name
   - XXX → the company name (when used as company placeholder)
   - XYZ → the company name or product name (when used as product placeholder)
   - XXXXX → the company name (when used as company placeholder)
   - Company-specific department names and roles based on the org chart
   - Board member names and composition
   - Specific dates where applicable

## Current Date
${dateStr}

## Company Context (use ONLY for substitutions)
${companyContext}

## Template to Customize
${template}

## What to substitute:
- Replace "[company]" with the actual company name
- Replace "XXX", "XYZ", "XXXXX" placeholders with the company/product name where contextually appropriate
- Update the title date range to reflect the current review period
- Update Board of Directors composition if provided in company context
- Update organizational structure/departments if provided in company context
- Update R&D team structure if provided in company context

## What to KEEP EXACTLY AS-IS:
- All section headings and structure
- All control descriptions and security language
- All process descriptions
- All policy references (numbered references like **69**, **70**, etc.)
- All tables and their format
- The Subservice Organizations and CUEC sections at the end
- ALL wording that is not a placeholder

Output ONLY the customized document in markdown format. Preserve ALL original formatting.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template, templateFile, fileName, systemInstructions } = body

    if (!fileName) {
      return NextResponse.json({ error: "Missing fileName" }, { status: 400 })
    }

    if (!template && !templateFile) {
      return NextResponse.json(
        { error: "Missing template or templateFile" },
        { status: 400 },
      )
    }

    // Ensure the documents directory exists
    await fs.mkdir(DOCUMENTS_DIR, { recursive: true })

    // Get template content - either from file or directly provided
    let templateContent: string
    let isSection3Template = false

    if (templateFile) {
      // Read template from file
      const templatePath = path.join(process.cwd(), templateFile)
      try {
        templateContent = await fs.readFile(templatePath, "utf-8")
        // Check if this is the Section 3 template (use conservative prompt)
        isSection3Template = templateFile.includes("soc-2-section-3")
      } catch {
        return NextResponse.json(
          { error: `Template file not found: ${templateFile}` },
          { status: 404 },
        )
      }
    } else {
      templateContent = template
    }

    // Load all company context from compliance data
    const companyContext = await loadAllComplianceData()

    // Build the prompt - use conservative prompt for Section 3
    const prompt = isSection3Template
      ? buildSection3Prompt(templateContent, companyContext)
      : buildPrompt(templateContent, companyContext, systemInstructions)

    // Generate using LLM
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
    })

    // Write the document
    const filePath = path.join(DOCUMENTS_DIR, fileName)
    await fs.writeFile(filePath, text, "utf-8")

    return NextResponse.json({
      success: true,
      fileName,
      filePath: `user-data/documents/${fileName}`,
    })
  } catch (error) {
    console.error("Error generating document:", error)
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Ensure the documents directory exists
    await fs.mkdir(DOCUMENTS_DIR, { recursive: true })

    // List all documents
    const files = await fs.readdir(DOCUMENTS_DIR)
    const documents = files.filter((f) => f.endsWith(".md"))

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Error listing documents:", error)
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 },
    )
  }
}
