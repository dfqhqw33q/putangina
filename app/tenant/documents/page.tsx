import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { formatDate } from "@/lib/utils/format"
import { FolderArchive, Download, FileText, Receipt, FileCheck } from "lucide-react"

export default async function TenantDocumentsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: tenantAccount } = await supabase.from("tenant_accounts").select("id").eq("user_id", user?.id).single()

  const { data: documents } = await supabase
    .from("document_archive")
    .select("*")
    .eq("tenant_id", tenantAccount?.id)
    .order("created_at", { ascending: false })

  const getDocIcon = (type: string) => {
    switch (type) {
      case "contract":
        return FileCheck
      case "receipt":
        return Receipt
      default:
        return FileText
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Document Archive" description="Lahat ng iyong documents at files" />

      {!documents || documents.length === 0 ? (
        <EmptyState
          icon={FolderArchive}
          title="No documents yet"
          description="Makikita mo dito ang lahat ng iyong receipts, contracts, at iba pang documents"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => {
                const Icon = getDocIcon(doc.document_type)
                return (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.document_type} • {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>
                    {doc.file_url && (
                      <Button variant="outline" size="sm" asChild className="bg-transparent">
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
