import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const ONGOING_FILE = path.join(process.cwd(), "data/todos/ongoing-todos.json")
const CUSTOM_FILE = path.join(process.cwd(), "data/todos/custom-todos.json")

type TodoStatus = "todo" | "wip" | "done"

interface OngoingTodo {
  id: string
  title: string
  description: string
  status: TodoStatus
  notes: string[]
}

interface OngoingTodosData {
  todos: OngoingTodo[]
}

interface CustomTodo {
  id: string
  title: string
  description: string
}

interface CustomTodosData {
  todos: CustomTodo[]
}

async function readOngoingTodos(): Promise<OngoingTodosData> {
  try {
    const content = await fs.readFile(ONGOING_FILE, "utf-8")
    return JSON.parse(content)
  } catch {
    return { todos: [] }
  }
}

async function writeOngoingTodos(data: OngoingTodosData): Promise<void> {
  await fs.writeFile(ONGOING_FILE, JSON.stringify(data, null, 2), "utf-8")
}

export async function GET() {
  try {
    const data = await readOngoingTodos()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error reading ongoing todos:", error)
    return NextResponse.json({ todos: [] })
  }
}

// Start over: import from custom todos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.action === "start-over") {
      // Read custom todos
      const customContent = await fs.readFile(CUSTOM_FILE, "utf-8")
      const customData: CustomTodosData = JSON.parse(customContent)

      // Convert to ongoing todos with default status
      const ongoingTodos: OngoingTodo[] = customData.todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        status: "todo" as TodoStatus,
        notes: [],
      }))

      await writeOngoingTodos({ todos: ongoingTodos })

      return NextResponse.json({
        success: true,
        message: "Started over with custom todos",
        todos: ongoingTodos,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in ongoing todos POST:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    )
  }
}

// Update status or notes
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes, addNote, deleteNoteIndex } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const data = await readOngoingTodos()
    const todoIndex = data.todos.findIndex((t) => t.id === id)

    if (todoIndex === -1) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    // Update status
    if (status !== undefined) {
      if (!["todo", "wip", "done"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      data.todos[todoIndex].status = status
    }

    // Replace all notes
    if (notes !== undefined) {
      data.todos[todoIndex].notes = notes
    }

    // Add a note
    if (addNote !== undefined) {
      data.todos[todoIndex].notes.push(addNote)
    }

    // Delete a note by index
    if (deleteNoteIndex !== undefined && typeof deleteNoteIndex === "number") {
      data.todos[todoIndex].notes.splice(deleteNoteIndex, 1)
    }

    await writeOngoingTodos(data)

    return NextResponse.json({
      success: true,
      todo: data.todos[todoIndex],
    })
  } catch (error) {
    console.error("Error updating ongoing todo:", error)
    return NextResponse.json(
      { error: "Failed to update todo" },
      { status: 500 },
    )
  }
}
