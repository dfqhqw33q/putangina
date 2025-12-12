import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/utils/format"
import { Megaphone } from "lucide-react"

export default async function TenantAnnouncementsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tenantAccount } = await supabase
    .from("tenant_accounts")
    .select("tenant_bindings(workspace_id)")
    .eq("user_id", user?.id)
    .single()

  const workspaceId = tenantAccount?.tenant_bindings?.[0]?.workspace_id

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Mga anunsyo mula sa landlord" />

      {!announcements || announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" description="Wala pang mga anunsyo mula sa landlord" />
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                  {announcement.is_pinned && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded shrink-0">Pinned</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(announcement.created_at)}</p>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
