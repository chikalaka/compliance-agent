"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Loader2, ListChecks, StickyNote } from "lucide-react"
import { toast } from "sonner"
import { TodoDetailModal } from "@/components/todo-detail-modal"
import { ConfirmDialog } from "@/components/confirm-dialog"

type TodoStatus = "todo" | "wip" | "done"

interface ActionInput {
  key: string
  label: string
  defaultValue: string
}

interface TodoAction {
  label: string
  type: "url" | "route" | "generate" | "capture"
  url?: string
  route?: string
  template?: string
  templateFile?: string
  fileName?: string
  calendarSearch?: string
  fileNamePrefix?: string
  inputs?: ActionInput[]
}

interface OngoingTodo {
  id: string
  title: string
  description: string
  status: TodoStatus
  notes: string[]
  actions?: TodoAction[]
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

export default function OngoingTodosPage() {
  const [todos, setTodos] = useState<OngoingTodo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTodo, setSelectedTodo] = useState<OngoingTodo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [startOverDialogOpen, setStartOverDialogOpen] = useState(false)

  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/todos/ongoing")
      if (res.ok) {
        const data = await res.json()
        setTodos(data.todos || [])
      }
    } catch (error) {
      console.error("Failed to fetch ongoing todos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  const handleStartOver = async () => {
    try {
      const res = await fetch("/api/todos/ongoing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start-over" }),
      })

      if (res.ok) {
        const data = await res.json()
        setTodos(data.todos || [])
        toast.success("Started over with custom todos!")
      } else {
        toast.error("Failed to start over")
      }
    } catch (error) {
      console.error("Failed to start over:", error)
      toast.error("Failed to start over")
    }
  }

  const handleTodoClick = (todo: OngoingTodo) => {
    setSelectedTodo(todo)
    setModalOpen(true)
  }

  const handleStatusChange = async (status: TodoStatus) => {
    if (!selectedTodo) return

    try {
      const res = await fetch("/api/todos/ongoing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTodo.id, status }),
      })

      if (res.ok) {
        const data = await res.json()
        setTodos(todos.map((t) => (t.id === selectedTodo.id ? data.todo : t)))
        setSelectedTodo(data.todo)
        toast.success("Status updated!")
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      console.error("Failed to update status:", error)
      toast.error("Failed to update status")
    }
  }

  const handleNotesChange = async (notes: string[]) => {
    if (!selectedTodo) return

    try {
      const res = await fetch("/api/todos/ongoing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTodo.id, notes }),
      })

      if (res.ok) {
        const data = await res.json()
        setTodos(todos.map((t) => (t.id === selectedTodo.id ? data.todo : t)))
        setSelectedTodo(data.todo)
      }
    } catch (error) {
      console.error("Failed to update notes:", error)
    }
  }

  // Group todos by status
  const todosByStatus = {
    todo: todos.filter((t) => t.status === "todo"),
    wip: todos.filter((t) => t.status === "wip"),
    done: todos.filter((t) => t.status === "done"),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
            <ListChecks className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Ongoing Todos
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Track your task progress. Click to update status and add notes.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setStartOverDialogOpen(true)}
          className="shrink-0 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Start Over
        </Button>
      </div>

      {todos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <ListChecks className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">
            No ongoing tasks. Click &quot;Start Over&quot; to import from your
            custom todos.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                  {todosByStatus.todo.length}
                </p>
                <p className="text-sm text-zinc-500">To Do</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {todosByStatus.wip.length}
                </p>
                <p className="text-sm text-zinc-500">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {todosByStatus.done.length}
                </p>
                <p className="text-sm text-zinc-500">Done</p>
              </CardContent>
            </Card>
          </div>

          {/* Todo List */}
          <div className="flex flex-col gap-3">
            {todos.map((todo) => (
              <Card
                key={todo.id}
                className="cursor-pointer transition-all hover:border-amber-300 hover:shadow-sm dark:hover:border-amber-700"
                onClick={() => handleTodoClick(todo)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <Badge
                    variant="outline"
                    className="shrink-0 rounded-lg border-amber-300 px-2 py-1 text-xs font-mono text-amber-600 dark:border-amber-700 dark:text-amber-400"
                  >
                    {todo.id}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {todo.title}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                      {todo.description}
                    </p>
                  </div>
                  {todo.notes.length > 0 && (
                    <div className="flex shrink-0 items-center gap-1 text-zinc-400">
                      <StickyNote className="h-4 w-4" />
                      <span className="text-xs">{todo.notes.length}</span>
                    </div>
                  )}
                  <Badge className={`shrink-0 ${statusColors[todo.status]}`}>
                    {statusLabels[todo.status]}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <TodoDetailModal
        todo={selectedTodo}
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode="ongoing"
        onStatusChange={handleStatusChange}
        onNotesChange={handleNotesChange}
      />

      <ConfirmDialog
        open={startOverDialogOpen}
        onOpenChange={setStartOverDialogOpen}
        title="Start Over"
        description="This will delete your current ongoing todos and replace them with tasks from your Custom Todos list. Are you sure you want to continue?"
        confirmLabel="Yes, Start Over"
        onConfirm={handleStartOver}
        variant="destructive"
      />
    </div>
  )
}
