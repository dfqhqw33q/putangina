import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Users, MoreVertical, Eye, UserX, Building2 } from "lucide-react"
import { formatDate } from "@/lib/utils/format"

async function getLandlords() {
  const supabase = await createClient()

  const { data: landlords } = await supabase
    .from("profiles")
    .select(
      `
      *,
      workspaces:workspaces(id, name, plan_type, is_active)
    `,
    )
    .eq("role", "landlord")
    .order("created_at", { ascending: false })

  return landlords || []
}

export default async function LandlordsPage() {
  const landlords = await getLandlords()

  return (
    <div>
      <PageHeader
        title="Landlords"
        titleFilipino="Mga May-ari"
        description="Manage all landlord accounts"
        descriptionFilipino="Pamahalaan ang lahat ng account ng may-ari"
        actions={
          <Button asChild>
            <Link href="/superadmin/workspaces/new">
              <Building2 className="mr-2 h-4 w-4" />
              Create Workspace
            </Link>
          </Button>
        }
      />

      {landlords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No landlords yet</h3>
            <p className="text-sm text-muted-foreground">Wala pang may-ari</p>
            <Button asChild className="mt-4">
              <Link href="/superadmin/workspaces/new">Create Landlord Account</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {landlords.map((landlord) => {
            const initials = landlord.full_name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)

            const workspaceCount = landlord.workspaces?.length || 0

            return (
              <Card key={landlord.id} className={!landlord.is_active ? "border-red-200 bg-red-50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={landlord.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{landlord.full_name}</h3>
                        <p className="text-xs text-muted-foreground">{landlord.email}</p>
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
                          <Link href={`/superadmin/landlords/${landlord.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <UserX className="mr-2 h-4 w-4" />
                          Deactivate Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {landlord.is_active ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                    <Badge variant="outline">{workspaceCount} workspace(s)</Badge>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                    {landlord.phone && <p>{landlord.phone}</p>}
                    <p className="text-xs">Joined {formatDate(landlord.created_at)}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
