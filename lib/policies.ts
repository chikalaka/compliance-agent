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
    name: "Asset Management Policy",
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
  {
    id: "change-management",
    name: "Change Management Policy",
    fileName: "change-management.md",
  },
  {
    id: "code-of-conduct",
    name: "Code of Conduct",
    fileName: "code-of-conduct.md",
  },
  {
    id: "data-classification-and-protection",
    name: "Data Classification and Protection Policy",
    fileName: "data-classification-and-protection.md",
  },
  {
    id: "data-deletion-policy",
    name: "Data Deletion Policy",
    fileName: "data-deletion-policy.md",
  },
  {
    id: "disaster-recovery",
    name: "Disaster Recovery Policy (DRP)",
    fileName: "disaster-recovery.md",
  },
  {
    id: "human-resources",
    name: "Human Resources Policy",
    fileName: "human-resources.md",
  },
  {
    id: "incident-management",
    name: "Incident Management Policy",
    fileName: "incident-management.md",
  },
  {
    id: "information-classification-and-protection",
    name: "Information Classification and Protection Policy",
    fileName: "information-classification-and-protection.md",
  },
  {
    id: "information-security",
    name: "Information Security Policy",
    fileName: "information-security.md",
  },
  {
    id: "malware-detection-and-response",
    name: "Malware Detection and Response Policy",
    fileName: "malware-detection-and-response.md",
  },
  {
    id: "physical-access",
    name: "Physical Access Policy",
    fileName: "physical-access.md",
  },
  {
    id: "risk-management",
    name: "Risk Management Policy",
    fileName: "risk-management.md",
  },
  {
    id: "security",
    name: "Security Policy",
    fileName: "security.md",
  },
  {
    id: "software-development-lifecycle",
    name: "Software Development Lifecycle (SDLC)",
    fileName: "software-development-lifecycle.md",
  },
]

export function getPolicyById(id: string): Policy | undefined {
  return policies.find((p) => p.id === id)
}
