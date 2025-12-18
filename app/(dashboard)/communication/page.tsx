"use client"

import { useState } from "react"
import { SectionForm } from "@/components/section-form"
import { FieldWrapper } from "@/components/form-fields"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

export default function CommunicationPage() {
  const [customerCommunication, setCustomerCommunication] = useState("")
  const [employeeCommunication, setEmployeeCommunication] = useState("")

  const getFormData = () => ({
    customerCommunication,
    employeeCommunication,
  })

  return (
    <SectionForm
      sectionId="communication"
      title="Communication"
      description="Describe how you communicate features and updates to customers and employees."
      getFormData={getFormData}
    >
      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Customer Communication
          </h3>

          <FieldWrapper
            label="How do you communicate features to customers?"
            description="Describe the channels and processes used to inform customers about new features, updates, and changes"
            htmlFor="customerComm"
          >
            <Textarea
              id="customerComm"
              value={customerCommunication}
              onChange={(e) => setCustomerCommunication(e.target.value)}
              placeholder="We communicate new features to customers through:
- In-app announcements and notifications
- Email newsletters
- Product changelog on our website
- Blog posts for major features
- Social media updates..."
              rows={8}
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Employee Communication
          </h3>

          <FieldWrapper
            label="How do you communicate features to employees?"
            description="Describe how employees are informed about new features, product updates, and company changes"
            htmlFor="employeeComm"
          >
            <Textarea
              id="employeeComm"
              value={employeeCommunication}
              onChange={(e) => setEmployeeCommunication(e.target.value)}
              placeholder="We communicate to employees through:
- Weekly all-hands meetings
- Slack channel #product-updates
- Internal wiki documentation
- Demo sessions for new features
- Training sessions when needed..."
              rows={8}
            />
          </FieldWrapper>
        </CardContent>
      </Card>
    </SectionForm>
  )
}
