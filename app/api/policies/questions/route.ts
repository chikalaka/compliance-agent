import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { readdir, readFile } from "fs/promises"
import { join } from "path"
import { getPolicyById } from "@/lib/policies"
import { POLICY_SYSTEM_PROMPT, getQuestionsPrompt } from "@/lib/policy-prompts"

const COMPLIANCE_DATA_DIR = join(process.cwd(), "compliance-data")

async function readAllComplianceData(): Promise<string> {
  try {
    const files = await readdir(COMPLIANCE_DATA_DIR)
    const mdFiles = files.filter((f) => f.endsWith(".md"))

    const contents: string[] = []
    for (const file of mdFiles) {
      try {
        const content = await readFile(join(COMPLIANCE_DATA_DIR, file), "utf-8")
        if (content.trim()) {
          contents.push(`## ${file}\n${content}`)
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return contents.join("\n\n---\n\n")
  } catch {
    return ""
  }
}

export async function POST(request: Request) {
  try {
    const { policyId, policyName } = await request.json()

    if (!policyId) {
      return NextResponse.json(
        { error: "Policy ID is required" },
        { status: 400 },
      )
    }

    let resolvedPolicyName: string

    if (policyId === "custom") {
      if (!policyName) {
        return NextResponse.json(
          { error: "Policy name is required for custom policies" },
          { status: 400 },
        )
      }
      resolvedPolicyName = policyName
    } else {
      const policy = getPolicyById(policyId)
      if (!policy) {
        return NextResponse.json({ error: "Policy not found" }, { status: 404 })
      }
      resolvedPolicyName = policy.name
    }

    const complianceData = await readAllComplianceData()

    const { text } = await generateText({
      model: openai("gpt-5.2"),
      system: POLICY_SYSTEM_PROMPT,
      prompt: getQuestionsPrompt(resolvedPolicyName, complianceData),
    })

    return NextResponse.json({ questions: text })
  } catch (error) {
    console.error("Error generating questions:", error)
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 },
    )
  }
}
