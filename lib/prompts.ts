const BASE_INSTRUCTIONS = `You are a compliance documentation specialist. Your task is to transform form data into well-structured, professional markdown documentation for SOC 2 compliance.

Guidelines:
- Use proper markdown formatting with headings, lists, and emphasis
- Keep the output clean and readable
- If a field is empty or null, either omit it or note "Not provided" where appropriate
- Use bullet points for lists
- Use bold for field labels
- Maintain a professional, formal tone
- Output ONLY the markdown content, no explanations or preamble`

const MERGE_INSTRUCTIONS = `You are a compliance documentation specialist. Your task is to UPDATE an existing markdown document with new form data, preserving unchanged sections.

CRITICAL RULES:
1. Compare the new form data with what's in the existing document
2. Only update sections where the data has actually changed
3. Preserve the exact formatting and wording of unchanged sections
4. If a field in the new data is empty/null but has content in the existing doc, KEEP the existing content
5. Maintain the same document structure and style
6. Output ONLY the updated markdown content, no explanations

The goal is SURGICAL updates - change only what needs to change, preserve everything else.`

export function getSectionPrompt(
  sectionId: string,
  formData: Record<string, unknown>,
): string {
  const dataJson = JSON.stringify(formData, null, 2)

  const sectionPrompts: Record<string, string> = {
    "company-product": `${BASE_INSTRUCTIONS}

Create a markdown document titled "# Company & Product Details" with the following sections:
- Company Information (legal name, HQ location, entity type)
- Review Period (from and to dates)
- Products in Scope
- Customer Types
- Product Description Location
- Product Description
- Product Architecture
- Cloud Architecture

Form data:
${dataJson}`,

    personnel: `${BASE_INSTRUCTIONS}

Create a markdown document titled "# Personnel" with the following sections:
- Board Members (name and role for each)
- Management Team (name and role for each)
- Organizational Chart (include the mermaid chart if provided, wrapped in a mermaid code block)
- SOC 2 Compliance Owner
- Executive Responsible for Security
- Employees (name and role for each)
- Contractors (name and role for each)

Form data:
${dataJson}`,

    infrastructure: `${BASE_INSTRUCTIONS}

Create a markdown document titled "# Infrastructure & Security" with the following sections:
- Physical Assets (list of computers, monitors, etc.)
- Device Management (MDM solution)
- Antivirus / EDR Solution
- Primary Identity Provider (IdP)
- Monitoring Tools
- Vulnerability Scanning Tools
- Disaster Recovery Plan

Form data:
${dataJson}`,

    "vendors-tools": `${BASE_INSTRUCTIONS}

Create a markdown document titled "# Vendors & Tools" with the following sections:
- Critical Vendors (list each vendor with description if provided)
- Tools (categorize if possible: Communication, Development, Design, Cloud, etc.)

Form data:
${dataJson}`,

    "data-protection": `${BASE_INSTRUCTIONS}

Create a markdown document titled "# Data Protection & Privacy" with the following sections:
- Types of Data Processed:
  - Customer Data (describe what customer data is processed)
  - Personal Data (describe what personal data is processed)
  - Sensitive Data (describe what sensitive data is processed)

Form data:
${dataJson}`,

    sdlc: `${BASE_INSTRUCTIONS}

Create a markdown document titled "# Software Development Lifecycle (SDLC)" with the following sections:
- Version Control (platform used)
- Repositories:
  - Production Repositories
  - Infrastructure Repositories
- CI/CD Tools
- Task Management

Form data:
${dataJson}`,

    communication: `${BASE_INSTRUCTIONS}

Create a markdown document titled "# Communication" with the following sections:
- Customer Communication (how features and updates are communicated to customers)
- Employee Communication (how features and updates are communicated to employees)

Form data:
${dataJson}`,

    offices: `${BASE_INSTRUCTIONS}

Create a markdown document titled "# Offices & Physical Security" with the following sections:
- Office Type (remote-only, hybrid, or fully in-person)
- Office Locations (for each office: location, ownership type)
- Physical Access Methods (key, badge, biometric, security guard, etc.)
- Visitor Access Process:
  - Sign-in Requirements
  - Escort Requirements
  - Server Room Access

Form data:
${dataJson}`,

    "additional-context": `${BASE_INSTRUCTIONS}

Create a markdown document titled "# Additional Context" that preserves the user's notes while organizing them into logical sections if possible.

Guidelines for this section:
- Preserve the user's original wording as much as possible
- If the content covers multiple topics, organize with appropriate subheadings
- Keep all information provided - do not summarize or remove details
- Use bullet points for lists where appropriate
- If the content is already well-structured, preserve that structure

Form data:
${dataJson}`,
  }

  return (
    sectionPrompts[sectionId] ||
    `${BASE_INSTRUCTIONS}

Create a well-structured markdown document from the following form data:
${dataJson}`
  )
}

export function getMergePrompt(
  sectionId: string,
  formData: Record<string, unknown>,
  existingContent: string,
): string {
  const dataJson = JSON.stringify(formData, null, 2)

  const sectionDescriptions: Record<string, string> = {
    "company-product": `Document: "# Company & Product Details"
Sections: Company Information, Review Period, Products in Scope, Customer Types, Product Description Location, Product Description, Product Architecture, Cloud Architecture`,

    personnel: `Document: "# Personnel"
Sections: Board Members, Management Team, Organizational Chart, SOC 2 Compliance Owner, Executive Responsible for Security, Employees, Contractors`,

    infrastructure: `Document: "# Infrastructure & Security"
Sections: Physical Assets, Device Management, Antivirus/EDR, Identity Provider, Monitoring Tools, Vulnerability Scanning, Disaster Recovery`,

    "vendors-tools": `Document: "# Vendors & Tools"
Sections: Critical Vendors, Tools (categorized)`,

    "data-protection": `Document: "# Data Protection & Privacy"
Sections: Types of Data Processed (Customer Data, Personal Data, Sensitive Data)`,

    sdlc: `Document: "# Software Development Lifecycle (SDLC)"
Sections: Version Control, Repositories, CI/CD Tools, Task Management`,

    communication: `Document: "# Communication"
Sections: Customer Communication, Employee Communication`,

    offices: `Document: "# Offices & Physical Security"
Sections: Office Type, Office Locations, Physical Access Methods, Visitor Access Process`,

    "additional-context": `Document: "# Additional Context"
Sections: Free-form notes organized by topic. Preserve user's original wording.`,
  }

  const sectionDesc = sectionDescriptions[sectionId] || "A compliance document"

  return `${MERGE_INSTRUCTIONS}

${sectionDesc}

EXISTING DOCUMENT:
---
${existingContent}
---

NEW FORM DATA:
${dataJson}

Update the existing document with only the changes from the new form data. If a field in the form data is empty but already has content in the document, preserve the existing content.`
}
