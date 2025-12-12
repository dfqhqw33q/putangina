import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Plus, CreditCard, Eye, Check, X } from "lucide-react"
import Link from "next/link"

export default async function PaymentsPage({
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
    .from("payments")
    .select(`
      *,
      tenant_accounts(full_name),
      bills(billing_period)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (filterStatus) {
    query = query.eq("status", filterStatus)
  }

  const { data: payments } = await query

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="I-record at i-verify ang mga bayad"
        actions={
          <Button asChild>
            <Link href="/landlord/payments/record">
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Link>
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button variant={!filterStatus ? "default" : "outline"} size="sm" asChild>
          <Link href="/landlord/payments">All</Link>
        </Button>
        <Button variant={filterStatus === "pending" ? "default" : "outline"} size="sm" asChild>
          <Link href="/landlord/payments?status=pending">Pending</Link>
        </Button>
        <Button variant={filterStatus === "verified" ? "default" : "outline"} size="sm" asChild>
          <Link href="/landlord/payments?status=verified">Verified</Link>
        </Button>
        <Button variant={filterStatus === "rejected" ? "default" : "outline"} size="sm" asChild>
          <Link href="/landlord/payments?status=rejected">Rejected</Link>
        </Button>
      </div>

      {!payments || payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments yet"
          description={filterStatus ? `Walang ${filterStatus} payments` : "Walang recorded payments"}
          action={
            <Button asChild>
              <Link href="/landlord/payments/record">
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 font-medium">Tenant</th>
                    <th className="text-left py-3 font-medium hidden sm:table-cell">Date</th>
                    <th className="text-left py-3 font-medium hidden md:table-cell">Method</th>
                    <th className="text-right py-3 font-medium">Amount</th>
                    <th className="text-center py-3 font-medium">Status</th>
                    <th className="text-right py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="py-4">
                        <p className="font-medium">{payment.tenant_accounts?.full_name}</p>
                        <p className="text-sm text-muted-foreground sm:hidden">{formatDate(payment.payment_date)}</p>
                      </td>
                      <td className="py-4 hidden sm:table-cell">{formatDate(payment.payment_date)}</td>
                      <td className="py-4 hidden md:table-cell capitalize">
                        {payment.payment_method?.replace("_", " ")}
                      </td>
                      <td className="py-4 text-right font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="py-4 text-center">
                        <StatusBadge status={payment.status} />
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/landlord/payments/${payment.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {payment.status === "pending" && (
                            <>
                              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" asChild>
                                <Link href={`/landlord/payments/${payment.id}/verify`}>
                                  <Check className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" asChild>
                                <Link href={`/landlord/payments/${payment.id}/reject`}>
                                  <X className="h-4 w-4" />
                                </Link>
                              </Button>
                            </>
                          )}
                        </div>
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
