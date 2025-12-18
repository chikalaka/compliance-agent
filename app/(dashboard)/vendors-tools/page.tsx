"use client";

import { useState } from "react";
import { SectionForm } from "@/components/section-form";
import { FieldWrapper, DynamicList, CheckboxGroup } from "@/components/form-fields";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Vendor {
  id: string;
  name: string;
  role?: string;
}

const COMMUNICATION_TOOLS = [
  { id: "slack", label: "Slack" },
  { id: "teams", label: "Microsoft Teams" },
  { id: "discord", label: "Discord" },
  { id: "zoom", label: "Zoom" },
  { id: "google-meet", label: "Google Meet" },
];

const DEVELOPMENT_TOOLS = [
  { id: "github", label: "GitHub" },
  { id: "gitlab", label: "GitLab" },
  { id: "bitbucket", label: "Bitbucket" },
  { id: "vscode", label: "VS Code" },
  { id: "jetbrains", label: "JetBrains IDEs" },
];

const DESIGN_TOOLS = [
  { id: "figma", label: "Figma" },
  { id: "sketch", label: "Sketch" },
  { id: "adobe-xd", label: "Adobe XD" },
  { id: "canva", label: "Canva" },
];

const PROJECT_TOOLS = [
  { id: "linear", label: "Linear" },
  { id: "jira", label: "Jira" },
  { id: "asana", label: "Asana" },
  { id: "notion", label: "Notion" },
  { id: "monday", label: "Monday.com" },
  { id: "clickup", label: "ClickUp" },
  { id: "trello", label: "Trello" },
];

const CLOUD_PROVIDERS = [
  { id: "aws", label: "AWS" },
  { id: "gcp", label: "Google Cloud Platform" },
  { id: "azure", label: "Microsoft Azure" },
  { id: "vercel", label: "Vercel" },
  { id: "netlify", label: "Netlify" },
  { id: "heroku", label: "Heroku" },
  { id: "digitalocean", label: "DigitalOcean" },
];

const DATA_TOOLS = [
  { id: "snowflake", label: "Snowflake" },
  { id: "databricks", label: "Databricks" },
  { id: "bigquery", label: "BigQuery" },
  { id: "redshift", label: "Redshift" },
  { id: "mongodb", label: "MongoDB Atlas" },
  { id: "postgres", label: "PostgreSQL" },
];

export default function VendorsToolsPage() {
  const [criticalVendors, setCriticalVendors] = useState<Vendor[]>([]);
  const [communicationTools, setCommunicationTools] = useState<string[]>([]);
  const [developmentTools, setDevelopmentTools] = useState<string[]>([]);
  const [designTools, setDesignTools] = useState<string[]>([]);
  const [projectTools, setProjectTools] = useState<string[]>([]);
  const [cloudProviders, setCloudProviders] = useState<string[]>([]);
  const [dataTools, setDataTools] = useState<string[]>([]);
  const [otherTools, setOtherTools] = useState("");

  const getFormData = () => ({
    criticalVendors: criticalVendors
      .filter((v) => v.name)
      .map((v) => ({ name: v.name, description: v.role })),
    tools: {
      communication: communicationTools,
      development: developmentTools,
      design: designTools,
      projectManagement: projectTools,
      cloud: cloudProviders,
      data: dataTools,
      other: otherTools,
    },
  });

  return (
    <SectionForm
      sectionId="vendors-tools"
      title="Vendors & Tools"
      description="List your critical vendors and the tools your organization uses."
      getFormData={getFormData}
    >
      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Critical Vendors
          </h3>

          <FieldWrapper
            label="Vendor List"
            description="List vendors that are critical to your operations (payment processors, key SaaS providers, etc.)"
          >
            <DynamicList
              items={criticalVendors}
              onChange={setCriticalVendors}
              placeholder="Vendor name"
              showRole
              rolePlaceholder="Description / Purpose"
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Communication Tools
          </h3>

          <FieldWrapper label="Select tools used for communication">
            <CheckboxGroup
              options={COMMUNICATION_TOOLS}
              selected={communicationTools}
              onChange={setCommunicationTools}
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Development Tools
          </h3>

          <FieldWrapper label="Select development tools">
            <CheckboxGroup
              options={DEVELOPMENT_TOOLS}
              selected={developmentTools}
              onChange={setDevelopmentTools}
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Design Tools
          </h3>

          <FieldWrapper label="Select design tools">
            <CheckboxGroup
              options={DESIGN_TOOLS}
              selected={designTools}
              onChange={setDesignTools}
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Project Management
          </h3>

          <FieldWrapper label="Select project management tools">
            <CheckboxGroup
              options={PROJECT_TOOLS}
              selected={projectTools}
              onChange={setProjectTools}
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Cloud Providers
          </h3>

          <FieldWrapper label="Select cloud providers">
            <CheckboxGroup
              options={CLOUD_PROVIDERS}
              selected={cloudProviders}
              onChange={setCloudProviders}
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Data & Database Tools
          </h3>

          <FieldWrapper label="Select data tools">
            <CheckboxGroup
              options={DATA_TOOLS}
              selected={dataTools}
              onChange={setDataTools}
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Other Tools
          </h3>

          <FieldWrapper
            label="Additional Tools"
            description="List any other tools not mentioned above"
            htmlFor="otherTools"
          >
            <Input
              id="otherTools"
              value={otherTools}
              onChange={(e) => setOtherTools(e.target.value)}
              placeholder="Tool1, Tool2, Tool3..."
            />
          </FieldWrapper>
        </CardContent>
      </Card>
    </SectionForm>
  );
}

