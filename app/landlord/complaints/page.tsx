import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/utils/format"
import { MessageSquareWarning, Eye } from "lucide-react"
import Link from "next/link"

export default async function ComplaintsPage({
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
    .from("complaints")
    .select(`
      *,
      tenant_accounts(full_name)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (filterStatus) {
    query = query.eq("status", filterStatus)
  }

  const { data: complaints } = await query

  return (
    <div className="space-y-6">
      <PageHeader title="Complaints" description="Pamahalaan ang mga reklamo ng tenant" />

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button variant={!filterStatus ? "default" : "outline"} size="sm" asChild>
          <Link href="/landlord/complaints">All</Link>
        </Button>
        <Button variant={filterStatus === "open" ? "default" : "outline"} size="sm" asChild>
          <Link href="/landlord/complaints?status=open">Open</Link>
        </Button>
        <Button variant={filterStatus === "investigating" ? "default" : "outline"} size="sm" asChild>
          <Link href="/landlord/complaints?status=investigating">Investigating</Link>
        </Button>
        <Button variant={filterStatus === "resolved" ? "default" : "outline"} size="sm" asChild>
          <Link href="/landlord/complaints?status=resolved">Resolved</Link>
        </Button>
      </div>

      {!complaints || complaints.length === 0 ? (
        <EmptyState
          icon={MessageSquareWarning}
          title="No complaints"
          description={filterStatus ? `Walang ${filterStatus} complaints` : "Walang complaints"}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted shrink-0">
                        <MessageSquareWarning className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{complaint.subject}</p>
                        <p className="text-sm text-muted-foreground">{complaint.tenant_accounts?.full_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{formatDate(complaint.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={complaint.status} />
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/landlord/complaints/${complaint.id}`}>
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
