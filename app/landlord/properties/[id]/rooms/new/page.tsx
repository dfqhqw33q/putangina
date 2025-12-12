"use client"

import type React from "react"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: propertyId } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    room_number: "",
    floor: "",
    capacity: "4",
    amenities: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: profile } = await supabase
        .from("profiles")
        .select("workspace_members(workspace_id)")
        .eq("id", user?.id)
        .single()

      const workspaceId = profile?.workspace_members?.[0]?.workspace_id

      const { error } = await supabase.from("rooms").insert({
        property_id: propertyId,
        workspace_id: workspaceId,
        room_number: formData.room_number,
        floor: formData.floor ? Number.parseInt(formData.floor) : null,
        capacity: Number.parseInt(formData.capacity),
        amenities: formData.amenities || null,
        description: formData.description || null,
      })

      if (error) throw error

      toast({
        title: "Room created",
        description: "Matagumpay na naidagdag ang room",
      })

      router.push(`/landlord/properties/${propertyId}/rooms`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create room",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Room"
        description="Magdagdag ng bagong room sa dormitory"
        actions={
          <Button variant="ghost" asChild>
            <Link href={`/landlord/properties/${propertyId}/rooms`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Room Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room_number">Room Number *</Label>
                <Input
                  id="room_number"
                  placeholder="e.g., 101, A1"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  placeholder="e.g., 1"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Bed Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder="e.g., 4"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Maximum na bilang ng beds sa room na ito</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities</Label>
              <Input
                id="amenities"
                placeholder="e.g., AC, CR, Study Area"
                value={formData.amenities}
                onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about the room"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Room
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/landlord/properties/${propertyId}/rooms`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
