"use client"

import { useState } from "react"
import { SectionForm } from "@/components/section-form"
import {
  FieldWrapper,
  DynamicList,
  CheckboxGroup,
} from "@/components/form-fields"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"

interface Asset {
  id: string
  name: string
  role?: string
}

const MDM_OPTIONS = [
  { id: "jamf", label: "Jamf" },
  { id: "kandji", label: "Kandji" },
  { id: "mosyle", label: "Mosyle" },
  { id: "intune", label: "Microsoft Intune" },
  { id: "workspace-one", label: "VMware Workspace ONE" },
  { id: "other", label: "Other" },
]

const ANTIVIRUS_OPTIONS = [
  { id: "crowdstrike", label: "CrowdStrike" },
  { id: "sentinelone", label: "SentinelOne" },
  { id: "carbon-black", label: "Carbon Black" },
  { id: "defender", label: "Microsoft Defender" },
  { id: "sophos", label: "Sophos" },
  { id: "other", label: "Other" },
]

const IDP_OPTIONS = [
  { id: "okta", label: "Okta" },
  { id: "google-workspace", label: "Google Workspace" },
  { id: "azure-ad", label: "Azure AD / Entra ID" },
  { id: "onelogin", label: "OneLogin" },
  { id: "jumpcloud", label: "JumpCloud" },
  { id: "other", label: "Other" },
]

const MONITORING_OPTIONS = [
  { id: "datadog", label: "Datadog" },
  { id: "newrelic", label: "New Relic" },
  { id: "grafana", label: "Grafana" },
  { id: "prometheus", label: "Prometheus" },
  { id: "cloudwatch", label: "AWS CloudWatch" },
  { id: "stackdriver", label: "Google Cloud Monitoring" },
  { id: "pagerduty", label: "PagerDuty" },
  { id: "other", label: "Other" },
]

const VULN_SCANNING_OPTIONS = [
  { id: "snyk", label: "Snyk" },
  { id: "dependabot", label: "Dependabot" },
  { id: "qualys", label: "Qualys" },
  { id: "nessus", label: "Nessus" },
  { id: "rapid7", label: "Rapid7" },
  { id: "sonarqube", label: "SonarQube" },
  { id: "other", label: "Other" },
]

