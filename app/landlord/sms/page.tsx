import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatDate } from "@/lib/utils/format"
import { Send, FileText, Clock, Check } from "lucide-react"
import Link from "next/link"

export default async function SMSBridgePage() {
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

  const { data: smsQueue } = await supabase
    .from("sms_queue")
    .select(`
      *,
      tenant_accounts(full_name, phone)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(20)

  const pendingCount = smsQueue?.filter((s) => s.status === "pending").length || 0

  return (
    <div className="space-y-6">
      <PageHeader title="SMS Bridge" description="Ihanda ang SMS para ipadala gamit ang iyong phone" />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
          <Link href="/landlord/sms/receipts">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Receipt SMS</CardTitle>
                  <CardDescription>Ipadala ang resibo via SMS</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
          <Link href="/landlord/sms/reminders">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Payment Reminders</CardTitle>
                  <CardDescription>Paalalahanan ang mga tenant</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
          <Link href="/landlord/sms/blast">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Send className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Mass SMS</CardTitle>
                  <CardDescription>Mag-blast sa lahat ng tenant</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* SMS Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>SMS Queue</CardTitle>
            <CardDescription>
              {pendingCount > 0
                ? `${pendingCount} pending message${pendingCount > 1 ? "s" : ""} to send`
                : "No pending messages"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!smsQueue || smsQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Walang SMS sa queue</p>
          ) : (
            <div className="space-y-3">
              {smsQueue.map((sms) => (
                <div key={sms.id} className="flex items-start justify-between p-4 rounded-lg border gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{sms.tenant_accounts?.full_name}</p>
                      {sms.status === "pending" ? (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Pending</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded flex items-center gap-1">
                          <Check className="h-3 w-3" /> Sent
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{sms.tenant_accounts?.phone}</p>
                    <p className="text-sm mt-2 line-clamp-2">{sms.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(sms.created_at)}</p>
                  </div>
                  {sms.status === "pending" && (
                    <Button size="sm" asChild>
                      <a href={`sms:${sms.tenant_accounts?.phone}?body=${encodeURIComponent(sms.message)}`}>
                        <Send className="mr-2 h-4 w-4" />
                        Send
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How SMS Bridge Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-muted text-sm font-medium">1</div>
            <div>
              <p className="font-medium">Piliin ang SMS type</p>
              <p className="text-sm text-muted-foreground">Receipt, reminder, o mass message</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-muted text-sm font-medium">2</div>
            <div>
              <p className="font-medium">I-prepare ang message</p>
              <p className="text-sm text-muted-foreground">Auto-fill ang template gamit ang tenant info</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-muted text-sm font-medium">3</div>
            <div>
              <p className="font-medium">I-click ang Send button</p>
              <p className="text-sm text-muted-foreground">Magbubukas ang SMS app mo na may pre-filled message</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            Tip: Gamitin ang "Unli-Text" promo ng network mo para libre ang pagpapadala!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
