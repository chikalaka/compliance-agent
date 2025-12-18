"use client"

import { useState, useEffect } from "react"
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
import { Trash2, Plus, FileText, StickyNote } from "lucide-react"

type TodoStatus = "todo" | "wip" | "done"

interface BaseTodo {
  id: string
  title: string
  description: string
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
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState<string[]>([])
  const [newNote, setNewNote] = useState("")

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
    } else {
      setTitle("")
      setDescription("")
      setNotes([])
    }
    setNewNote("")
  }, [todo, open])

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-w-lg ${className || ""}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" />
            {mode === "view" ? "Task Details" : mode === "edit" ? "Edit Task" : "Task Progress"}
          </DialogTitle>
          <DialogDescription>
            {mode === "view" && "View the details of this task."}
            {mode === "edit" && "Edit the title and description of this task."}
            {mode === "ongoing" && "Update the status and add notes for this task."}
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
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {todo?.description || "No description provided."}
              </p>
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
                onValueChange={(value) => handleStatusChange(value as TodoStatus)}
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
                    <Badge className={statusColors.todo}>{statusLabels.todo}</Badge>
                  </SelectItem>
                  <SelectItem value="wip">
                    <Badge className={statusColors.wip}>{statusLabels.wip}</Badge>
                  </SelectItem>
                  <SelectItem value="done">
                    <Badge className={statusColors.done}>{statusLabels.done}</Badge>
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

