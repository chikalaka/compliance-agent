import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const CUSTOM_FILE = path.join(
  process.cwd(),
  "user-data",
  "todos",
  "custom-todos.json",
)
const TEMPLATE_FILE = path.join(process.cwd(), "data", "todos", "template.json")

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

interface TodosData {
  todos: Todo[]
}

async function readCustomTodos(): Promise<TodosData> {
  try {
    const content = await fs.readFile(CUSTOM_FILE, "utf-8")
    return JSON.parse(content)
  } catch {
    return { todos: [] }
  }
}

async function writeCustomTodos(data: TodosData): Promise<void> {
  // Ensure directory exists
  await fs.mkdir(path.dirname(CUSTOM_FILE), { recursive: true })
  await fs.writeFile(CUSTOM_FILE, JSON.stringify(data, null, 2), "utf-8")
}

export async function GET() {
  try {
    const data = await readCustomTodos()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error reading custom todos:", error)
    return NextResponse.json({ todos: [] })
  }
}

// Create a new todo or import from template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Import from template
    if (body.action === "import-from-template") {
      const templateContent = await fs.readFile(TEMPLATE_FILE, "utf-8")
      const templateData: TodosData = JSON.parse(templateContent)

      const currentData = await readCustomTodos()

      // Extract base IDs from existing custom todos (the part before the timestamp)
      const existingBaseIds = new Set(
        currentData.todos.map((todo) => {
          // For template-derived IDs like "sec-policies-1234567890", extract "sec-policies"
          // For custom IDs like "custom-1234567890", the base would be "custom"
          const parts = todo.id.split("-")
          // Remove the last part (timestamp) if it's a number
          if (parts.length > 1 && /^\d+$/.test(parts[parts.length - 1])) {
            return parts.slice(0, -1).join("-")
          }
          return todo.id
        }),
      )

      // Filter out template todos that already exist
      const newTemplateTodos = templateData.todos.filter(
        (todo) => !existingBaseIds.has(todo.id),
      )

      // Generate new IDs for imported todos
      const importedTodos = newTemplateTodos.map((todo) => ({
        ...todo,
        id: `${todo.id}-${Date.now()}`,
      }))

      currentData.todos.push(...importedTodos)
      await writeCustomTodos(currentData)

      return NextResponse.json({
        success: true,
        message:
          importedTodos.length > 0
            ? `Imported ${importedTodos.length} new todos from template`
            : "All template todos already exist",
        todos: currentData.todos,
        importedCount: importedTodos.length,
      })
    }

    // Add new todo
    const { title, description } = body
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const newTodo: Todo = {
      id: `custom-${Date.now()}`,
      title,
      description: description || "",
    }

    const data = await readCustomTodos()
    data.todos.push(newTodo)
    await writeCustomTodos(data)

    return NextResponse.json({
      success: true,
      todo: newTodo,
    })
  } catch (error) {
    console.error("Error creating custom todo:", error)
    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 },
    )
  }
}

// Update a todo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, description } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const data = await readCustomTodos()
    const todoIndex = data.todos.findIndex((t) => t.id === id)

    if (todoIndex === -1) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    if (title !== undefined) data.todos[todoIndex].title = title
    if (description !== undefined)
      data.todos[todoIndex].description = description

    await writeCustomTodos(data)

    return NextResponse.json({
      success: true,
      todo: data.todos[todoIndex],
    })
  } catch (error) {
    console.error("Error updating custom todo:", error)
    return NextResponse.json(
      { error: "Failed to update todo" },
      { status: 500 },
    )
  }
}

// Delete a todo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const data = await readCustomTodos()
    const todoIndex = data.todos.findIndex((t) => t.id === id)

    if (todoIndex === -1) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    data.todos.splice(todoIndex, 1)
    await writeCustomTodos(data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting custom todo:", error)
    return NextResponse.json(
      { error: "Failed to delete todo" },
      { status: 500 },
    )
  }
}
