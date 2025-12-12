import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Send, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function SMSReceiptsPage() {
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

  // Get recent receipts
  const { data: receipts } = await supabase
    .from("receipts")
    .select(`
      *,
      payments(
        bill_id,
        bills(
          tenant_accounts(
            id,
            full_name,
            phone
          )
        )
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(20)

  async function queueReceiptSMS(receiptId: string) {
    "use server"
    const supabase = await createServerSupabaseClient()

    const { data: receipt } = await supabase
      .from("receipts")
      .select(`
        *,
        payments(
          bill_id,
          bills(
            tenant_accounts(id, full_name, phone)
          )
        )
      `)
      .eq("id", receiptId)
      .single()

    if (!receipt) return

    const tenant = receipt.payments.bills.tenant_accounts
    const message = `Kumusta! Natanggap na namin ang inyong bayad na ${formatCurrency(receipt.amount_received)} para sa Receipt #${receipt.receipt_number}. Salamat po! - Property Management`

    await supabase.from("sms_queue").insert({
      workspace_id: receipt.workspace_id,
      tenant_id: tenant.id,
      phone_number: tenant.phone,
      message,
      message_type: "receipt",
      reference_type: "receipt",
      reference_id: receipt.id,
      status: "queued",
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Receipt SMS"
        description="Ipadala ang receipt confirmation sa tenant"
        action={
          <Button variant="outline" asChild>
            <Link href="/landlord/sms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to SMS
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          {!receipts || receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Walang recent receipts</p>
          ) : (
            <div className="space-y-3">
              {receipts.map((receipt) => {
                const tenant = receipt.payments?.bills?.tenant_accounts
                const smsMessage = `Kumusta! Natanggap na namin ang inyong bayad na ${formatCurrency(receipt.amount_received)} para sa Receipt #${receipt.receipt_number}. Salamat po! - Property Management`

                return (
                  <div key={receipt.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium">{tenant?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{tenant?.phone}</p>
                      <p className="text-sm mt-1">
                        Receipt #{receipt.receipt_number} · {formatCurrency(receipt.amount_received)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(receipt.created_at)}</p>
                    </div>
                    <Button size="sm" asChild>
                      <a href={`sms:${tenant?.phone}?body=${encodeURIComponent(smsMessage)}`}>
                        <Send className="mr-2 h-4 w-4" />
                        Send SMS
                      </a>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
