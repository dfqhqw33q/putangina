import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, Users, MoreVertical, Settings, Power, Eye } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils/format"

async function getWorkspaces() {
  const supabase = await createClient()

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select(
      `
      *,
      owner:profiles!workspaces_owner_id_fkey(id, full_name, email)
    `,
    )
    .order("created_at", { ascending: false })

  return workspaces || []
}

export default async function WorkspacesPage() {
  const workspaces = await getWorkspaces()

  const planColors = {
    starter: "bg-gray-100 text-gray-800",
    professional: "bg-blue-100 text-blue-800",
    empire: "bg-purple-100 text-purple-800",
  }

  return (
    <div>
      <PageHeader
        title="Workspaces"
        titleFilipino="Mga Workspace"
        description="Manage all landlord workspaces"
        descriptionFilipino="Pamahalaan ang lahat ng workspace ng may-ari"
        actions={
          <Button asChild>
            <Link href="/superadmin/workspaces/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Link>
          </Button>
        }
      />

      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No workspaces yet</h3>
            <p className="text-sm text-muted-foreground">Wala pang workspace</p>
            <Button asChild className="mt-4">
              <Link href="/superadmin/workspaces/new">
                <Plus className="mr-2 h-4 w-4" />
                Create First Workspace
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <Card key={workspace.id} className={workspace.kill_switch_enabled ? "border-red-200 bg-red-50" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${workspace.kill_switch_enabled ? "bg-red-100" : "bg-primary/10"}`}
                    >
                      <Building2
                        className={`h-5 w-5 ${workspace.kill_switch_enabled ? "text-red-600" : "text-primary"}`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{workspace.name}</h3>
                      <p className="text-xs text-muted-foreground">{workspace.slug}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/superadmin/workspaces/${workspace.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/superadmin/workspaces/${workspace.id}/edit`}>
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/superadmin/kill-switch?workspace=${workspace.id}`}
                          className={workspace.kill_switch_enabled ? "text-green-600" : "text-red-600"}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          {workspace.kill_switch_enabled ? "Reactivate" : "Kill Switch"}
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className={planColors[workspace.plan_type as keyof typeof planColors]}>
                    {workspace.plan_type.charAt(0).toUpperCase() + workspace.plan_type.slice(1)}
                  </Badge>
                  <Badge variant={workspace.workspace_type === "dormitory" ? "secondary" : "outline"}>
                    {workspace.workspace_type === "dormitory" ? "Dorm" : "Homes"}
                  </Badge>
                  {workspace.kill_switch_enabled && <Badge variant="destructive">Suspended</Badge>}
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{workspace.owner?.full_name || "No owner"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Created {formatDate(workspace.created_at)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
