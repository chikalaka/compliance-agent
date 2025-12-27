"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  GitBranch,
  ListChecks,
  Mail,
  Cloud,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface AuthStatus {
  authenticated: boolean
  services: {
    github: boolean
    linear: boolean
    googleWorkspace: boolean
    aws: boolean
  }
}

interface ServiceConfig {
  id: keyof AuthStatus["services"]
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  requiredFor: string[]
}

const services: ServiceConfig[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Required for repository and PR screenshots",
    icon: GitBranch,
    requiredFor: ["Ticket Screenshots"],
  },
  {
    id: "linear",
    name: "Linear",
    description: "Required for issue tracking screenshots",
    icon: ListChecks,
    requiredFor: ["Ticket Screenshots"],
  },
  {
    id: "googleWorkspace",
    name: "Google Workspace",
    description: "Required for calendar and document screenshots",
    icon: Mail,
    requiredFor: ["Calendar Screenshots", "Document Evidence"],
  },
  {
    id: "aws",
    name: "AWS Console",
    description: "Required for infrastructure screenshots",
    icon: Cloud,
    requiredFor: ["Infrastructure Evidence"],
  },
]

export default function BrowserAuthPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isBrowserOpen, setIsBrowserOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const checkAuthStatus = useCallback(async () => {
    setIsCheckingAuth(true)
    try {
      const res = await fetch("/api/browser/status")
      if (res.ok) {
        const status: AuthStatus = await res.json()
        setAuthStatus(status)
      }
    } catch (error) {
      console.error("Failed to check auth status:", error)
      toast.error("Failed to check authentication status")
    } finally {
      setIsCheckingAuth(false)
    }
  }, [])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  const handleAuthenticate = async () => {
    setIsLoading(true)

    try {
      const res = await fetch("/api/browser/auth", { method: "POST" })
      const data = await res.json()

      if (data.success) {
        setIsBrowserOpen(true)
        toast.success("Browser opened!", {
          description: "Log in to the services, then click Done.",
        })
      } else {
        toast.error("Failed to open browser", {
          description: data.error || "Please try again.",
        })
      }
    } catch (error) {
      console.error("Auth error:", error)
      toast.error("Failed to open browser", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDone = async () => {
    setIsLoading(true)

    try {
      const res = await fetch("/api/browser/auth/stop", { method: "POST" })
      const data = await res.json()

      setIsBrowserOpen(false)

      if (data.success) {
        toast.success("Session saved!", {
          description: "Your browser session has been saved.",
        })
      } else {
        toast.info("Browser closed", {
          description: data.error || "Session may not be complete.",
        })
      }

      await checkAuthStatus()
    } catch (error) {
      console.error("Stop auth error:", error)
      setIsBrowserOpen(false)
      toast.error("Error closing browser", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      })
      await checkAuthStatus()
    } finally {
      setIsLoading(false)
    }
  }

  const connectedCount = authStatus
    ? Object.values(authStatus.services).filter(Boolean).length
    : 0
  const totalCount = services.length

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Browser Authentication
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Manage your browser session connections for automated screenshot
          capture and evidence collection.
        </p>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Why is authentication needed?
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Some compliance evidence requires screenshots from authenticated
                services. Without browser authentication, features like{" "}
                <Link
                  href="/ticket-screenshots"
                  className="font-medium underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-100"
                >
                  Ticket Screenshots
                </Link>{" "}
                and calendar evidence collection will not be available.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      {!isCheckingAuth && authStatus && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            {connectedCount === totalCount ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            ) : connectedCount > 0 ? (
              <AlertCircle className="h-6 w-6 text-amber-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-zinc-400" />
            )}
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {connectedCount} of {totalCount} services connected
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {connectedCount === totalCount
                  ? "All services are authenticated"
                  : connectedCount > 0
                  ? "Some services need authentication"
                  : "No services authenticated yet"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkAuthStatus}
              disabled={isCheckingAuth || isBrowserOpen}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${
                  isCheckingAuth ? "animate-spin" : ""
                }`}
              />
              Check Connection Statuses
            </Button>
            {isBrowserOpen ? (
              <Button
                onClick={handleDone}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Done
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleAuthenticate}
                disabled={isLoading || connectedCount === totalCount}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening...
                  </>
                ) : connectedCount === totalCount ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    All Connected
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Authenticate
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isCheckingAuth && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      )}

      {/* Service Cards Grid */}
      {!isCheckingAuth && authStatus && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {services.map((service) => {
            const Icon = service.icon
            const isConnected = authStatus.services[service.id]

            return (
              <Card
                key={service.id}
                className={
                  isConnected
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }
              >
                <CardContent className="py-5">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                        isConnected
                          ? "bg-emerald-100 dark:bg-emerald-900/50"
                          : "bg-zinc-100 dark:bg-zinc-800"
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          isConnected
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {service.name}
                        </h3>
                        {isConnected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            Not Connected
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {service.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {service.requiredFor.map((feature) => (
                          <span
                            key={feature}
                            className="inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Additional Help */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="py-5">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            How it works
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              Click &quot;Authenticate&quot; to open a browser with tabs for
              services that need login.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              Log in to each service as you normally would.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              When finished, click &quot;Done&quot; to save your session and
              close the browser.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              Sessions are stored locally and persist until they expire.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
