"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Trash2,
  Plus,
  FileText,
  StickyNote,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  Camera,
  Calendar,
  Search,
  Copy,
} from "lucide-react"
import { toast } from "sonner"
import { TodoAction } from "@/types/action.types"

type TodoStatus = "todo" | "wip" | "done"

interface BaseTodo {
  id: string
  title: string
  description: string
  actions?: TodoAction[]
}

interface OngoingTodo extends BaseTodo {
  status: TodoStatus
  notes: string[]
}

type ModalMode = "view" | "edit" | "ongoing"

interface TodoDetailModalProps {
  todo: BaseTodo | OngoingTodo | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: ModalMode
  onSave?: (todo: BaseTodo) => void
  onStatusChange?: (status: TodoStatus) => void
  onNotesChange?: (notes: string[]) => void
  className?: string
}

const statusColors: Record<TodoStatus, string> = {
  todo: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  wip: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
}

const statusLabels: Record<TodoStatus, string> = {
  todo: "To Do",
  wip: "In Progress",
  done: "Done",
}

export function TodoDetailModal({
  todo,
  open,
  onOpenChange,
  mode,
  onSave,
  onStatusChange,
  onNotesChange,
  className,
}: TodoDetailModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState<string[]>([])
  const [newNote, setNewNote] = useState("")
  const [generatingAction, setGeneratingAction] = useState<string | null>(null)
  const [generatedActions, setGeneratedActions] = useState<Set<string>>(
    new Set(),
  )
  // State for configurable action inputs
  const [actionInputValues, setActionInputValues] = useState<
    Record<string, Record<string, string>>
  >({})
  // State for prompt values
  const [actionPromptValues, setActionPromptValues] = useState<
    Record<string, string>
  >({})

  const ongoingTodo = todo as OngoingTodo | null

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description)
      if ("notes" in todo) {
        setNotes(todo.notes || [])
      } else {
        setNotes([])
      }
      // Initialize action input values from defaults
      const initialInputValues: Record<string, Record<string, string>> = {}
      const initialPromptValues: Record<string, string> = {}
      todo.actions?.forEach((action, index) => {
        if (action.inputs && action.inputs.length > 0) {
          const actionKey = `${index}-${action.label}`
          initialInputValues[actionKey] = {}
          action.inputs.forEach((input) => {
            initialInputValues[actionKey][input.key] = input.defaultValue
          })
        }
        // Initialize prompt values for actions with defaultPrompt
        if (action.defaultPrompt) {
          const actionKey = `${index}-${action.label}`
          initialPromptValues[actionKey] = action.defaultPrompt
        }
      })
      setActionInputValues(initialInputValues)
      setActionPromptValues(initialPromptValues)
    } else {
      setTitle("")
      setDescription("")
      setNotes([])
      setActionInputValues({})
      setActionPromptValues({})
    }
    setNewNote("")
    setGeneratedActions(new Set())
  }, [todo, open])

  // Helper to get the action key for state management
  const getActionKey = (index: number, label: string) => `${index}-${label}`

  // Helper to get input value for an action
  const getInputValue = (
    actionIndex: number,
    action: TodoAction,
    inputKey: string,
  ) => {
    const actionKey = getActionKey(actionIndex, action.label)
    return (
      actionInputValues[actionKey]?.[inputKey] ??
      action.inputs?.find((i) => i.key === inputKey)?.defaultValue ??
      ""
    )
  }

  // Helper to set input value for an action
  const setInputValue = (
    actionIndex: number,
    action: TodoAction,
    inputKey: string,
    value: string,
  ) => {
    const actionKey = getActionKey(actionIndex, action.label)
    setActionInputValues((prev) => ({
      ...prev,
      [actionKey]: {
        ...prev[actionKey],
        [inputKey]: value,
      },
    }))
  }

  // Helper to get prompt value for an action
  const getPromptValue = (actionIndex: number, action: TodoAction) => {
    const actionKey = getActionKey(actionIndex, action.label)
    return actionPromptValues[actionKey] ?? action.defaultPrompt ?? ""
  }

  // Helper to set prompt value for an action
  const setPromptValue = (
    actionIndex: number,
    action: TodoAction,
    value: string,
  ) => {
    const actionKey = getActionKey(actionIndex, action.label)
    setActionPromptValues((prev) => ({
      ...prev,
      [actionKey]: value,
    }))
  }

  // Helper to replace placeholders in a string with input values
  const replacePlaceholders = (
    text: string,
    actionIndex: number,
    action: TodoAction,
  ) => {
    if (!action.inputs || !text) return text
    let result = text
    action.inputs.forEach((input) => {
      const value = getInputValue(actionIndex, action, input.key)
      // Replace {{key}} with the value (URL-encoded for URLs)
      result = result.replace(
        new RegExp(`\\{\\{${input.key}\\}\\}`, "g"),
        text.includes("://") ? encodeURIComponent(value) : value,
      )
    })
    return result
  }

  const handleSave = () => {
    if (!todo || !onSave) return
    onSave({
      id: todo.id,
      title,
      description,
    })
    onOpenChange(false)
  }

  const handleAddNote = () => {
    if (!newNote.trim() || !onNotesChange) return
    const updatedNotes = [...notes, newNote.trim()]
    setNotes(updatedNotes)
    setNewNote("")
    onNotesChange(updatedNotes)
  }

  const handleDeleteNote = (index: number) => {
    if (!onNotesChange) return
    const updatedNotes = notes.filter((_, i) => i !== index)
    setNotes(updatedNotes)
    onNotesChange(updatedNotes)
  }

  const handleStatusChange = (status: TodoStatus) => {
    if (onStatusChange) {
      onStatusChange(status)
    }
  }

  const handleActionClick = async (action: TodoAction, actionIndex: number) => {
    switch (action.type) {
      case "url":
        if (action.url) {
          const finalUrl = replacePlaceholders(action.url, actionIndex, action)
          window.open(finalUrl, "_blank", "noopener,noreferrer")
        }
        break
      case "route":
        if (action.route) {
          onOpenChange(false)
          router.push(action.route)
        }
        break
      case "generate":
        if (
          (action.template || action.templateFile || action.defaultPrompt) &&
          action.fileName
        ) {
          setGeneratingAction(action.label)
          try {
            // Get system instructions if provided
            const systemInstructions = getInputValue(
              actionIndex,
              action,
              "systemInstructions",
            )

            // Get prompt value if this is a prompt-based action
            const promptValue = action.defaultPrompt
              ? getPromptValue(actionIndex, action)
              : undefined

            const res = await fetch("/api/todos/generate-doc", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                template: action.template,
                templateFile: action.templateFile,
                fileName: action.fileName,
                prompt: promptValue,
                systemInstructions: systemInstructions || undefined,
              }),
            })

            if (res.ok) {
              const data = await res.json()
              setGeneratedActions((prev) => new Set(prev).add(action.label))
              toast.success(`Document generated: ${data.fileName}`)
            } else {
              const error = await res.json()
              toast.error(error.message || "Failed to generate document")
            }
          } catch (error) {
            console.error("Failed to generate document:", error)
            toast.error("Failed to generate document")
          } finally {
            setGeneratingAction(null)
          }
        }
        break
      case "copyTemplate":
        if (action.templateFile && action.fileName) {
          setGeneratingAction(action.label)
          try {
            const res = await fetch("/api/todos/copy-template", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                templateFile: action.templateFile,
                fileName: action.fileName,
              }),
            })

            if (res.ok) {
              const data = await res.json()
              setGeneratedActions((prev) => new Set(prev).add(action.label))
              toast.success(`Template copied: ${data.fileName}`)
            } else {
              const error = await res.json()
              toast.error(error.message || "Failed to copy template")
            }
          } catch (error) {
            console.error("Failed to copy template:", error)
            toast.error("Failed to copy template")
          } finally {
            setGeneratingAction(null)
          }
        }
        break
      case "capture":
        setGeneratingAction(action.label)
        try {
          // Check if this is a calendar search capture or regular URL capture
          const isCalendarCapture =
            action.calendarSearch && action.fileNamePrefix
          const isUrlCapture = action.url && action.fileName

          if (!isCalendarCapture && !isUrlCapture) {
            toast.error("Invalid capture action configuration")
            break
          }

          // Replace placeholders in calendar search or URL
          const finalCalendarSearch = isCalendarCapture
            ? replacePlaceholders(action.calendarSearch!, actionIndex, action)
            : undefined
          const finalUrl = isUrlCapture
            ? replacePlaceholders(action.url!, actionIndex, action)
            : undefined

          const requestBody = isCalendarCapture
            ? {
                calendarSearch: finalCalendarSearch,
                fileNamePrefix: action.fileNamePrefix,
                maxCount: 4,
              }
            : {
                url: finalUrl,
                fileName: action.fileName,
              }

          const res = await fetch("/api/screenshots/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          })

          if (res.ok) {
            const data = await res.json()
            setGeneratedActions((prev) => new Set(prev).add(action.label))

            if (isCalendarCapture) {
              const count = data.screenshots?.length || 0
              toast.success(
                `Captured ${count} calendar event${
                  count !== 1 ? "s" : ""
                }: ${finalCalendarSearch}`,
              )
            } else {
              toast.success(`Screenshot captured: ${data.fileName}`)
            }
          } else {
            const error = await res.json()
            if (res.status === 404 && isCalendarCapture) {
              toast.error(`No events found with title "${finalCalendarSearch}"`)
            } else {
              toast.error(error.message || "Failed to capture screenshot")
            }
          }
        } catch (error) {
          console.error("Failed to capture screenshot:", error)
          toast.error("Failed to capture screenshot")
        } finally {
          setGeneratingAction(null)
        }
        break
    }
  }

  const getActionIcon = (action: TodoAction) => {
    if (generatingAction === action.label) {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    if (generatedActions.has(action.label)) {
      return <CheckCircle2 className="h-4 w-4" />
    }
    switch (action.type) {
      case "url":
        return <ExternalLink className="h-4 w-4" />
      case "route":
        return <ArrowRight className="h-4 w-4" />
      case "generate":
        return <Sparkles className="h-4 w-4" />
      case "capture":
        return <Camera className="h-4 w-4" />
      case "copyTemplate":
        return <Copy className="h-4 w-4" />
    }
  }

  const hasActions = todo?.actions && todo.actions.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-lg ${className || ""}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            {mode === "view"
              ? "Task Details"
              : mode === "edit"
                ? "Edit Task"
                : "Task Progress"}
          </DialogTitle>
          <DialogDescription>
            {mode === "view" && "View the details of this task."}
            {mode === "edit" && "Edit the title and description of this task."}
            {mode === "ongoing" &&
              "Update the status and add notes for this task."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          {mode === "edit" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Title
              </p>
              <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                {todo?.title}
              </p>
            </div>
          )}

          {/* Description */}
          {mode === "edit" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description"
                className="min-h-[100px]"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Description
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line">
                {todo?.description || "No description provided."}
              </p>
            </div>
          )}

          {/* Actions (for view and ongoing modes) */}
          {mode !== "edit" && hasActions && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Actions
              </p>
              <div className="flex flex-col gap-3">
                {todo?.actions?.map((action, index) => {
                  const hasInputs = action.inputs && action.inputs.length > 0
                  const hasPrompt =
                    action.type === "generate" &&
                    action.defaultPrompt &&
                    !action.template &&
                    !action.templateFile
                  const isCalendarCapture =
                    action.type === "capture" && action.calendarSearch
                  const isLoading = generatingAction === action.label

                  // Get the display value for inputs
                  const getDisplayValue = (inputKey: string) => {
                    return getInputValue(index, action, inputKey)
                  }

                  // Actions with inputs get wrapped in a card-like container
                  if (hasInputs) {
                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 p-3 space-y-3"
                      >
                        {/* Input fields */}
                        {action.inputs!.map((input) => (
                          <div key={input.key} className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              {input.label}
                            </label>
                            <Input
                              value={getDisplayValue(input.key)}
                              onChange={(e) =>
                                setInputValue(
                                  index,
                                  action,
                                  input.key,
                                  e.target.value,
                                )
                              }
                              className="h-9 text-sm bg-white dark:bg-zinc-800"
                              placeholder={input.defaultValue}
                            />
                          </div>
                        ))}

                        {/* Action Button */}
                        <Button
                          variant="default"
                          className="w-full justify-center gap-2 h-auto py-2.5 bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => handleActionClick(action, index)}
                          disabled={isLoading}
                        >
                          {getActionIcon(action)}
                          <span>{action.label}</span>
                          {generatedActions.has(action.label) && (
                            <Badge className="bg-white/20 text-white text-xs ml-1">
                              Done
                            </Badge>
                          )}
                        </Button>
                      </div>
                    )
                  }

                  // Actions with prompts get wrapped in a card-like container
                  if (hasPrompt) {
                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 p-3 space-y-3"
                      >
                        {/* Prompt field */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Prompt
                          </label>
                          <Textarea
                            value={getPromptValue(index, action)}
                            onChange={(e) =>
                              setPromptValue(index, action, e.target.value)
                            }
                            className="text-sm bg-white dark:bg-zinc-800 min-h-[80px]"
                            placeholder={action.defaultPrompt}
                          />
                        </div>

                        {/* Action Button */}
                        <Button
                          variant="default"
                          className="w-full justify-center gap-2 h-auto py-2.5 bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => handleActionClick(action, index)}
                          disabled={isLoading}
                        >
                          {getActionIcon(action)}
                          <span>{action.label}</span>
                          {generatedActions.has(action.label) && (
                            <Badge className="bg-white/20 text-white text-xs ml-1">
                              Done
                            </Badge>
                          )}
                        </Button>
                      </div>
                    )
                  }

                  // Actions without inputs render as standalone buttons
                  return (
                    <div key={index} className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        className="justify-start gap-2 h-auto py-2.5 px-3 text-left"
                        onClick={() => handleActionClick(action, index)}
                        disabled={isLoading}
                      >
                        {getActionIcon(action)}
                        <span className="flex-1">{action.label}</span>
                        {generatedActions.has(action.label) && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs">
                            Done
                          </Badge>
                        )}
                      </Button>

                      {/* Show calendar indicator for legacy actions without inputs */}
                      {isCalendarCapture && (
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs ${
                            isLoading
                              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                              : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <Search className="h-3 w-3 animate-pulse" />
                              <span>
                                Searching for &quot;{action.calendarSearch}
                                &quot;...
                              </span>
                            </>
                          ) : (
                            <>
                              <Calendar className="h-3 w-3" />
                              <span>
                                Will search: &quot;{action.calendarSearch}&quot;
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Status (only for ongoing mode) */}
          {mode === "ongoing" && ongoingTodo && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Status
              </label>
              <Select
                value={ongoingTodo.status}
                onValueChange={(value) =>
                  handleStatusChange(value as TodoStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <Badge className={statusColors[ongoingTodo.status]}>
                      {statusLabels[ongoingTodo.status]}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">
                    <Badge className={statusColors.todo}>
                      {statusLabels.todo}
                    </Badge>
                  </SelectItem>
                  <SelectItem value="wip">
                    <Badge className={statusColors.wip}>
                      {statusLabels.wip}
                    </Badge>
                  </SelectItem>
                  <SelectItem value="done">
                    <Badge className={statusColors.done}>
                      {statusLabels.done}
                    </Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes (only for ongoing mode) */}
          {mode === "ongoing" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-amber-500" />
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Notes
                </label>
              </div>

              {notes.length > 0 && (
                <ScrollArea className="h-[120px] rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="space-y-2">
                    {notes.map((note, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-2 rounded bg-white p-2 dark:bg-zinc-800"
                      >
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 flex-1">
                          {note}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(index)}
                          className="h-6 w-6 p-0 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <div className="flex gap-2">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleAddNote()
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {mode === "edit" ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!title.trim()}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
