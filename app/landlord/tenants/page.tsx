import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, Users, Phone, Mail, Home } from "lucide-react"
import Link from "next/link"

export default async function TenantsPage() {
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

  const { data: tenants } = await supabase
    .from("tenant_accounts")
    .select(`
      *,
      tenant_bindings(
        units(unit_number, properties(name)),
        beds(bed_number, rooms(room_number, properties(name)))
      )
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Pamahalaan ang mga nangungupahan"
        actions={
          <Button asChild>
            <Link href="/landlord/tenants/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Link>
          </Button>
        }
      />

      {!tenants || tenants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenants yet"
          description="Magdagdag ng tenant para makapagsimula ng billing"
          action={
            <Button asChild>
              <Link href="/landlord/tenants/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((tenant) => {
            const binding = tenant.tenant_bindings?.[0]
            const unit = binding?.units
            const bed = binding?.beds
            const location = unit
              ? `Unit ${unit.unit_number} - ${unit.properties?.name}`
              : bed
                ? `Bed ${bed.bed_number}, Room ${bed.rooms?.room_number} - ${bed.rooms?.properties?.name}`
                : "Not assigned"

            return (
              <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {tenant.full_name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{tenant.full_name}</p>
                        <StatusBadge status={tenant.status} size="sm" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {tenant.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{tenant.phone}</span>
                      </div>
                    )}
                    {tenant.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{tenant.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Home className="h-4 w-4" />
                      <span>{location}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                      <Link href={`/landlord/tenants/${tenant.id}`}>View Details</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                      <Link href={`/landlord/billing?tenant=${tenant.id}`}>Bills</Link>
                    </Button>
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
