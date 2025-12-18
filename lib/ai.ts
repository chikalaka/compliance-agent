import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { getSectionPrompt, getMergePrompt } from "./prompts"

export async function generateSectionMarkdown(
  sectionId: string,
  formData: Record<string, unknown>,
): Promise<string> {
  const prompt = getSectionPrompt(sectionId, formData)

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
  })

  return text
}

export async function mergeSectionMarkdown(
  sectionId: string,
  formData: Record<string, unknown>,
  existingContent: string,
): Promise<string> {
  const prompt = getMergePrompt(sectionId, formData, existingContent)

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt,
  })

  return text
}
