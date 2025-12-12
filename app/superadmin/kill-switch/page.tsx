"use client"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Power, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface Workspace {
  id: string
  name: string
  slug: string
  kill_switch_enabled: boolean
  kill_switch_reason: string | null
  owner: {
    full_name: string
    email: string
  } | null
}

export default function KillSwitchPage() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get("workspace")

  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    if (preselectedId && workspaces.length > 0) {
      setSelectedWorkspace(preselectedId)
    }
  }, [preselectedId, workspaces])

  const fetchWorkspaces = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("workspaces")
      .select(
        `
        id, name, slug, kill_switch_enabled, kill_switch_reason,
        owner:profiles!workspaces_owner_id_fkey(full_name, email)
      `,
      )
      .order("name")

    setWorkspaces((data as Workspace[]) || [])
    setIsFetching(false)
  }

  const handleToggleKillSwitch = async () => {
    if (!selectedWorkspace) return

    const workspace = workspaces.find((w) => w.id === selectedWorkspace)
    if (!workspace) return

    const newState = !workspace.kill_switch_enabled

    if (newState && !reason.trim()) {
      toast.error("Please provide a reason for suspension")
      return
    }

    setIsLoading(true)

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("workspaces")
        .update({
          kill_switch_enabled: newState,
          kill_switch_reason: newState ? reason : null,
          is_active: !newState,
        })
        .eq("id", selectedWorkspace)

      if (error) throw error

      // Log the action
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          user_email: user.email || "",
          user_role: "superadmin",
          action: newState ? "enable_kill_switch" : "disable_kill_switch",
          resource_type: "workspace",
          resource_id: selectedWorkspace,
          workspace_id: selectedWorkspace,
          details: { reason: newState ? reason : "Reactivated" },
        })
      }

      toast.success(
        newState
          ? "Workspace suspended successfully / Matagumpay na nasuspinde ang workspace"
          : "Workspace reactivated successfully / Matagumpay na na-reactivate ang workspace",
      )

      setReason("")
      fetchWorkspaces()
    } catch (err) {
      toast.error("Failed to update workspace")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedWorkspaceData = workspaces.find((w) => w.id === selectedWorkspace)
  const suspendedWorkspaces = workspaces.filter((w) => w.kill_switch_enabled)

  return (
    <div>
      <PageHeader
        title="Kill Switch"
        titleFilipino="Kill Switch"
        description="Suspend or reactivate workspace access"
        descriptionFilipino="Suspindihin o i-reactivate ang access ng workspace"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              Kill Switch Control
            </CardTitle>
            <CardDescription>Toggle workspace access for delinquent clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Workspace / Pumili ng Workspace</Label>
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace} disabled={isFetching}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a workspace..." />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      <div className="flex items-center gap-2">
                        {ws.name}
                        {ws.kill_switch_enabled && (
                          <Badge variant="destructive" className="ml-2">
                            Suspended
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedWorkspaceData && (
              <>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{selectedWorkspaceData.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedWorkspaceData.owner?.full_name}</p>
                    </div>
                    <Badge variant={selectedWorkspaceData.kill_switch_enabled ? "destructive" : "default"}>
                      {selectedWorkspaceData.kill_switch_enabled ? "Suspended" : "Active"}
                    </Badge>
                  </div>

                  {selectedWorkspaceData.kill_switch_enabled && selectedWorkspaceData.kill_switch_reason && (
                    <Alert className="mt-4" variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Reason:</strong> {selectedWorkspaceData.kill_switch_reason}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {!selectedWorkspaceData.kill_switch_enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="reason">Suspension Reason / Dahilan ng Suspensyon *</Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g., Non-payment of subscription fees"
                      rows={3}
                    />
                  </div>
                )}

                <Button
                  onClick={handleToggleKillSwitch}
                  disabled={isLoading}
                  variant={selectedWorkspaceData.kill_switch_enabled ? "default" : "destructive"}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Power className="mr-2 h-4 w-4" />}
                  {selectedWorkspaceData.kill_switch_enabled
                    ? "Reactivate Workspace / I-reactivate ang Workspace"
                    : "Suspend Workspace / Suspindihin ang Workspace"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Currently Suspended */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Currently Suspended ({suspendedWorkspaces.length})
            </CardTitle>
            <CardDescription>Workspaces with kill switch enabled</CardDescription>
          </CardHeader>
          <CardContent>
            {suspendedWorkspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-sm text-muted-foreground">No suspended workspaces</p>
                <p className="text-xs text-muted-foreground">Walang suspendidong workspace</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suspendedWorkspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"
                  >
                    <div>
                      <p className="font-medium">{ws.name}</p>
                      <p className="text-xs text-muted-foreground">{ws.kill_switch_reason}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedWorkspace(ws.id)
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                    >
                      Manage
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
