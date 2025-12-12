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

export default function NewUnitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: propertyId } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    unit_number: "",
    floor: "",
    bedrooms: "1",
    bathrooms: "1",
    area_sqm: "",
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

      const { error } = await supabase.from("units").insert({
        property_id: propertyId,
        workspace_id: workspaceId,
        unit_number: formData.unit_number,
        floor: formData.floor ? Number.parseInt(formData.floor) : null,
        bedrooms: Number.parseInt(formData.bedrooms),
        bathrooms: Number.parseInt(formData.bathrooms),
        area_sqm: formData.area_sqm ? Number.parseFloat(formData.area_sqm) : null,
        monthly_rent: Number.parseFloat(formData.monthly_rent),
        description: formData.description || null,
        status: "vacant",
      })

      if (error) throw error

      toast({
        title: "Unit created",
        description: "Matagumpay na naidagdag ang unit",
      })

      router.push(`/landlord/properties/${propertyId}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create unit",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Unit"
        description="Magdagdag ng bagong unit sa property"
        actions={
          <Button variant="ghost" asChild>
            <Link href={`/landlord/properties/${propertyId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Unit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_number">Unit Number *</Label>
                <Input
                  id="unit_number"
                  placeholder="e.g., 101, A1"
                  value={formData.unit_number}
                  onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area_sqm">Area (sqm)</Label>
                <Input
                  id="area_sqm"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 45.5"
                  value={formData.area_sqm}
                  onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_rent">Monthly Rent (PHP) *</Label>
              <Input
                id="monthly_rent"
                type="number"
                step="0.01"
                placeholder="e.g., 8000"
                value={formData.monthly_rent}
                onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about the unit"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Unit
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/landlord/properties/${propertyId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
