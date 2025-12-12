import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/utils/format"
import { Plus, Megaphone, Edit } from "lucide-react"
import Link from "next/link"

export default async function AnnouncementsPage() {
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

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Mag-post ng anunsyo para sa mga tenant"
        actions={
          <Button asChild>
            <Link href="/landlord/announcements/new">
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Link>
          </Button>
        }
      />

      {!announcements || announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Gumawa ng announcement para makita ng mga tenant"
          action={
            <Button asChild>
              <Link href="/landlord/announcements/new">
                <Plus className="mr-2 h-4 w-4" />
                New Announcement
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{announcement.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(announcement.created_at)}
                    {announcement.is_pinned && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Pinned</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/landlord/announcements/${announcement.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
