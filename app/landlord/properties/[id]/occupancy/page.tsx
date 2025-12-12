import { createServerSupabaseClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { OccupancyGrid } from "@/components/dorm/occupancy-grid"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function OccupancyPage({
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
        id,
        room_number,
        floor,
        beds(
          id,
          bed_number,
          status,
          tenant_bindings(tenant_accounts(full_name))
        )
      )
    `)
    .eq("id", propertyId)
    .single()

  if (!property || property.property_type !== "dormitory") {
    notFound()
  }

  const roomsWithBeds =
    property.rooms?.map((room: any) => ({
      id: room.id,
      room_number: room.room_number,
      floor: room.floor,
      beds: room.beds.map((bed: any) => ({
        id: bed.id,
        bed_number: bed.bed_number,
        status: bed.status,
        tenant_name: bed.tenant_bindings?.[0]?.tenant_accounts?.full_name,
      })),
    })) || []

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${property.name} - Occupancy`}
        description="Visual na pagpapakita ng bed occupancy"
        actions={
          <Button variant="ghost" asChild>
            <Link href={`/landlord/properties/${propertyId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <OccupancyGrid rooms={roomsWithBeds} />
    </div>
  )
}
