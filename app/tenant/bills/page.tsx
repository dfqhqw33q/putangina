import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Receipt, Eye, Upload } from "lucide-react"
import Link from "next/link"

export default async function TenantBillsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tenantAccount } = await supabase.from("tenant_accounts").select("id").eq("user_id", user?.id).single()

  const { data: bills } = await supabase
    .from("bills")
    .select("*, bill_line_items(*)")
    .eq("tenant_id", tenantAccount?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Bills"
        description="Tingnan ang lahat ng iyong bills at balances"
        actions={
          <Button asChild>
            <Link href="/tenant/payments/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload Payment
            </Link>
          </Button>
        }
      />

      {!bills || bills.length === 0 ? (
        <EmptyState icon={Receipt} title="No bills yet" description="Wala ka pang natatanggap na bill" />
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => (
            <Card key={bill.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{bill.billing_period}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Due: {formatDate(bill.due_date)}</p>
                </div>
                <StatusBadge status={bill.status} />
              </CardHeader>
              <CardContent>
                {/* Line Items */}
                <div className="space-y-2 mb-4">
                  {bill.bill_line_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.description}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{formatCurrency(bill.total_amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="text-green-600">{formatCurrency(bill.amount_paid)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">Balance</span>
                    <span className={`font-bold ${bill.balance > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(bill.balance)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                    <Link href={`/tenant/bills/${bill.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                  {bill.balance > 0 && (
                    <Button size="sm" asChild className="flex-1">
                      <Link href="/tenant/payments/upload">
                        <Upload className="mr-2 h-4 w-4" />
                        Pay Now
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
