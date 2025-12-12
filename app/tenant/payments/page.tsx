import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { CreditCard, Upload } from "lucide-react"
import Link from "next/link"

export default async function TenantPaymentsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tenantAccount } = await supabase.from("tenant_accounts").select("id").eq("user_id", user?.id).single()

  const { data: payments } = await supabase
    .from("payments")
    .select("*, bills(billing_period)")
    .eq("tenant_id", tenantAccount?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Payments"
        description="Tingnan ang lahat ng iyong payments"
        actions={
          <Button asChild>
            <Link href="/tenant/payments/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Payment
            </Link>
          </Button>
        }
      />

      {!payments || payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments yet"
          description="Wala ka pang recorded na payment"
          action={
            <Button asChild>
              <Link href="/tenant/payments/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Payment
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.payment_date)} • {payment.payment_method?.replace("_", " ")}
                      </p>
                      {payment.bills?.billing_period && (
                        <p className="text-sm text-muted-foreground">For: {payment.bills.billing_period}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <StatusBadge status={payment.status} />
                    {payment.reference_number && (
                      <p className="text-xs text-muted-foreground">Ref: {payment.reference_number}</p>
                    )}
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
