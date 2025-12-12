import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, Building2, MapPin, Home } from "lucide-react"
import Link from "next/link"

export default async function PropertiesPage() {
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

  const { data: properties } = await supabase
    .from("properties")
    .select(`
      *,
      units(id, unit_number, status),
      rooms(id, room_number)
    `)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Properties"
        description="Pamahalaan ang iyong mga rental properties"
        actions={
          <Button asChild>
            <Link href="/landlord/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
        }
      />

      {!properties || properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Magdagdag ng iyong unang property para makapagsimula"
          action={
            <Button asChild>
              <Link href="/landlord/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{property.name}</CardTitle>
                  <StatusBadge
                    status={property.property_type === "apartment" ? "active" : "pending"}
                    label={property.property_type === "apartment" ? "Apartment" : "Dormitory"}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {property.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{property.address}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {property.property_type === "apartment"
                      ? `${property.units?.length || 0} units`
                      : `${property.rooms?.length || 0} rooms`}
                  </span>
                </div>

                {property.property_type === "apartment" && property.units && (
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600">
                      {property.units.filter((u: any) => u.status === "occupied").length} occupied
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-yellow-600">
                      {property.units.filter((u: any) => u.status === "vacant").length} vacant
                    </span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                    <Link href={`/landlord/properties/${property.id}`}>View Details</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                    <Link href={`/landlord/properties/${property.id}/units`}>Manage Units</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
