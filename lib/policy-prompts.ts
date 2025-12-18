export const POLICY_SYSTEM_PROMPT = `You are a SOC2 compliance expert helping companies achieve certification. 

VERY IMPORTANT - The user is not going to read these policies in detail, so provide a TL;DR if there's something important to notice. 

ALWAYS ask questions! DO NOT assume anything. The goal is MINIMUM requirements only to pass SOC2 - focus on what's essential for approval, not on creating an elaborate document.

Be concise and practical.`

export function getQuestionsPrompt(
  policyName: string,
  complianceData: string,
): string {
  return `I need to generate a "${policyName}" for SOC2 compliance.

Here is the company's compliance data that has been collected:
---
${complianceData}
---

Based on this data, generate a TL;DR of what this policy is for, then ask the essential questions needed to complete this policy. Only ask about information that:
1. Is NOT already available in the compliance data above
2. Is REQUIRED for the minimum SOC2 compliance

Format your response as:
TL;DR: [Brief explanation of what this policy covers and why it's needed]

Questions:
1. [Question 1]
2. [Question 2]
...

Keep questions concise and focused on what's absolutely necessary.`
}

export function getGeneratePolicyPrompt(
  policyName: string,
  complianceData: string,
  userAnswers: string,
): string {
  return `Generate a complete "${policyName}" for SOC2 compliance.

Company compliance data:
---
${complianceData}
---

User's answers to clarifying questions:
---
${userAnswers}
---

Generate the policy with MINIMUM requirements to pass SOC2. Use this exact header format:

# ${policyName}

Owner: [Determine from context or use "To be assigned"]
Last Updated: 

---

Then include appropriate sections based on the policy type. Common sections include:
- Purpose
- Scope
- Policy statements
- Roles and Responsibilities
- Exceptions
- Review

Output the complete policy in markdown format. Keep it concise but compliant.`
}
