"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Bed, User } from "lucide-react"

interface BedData {
  id: string
  bed_number: string
  status: string
  tenant_name?: string
}

interface RoomData {
  id: string
  room_number: string
  floor?: number
  beds: BedData[]
}

interface OccupancyGridProps {
  rooms: RoomData[]
  onBedClick?: (bedId: string) => void
}

export function OccupancyGrid({ rooms, onBedClick }: OccupancyGridProps) {
  const totalBeds = rooms.reduce((acc, room) => acc + room.beds.length, 0)
  const occupiedBeds = rooms.reduce((acc, room) => acc + room.beds.filter((b) => b.status === "occupied").length, 0)
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-sm">Occupied ({occupiedBeds})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-300" />
            <span className="text-sm">Vacant ({totalBeds - occupiedBeds})</span>
          </div>
        </div>
        <div className="text-sm font-medium">{occupancyRate}% Occupancy</div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card key={room.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Room {room.room_number}</span>
                {room.floor && <span className="text-xs text-muted-foreground">Floor {room.floor}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {room.beds.map((bed) => (
                  <button
                    key={bed.id}
                    onClick={() => onBedClick?.(bed.id)}
                    className={cn(
                      "p-3 rounded-lg border transition-all flex flex-col items-center gap-1",
                      bed.status === "occupied"
                        ? "bg-green-50 border-green-200 hover:bg-green-100"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100",
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      <span className="text-sm font-medium">{bed.bed_number}</span>
                    </div>
                    {bed.status === "occupied" && bed.tenant_name ? (
                      <span className="text-xs text-green-700 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {bed.tenant_name.split(" ")[0]}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Vacant</span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
