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
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Receipt } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/format"

interface TenantWithUnit {
  id: string
  full_name: string
  tenant_bindings: Array<{
    units: {
      unit_number: string
      monthly_rent: number
    }
  }>
}

export default function GenerateBillsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [tenants, setTenants] = useState<TenantWithUnit[]>([])
  const [selectedTenants, setSelectedTenants] = useState<string[]>([])
  const [billingPeriod, setBillingPeriod] = useState(() => {
    const now = new Date()
    return `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`
  })
  const [dueDate, setDueDate] = useState(() => {
    const now = new Date()
    now.setDate(now.getDate() + 15)
    return now.toISOString().split("T")[0]
  })

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
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
      .from("tenant_accounts")
      .select(`
        id,
        full_name,
        tenant_bindings(
          units(unit_number, monthly_rent)
        )
      `)
      .eq("workspace_id", workspaceId)
      .eq("status", "active")

    setTenants(data || [])
  }

  const toggleTenant = (tenantId: string) => {
    setSelectedTenants((prev) => (prev.includes(tenantId) ? prev.filter((id) => id !== tenantId) : [...prev, tenantId]))
  }

  const selectAll = () => {
    if (selectedTenants.length === tenants.length) {
      setSelectedTenants([])
    } else {
      setSelectedTenants(tenants.map((t) => t.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTenants.length === 0) {
      toast({
        title: "Error",
        description: "Pumili ng kahit isang tenant",
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

      // Generate bills for each selected tenant
      for (const tenantId of selectedTenants) {
        const tenant = tenants.find((t) => t.id === tenantId)
        if (!tenant) continue

        const monthlyRent = tenant.tenant_bindings?.[0]?.units?.monthly_rent || 0

        // Create bill
        const { data: bill, error: billError } = await supabase
          .from("bills")
          .insert({
            workspace_id: workspaceId,
            tenant_id: tenantId,
            billing_period: billingPeriod,
            due_date: dueDate,
            total_amount: monthlyRent,
            balance: monthlyRent,
            status: "pending",
          })
          .select()
          .single()

        if (billError) throw billError

        // Create line item for rent
        await supabase.from("bill_line_items").insert({
          bill_id: bill.id,
          description: "Monthly Rent",
          amount: monthlyRent,
          item_type: "rent",
        })
      }

      toast({
        title: "Bills generated",
        description: `Matagumpay na naggenerate ng ${selectedTenants.length} bills`,
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
        title="Generate Bills"
        description="Gumawa ng bills para sa mga tenant"
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Tenants</CardTitle>
                <CardDescription>Pumili ng mga tenant na bibigyan ng bill</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={selectAll}>
                {selectedTenants.length === tenants.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Walang active tenants. Magdagdag muna ng tenant.
              </p>
            ) : (
              <div className="space-y-3">
                {tenants.map((tenant) => {
                  const unit = tenant.tenant_bindings?.[0]?.units
                  return (
                    <div key={tenant.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={tenant.id}
                          checked={selectedTenants.includes(tenant.id)}
                          onCheckedChange={() => toggleTenant(tenant.id)}
                        />
                        <label htmlFor={tenant.id} className="cursor-pointer">
                          <p className="font-medium">{tenant.full_name}</p>
                          {unit && <p className="text-sm text-muted-foreground">Unit {unit.unit_number}</p>}
                        </label>
                      </div>
                      <p className="font-medium">{unit ? formatCurrency(unit.monthly_rent) : "N/A"}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading || selectedTenants.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Receipt className="mr-2 h-4 w-4" />
            Generate {selectedTenants.length} Bill{selectedTenants.length !== 1 ? "s" : ""}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/landlord/billing">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
