"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Building2,
  Users,
  Shield,
  Wrench,
  Lock,
  GitBranch,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Circle,
  FileText,
  ChevronDown,
  ChevronRight,
  Camera,
  ClipboardList,
  ListTodo,
  ListChecks,
  NotebookPen,
  KeyRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { sections } from "@/lib/sections"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Users,
  Shield,
  Wrench,
  Lock,
  GitBranch,
  MessageSquare,
  MapPin,
  Camera,
  FileText,
  ClipboardList,
  ListTodo,
  ListChecks,
  NotebookPen,
  KeyRound,
}

interface SectionStatus {
  exists: boolean
  size: number
}

interface ActionItem {
  id: string
  title: string
  icon: string
  href: string
}

const actionItems: ActionItem[] = [
  {
    id: "ticket-screenshots",
    title: "Ticket Screenshots",
    icon: "Camera",
    href: "/ticket-screenshots",
  },
  {
    id: "generate-policies",
    title: "Generate Policies",
    icon: "FileText",
    href: "/generate-policies",
  },
]

interface TodoItem {
  id: string
  title: string
  icon: string
  href: string
}

const todoItems: TodoItem[] = [
  {
    id: "custom",
    title: "Task List",
    icon: "ClipboardList",
    href: "/todos/custom",
  },
  {
    id: "ongoing",
    title: "Ongoing Todos",
    icon: "ListTodo",
    href: "/todos/ongoing",
  },
]

interface PreparationItem {
  id: string
  title: string
  icon: string
  href: string
}

const preparationItems: PreparationItem[] = [
  {
    id: "browser-auth",
    title: "Browser Authentication",
    icon: "KeyRound",
    href: "/browser-auth",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [statuses, setStatuses] = useState<Record<string, SectionStatus>>({})
  const [preparationOpen, setPreparationOpen] = useState(true)
  const [companyDataOpen, setCompanyDataOpen] = useState(true)
  const [actionsOpen, setActionsOpen] = useState(true)
  const [todosOpen, setTodosOpen] = useState(true)

  useEffect(() => {
    async function fetchStatuses() {
      try {
        const res = await fetch("/api/sections/status")
        if (res.ok) {
          const data = await res.json()
          setStatuses(data)
        }
      } catch (error) {
        console.error("Failed to fetch statuses:", error)
      }
    }

    fetchStatuses()
  }, [pathname])

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-6 dark:border-zinc-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            SOC 2 Collector
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Compliance Data
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {/* Preparation Section */}
          <div>
            <button
              onClick={() => setPreparationOpen(!preparationOpen)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {preparationOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Preparation
            </button>

            {preparationOpen && (
              <div className="mt-1 space-y-1 pl-2">
                {preparationItems.map((item) => {
                  const Icon = iconMap[item.icon] || Circle
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isActive
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Company Data Section */}
          <div>
            <button
              onClick={() => setCompanyDataOpen(!companyDataOpen)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {companyDataOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Company Data
            </button>

            {companyDataOpen && (
              <div className="mt-1 space-y-1 pl-2">
                {sections.map((section) => {
                  const Icon = iconMap[section.icon] || Circle
                  const isActive = pathname === `/${section.id}`
                  const status = statuses[section.id]
                  const isSaved = status?.exists && status.size > 0

                  return (
                    <Link
                      key={section.id}
                      href={`/${section.id}`}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isActive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{section.title}</p>
                      </div>
                      {isSaved ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : (
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px] px-1.5 py-0"
                        >
                          Draft
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div>
            <button
              onClick={() => setActionsOpen(!actionsOpen)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {actionsOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Actions
            </button>

            {actionsOpen && (
              <div className="mt-1 space-y-1 pl-2">
                {actionItems.map((item) => {
                  const Icon = iconMap[item.icon] || Circle
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isActive
                            ? "text-violet-600 dark:text-violet-400"
                            : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Todos Section */}
          <div>
            <button
              onClick={() => setTodosOpen(!todosOpen)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {todosOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Todos
            </button>

            {todosOpen && (
              <div className="mt-1 space-y-1 pl-2">
                {todoItems.map((item) => {
                  const Icon = iconMap[item.icon] || Circle
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          isActive
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{item.title}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>
      </ScrollArea>

      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Files saved to{" "}
          <code className="rounded bg-zinc-200 px-1 py-0.5 font-mono text-[10px] dark:bg-zinc-800">
            /compliance-data/
          </code>
        </p>
      </div>
    </aside>
  )
}
