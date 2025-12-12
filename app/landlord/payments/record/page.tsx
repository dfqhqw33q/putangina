"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { PAYMENT_METHODS } from "@/lib/constants/payments"
import { formatCurrency } from "@/lib/utils/format"

export default function RecordPaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [tenants, setTenants] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])
  const [formData, setFormData] = useState({
    tenant_id: "",
    bill_id: "",
    amount: "",
    payment_method: "",
    reference_number: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    loadTenants()
  }, [])

  useEffect(() => {
    if (formData.tenant_id) {
      loadBills(formData.tenant_id)
    }
  }, [formData.tenant_id])

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
      .select("id, full_name")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")

    setTenants(data || [])
  }

  const loadBills = async (tenantId: string) => {
    const supabase = createBrowserSupabaseClient()

    const { data } = await supabase
      .from("bills")
      .select("*")
      .eq("tenant_id", tenantId)
      .gt("balance", 0)
      .order("created_at", { ascending: false })

    setBills(data || [])
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

      // Record payment
      const { error: paymentError } = await supabase.from("payments").insert({
        workspace_id: workspaceId,
        tenant_id: formData.tenant_id,
        bill_id: formData.bill_id || null,
        amount: Number.parseFloat(formData.amount),
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || null,
        payment_date: formData.payment_date,
        notes: formData.notes || null,
        status: "verified", // Landlord-recorded payments are auto-verified
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      })

      if (paymentError) throw paymentError

      // Update bill balance if bill selected
      if (formData.bill_id) {
        const bill = bills.find((b) => b.id === formData.bill_id)
        if (bill) {
          const newBalance = Math.max(0, bill.balance - Number.parseFloat(formData.amount))
          const newStatus = newBalance === 0 ? "paid" : "partial"

          await supabase
            .from("bills")
            .update({
              balance: newBalance,
              status: newStatus,
              amount_paid: bill.amount_paid + Number.parseFloat(formData.amount),
            })
            .eq("id", formData.bill_id)
        }
      }

      toast({
        title: "Payment recorded",
        description: "Matagumpay na nai-record ang bayad",
      })

      router.push("/landlord/payments")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record Payment"
        description="I-record ang bayad ng tenant"
        actions={
          <Button variant="ghost" asChild>
            <Link href="/landlord/payments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant_id">Tenant *</Label>
              <Select
                value={formData.tenant_id}
                onValueChange={(value) => setFormData({ ...formData, tenant_id: value, bill_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.tenant_id && bills.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="bill_id">Apply to Bill</Label>
                <Select
                  value={formData.bill_id}
                  onValueChange={(value) => setFormData({ ...formData, bill_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bill (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {bills.map((bill) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        {bill.billing_period} - Balance: {formatCurrency(bill.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PHP) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                    <SelectItem key={key} value={key}>
                      {method.label} ({method.labelFil})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                placeholder="Transaction/Reference number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/landlord/payments">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
