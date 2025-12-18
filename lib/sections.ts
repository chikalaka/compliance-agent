export interface Section {
  id: string
  title: string
  description: string
  fileName: string
  icon: string
}

export const sections: Section[] = [
  {
    id: "company-product",
    title: "Company & Product",
    description: "Company details, products in scope, and architecture",
    fileName: "company-product.md",
    icon: "Building2",
  },
  {
    id: "personnel",
    title: "Personnel",
    description: "Board, management, employees, and organizational structure",
    fileName: "personnel.md",
    icon: "Users",
  },
  {
    id: "infrastructure",
    title: "Infra & Security",
    description: "Assets, MDM, security tools, and disaster recovery",
    fileName: "infrastructure.md",
    icon: "Shield",
  },
  {
    id: "vendors-tools",
    title: "Vendors & Tools",
    description: "Critical vendors and tools used by the organization",
    fileName: "vendors-tools.md",
    icon: "Wrench",
  },
  {
    id: "data-protection",
    title: "Data Protection",
    description: "Types of data processed and privacy measures",
    fileName: "data-protection.md",
    icon: "Lock",
  },
  {
    id: "sdlc",
    title: "SDLC",
    description: "Version control, CI/CD, and development processes",
    fileName: "sdlc.md",
    icon: "GitBranch",
  },
  {
    id: "communication",
    title: "Communication",
    description: "How features are communicated to customers and employees",
    fileName: "communication.md",
    icon: "MessageSquare",
  },
  {
    id: "offices",
    title: "Offices & Physical",
    description: "Office locations, access methods, and visitor processes",
    fileName: "offices.md",
    icon: "MapPin",
  },
]

export function getSectionById(id: string): Section | undefined {
  return sections.find((s) => s.id === id)
}
