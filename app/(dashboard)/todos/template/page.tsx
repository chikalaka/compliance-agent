"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Loader2 } from "lucide-react"
import { TodoDetailModal } from "@/components/todo-detail-modal"

interface Todo {
  id: string
  title: string
  description: string
}

export default function TemplateTodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    async function fetchTodos() {
      try {
        const res = await fetch("/api/todos/template")
        if (res.ok) {
          const data = await res.json()
          setTodos(data.todos || [])
        }
      } catch (error) {
        console.error("Failed to fetch template todos:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTodos()
  }, [])

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo)
    setModalOpen(true)
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
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Template Tasks
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Baseline SOC2 compliance tasks. Click to view details.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          These are read-only template tasks. Go to{" "}
          <span className="font-medium">Custom Todos</span> to import and
          customize them.
        </p>
      </div>

      {todos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No template tasks available.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {todos.map((todo, index) => (
            <Card
              key={todo.id}
              className="cursor-pointer transition-all hover:border-amber-300 hover:shadow-sm dark:hover:border-amber-700"
              onClick={() => handleTodoClick(todo)}
            >
              <CardContent className="flex items-center gap-4 py-4">
                <Badge
                  variant="outline"
                  className="h-7 w-7 shrink-0 items-center justify-center rounded-full border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                >
                  {index + 1}
                </Badge>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {todo.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    {todo.description}
                  </p>
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
        mode="view"
      />
    </div>
  )
}
