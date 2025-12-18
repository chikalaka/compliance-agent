export interface Policy {
  id: string
  name: string
  fileName: string
}

export const policies: Policy[] = [
  {
    id: "acceptable-use",
    name: "Acceptable Use Policy",
    fileName: "acceptable-use-policy.md",
  },
  {
    id: "asset-management",
    name: "Asset Management",
    fileName: "asset-management.md",
  },
  {
    id: "backup-policy",
    name: "Backup Policy",
    fileName: "backup-policy.md",
  },
  {
    id: "bcp",
    name: "Business Continuity Plan (BCP)",
    fileName: "business-continuity-plan.md",
  },
]

export function getPolicyById(id: string): Policy | undefined {
  return policies.find((p) => p.id === id)
}
