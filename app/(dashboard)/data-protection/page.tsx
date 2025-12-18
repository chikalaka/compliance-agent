"use client"

import { useState } from "react"
import { SectionForm } from "@/components/section-form"
import { FieldWrapper } from "@/components/form-fields"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export default function DataProtectionPage() {
  const [processesCustomerData, setProcessesCustomerData] = useState(false)
  const [customerDataDescription, setCustomerDataDescription] = useState("")
  const [processesPersonalData, setProcessesPersonalData] = useState(false)
  const [personalDataDescription, setPersonalDataDescription] = useState("")
  const [processesSensitiveData, setProcessesSensitiveData] = useState(false)
  const [sensitiveDataDescription, setSensitiveDataDescription] = useState("")

  const getFormData = () => ({
    customerData: {
      processed: processesCustomerData,
      description: customerDataDescription,
    },
    personalData: {
      processed: processesPersonalData,
      description: personalDataDescription,
    },
    sensitiveData: {
      processed: processesSensitiveData,
      description: sensitiveDataDescription,
    },
  })

  return (
    <SectionForm
      sectionId="data-protection"
      title="Data Protection & Privacy"
      description="Describe the types of data your organization processes."
      getFormData={getFormData}
    >
      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Customer Data
          </h3>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="customerData"
              checked={processesCustomerData}
              onCheckedChange={(checked) =>
                setProcessesCustomerData(checked === true)
              }
            />
            <Label htmlFor="customerData" className="cursor-pointer">
              We process customer data
            </Label>
          </div>

          {processesCustomerData && (
            <FieldWrapper
              label="Customer Data Description"
              description="Describe what customer data you collect and process"
              htmlFor="customerDataDesc"
            >
              <Textarea
                id="customerDataDesc"
                value={customerDataDescription}
                onChange={(e) => setCustomerDataDescription(e.target.value)}
                placeholder="We collect customer account information including name, email, company name. We also process usage data such as..."
                rows={5}
              />
            </FieldWrapper>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Personal Data
          </h3>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="personalData"
              checked={processesPersonalData}
              onCheckedChange={(checked) =>
                setProcessesPersonalData(checked === true)
              }
            />
            <Label htmlFor="personalData" className="cursor-pointer">
              We process personal data (PII)
            </Label>
          </div>

          {processesPersonalData && (
            <FieldWrapper
              label="Personal Data Description"
              description="Describe what personal data you collect and how it's handled"
              htmlFor="personalDataDesc"
            >
              <Textarea
                id="personalDataDesc"
                value={personalDataDescription}
                onChange={(e) => setPersonalDataDescription(e.target.value)}
                placeholder="We collect personal information such as names, email addresses, phone numbers. This data is encrypted at rest and in transit..."
                rows={5}
              />
            </FieldWrapper>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Sensitive Data
          </h3>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sensitiveData"
              checked={processesSensitiveData}
              onCheckedChange={(checked) =>
                setProcessesSensitiveData(checked === true)
              }
            />
            <Label htmlFor="sensitiveData" className="cursor-pointer">
              We process sensitive data (PHI, financial data, etc.)
            </Label>
          </div>

          {processesSensitiveData && (
            <FieldWrapper
              label="Sensitive Data Description"
              description="Describe what sensitive data you process and the additional protections in place"
              htmlFor="sensitiveDataDesc"
            >
              <Textarea
                id="sensitiveDataDesc"
                value={sensitiveDataDescription}
                onChange={(e) => setSensitiveDataDescription(e.target.value)}
                placeholder="We process financial data including payment card information. This is handled through a PCI-compliant payment processor..."
                rows={5}
              />
            </FieldWrapper>
          )}
        </CardContent>
      </Card>
    </SectionForm>
  )
}
