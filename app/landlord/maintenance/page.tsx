import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/utils/format"
import { Wrench, Eye } from "lucide-react"
import Link from "next/link"

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: filterStatus } = await searchParams
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_members(workspace_id)")
    .eq("id", user?.id)
    .single()

  const workspaceId = profile?.workspace_members?.[0]?.workspace_id

  let query = supabase
    .from("maintenance_requests")
    .select(`
      *,
      tenant_accounts(full_name),
      units(unit_number, properties(name))
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (filterStatus) {
    query = query.eq("status", filterStatus)
  }

  const { data: requests } = await query

  return (
    <div className="space-y-6">
      <PageHeader title="Maintenance Requests" description="Pamahalaan ang mga request ng tenant" />

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button variant={!filterStatus ? "default" : "outline"} size="sm" asChild>
          <Link href="/landlord/maintenance">All</Link>
        </Button>
        <Button variant={filterStatus === "pending" ? "default" : "outline"} size="sm" asChild>
          <Link href="/landlord/maintenance?status=pending">Pending</Link>
        </Button>
        <Button variant={filterStatus === "in_progress" ? "default" : "outline"} size="sm" asChild>
          <Link href="/landlord/maintenance?status=in_progress">In Progress</Link>
        </Button>
        <Button variant={filterStatus === "completed" ? "default" : "outline"} size="sm" asChild>
          <Link href="/landlord/maintenance?status=completed">Completed</Link>
        </Button>
      </div>

      {!requests || requests.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance requests"
          description={filterStatus ? `Walang ${filterStatus} requests` : "Walang maintenance requests"}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted shrink-0">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.tenant_accounts?.full_name} • Unit {request.units?.unit_number}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">{formatDate(request.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={request.status} />
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/landlord/maintenance/${request.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
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
