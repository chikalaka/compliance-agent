"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sparkles, CheckCircle2 } from "lucide-react"
import { policies, type Policy } from "@/lib/policies"
import { PolicyModal } from "@/components/policy-modal"

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

interface PolicyStatus {
  [key: string]: boolean
}

export default function GeneratePoliciesPage() {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [policyStatuses, setPolicyStatuses] = useState<PolicyStatus>({})
  const [customPolicyName, setCustomPolicyName] = useState("")

  const checkPolicyStatuses = async () => {
    try {
      const res = await fetch("/api/policies/status")
      if (res.ok) {
        const data = await res.json()
        setPolicyStatuses(data)
      }
    } catch {
      // Ignore errors
    }
  }

  useEffect(() => {
    async function fetchStatuses() {
      await checkPolicyStatuses()
    }
    fetchStatuses()
  }, [])

  const handleGenerate = (policy: Policy) => {
    setSelectedPolicy(policy)
    setModalOpen(true)
  }

  const handleCustomGenerate = () => {
    if (!customPolicyName.trim()) return
    const customPolicy: Policy = {
      id: "custom",
      name: customPolicyName.trim(),
      description: "Custom policy",
      fileName: `${toKebabCase(customPolicyName)}.md`,
    }
    setSelectedPolicy(customPolicy)
    setModalOpen(true)
    setCustomPolicyName("")
  }

  const handlePolicyGenerated = () => {
    checkPolicyStatuses()
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Generate Policies
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Generate SOC2 compliance policies using AI. Each policy is tailored
          based on your company data.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={customPolicyName}
          onChange={(e) => setCustomPolicyName(e.target.value)}
          placeholder="Custom policy name..."
          className="max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && handleCustomGenerate()}
        />
        <Button
          onClick={handleCustomGenerate}
          disabled={!customPolicyName.trim()}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate
        </Button>
      </div>

      <div className="grid gap-4">
        {policies.map((policy) => {
          const isGenerated = policyStatuses[policy.id]

          return (
            <Card key={policy.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {policy.name}
                    </h3>
                    {isGenerated && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Generated
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    {policy.description}
                  </p>
                </div>
                <Button
                  onClick={() => handleGenerate(policy)}
                  variant={isGenerated ? "outline" : "default"}
                  className={
                    isGenerated ? "" : "bg-violet-600 hover:bg-violet-700 gap-2"
                  }
                >
                  <Sparkles className="h-4 w-4" />
                  {isGenerated ? "Regenerate" : "Generate"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <PolicyModal
        policy={selectedPolicy}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onPolicyGenerated={handlePolicyGenerated}
      />
    </div>
  )
}
