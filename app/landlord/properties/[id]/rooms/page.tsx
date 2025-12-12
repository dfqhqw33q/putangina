import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Plus, DoorOpen, Bed, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: propertyId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: property } = await supabase
    .from("properties")
    .select(`
      *,
      rooms(
        *,
        beds(*, tenant_bindings(tenant_accounts(full_name)))
      )
    `)
    .eq("id", propertyId)
    .single()

  if (!property || property.property_type !== "dormitory") {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${property.name} - Rooms`}
        description="Pamahalaan ang mga rooms at beds ng dormitory"
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href={`/landlord/properties/${propertyId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/landlord/properties/${propertyId}/rooms/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Link>
            </Button>
          </div>
        }
      />

      {!property.rooms || property.rooms.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="No rooms yet"
          description="Magdagdag ng mga rooms para sa dormitory"
          action={
            <Button asChild>
              <Link href={`/landlord/properties/${propertyId}/rooms/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Room
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {property.rooms.map((room: any) => {
            const totalBeds = room.beds?.length || 0
            const occupiedBeds = room.beds?.filter((b: any) => b.tenant_bindings?.length > 0).length || 0

            return (
              <Card key={room.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DoorOpen className="h-5 w-5" />
                      Room {room.room_number}
                    </CardTitle>
                    <StatusBadge
                      status={occupiedBeds === totalBeds ? "occupied" : occupiedBeds > 0 ? "partial" : "vacant"}
                      label={`${occupiedBeds}/${totalBeds}`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Room Stats */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      <span>{totalBeds} beds</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{occupiedBeds} occupied</span>
                    </div>
                  </div>

                  {/* Beds List */}
                  {room.beds && room.beds.length > 0 && (
                    <div className="space-y-2">
                      {room.beds.map((bed: any) => {
                        const tenant = bed.tenant_bindings?.[0]?.tenant_accounts
                        return (
                          <div key={bed.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Bed className="h-4 w-4" />
                              <span className="text-sm font-medium">Bed {bed.bed_number}</span>
                            </div>
                            {tenant ? (
                              <span className="text-sm text-green-600">{tenant.full_name}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">Vacant</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                      <Link href={`/landlord/properties/${propertyId}/rooms/${room.id}`}>View Details</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                      <Link href={`/landlord/properties/${propertyId}/rooms/${room.id}/beds/new`}>
                        <Plus className="mr-1 h-3 w-3" />
                        Add Bed
                      </Link>
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
