"use client"

import { useState } from "react"
import { SectionForm } from "@/components/section-form"
import { FieldWrapper } from "@/components/form-fields"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

export default function AdditionalContextPage() {
  const [additionalNotes, setAdditionalNotes] = useState("")

  const getFormData = () => ({
    additionalNotes,
  })

  return (
    <SectionForm
      sectionId="additional-context"
      title="Additional Context"
      description="Add any other SOC 2 relevant information that doesn't fit in the other sections."
      getFormData={getFormData}
    >
      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Free-Form Notes
          </h3>

          <FieldWrapper
            label="Additional Information"
            description="Include any context about your company, processes, or compliance posture that may be helpful for policy generation. This section is also automatically enriched when you answer AI questions during policy generation."
            htmlFor="additionalNotes"
          >
            <Textarea
              id="additionalNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Examples of what to include here:
- Special compliance requirements or certifications
- Industry-specific regulations you follow
- Security practices not covered elsewhere
- Historical context about your security program
- Exceptions or unique aspects of your operations
- Anything else relevant for SOC 2 compliance..."
              rows={16}
            />
          </FieldWrapper>
        </CardContent>
      </Card>
    </SectionForm>
  )
}
