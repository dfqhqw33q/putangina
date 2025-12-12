import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/utils/format"
import { Plus, FileText, Download, Eye } from "lucide-react"
import Link from "next/link"

export default async function ContractsPage() {
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

  const { data: contracts } = await supabase
    .from("contracts")
    .select(`
      *,
      tenant_accounts(full_name)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts"
        description="Pamahalaan ang mga kontrata ng tenant"
        actions={
          <Button asChild>
            <Link href="/landlord/contracts/upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload Contract
            </Link>
          </Button>
        }
      />

      {!contracts || contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No contracts yet"
          description="Mag-upload ng contract para sa mga tenant"
          action={
            <Button asChild>
              <Link href="/landlord/contracts/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload Contract
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 font-medium">Tenant</th>
                    <th className="text-left py-3 font-medium hidden sm:table-cell">Start Date</th>
                    <th className="text-left py-3 font-medium hidden md:table-cell">End Date</th>
                    <th className="text-center py-3 font-medium">Status</th>
                    <th className="text-right py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="border-b last:border-0">
                      <td className="py-4">
                        <p className="font-medium">{contract.tenant_accounts?.full_name}</p>
                        <p className="text-sm text-muted-foreground sm:hidden">{formatDate(contract.start_date)}</p>
                      </td>
                      <td className="py-4 hidden sm:table-cell">{formatDate(contract.start_date)}</td>
                      <td className="py-4 hidden md:table-cell">
                        {contract.end_date ? formatDate(contract.end_date) : "Ongoing"}
                      </td>
                      <td className="py-4 text-center">
                        <StatusBadge status={contract.status} />
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/landlord/contracts/${contract.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {contract.file_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={contract.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
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
