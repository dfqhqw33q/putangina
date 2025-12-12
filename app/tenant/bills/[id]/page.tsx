import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: bill } = await supabase
    .from("bills")
    .select("*, bill_line_items(*), payments(id, amount, payment_date, status)")
    .eq("id", id)
    .single()

  if (!bill) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bill: ${bill.billing_period}`}
        description={`Due date: ${formatDate(bill.due_date)}`}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/tenant/bills">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            {bill.balance > 0 && (
              <Button asChild>
                <Link href="/tenant/payments/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Pay Now
                </Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bill Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bill Details</CardTitle>
              <StatusBadge status={bill.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Description</th>
                      <th className="text-right py-2 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.bill_line_items?.map((item: any) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3">
                          <p>{item.description}</p>
                          {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
                        </td>
                        <td className="py-3 text-right">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t">
                      <td className="py-3 font-medium">Total Amount</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(bill.total_amount)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-green-600">Amount Paid</td>
                      <td className="py-2 text-right text-green-600">{formatCurrency(bill.amount_paid)}</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-3 font-bold text-lg">Balance Due</td>
                      <td
                        className={`py-3 text-right font-bold text-lg ${bill.balance > 0 ? "text-red-600" : "text-green-600"}`}
                      >
                        {formatCurrency(bill.balance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {bill.notes && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Notes:</p>
                  <p className="text-sm text-muted-foreground">{bill.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment History for this Bill */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payments for this Bill</CardTitle>
          </CardHeader>
          <CardContent>
            {!bill.payments || bill.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {bill.payments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(payment.payment_date)}</p>
                    </div>
                    <StatusBadge status={payment.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
