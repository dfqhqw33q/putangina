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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewBedPage({
  params,
}: {
  params: Promise<{ id: string; roomId: string }>
}) {
  const { id: propertyId, roomId } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bed_number: "",
    bed_type: "single",
    monthly_rent: "",
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

      const { error } = await supabase.from("beds").insert({
        room_id: roomId,
        workspace_id: workspaceId,
        bed_number: formData.bed_number,
        bed_type: formData.bed_type,
        monthly_rent: Number.parseFloat(formData.monthly_rent),
        description: formData.description || null,
        status: "vacant",
      })

      if (error) throw error

      toast({
        title: "Bed added",
        description: "Matagumpay na naidagdag ang bed",
      })

      router.push(`/landlord/properties/${propertyId}/rooms`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add bed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Bed"
        description="Magdagdag ng bagong bed sa room"
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
          <CardTitle>Bed Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bed_number">Bed Number/Label *</Label>
                <Input
                  id="bed_number"
                  placeholder="e.g., A, B, 1, Upper"
                  value={formData.bed_number}
                  onChange={(e) => setFormData({ ...formData, bed_number: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bed_type">Bed Type *</Label>
                <Select
                  value={formData.bed_type}
                  onValueChange={(value) => setFormData({ ...formData, bed_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Bed</SelectItem>
                    <SelectItem value="double">Double Bed</SelectItem>
                    <SelectItem value="bunk_upper">Bunk - Upper</SelectItem>
                    <SelectItem value="bunk_lower">Bunk - Lower</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_rent">Monthly Rent per Bed (PHP) *</Label>
              <Input
                id="monthly_rent"
                type="number"
                step="0.01"
                placeholder="e.g., 2500"
                value={formData.monthly_rent}
                onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about the bed"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Bed
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
