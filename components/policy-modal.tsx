"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Sparkles, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import type { Policy } from "@/lib/policies"

interface PolicyModalProps {
  policy: Policy | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPolicyGenerated?: () => void
}

type ModalStep = "loading-questions" | "answering" | "generating" | "complete"

export function PolicyModal({
  policy,
  open,
  onOpenChange,
  onPolicyGenerated,
}: PolicyModalProps) {
  const [step, setStep] = useState<ModalStep>("loading-questions")
  const [questions, setQuestions] = useState("")
  const [userAnswers, setUserAnswers] = useState("")
  const [generatedPolicy, setGeneratedPolicy] = useState("")
  const [copied, setCopied] = useState(false)

  // Fetch questions when modal opens
  useEffect(() => {
    async function fetchQuestions() {
      if (!open || !policy) return

      setStep("loading-questions")
      setQuestions("")
      setUserAnswers("")
      setGeneratedPolicy("")
      setCopied(false)

      try {
        const res = await fetch("/api/policies/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policyId: policy.id,
            policyName: policy.id === "custom" ? policy.name : undefined,
          }),
        })

        if (!res.ok) {
          throw new Error("Failed to fetch questions")
        }

        const data = await res.json()
        setQuestions(data.questions)
        setStep("answering")
      } catch (error) {
        console.error("Error fetching questions:", error)
        toast.error("Failed to load questions")
        onOpenChange(false)
      }
    }

    fetchQuestions()
  }, [open, policy, onOpenChange])

  const handleGeneratePolicy = async () => {
    if (!policy) return

    setStep("generating")

    try {
      const res = await fetch("/api/policies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId: policy.id,
          userAnswers,
          questions,
          policyName: policy.id === "custom" ? policy.name : undefined,
          fileName: policy.id === "custom" ? policy.fileName : undefined,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to generate policy")
      }

      const data = await res.json()
      setGeneratedPolicy(data.policy)
      setStep("complete")
      toast.success("Policy generated!", {
        description: `Saved to /policies/${data.savedTo}`,
      })
      onPolicyGenerated?.()
    } catch (error) {
      console.error("Error generating policy:", error)
      toast.error("Failed to generate policy")
      setStep("answering")
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPolicy)
      setCopied(true)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Generate {policy?.name}
          </DialogTitle>
          <DialogDescription>
            {step === "loading-questions" && "Analyzing compliance data..."}
            {step === "answering" &&
              "Answer the questions below to generate your policy."}
            {step === "generating" && "Generating your policy..."}
            {step === "complete" && "Your policy has been generated and saved."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {step === "loading-questions" && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
          )}

          {step === "answering" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  AI Questions
                </p>
                <ScrollArea className="h-[150px]">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                    {questions}
                  </p>
                </ScrollArea>
              </div>

              <div>
                <label
                  htmlFor="answers"
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Your Answers
                </label>
                <Textarea
                  id="answers"
                  value={userAnswers}
                  onChange={(e) => setUserAnswers(e.target.value)}
                  placeholder="Type your answers here..."
                  className="mt-2 min-h-[150px]"
                />
              </div>
            </div>
          )}

          {step === "generating" && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500 mx-auto mb-4" />
                <p className="text-sm text-zinc-500">
                  Generating your policy...
                </p>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Generated Policy
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="h-[300px] rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <pre className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-mono">
                  {generatedPolicy}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "answering" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGeneratePolicy}
                className="bg-violet-600 hover:bg-violet-700 gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate Final Policy
              </Button>
            </>
          )}

          {step === "complete" && <Button onClick={handleClose}>Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
