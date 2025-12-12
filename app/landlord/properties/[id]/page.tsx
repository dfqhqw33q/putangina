import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { ArrowLeft, Edit, Plus, Home, Users } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: property } = await supabase
    .from("properties")
    .select(`
      *,
      units(*, tenant_bindings(tenant_accounts(full_name))),
      rooms(*, beds(*))
    `)
    .eq("id", id)
    .single()

  if (!property) {
    notFound()
  }

  const isApartment = property.property_type === "apartment"

  return (
    <div className="space-y-6">
      <PageHeader
        title={property.name}
        description={property.address || "No address provided"}
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/landlord/properties">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/landlord/properties/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Info */}
        <Card>
          <CardHeader>
            <CardTitle>Property Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{property.property_type}</p>
            </div>
            {property.city && (
              <div>
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">{property.city}</p>
              </div>
            )}
            {property.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{property.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Units/Rooms List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{isApartment ? "Units" : "Rooms"}</CardTitle>
            <Button size="sm" asChild>
              <Link href={`/landlord/properties/${id}/units/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add {isApartment ? "Unit" : "Room"}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isApartment ? (
              property.units?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No units added yet. Click "Add Unit" to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {property.units?.map((unit: any) => (
                    <div key={unit.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Home className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">Unit {unit.unit_number}</p>
                          {unit.tenant_bindings?.[0]?.tenant_accounts ? (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {unit.tenant_bindings[0].tenant_accounts.full_name}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Vacant</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={unit.status} />
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/landlord/properties/${id}/units/${unit.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Dormitory rooms management coming in Phase 7
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
