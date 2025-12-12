import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"

export default async function SMSBlastPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("workspace_members(workspace_id, workspaces(plan_type))")
    .eq("id", user?.id)
    .single()

  const workspace = profile?.workspace_members?.[0]?.workspaces
  const planType = workspace?.plan_type
  const hasAccess = planType === "empire"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mass SMS Blast"
        description="Mag-send ng mensahe sa lahat ng tenant"
        action={
          <Button variant="outline" asChild>
            <Link href="/landlord/sms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to SMS
            </Link>
          </Button>
        }
      />

      {!hasAccess ? (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Mass SMS Blast is only available on the <Badge>Empire Plan</Badge>. Upgrade your plan to unlock this
            feature.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Create SMS Blast</CardTitle>
              <CardDescription>Ipadala ang announcement o reminder sa lahat ng active tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <form action="/api/sms/blast" method="POST" className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Type your message here..."
                    required
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">Max 160 characters for single SMS</p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="target" className="text-sm font-medium">
                    Target <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="target"
                    name="target"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">All Active Tenants</option>
                    <option value="overdue">Tenants with Overdue Bills</option>
                    <option value="current">Tenants with Current Bills</option>
                  </select>
                </div>

                <Button type="submit" className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Queue Messages
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMS Blast Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>✅ Keep messages short and clear (160 characters)</p>
              <p>✅ Always include your property name</p>
              <p>✅ Use respectful and friendly tone</p>
              <p>✅ Best time to send: 9AM - 6PM</p>
              <p>⚠️ Avoid sending after 8PM or before 8AM</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
