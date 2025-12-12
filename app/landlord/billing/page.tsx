import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Plus, Receipt, FileText, Eye } from "lucide-react"
import Link from "next/link"

export default async function BillingPage() {
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

  const { data: bills } = await supabase
    .from("bills")
    .select(`
      *,
      tenant_accounts(full_name),
      bill_line_items(*)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Pamahalaan ang mga bills at utilities"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/landlord/billing/utilities">
                <FileText className="mr-2 h-4 w-4" />
                Utility Readings
              </Link>
            </Button>
            <Button asChild>
              <Link href="/landlord/billing/generate">
                <Plus className="mr-2 h-4 w-4" />
                Generate Bills
              </Link>
            </Button>
          </div>
        }
      />

      {!bills || bills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No bills yet"
          description="Generate bills para sa mga tenant"
          action={
            <Button asChild>
              <Link href="/landlord/billing/generate">
                <Plus className="mr-2 h-4 w-4" />
                Generate Bills
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 font-medium">Tenant</th>
                    <th className="text-left py-3 font-medium hidden sm:table-cell">Period</th>
                    <th className="text-left py-3 font-medium hidden md:table-cell">Due Date</th>
                    <th className="text-right py-3 font-medium">Amount</th>
                    <th className="text-right py-3 font-medium">Balance</th>
                    <th className="text-center py-3 font-medium">Status</th>
                    <th className="text-right py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill.id} className="border-b last:border-0">
                      <td className="py-4">
                        <p className="font-medium">{bill.tenant_accounts?.full_name}</p>
                        <p className="text-sm text-muted-foreground sm:hidden">{bill.billing_period}</p>
                      </td>
                      <td className="py-4 hidden sm:table-cell">{bill.billing_period}</td>
                      <td className="py-4 hidden md:table-cell">{formatDate(bill.due_date)}</td>
                      <td className="py-4 text-right">{formatCurrency(bill.total_amount)}</td>
                      <td className="py-4 text-right">
                        <span className={bill.balance > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                          {formatCurrency(bill.balance)}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <StatusBadge status={bill.status} />
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/landlord/billing/${bill.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
