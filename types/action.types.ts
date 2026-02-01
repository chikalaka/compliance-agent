export interface ActionInput {
  key: string
  label: string
  defaultValue: string
}

export interface TodoAction {
  label: string
  type: "url" | "route" | "generate" | "capture" | "copyTemplate" | "script"
  url?: string
  route?: string
  template?: string
  templateFile?: string
  fileName?: string
  defaultPrompt?: string
  calendarSearch?: string
  fileNamePrefix?: string
  inputs?: ActionInput[]
}

export interface Todo {
  id: string
  title: string
  description: string
  actions?: TodoAction[]
}
