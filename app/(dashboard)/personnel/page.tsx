"use client"

import { useState } from "react"
import { SectionForm } from "@/components/section-form"
import { FieldWrapper, DynamicList } from "@/components/form-fields"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

interface Person {
  id: string
  name: string
  role?: string
}

export default function PersonnelPage() {
  const [boardMembers, setBoardMembers] = useState<Person[]>([])
  const [managementMembers, setManagementMembers] = useState<Person[]>([])
  const [orgChart, setOrgChart] = useState("")
  const [soc2OwnerName, setSoc2OwnerName] = useState("")
  const [soc2OwnerTitle, setSoc2OwnerTitle] = useState("")
  const [securityExecName, setSecurityExecName] = useState("")
  const [securityExecTitle, setSecurityExecTitle] = useState("")
  const [securityExecSameAsSoc2, setSecurityExecSameAsSoc2] = useState(false)
  const [employees, setEmployees] = useState<Person[]>([])
  const [contractors, setContractors] = useState<Person[]>([])

  const getFormData = () => ({
    boardMembers: boardMembers
      .filter((p) => p.name)
      .map((p) => ({ name: p.name, role: p.role })),
    managementMembers: managementMembers
      .filter((p) => p.name)
      .map((p) => ({ name: p.name, role: p.role })),
    orgChart,
    soc2Owner: { name: soc2OwnerName, title: soc2OwnerTitle },
    securityExecutive: securityExecSameAsSoc2
      ? { name: soc2OwnerName, title: soc2OwnerTitle, sameAsSoc2Owner: true }
      : { name: securityExecName, title: securityExecTitle },
    employees: employees
      .filter((p) => p.name)
      .map((p) => ({ name: p.name, role: p.role })),
    contractors: contractors
      .filter((p) => p.name)
      .map((p) => ({ name: p.name, role: p.role })),
  })

  return (
    <SectionForm
      sectionId="personnel"
      title="Personnel"
      description="Enter information about your board, management, employees, and organizational structure."
      getFormData={getFormData}
    >
      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Board Members
          </h3>

          <FieldWrapper
            label="Board Members"
            description="List all board members with their roles"
          >
            <DynamicList
              items={boardMembers}
              onChange={setBoardMembers}
              placeholder="Name"
              showRole
              rolePlaceholder="Role (e.g., Chairman, Director)"
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Management Team
          </h3>

          <FieldWrapper
            label="Management Members"
            description="List all management team members with their roles"
          >
            <DynamicList
              items={managementMembers}
              onChange={setManagementMembers}
              placeholder="Name"
              showRole
              rolePlaceholder="Role (e.g., CEO, CTO, VP Engineering)"
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Organizational Chart
          </h3>

          <FieldWrapper
            label="Org Chart (Mermaid Format)"
            description="Paste a mermaid diagram showing your organizational structure (roles only)"
            htmlFor="orgChart"
          >
            <Textarea
              id="orgChart"
              value={orgChart}
              onChange={(e) => setOrgChart(e.target.value)}
              placeholder={`graph TD
    CEO --> CTO
    CEO --> CFO
    CTO --> Engineering
    CTO --> Security`}
              rows={8}
              className="font-mono text-sm"
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Compliance & Security Leadership
          </h3>

          <div className="space-y-4">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              SOC 2 Compliance Owner
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="Name" htmlFor="soc2Name">
                <Input
                  id="soc2Name"
                  value={soc2OwnerName}
                  onChange={(e) => setSoc2OwnerName(e.target.value)}
                  placeholder="John Smith"
                />
              </FieldWrapper>

              <FieldWrapper label="Title" htmlFor="soc2Title">
                <Input
                  id="soc2Title"
                  value={soc2OwnerTitle}
                  onChange={(e) => setSoc2OwnerTitle(e.target.value)}
                  placeholder="Head of Compliance"
                />
              </FieldWrapper>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Executive Responsible for Security
              </p>
              <label className="flex items-center gap-2 text-sm text-zinc-500">
                <input
                  type="checkbox"
                  checked={securityExecSameAsSoc2}
                  onChange={(e) => setSecurityExecSameAsSoc2(e.target.checked)}
                  className="rounded"
                />
                Same as SOC 2 owner
              </label>
            </div>

            {!securityExecSameAsSoc2 && (
              <div className="grid grid-cols-2 gap-4">
                <FieldWrapper label="Name" htmlFor="secName">
                  <Input
                    id="secName"
                    value={securityExecName}
                    onChange={(e) => setSecurityExecName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </FieldWrapper>

                <FieldWrapper label="Title" htmlFor="secTitle">
                  <Input
                    id="secTitle"
                    value={securityExecTitle}
                    onChange={(e) => setSecurityExecTitle(e.target.value)}
                    placeholder="CISO"
                  />
                </FieldWrapper>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Employees
          </h3>

          <FieldWrapper
            label="Employee List"
            description="List all employees with their roles"
          >
            <DynamicList
              items={employees}
              onChange={setEmployees}
              placeholder="Name"
              showRole
              rolePlaceholder="Role"
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Contractors
          </h3>

          <FieldWrapper
            label="Contractor List"
            description="List all contractors with their roles"
          >
            <DynamicList
              items={contractors}
              onChange={setContractors}
              placeholder="Name"
              showRole
              rolePlaceholder="Role"
            />
          </FieldWrapper>
        </CardContent>
      </Card>
    </SectionForm>
  )
}
