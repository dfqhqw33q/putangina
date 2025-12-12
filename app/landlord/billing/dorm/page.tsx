"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Receipt, Calculator } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/format"

interface RoomWithBoarders {
  id: string
  room_number: string
  beds: Array<{
    id: string
    bed_number: string
    monthly_rent: number
    tenant_bindings: Array<{
      tenant_accounts: {
        id: string
        full_name: string
      }
    }>
  }>
}

export default function DormBillingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<RoomWithBoarders[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>("")
  const [selectedBoarders, setSelectedBoarders] = useState<string[]>([])
  const [billingPeriod, setBillingPeriod] = useState(() => {
    const now = new Date()
    return `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`
  })
  const [dueDate, setDueDate] = useState(() => {
    const now = new Date()
    now.setDate(now.getDate() + 15)
    return now.toISOString().split("T")[0]
  })
  const [sharedUtility, setSharedUtility] = useState({
    electricity: "",
    water: "",
  })

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
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

    const { data } = await supabase
      .from("rooms")
      .select(`
        id,
        room_number,
        beds(
          id,
          bed_number,
          monthly_rent,
          tenant_bindings(
            tenant_accounts(id, full_name)
          )
        )
      `)
      .eq("workspace_id", workspaceId)

    setRooms(data || [])
  }

  const currentRoom = rooms.find((r) => r.id === selectedRoom)
  const boardersInRoom =
    currentRoom?.beds
      ?.filter((bed) => bed.tenant_bindings?.length > 0)
      .map((bed) => ({
        tenantId: bed.tenant_bindings[0].tenant_accounts.id,
        name: bed.tenant_bindings[0].tenant_accounts.full_name,
        bedNumber: bed.bed_number,
        rent: bed.monthly_rent,
      })) || []

  const totalElectricity = Number.parseFloat(sharedUtility.electricity) || 0
  const totalWater = Number.parseFloat(sharedUtility.water) || 0
  const occupantCount = selectedBoarders.length || 1
  const electricityPerPerson = totalElectricity / occupantCount
  const waterPerPerson = totalWater / occupantCount

  const toggleBoarder = (tenantId: string) => {
    setSelectedBoarders((prev) =>
      prev.includes(tenantId) ? prev.filter((id) => id !== tenantId) : [...prev, tenantId],
    )
  }

  const selectAllInRoom = () => {
    if (selectedBoarders.length === boardersInRoom.length) {
      setSelectedBoarders([])
    } else {
      setSelectedBoarders(boardersInRoom.map((b) => b.tenantId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedBoarders.length === 0) {
      toast({
        title: "Error",
        description: "Pumili ng kahit isang boarder",
        variant: "destructive",
      })
      return
    }

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

      // Generate bills for each selected boarder
      for (const tenantId of selectedBoarders) {
        const boarder = boardersInRoom.find((b) => b.tenantId === tenantId)
        if (!boarder) continue

        const totalAmount = boarder.rent + electricityPerPerson + waterPerPerson

        // Create bill
        const { data: bill, error: billError } = await supabase
          .from("bills")
          .insert({
            workspace_id: workspaceId,
            tenant_id: tenantId,
            billing_period: billingPeriod,
            due_date: dueDate,
            total_amount: totalAmount,
            balance: totalAmount,
            status: "pending",
          })
          .select()
          .single()

        if (billError) throw billError

        // Create line items
        const lineItems = [
          {
            bill_id: bill.id,
            description: `Bed Rent (Bed ${boarder.bedNumber})`,
            amount: boarder.rent,
            item_type: "rent",
          },
        ]

        if (electricityPerPerson > 0) {
          lineItems.push({
            bill_id: bill.id,
            description: `Electricity (shared ${occupantCount} ways)`,
            amount: electricityPerPerson,
            item_type: "utility",
          })
        }

        if (waterPerPerson > 0) {
          lineItems.push({
            bill_id: bill.id,
            description: `Water (shared ${occupantCount} ways)`,
            amount: waterPerPerson,
            item_type: "utility",
          })
        }

        await supabase.from("bill_line_items").insert(lineItems)
      }

      toast({
        title: "Bills generated",
        description: `Matagumpay na naggenerate ng ${selectedBoarders.length} dorm bills`,
      })

      router.push("/landlord/billing")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate bills",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dorm Billing"
        description="Gumawa ng bills na may shared utility splitting"
        actions={
          <Button variant="ghost" asChild>
            <Link href="/landlord/billing">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Billing Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billing_period">Billing Period *</Label>
                <Input
                  id="billing_period"
                  placeholder="e.g., January 2025"
                  value={billingPeriod}
                  onChange={(e) => setBillingPeriod(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Room</CardTitle>
            <CardDescription>Piliin ang room para sa billing</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    Room {room.room_number} ({room.beds?.filter((b) => b.tenant_bindings?.length > 0).length || 0}{" "}
                    boarders)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedRoom && boardersInRoom.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Shared Utilities</CardTitle>
                    <CardDescription>Total bill na hahatiin sa mga boarder</CardDescription>
                  </div>
                  <Calculator className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="electricity">Total Electricity Bill (PHP)</Label>
                    <Input
                      id="electricity"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={sharedUtility.electricity}
                      onChange={(e) => setSharedUtility({ ...sharedUtility, electricity: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="water">Total Water Bill (PHP)</Label>
                    <Input
                      id="water"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={sharedUtility.water}
                      onChange={(e) => setSharedUtility({ ...sharedUtility, water: e.target.value })}
                    />
                  </div>
                </div>

                {(totalElectricity > 0 || totalWater > 0) && selectedBoarders.length > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      Per Person ({selectedBoarders.length} boarder{selectedBoarders.length > 1 ? "s" : ""}):
                    </p>
                    <div className="flex gap-6 text-sm">
                      {totalElectricity > 0 && (
                        <div>
                          <span className="text-muted-foreground">Electricity:</span>{" "}
                          <span className="font-medium">{formatCurrency(electricityPerPerson)}</span>
                        </div>
                      )}
                      {totalWater > 0 && (
                        <div>
                          <span className="text-muted-foreground">Water:</span>{" "}
                          <span className="font-medium">{formatCurrency(waterPerPerson)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Select Boarders</CardTitle>
                    <CardDescription>Piliin ang mga boarder na bibigyan ng bill</CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={selectAllInRoom}>
                    {selectedBoarders.length === boardersInRoom.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {boardersInRoom.map((boarder) => {
                    const totalForBoarder = boarder.rent + electricityPerPerson + waterPerPerson
                    return (
                      <div key={boarder.tenantId} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={boarder.tenantId}
                            checked={selectedBoarders.includes(boarder.tenantId)}
                            onCheckedChange={() => toggleBoarder(boarder.tenantId)}
                          />
                          <label htmlFor={boarder.tenantId} className="cursor-pointer">
                            <p className="font-medium">{boarder.name}</p>
                            <p className="text-sm text-muted-foreground">Bed {boarder.bedNumber}</p>
                          </label>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(totalForBoarder)}</p>
                          <p className="text-xs text-muted-foreground">Rent + Utilities</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading || selectedBoarders.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Receipt className="mr-2 h-4 w-4" />
            Generate {selectedBoarders.length} Bill{selectedBoarders.length !== 1 ? "s" : ""}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/landlord/billing">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
