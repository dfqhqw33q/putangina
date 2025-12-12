import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/utils/format"
import { Plus, MessageSquareWarning } from "lucide-react"
import Link from "next/link"

export default async function TenantComplaintsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tenantAccount } = await supabase.from("tenant_accounts").select("id").eq("user_id", user?.id).single()

  const { data: complaints } = await supabase
    .from("complaints")
    .select("*")
    .eq("tenant_id", tenantAccount?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Complaints"
        description="Mag-submit ng complaint o concern"
        actions={
          <Button asChild>
            <Link href="/tenant/complaints/new">
              <Plus className="mr-2 h-4 w-4" />
              New Complaint
            </Link>
          </Button>
        }
      />

      {!complaints || complaints.length === 0 ? (
        <EmptyState
          icon={MessageSquareWarning}
          title="No complaints"
          description="Wala ka pang nai-submit na complaint"
          action={
            <Button asChild>
              <Link href="/tenant/complaints/new">
                <Plus className="mr-2 h-4 w-4" />
                Submit Complaint
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>My Complaints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      <MessageSquareWarning className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{complaint.subject}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{complaint.description}</p>
                      <p className="text-sm text-muted-foreground mt-1">{formatDate(complaint.created_at)}</p>
                    </div>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
