import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/utils/format"
import { FileText, Download, Eye } from "lucide-react"

export default async function TenantContractsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tenantAccount } = await supabase.from("tenant_accounts").select("id").eq("user_id", user?.id).single()

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .eq("tenant_id", tenantAccount?.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader title="My Contract" description="Tingnan ang iyong rental contract" />

      {!contracts || contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No contract yet"
          description="Wala ka pang contract. Makikita mo ito dito kapag na-upload na ng landlord."
        />
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <Card key={contract.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Rental Contract</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {contract.start_date && `Start: ${formatDate(contract.start_date)}`}
                    {contract.end_date && ` • End: ${formatDate(contract.end_date)}`}
                  </p>
                </div>
                <StatusBadge status={contract.status} />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contract.description && <p className="text-sm text-muted-foreground">{contract.description}</p>}

                  <div className="flex flex-col sm:flex-row gap-2">
                    {contract.file_url && (
                      <>
                        <Button variant="outline" asChild className="bg-transparent">
                          <a href={contract.file_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="mr-2 h-4 w-4" />
                            View Contract
                          </a>
                        </Button>
                        <Button variant="outline" asChild className="bg-transparent">
                          <a href={contract.file_url} download>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </a>
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="p-4 bg-muted rounded-lg text-sm">
                    <p className="font-medium mb-1">Important:</p>
                    <p className="text-muted-foreground">
                      Basahin ng mabuti ang lahat ng terms and conditions sa contract. Kung may mga katanungan,
                      makipag-ugnayan sa landlord.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