export default function InfrastructurePage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [mdmSolutions, setMdmSolutions] = useState<string[]>([])
  const [mdmOther, setMdmOther] = useState("")
  const [antivirusSolutions, setAntivirusSolutions] = useState<string[]>([])
  const [antivirusOther, setAntivirusOther] = useState("")
  const [idpSolutions, setIdpSolutions] = useState<string[]>([])
  const [idpOther, setIdpOther] = useState("")
  const [monitoringTools, setMonitoringTools] = useState<string[]>([])
  const [monitoringOther, setMonitoringOther] = useState("")
  const [vulnScanningTools, setVulnScanningTools] = useState<string[]>([])
  const [vulnScanningOther, setVulnScanningOther] = useState("")
  const [disasterRecoveryPlan, setDisasterRecoveryPlan] = useState("")

  const getFormData = () => ({
    physicalAssets: assets
      .filter((a) => a.name)
      .map((a) => ({ type: a.name, quantity: a.role })),
    deviceManagement: {
      solutions: mdmSolutions,
      other: mdmOther,
    },
    antivirusEdr: {
      solutions: antivirusSolutions,
      other: antivirusOther,
    },
    identityProvider: {
      solutions: idpSolutions,
      other: idpOther,
    },
    monitoringTools: {
      tools: monitoringTools,
      other: monitoringOther,
    },
    vulnerabilityScanning: {
      tools: vulnScanningTools,
      other: vulnScanningOther,
    },
    disasterRecoveryPlan,
  })

  return (
    <SectionForm
      sectionId="infrastructure"
      title="Infrastructure & Security"
      description="Enter details about your physical assets, security tools, and disaster recovery plans."
      getFormData={getFormData}
    >
      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Physical Assets
          </h3>

          <FieldWrapper
            label="Asset Inventory"
            description="List physical assets (computers, monitors, servers, etc.)"
          >
            <DynamicList
              items={assets}
              onChange={setAssets}
              placeholder="Asset type (e.g., MacBook Pro)"
              showRole
              rolePlaceholder="Quantity"
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Device Management (MDM)
          </h3>

          <FieldWrapper
            label="MDM Solution"
            description="Select your MDM provider(s)"
          >
            <CheckboxGroup
              options={MDM_OPTIONS}
              selected={mdmSolutions}
              onChange={setMdmSolutions}
            />
          </FieldWrapper>

          {mdmSolutions.includes("other") && (
            <FieldWrapper label="Other MDM Solution" htmlFor="mdmOther">
              <Input
                id="mdmOther"
                value={mdmOther}
                onChange={(e) => setMdmOther(e.target.value)}
                placeholder="Specify other MDM solution"
              />
            </FieldWrapper>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Antivirus / EDR
          </h3>

          <FieldWrapper
            label="Antivirus/EDR Solution"
            description="Select your endpoint protection solution(s)"
          >
            <CheckboxGroup
              options={ANTIVIRUS_OPTIONS}
              selected={antivirusSolutions}
              onChange={setAntivirusSolutions}
            />
          </FieldWrapper>

          {antivirusSolutions.includes("other") && (
            <FieldWrapper label="Other Antivirus/EDR" htmlFor="avOther">
              <Input
                id="avOther"
                value={antivirusOther}
                onChange={(e) => setAntivirusOther(e.target.value)}
                placeholder="Specify other solution"
              />
            </FieldWrapper>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Identity Provider (IdP)
          </h3>

          <FieldWrapper
            label="Primary IdP"
            description="Select your identity provider(s)"
          >
            <CheckboxGroup
              options={IDP_OPTIONS}
              selected={idpSolutions}
              onChange={setIdpSolutions}
            />
          </FieldWrapper>

          {idpSolutions.includes("other") && (
            <FieldWrapper label="Other IdP" htmlFor="idpOther">
              <Input
                id="idpOther"
                value={idpOther}
                onChange={(e) => setIdpOther(e.target.value)}
                placeholder="Specify other IdP"
              />
            </FieldWrapper>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Monitoring Tools
          </h3>

          <FieldWrapper
            label="Monitoring Solutions"
            description="Select your monitoring and alerting tools"
          >
            <CheckboxGroup
              options={MONITORING_OPTIONS}
              selected={monitoringTools}
              onChange={setMonitoringTools}
            />
          </FieldWrapper>

          {monitoringTools.includes("other") && (
            <FieldWrapper label="Other Monitoring Tool" htmlFor="monOther">
              <Input
                id="monOther"
                value={monitoringOther}
                onChange={(e) => setMonitoringOther(e.target.value)}
                placeholder="Specify other monitoring tool"
              />
            </FieldWrapper>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Vulnerability Scanning
          </h3>

          <FieldWrapper
            label="Vulnerability Scanning Tools"
            description="Select your vulnerability scanning solutions"
          >
            <CheckboxGroup
              options={VULN_SCANNING_OPTIONS}
              selected={vulnScanningTools}
              onChange={setVulnScanningTools}
            />
          </FieldWrapper>

          {vulnScanningTools.includes("other") && (
            <FieldWrapper label="Other Scanning Tool" htmlFor="vulnOther">
              <Input
                id="vulnOther"
                value={vulnScanningOther}
                onChange={(e) => setVulnScanningOther(e.target.value)}
                placeholder="Specify other scanning tool"
              />
            </FieldWrapper>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Disaster Recovery
          </h3>

          <FieldWrapper
            label="Disaster Recovery Plan"
            description="Describe your disaster recovery plan and procedures"
            htmlFor="drPlan"
          >
            <Textarea
              id="drPlan"
              value={disasterRecoveryPlan}
              onChange={(e) => setDisasterRecoveryPlan(e.target.value)}
              placeholder="Describe your disaster recovery plan, including RTO, RPO, backup procedures, and recovery testing..."
              rows={8}
            />
          </FieldWrapper>
        </CardContent>
      </Card>
    </SectionForm>
  )
}
