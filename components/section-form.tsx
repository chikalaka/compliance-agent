"use client"

import { ReactNode, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Save, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { MarkdownPreview } from "@/components/markdown-preview"

interface SectionFormProps {
  sectionId: string
  title: string
  description: string
  children: ReactNode
  getFormData: () => Record<string, unknown>
}

export function SectionForm({
  sectionId,
  title,
  description,
  children,
  getFormData,
}: SectionFormProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [existingContent, setExistingContent] = useState("")
  const [isLoadingContent, setIsLoadingContent] = useState(true)

  const fetchExistingContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/sections/${sectionId}`)
      if (res.ok) {
        const data = await res.json()
        setExistingContent(data.content || "")
      }
    } catch (error) {
      console.error("Error fetching existing content:", error)
    } finally {
      setIsLoadingContent(false)
    }
  }, [sectionId])

  useEffect(() => {
    fetchExistingContent()
  }, [fetchExistingContent])

  async function handleSave() {
    setIsSaving(true)
    try {
      const formData = getFormData()
      const res = await fetch(`/api/sections/${sectionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          existingContent: existingContent || undefined,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to save")
      }

      const data = await res.json()
      toast.success("Section saved!", {
        description: `Generated ${data.filePath}`,
        icon: <CheckCircle2 className="h-4 w-4" />,
      })

      // Refresh the preview with the new content
      await fetchExistingContent()
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Failed to save section", {
        description: "Please check your connection and try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>

      <div className="space-y-6">{children}</div>

      <div className="flex items-center justify-end gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="min-w-[140px] bg-emerald-600 hover:bg-emerald-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Section
            </>
          )}
        </Button>
      </div>

      <MarkdownPreview content={existingContent} isLoading={isLoadingContent} />
    </div>
  )
}
