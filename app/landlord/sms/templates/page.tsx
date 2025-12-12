import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Check, X } from "lucide-react"
import Link from "next/link"

export default async function SMSTemplatesPage() {
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

  const { data: templates } = await supabase
    .from("sms_templates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS Templates"
        description="Mag-manage ng SMS templates para sa mabilis na paggamit"
        action={
          <Button asChild>
            <Link href="/landlord/sms/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4">
        {!templates || templates.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-sm text-muted-foreground text-center">Walang templates pa. Gumawa ng bago!</p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? (
                          <>
                            <Check className="mr-1 h-3 w-3" /> Active
                          </>
                        ) : (
                          <>
                            <X className="mr-1 h-3 w-3" /> Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                    <CardDescription className="capitalize">{template.template_type}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/landlord/sms/templates/${template.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{template.content}</p>
                  </div>
                  {template.variables && template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <p className="text-xs text-muted-foreground">Variables:</p>
                      {template.variables.map((variable: string) => (
                        <code key={variable} className="text-xs bg-muted px-2 py-1 rounded">
                          {`{{${variable}}}`}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
