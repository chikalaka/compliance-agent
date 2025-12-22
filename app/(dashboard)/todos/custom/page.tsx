"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Download, Loader2, ListTodo } from "lucide-react"
import { toast } from "sonner"
import { TodoDetailModal } from "@/components/todo-detail-modal"
import { ConfirmDialog } from "@/components/confirm-dialog"

interface TodoAction {
  label: string
  type: "url" | "route" | "generate"
  url?: string
  route?: string
  template?: string
  fileName?: string
}

interface Todo {
  id: string
  title: string
  description: string
  actions?: TodoAction[]
}

export default function CustomTodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/todos/custom")
      if (res.ok) {
        const data = await res.json()
        setTodos(data.todos || [])
      }
    } catch (error) {
      console.error("Failed to fetch custom todos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  const handleImportFromTemplate = async () => {
    try {
      const res = await fetch("/api/todos/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import-from-template" }),
      })

      if (res.ok) {
        const data = await res.json()
        setTodos(data.todos || [])
        toast.success("Imported tasks from template!")
      } else {
        toast.error("Failed to import tasks")
      }
    } catch (error) {
      console.error("Failed to import:", error)
      toast.error("Failed to import tasks")
    }
  }

  const handleAddTodo = async () => {
    if (!newTitle.trim()) return

    setIsAdding(true)
    try {
      const res = await fetch("/api/todos/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setTodos([...todos, data.todo])
        setNewTitle("")
        setNewDescription("")
        toast.success("Task added!")
      } else {
        toast.error("Failed to add task")
      }
    } catch (error) {
      console.error("Failed to add todo:", error)
      toast.error("Failed to add task")
    } finally {
      setIsAdding(false)
    }
  }

  const handleCardClick = (todo: Todo) => {
    setSelectedTodo(todo)
    setViewModalOpen(true)
  }

  const handleEditClick = (todo: Todo, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedTodo(todo)
    setModalOpen(true)
  }

  const handleDeleteClick = (todo: Todo, e: React.MouseEvent) => {
    e.stopPropagation()
    setTodoToDelete(todo)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!todoToDelete) return

    try {
      const res = await fetch(`/api/todos/custom?id=${todoToDelete.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setTodos(todos.filter((t) => t.id !== todoToDelete.id))
        toast.success("Task deleted!")
      } else {
        toast.error("Failed to delete task")
      }
    } catch (error) {
      console.error("Failed to delete:", error)
      toast.error("Failed to delete task")
    }

    setTodoToDelete(null)
  }

  const handleSaveTodo = async (updatedTodo: Todo) => {
    try {
      const res = await fetch("/api/todos/custom", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTodo),
      })

      if (res.ok) {
        setTodos(todos.map((t) => (t.id === updatedTodo.id ? updatedTodo : t)))
        toast.success("Task updated!")
      } else {
        toast.error("Failed to update task")
      }
    } catch (error) {
      console.error("Failed to update:", error)
      toast.error("Failed to update task")
    }
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
            <ListTodo className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Task List
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Your customized task list. Add, edit, or delete tasks.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setImportDialogOpen(true)}
          className="shrink-0 gap-2"
        >
          <Download className="h-4 w-4" />
          Import from Default
        </Button>
      </div>

      {/* Add New Todo Form */}
      <Card>
        <CardContent className="">
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Task title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleAddTodo}
                disabled={!newTitle.trim() || isAdding}
                className="gap-2 bg-amber-600 hover:bg-amber-700"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Task
              </Button>
            </div>
            <Textarea
              placeholder="Task description (optional)..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Todo List */}
      {todos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <ListTodo className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">
            No custom tasks yet. Add one above or import from template.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {todos.map((todo) => (
            <Card
              key={todo.id}
              onClick={() => handleCardClick(todo)}
              className="cursor-pointer transition-all hover:border-amber-300 hover:shadow-sm dark:hover:border-amber-700"
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
                    {todo.description || "No description"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleEditClick(todo, e)}
                    className="h-8 w-8 text-zinc-400 hover:text-amber-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDeleteClick(todo, e)}
                    className="h-8 w-8 text-zinc-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TodoDetailModal
        todo={selectedTodo}
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode="edit"
        onSave={handleSaveTodo}
      />

      <TodoDetailModal
        todo={selectedTodo}
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        mode="view"
      />

      <ConfirmDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Import from Template"
        description="This will add all template tasks to your custom todos list. Existing tasks will be kept."
        confirmLabel="Import"
        onConfirm={handleImportFromTemplate}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Task"
        description={`Are you sure you want to delete "${todoToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  )
}
