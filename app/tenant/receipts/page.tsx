import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { FileText, Download } from "lucide-react"

export default async function TenantReceiptsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tenantAccount } = await supabase.from("tenant_accounts").select("id").eq("user_id", user?.id).single()

  const { data: receipts } = await supabase
    .from("receipts")
    .select("*, payments(amount, payment_date, payment_method)")
    .eq("tenant_id", tenantAccount?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader title="My Receipts" description="I-download ang iyong mga resibo" />

      {!receipts || receipts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No receipts yet"
          description="Wala ka pang natanggap na resibo. Makakakuha ka ng resibo kapag na-verify na ang iyong payment."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Receipt History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-100 shrink-0">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Receipt #{receipt.receipt_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(receipt.created_at)} • {formatCurrency(receipt.payments?.amount || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {receipt.payments?.payment_method?.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="bg-transparent">
                    <a href={receipt.file_url || "#"} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
