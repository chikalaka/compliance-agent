import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { readdir, readFile, writeFile, mkdir, access } from "fs/promises"
import { join } from "path"
import { getPolicyById } from "@/lib/policies"
import {
  POLICY_SYSTEM_PROMPT,
  getGeneratePolicyPrompt,
  getMergeQAIntoContextPrompt,
} from "@/lib/policy-prompts"

const COMPLIANCE_DATA_DIR = join(process.cwd(), "compliance-data")
const POLICIES_DIR = join(process.cwd(), "policies")
const ADDITIONAL_CONTEXT_FILE = join(
  COMPLIANCE_DATA_DIR,
  "additional-context.md",
)

async function readAdditionalContext(): Promise<string> {
  try {
    await access(ADDITIONAL_CONTEXT_FILE)
    return await readFile(ADDITIONAL_CONTEXT_FILE, "utf-8")
  } catch {
    return ""
  }
}

async function mergeQAIntoAdditionalContext(
  policyName: string,
  questions: string,
  userAnswers: string,
): Promise<void> {
  if (!userAnswers || !userAnswers.trim()) {
    return
  }

  const existingContent = await readAdditionalContext()

  const { text: mergedContent } = await generateText({
    model: openai("gpt-4o-mini"),
    system: POLICY_SYSTEM_PROMPT,
    prompt: getMergeQAIntoContextPrompt(
      policyName,
      existingContent,
      questions,
      userAnswers,
    ),
  })

  // Ensure directory exists
  await mkdir(COMPLIANCE_DATA_DIR, { recursive: true })

  // Save the merged content
  await writeFile(ADDITIONAL_CONTEXT_FILE, mergedContent, "utf-8")
}

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
    const { policyId, userAnswers, questions, policyName, fileName } =
      await request.json()

    if (!policyId) {
      return NextResponse.json(
        { error: "Policy ID is required" },
        { status: 400 },
      )
    }

    let resolvedPolicyName: string
    let resolvedFileName: string

    if (policyId === "custom") {
      if (!policyName || !fileName) {
        return NextResponse.json(
          {
            error: "Policy name and filename are required for custom policies",
          },
          { status: 400 },
        )
      }
      resolvedPolicyName = policyName
      resolvedFileName = fileName
    } else {
      const policy = getPolicyById(policyId)
      if (!policy) {
        return NextResponse.json({ error: "Policy not found" }, { status: 404 })
      }
      resolvedPolicyName = policy.name
      resolvedFileName = policy.fileName
    }

    const complianceData = await readAllComplianceData()

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: POLICY_SYSTEM_PROMPT,
      prompt: getGeneratePolicyPrompt(
        resolvedPolicyName,
        complianceData,
        userAnswers || "",
      ),
    })

    // Ensure policies directory exists
    await mkdir(POLICIES_DIR, { recursive: true })

    // Save the policy
    const policyPath = join(POLICIES_DIR, resolvedFileName)
    await writeFile(policyPath, text, "utf-8")

    // Merge user answers into additional context for future reference
    if (userAnswers && userAnswers.trim() && questions) {
      try {
        await mergeQAIntoAdditionalContext(
          resolvedPolicyName,
          questions,
          userAnswers,
        )
      } catch (mergeError) {
        // Log but don't fail the request if merge fails
        console.error("Error merging Q&A into additional context:", mergeError)
      }
    }

    return NextResponse.json({
      policy: text,
      savedTo: resolvedFileName,
    })
  } catch (error) {
    console.error("Error generating policy:", error)
    return NextResponse.json(
      { error: "Failed to generate policy" },
      { status: 500 },
    )
  }
}
