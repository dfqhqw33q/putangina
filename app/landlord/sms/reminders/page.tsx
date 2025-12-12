import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Send, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function SMSRemindersPage() {
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

  // Get unpaid bills for reminders
  const { data: bills } = await supabase
    .from("bills")
    .select(`
      *,
      tenant_accounts(id, full_name, phone)
    `)
    .eq("workspace_id", workspaceId)
    .in("status", ["pending", "overdue"])
    .gt("balance_due", 0)
    .order("due_date", { ascending: true })
    .limit(50)

  const today = new Date()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Reminders"
        description="Mag-send ng reminder sa mga tenant na may pending bills"
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
          <CardTitle>Tenants with Pending Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {!bills || bills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Walang pending bills. Lahat ay bayad na!</p>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => {
                const tenant = bill.tenant_accounts
                const dueDate = new Date(bill.due_date)
                const isOverdue = dueDate < today

                const smsMessage = isOverdue
                  ? `Mahal na tenant, ang inyong bill #${bill.bill_number} na ${formatCurrency(bill.balance_due)} ay LATE na po. Due date: ${formatDate(bill.due_date)}. Mangyaring magbayad na po. Salamat! - Property Management`
                  : `Paalala: Ang inyong bill #${bill.bill_number} na ${formatCurrency(bill.balance_due)} ay malapit nang mag-due (${formatDate(bill.due_date)}). Mangyaring maghanda ng bayad. Salamat! - Property Management`

                return (
                  <div
                    key={bill.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isOverdue ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{tenant?.full_name}</p>
                        {isOverdue && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">LATE</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{tenant?.phone}</p>
                      <p className="text-sm mt-1">
                        Bill #{bill.bill_number} · {formatCurrency(bill.balance_due)}
                      </p>
                      <p className="text-xs text-muted-foreground">Due: {formatDate(bill.due_date)}</p>
                    </div>
                    <Button size="sm" variant={isOverdue ? "destructive" : "default"} asChild>
                      <a href={`sms:${tenant?.phone}?body=${encodeURIComponent(smsMessage)}`}>
                        <Send className="mr-2 h-4 w-4" />
                        Send
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
