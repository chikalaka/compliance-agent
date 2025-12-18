"use client"

import { useState, useEffect, useCallback } from "react"
import { FieldWrapper } from "@/components/form-fields"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

const STORAGE_KEY = "ticket-screenshots-config"

interface StoredConfig {
  repoName: string
  count: number
  ticketPattern: string
  linearCompanyName: string
}

interface ScreenshotResult {
  ticketId: string
  success: boolean
  error?: string
}

interface AuthStatus {
  authenticated: boolean
  services: {
    github: boolean
    linear: boolean
  }
}

export default function TicketScreenshotsPage() {
  const [repoName, setRepoName] = useState("")
  const [count, setCount] = useState(5)
  const [ticketPattern, setTicketPattern] = useState("")
  const [linearCompanyName, setLinearCompanyName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<ScreenshotResult[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Auth state
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/browser/status")
      if (res.ok) {
        const status: AuthStatus = await res.json()
        setAuthStatus(status)
      }
    } catch (error) {
      console.error("Failed to check auth status:", error)
    } finally {
      setIsCheckingAuth(false)
    }
  }, [])

  // Load saved config from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const config: StoredConfig = JSON.parse(saved)
        setRepoName(config.repoName || "")
        setCount(config.count || 5)
        setTicketPattern(config.ticketPattern || "")
        setLinearCompanyName(config.linearCompanyName || "")
      }
    } catch {
      // Ignore parse errors
    }
    setIsInitialized(true)
    checkAuthStatus()
  }, [checkAuthStatus])

  // Save config to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialized) return
    const config: StoredConfig = {
      repoName,
      count,
      ticketPattern,
      linearCompanyName,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [repoName, count, ticketPattern, linearCompanyName, isInitialized])

  const handleAuthenticate = async () => {
    setIsAuthenticating(true)

    toast.info("Opening browser for authentication...", {
      description:
        "Please log in to GitHub and Linear in the browser window that opens.",
      duration: 10000,
    })

    try {
      const res = await fetch("/api/browser/auth", { method: "POST" })
      const data = await res.json()

      if (data.success) {
        toast.success("Authentication successful!", {
          description: "You can now take screenshots.",
        })
        await checkAuthStatus()
      } else {
        toast.error("Authentication incomplete", {
          description:
            data.error || "Please try again and log in to both services.",
        })
        await checkAuthStatus()
      }
    } catch (error) {
      console.error("Auth error:", error)
      toast.error("Authentication failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      })
    } finally {
      setIsAuthenticating(false)
    }
  }

  const runTakeScreenshots = useCallback(async () => {
    // Load config from localStorage to ensure we have the latest values
    let currentConfig = { repoName, count, ticketPattern, linearCompanyName }
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        currentConfig = JSON.parse(saved)
      }
    } catch {
      // Use state values as fallback
    }

    if (
      !currentConfig.repoName ||
      !currentConfig.ticketPattern ||
      !currentConfig.linearCompanyName
    ) {
      toast.error("Missing required fields", {
        description: "Please fill in all fields before taking screenshots.",
      })
      return
    }

    setIsProcessing(true)
    setResults([])

    try {
      const res = await fetch("/api/screenshots/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: currentConfig.repoName,
          count: currentConfig.count,
          ticketPattern: currentConfig.ticketPattern,
          linearCompanyName: currentConfig.linearCompanyName,
        }),
      })

      if (!res.ok) {
        const errorData: { error?: string; code?: string } = await res
          .json()
          .catch(() => ({}))

        // Handle auth required error
        if (res.status === 401 && errorData.code === "AUTH_REQUIRED") {
          await checkAuthStatus()
          toast.error("Authentication required", {
            description:
              "Please click 'Authenticate' to log in to GitHub and Linear.",
          })
          return
        }

        throw new Error(errorData.error || "Failed to take screenshots")
      }

      const data = await res.json()
      setResults(data.results || [])

      const successCount = data.results?.filter(
        (r: ScreenshotResult) => r.success,
      ).length
      toast.success("Screenshots completed!", {
        description: `Successfully captured ${successCount} of ${
          data.results?.length || 0
        } tickets.`,
        icon: <CheckCircle2 className="h-4 w-4" />,
      })
    } catch (error) {
      console.error("Screenshot error:", error)
      toast.error("Failed to take screenshots", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [repoName, count, ticketPattern, linearCompanyName, checkAuthStatus])

  async function handleTakeScreenshots() {
    await runTakeScreenshots()
  }

  const isAuthenticated = authStatus?.authenticated ?? false
  const missingServices: string[] = []
  if (authStatus && !authStatus.services.github) missingServices.push("GitHub")
  if (authStatus && !authStatus.services.linear) missingServices.push("Linear")

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Ticket Screenshots
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Automatically capture screenshots from GitHub PRs and their linked
          Linear tickets for compliance evidence.
        </p>
      </div>

      {/* Authentication Status Card */}
      {!isCheckingAuth && (
        <Card
          className={
            isAuthenticated
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
              : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                )}
                <div>
                  <p
                    className={
                      isAuthenticated
                        ? "text-sm font-medium text-emerald-900 dark:text-emerald-100"
                        : "text-sm font-medium text-amber-900 dark:text-amber-100"
                    }
                  >
                    {isAuthenticated
                      ? "Authenticated"
                      : "Authentication Required"}
                  </p>
                  <p
                    className={
                      isAuthenticated
                        ? "text-sm text-emerald-700 dark:text-emerald-300"
                        : "text-sm text-amber-700 dark:text-amber-300"
                    }
                  >
                    {isAuthenticated
                      ? "You're logged in to GitHub and Linear"
                      : `Please authenticate to: ${
                          missingServices.join(", ") || "GitHub and Linear"
                        }`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={checkAuthStatus}
                    disabled={isCheckingAuth}
                    className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={handleAuthenticate}
                  disabled={isAuthenticating}
                  variant={isAuthenticated ? "outline" : "default"}
                  className={
                    isAuthenticated
                      ? ""
                      : "bg-amber-600 hover:bg-amber-700 text-white"
                  }
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      {isAuthenticated ? "Re-authenticate" : "Authenticate"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Configuration
          </h3>

          <FieldWrapper
            label="Repository Name"
            description="GitHub repository in format: owner/repo-name"
            htmlFor="repoName"
          >
            <Input
              id="repoName"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="acme-org/backend-api"
            />
          </FieldWrapper>

          <FieldWrapper
            label="Number of PRs"
            description="How many recent closed PRs to process"
            htmlFor="count"
          >
            <Input
              id="count"
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            />
          </FieldWrapper>

          <FieldWrapper
            label="Ticket Pattern"
            description="Pattern to extract ticket IDs from PR titles (e.g., PRJ-* matches PRJ-123)"
            htmlFor="ticketPattern"
          >
            <Input
              id="ticketPattern"
              value={ticketPattern}
              onChange={(e) => setTicketPattern(e.target.value)}
              placeholder="PRJ-*"
            />
          </FieldWrapper>

          <FieldWrapper
            label="Linear Company Name"
            description="Your Linear workspace name for constructing ticket URLs"
            htmlFor="linearCompanyName"
          >
            <Input
              id="linearCompanyName"
              value={linearCompanyName}
              onChange={(e) => setLinearCompanyName(e.target.value)}
              placeholder="acme"
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <Button
          onClick={handleTakeScreenshots}
          disabled={isProcessing || !isAuthenticated}
          className="min-w-[180px] bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Take Screenshots
            </>
          )}
        </Button>
      </div>

      {results.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Results
            </h3>
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.ticketId}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
                >
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {result.ticketId}
                    </p>
                    {result.error && (
                      <p className="text-sm text-red-500">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
