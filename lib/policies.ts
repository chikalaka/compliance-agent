export interface Policy {
  id: string
  name: string
  description: string
  fileName: string
}

export const policies: Policy[] = [
  {
    id: "acceptable-use",
    name: "Acceptable Use Policy",
    description: "Defines acceptable use of company IT resources and systems",
    fileName: "acceptable-use-policy.md",
  },
  {
    id: "asset-management",
    name: "Asset Management",
    description: "Procedures for managing and tracking company assets",
    fileName: "asset-management.md",
  },
  {
    id: "backup-policy",
    name: "Backup Policy",
    description: "Data backup procedures and retention requirements",
    fileName: "backup-policy.md",
  },
  {
    id: "bcp",
    name: "Business Continuity Plan (BCP)",
    description: "Procedures for maintaining operations during disruptions",
    fileName: "business-continuity-plan.md",
  },
]

export function getPolicyById(id: string): Policy | undefined {
  return policies.find((p) => p.id === id)
}
