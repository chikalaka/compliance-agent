"use client";

import { useState } from "react";
import { SectionForm } from "@/components/section-form";
import { FieldWrapper, DynamicList, CheckboxGroup } from "@/components/form-fields";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Repo {
  id: string;
  name: string;
}

const VERSION_CONTROL_OPTIONS = [
  { id: "github", label: "GitHub" },
  { id: "gitlab", label: "GitLab" },
  { id: "bitbucket", label: "Bitbucket" },
  { id: "azure-devops", label: "Azure DevOps" },
  { id: "other", label: "Other" },
];

const CICD_OPTIONS = [
  { id: "github-actions", label: "GitHub Actions" },
  { id: "gitlab-ci", label: "GitLab CI" },
  { id: "jenkins", label: "Jenkins" },
  { id: "circleci", label: "CircleCI" },
  { id: "travis", label: "Travis CI" },
  { id: "azure-pipelines", label: "Azure Pipelines" },
  { id: "argo", label: "Argo CD" },
  { id: "other", label: "Other" },
];

const TASK_MANAGEMENT_OPTIONS = [
  { id: "jira", label: "Jira" },
  { id: "linear", label: "Linear" },
  { id: "asana", label: "Asana" },
  { id: "notion", label: "Notion" },
  { id: "github-issues", label: "GitHub Issues" },
  { id: "gitlab-issues", label: "GitLab Issues" },
  { id: "trello", label: "Trello" },
  { id: "other", label: "Other" },
];

export default function SdlcPage() {
  const [versionControl, setVersionControl] = useState<string[]>([]);
  const [versionControlOther, setVersionControlOther] = useState("");
  const [productionRepos, setProductionRepos] = useState<Repo[]>([]);
  const [infraRepos, setInfraRepos] = useState<Repo[]>([]);
  const [cicdTools, setCicdTools] = useState<string[]>([]);
  const [cicdOther, setCicdOther] = useState("");
  const [taskManagement, setTaskManagement] = useState<string[]>([]);
  const [taskManagementOther, setTaskManagementOther] = useState("");

  const getFormData = () => ({
    versionControl: {
      platforms: versionControl,
      other: versionControlOther,
    },
    productionRepos: productionRepos.filter((r) => r.name).map((r) => r.name),
    infraRepos: infraRepos.filter((r) => r.name).map((r) => r.name),
    cicd: {
      tools: cicdTools,
      other: cicdOther,
    },
    taskManagement: {
      tools: taskManagement,
      other: taskManagementOther,
    },
  });

  return (
    <SectionForm
      sectionId="sdlc"
      title="Software Development Lifecycle"
      description="Describe your development processes, version control, and CI/CD setup."
      getFormData={getFormData}
    >
      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Version Control
          </h3>

          <FieldWrapper
            label="Version Control Platform"
            description="Select your version control platform(s)"
          >
            <CheckboxGroup
              options={VERSION_CONTROL_OPTIONS}
              selected={versionControl}
              onChange={setVersionControl}
            />
          </FieldWrapper>

          {versionControl.includes("other") && (
            <FieldWrapper label="Other Version Control" htmlFor="vcOther">
              <Input
                id="vcOther"
                value={versionControlOther}
                onChange={(e) => setVersionControlOther(e.target.value)}
                placeholder="Specify other version control platform"
              />
            </FieldWrapper>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Repositories
          </h3>

          <FieldWrapper
            label="Production Repository Names"
            description="List the names of repositories containing production code"
          >
            <DynamicList
              items={productionRepos}
              onChange={setProductionRepos}
              placeholder="Repository name (e.g., acme/backend)"
            />
          </FieldWrapper>

          <FieldWrapper
            label="Infrastructure Repository Names"
            description="List the names of repositories containing infrastructure code (IaC)"
          >
            <DynamicList
              items={infraRepos}
              onChange={setInfraRepos}
              placeholder="Repository name (e.g., acme/infrastructure)"
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            CI/CD
          </h3>

          <FieldWrapper
            label="CI/CD Tools"
            description="Select your CI/CD tools"
          >
            <CheckboxGroup
              options={CICD_OPTIONS}
              selected={cicdTools}
              onChange={setCicdTools}
            />
          </FieldWrapper>

          {cicdTools.includes("other") && (
            <FieldWrapper label="Other CI/CD Tool" htmlFor="cicdOther">
              <Input
                id="cicdOther"
                value={cicdOther}
                onChange={(e) => setCicdOther(e.target.value)}
                placeholder="Specify other CI/CD tool"
              />
            </FieldWrapper>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Task Management
          </h3>

          <FieldWrapper
            label="Task/Ticket Management"
            description="Select your task management tools"
          >
            <CheckboxGroup
              options={TASK_MANAGEMENT_OPTIONS}
              selected={taskManagement}
              onChange={setTaskManagement}
            />
          </FieldWrapper>

          {taskManagement.includes("other") && (
            <FieldWrapper label="Other Task Management" htmlFor="tmOther">
              <Input
                id="tmOther"
                value={taskManagementOther}
                onChange={(e) => setTaskManagementOther(e.target.value)}
                placeholder="Specify other task management tool"
              />
            </FieldWrapper>
          )}
        </CardContent>
      </Card>
    </SectionForm>
  );
}

