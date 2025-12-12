"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Plus, Zap, Droplets } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils/format"

export default function UtilityReadingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<any[]>([])
  const [readings, setReadings] = useState<any[]>([])
  const [formData, setFormData] = useState({
    unit_id: "",
    utility_type: "electricity",
    previous_reading: "",
    current_reading: "",
    rate_per_unit: "",
    reading_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
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

    const [{ data: unitsData }, { data: readingsData }] = await Promise.all([
      supabase.from("units").select("*, properties(name)").eq("workspace_id", workspaceId).eq("status", "occupied"),
      supabase
        .from("utility_readings")
        .select("*, units(unit_number, properties(name))")
        .eq("workspace_id", workspaceId)
        .order("reading_date", { ascending: false })
        .limit(20),
    ])

    setUnits(unitsData || [])
    setReadings(readingsData || [])
  }

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

      const consumption = Number.parseFloat(formData.current_reading) - Number.parseFloat(formData.previous_reading)
      const totalAmount = consumption * Number.parseFloat(formData.rate_per_unit)

      const { error } = await supabase.from("utility_readings").insert({
        workspace_id: workspaceId,
        unit_id: formData.unit_id,
        utility_type: formData.utility_type,
        previous_reading: Number.parseFloat(formData.previous_reading),
        current_reading: Number.parseFloat(formData.current_reading),
        consumption,
        rate_per_unit: Number.parseFloat(formData.rate_per_unit),
        total_amount: totalAmount,
        reading_date: formData.reading_date,
      })

      if (error) throw error

      toast({
        title: "Reading saved",
        description: "Matagumpay na nai-save ang utility reading",
      })

      setFormData({
        unit_id: "",
        utility_type: "electricity",
        previous_reading: "",
        current_reading: "",
        rate_per_unit: "",
        reading_date: new Date().toISOString().split("T")[0],
      })

      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save reading",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const consumption =
    formData.current_reading && formData.previous_reading
      ? Number.parseFloat(formData.current_reading) - Number.parseFloat(formData.previous_reading)
      : 0

  const totalAmount =
    consumption && formData.rate_per_unit ? consumption * Number.parseFloat(formData.rate_per_unit) : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utility Readings"
        description="I-record ang sub-meter readings para sa utilities"
        actions={
          <Button variant="ghost" asChild>
            <Link href="/landlord/billing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Reading Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Reading</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unit_id">Unit *</Label>
                <Select
                  value={formData.unit_id}
                  onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unit {unit.unit_number} - {unit.properties?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="utility_type">Utility Type *</Label>
                <Select
                  value={formData.utility_type}
                  onValueChange={(value) => setFormData({ ...formData, utility_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electricity">
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Electricity (Kuryente)
                      </span>
                    </SelectItem>
                    <SelectItem value="water">
                      <span className="flex items-center gap-2">
                        <Droplets className="h-4 w-4" /> Water (Tubig)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="previous_reading">Previous Reading *</Label>
                  <Input
                    id="previous_reading"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.previous_reading}
                    onChange={(e) => setFormData({ ...formData, previous_reading: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_reading">Current Reading *</Label>
                  <Input
                    id="current_reading"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.current_reading}
                    onChange={(e) => setFormData({ ...formData, current_reading: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate_per_unit">Rate per kWh/m³ *</Label>
                  <Input
                    id="rate_per_unit"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 12.50"
                    value={formData.rate_per_unit}
                    onChange={(e) => setFormData({ ...formData, rate_per_unit: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reading_date">Reading Date *</Label>
                  <Input
                    id="reading_date"
                    type="date"
                    value={formData.reading_date}
                    onChange={(e) => setFormData({ ...formData, reading_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {consumption > 0 && (
                <div className="p-4 bg-muted rounded-lg space-y-1">
                  <p className="text-sm text-muted-foreground">Calculated Values</p>
                  <p>
                    Consumption: <span className="font-medium">{consumption.toFixed(2)}</span>{" "}
                    {formData.utility_type === "electricity" ? "kWh" : "m³"}
                  </p>
                  <p>
                    Total: <span className="font-medium">{formatCurrency(totalAmount)}</span>
                  </p>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Save Reading
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Readings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Readings</CardTitle>
          </CardHeader>
          <CardContent>
            {readings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Walang recorded readings</p>
            ) : (
              <div className="space-y-3">
                {readings.map((reading) => (
                  <div key={reading.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {reading.utility_type === "electricity" ? (
                        <Zap className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Droplets className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <p className="font-medium">Unit {reading.units?.unit_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(reading.reading_date)} • {reading.consumption.toFixed(2)}{" "}
                          {reading.utility_type === "electricity" ? "kWh" : "m³"}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">{formatCurrency(reading.total_amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
