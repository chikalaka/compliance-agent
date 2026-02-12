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
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { SessionStatus } from "@/types/browser-auth.types"

const STORAGE_KEY = "ticket-screenshots-config"

interface RepoRow {
  id: string
  repoName: string
  commitHashes: string
}

interface StoredConfig {
  repoRows: RepoRow[]
  ticketPattern: string
  linearCompanyName: string
}

interface ScreenshotResult {
  ticketId: string
  success: boolean
  error?: string
  repoName?: string
}

export default function TicketScreenshotsPage() {
  const [repoRows, setRepoRows] = useState<RepoRow[]>([
    { id: crypto.randomUUID(), repoName: "", commitHashes: "" },
  ])
  const [ticketPattern, setTicketPattern] = useState("")
  const [linearCompanyName, setLinearCompanyName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<ScreenshotResult[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Auth state
  const [authStatus, setAuthStatus] = useState<SessionStatus | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check authentication status
  const checkAuthStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/browser/status")
      if (res.ok) {
        const status: SessionStatus = await res.json()
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
        const config = JSON.parse(saved)
        
        // Migration: Handle old format with single repo
        if (config.repoName !== undefined && config.commitHashes !== undefined) {
          // Old format - migrate to new format
          setRepoRows([
            {
              id: crypto.randomUUID(),
              repoName: config.repoName || "",
              commitHashes: config.commitHashes || "",
            },
          ])
        } else if (config.repoRows && Array.isArray(config.repoRows)) {
          // New format - ensure all rows have IDs
          setRepoRows(
            config.repoRows.map((row: RepoRow) => ({
              ...row,
              id: row.id || crypto.randomUUID(),
            }))
          )
        }
        
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
      repoRows,
      ticketPattern,
      linearCompanyName,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [repoRows, ticketPattern, linearCompanyName, isInitialized])

  // Row management functions
  const addRow = () => {
    setRepoRows([
      ...repoRows,
      {
        id: crypto.randomUUID(),
        repoName: "",
        commitHashes: "",
      },
    ])
  }

  const removeRow = (id: string) => {
    if (repoRows.length > 1) {
      setRepoRows(repoRows.filter((row) => row.id !== id))
    }
  }

  const updateRow = (
    id: string,
    field: keyof Omit<RepoRow, "id">,
    value: string
  ) => {
    setRepoRows(
      repoRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

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
    let currentRepoRows = repoRows
    let currentTicketPattern = ticketPattern
    let currentLinearCompanyName = linearCompanyName
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const config = JSON.parse(saved)
        currentRepoRows = config.repoRows || repoRows
        currentTicketPattern = config.ticketPattern || ticketPattern
        currentLinearCompanyName = config.linearCompanyName || linearCompanyName
      }
    } catch {
      // Use state values as fallback
    }

    // Validate - filter out empty rows
    const validRows = currentRepoRows.filter(
      (row) => row.repoName.trim() && row.commitHashes.trim()
    )

    if (validRows.length === 0) {
      toast.error("No valid repositories", {
        description: "Please add at least one repository with commit hashes.",
      })
      return
    }

    if (!currentTicketPattern || !currentLinearCompanyName) {
      toast.error("Missing required fields", {
        description: "Please fill in ticket pattern and Linear company name.",
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
          repositories: validRows.map((row) => ({
            repoName: row.repoName,
            commitHashes: row.commitHashes,
          })),
          ticketPattern: currentTicketPattern,
          linearCompanyName: currentLinearCompanyName,
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
  }, [repoRows, ticketPattern, linearCompanyName, checkAuthStatus])

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
          <CardContent className="">
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
                    {isAuthenticated ? (
                      <>
                        You&apos;re logged in to GitHub and Linear.{" "}
                        <Link
                          href="/browser-auth"
                          className="underline underline-offset-2 hover:text-emerald-900 dark:hover:text-emerald-100"
                        >
                          Manage connections
                        </Link>
                      </>
                    ) : (
                      <>
                        This feature requires GitHub and Linear.{" "}
                        <Link
                          href="/browser-auth"
                          className="underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
                        >
                          Go to Browser Authentication
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Repositories
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Add repositories and their commit hashes to process
              </p>
            </div>

            <div className="space-y-3">
              {repoRows.map((row, index) => (
                <div
                  key={row.id}
                  className="flex items-start gap-3 p-4 border border-zinc-200 rounded-lg dark:border-zinc-800"
                >
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                        Repository Name
                      </label>
                      <Input
                        value={row.repoName}
                        onChange={(e) =>
                          updateRow(row.id, "repoName", e.target.value)
                        }
                        placeholder="owner/repo-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                        Commit Hashes
                      </label>
                      <Input
                        value={row.commitHashes}
                        onChange={(e) =>
                          updateRow(row.id, "commitHashes", e.target.value)
                        }
                        placeholder="5320fd0,0c6190a,306382a"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.id)}
                    disabled={repoRows.length === 1}
                    className="mt-7"
                    title="Remove repository"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={addRow} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Repository
            </Button>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Global Settings
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                These settings apply to all repositories
              </p>
            </div>

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
          </div>
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
            <div className="space-y-4">
              {(() => {
                // Group results by repository
                const resultsByRepo = results.reduce((acc, result) => {
                  const repo = result.repoName || "Unknown"
                  if (!acc[repo]) acc[repo] = []
                  acc[repo].push(result)
                  return acc
                }, {} as Record<string, ScreenshotResult[]>)

                return Object.entries(resultsByRepo).map(([repo, repoResults]) => (
                  <div key={repo} className="space-y-2">
                    <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 px-1">
                      {repo}
                    </h4>
                    <div className="space-y-2">
                      {repoResults.map((result, idx) => (
                        <div
                          key={`${result.ticketId}-${idx}`}
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
                  </div>
                ))
              })()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
