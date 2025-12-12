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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Upload, CheckCircle } from "lucide-react"
import Link from "next/link"
import { PAYMENT_METHODS } from "@/lib/constants/payments"
import { formatCurrency } from "@/lib/utils/format"

export default function UploadPaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [bills, setBills] = useState<any[]>([])
  const [tenantAccount, setTenantAccount] = useState<any>(null)
  const [formData, setFormData] = useState({
    bill_id: "",
    amount: "",
    payment_method: "",
    reference_number: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createBrowserSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: tenant } = await supabase
      .from("tenant_accounts")
      .select("id, workspace_id")
      .eq("user_id", user?.id)
      .single()

    if (tenant) {
      setTenantAccount(tenant)

      const { data: billsData } = await supabase
        .from("bills")
        .select("*")
        .eq("tenant_id", tenant.id)
        .gt("balance", 0)
        .order("created_at", { ascending: false })

      setBills(billsData || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()

      const { error } = await supabase.from("payments").insert({
        workspace_id: tenantAccount.workspace_id,
        tenant_id: tenantAccount.id,
        bill_id: formData.bill_id || null,
        amount: Number.parseFloat(formData.amount),
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || null,
        payment_date: formData.payment_date,
        notes: formData.notes || null,
        status: "pending", // Tenant uploads are pending verification
      })

      if (error) throw error

      setSubmitted(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit payment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payment Submitted" description="Hinihintay ang verification" />

        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Salamat!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Nai-submit na ang iyong payment proof. Hinihintay ang pag-verify ng landlord.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href="/tenant/payments">View My Payments</Link>
              </Button>
              <Button variant="outline" asChild className="bg-transparent">
                <Link href="/tenant">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Payment"
        description="I-submit ang iyong payment proof"
        actions={
          <Button variant="ghost" asChild>
            <Link href="/tenant/payments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Punan ang details ng iyong payment</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {bills.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="bill_id">Apply to Bill</Label>
                <Select
                  value={formData.bill_id}
                  onValueChange={(value) => {
                    const bill = bills.find((b) => b.id === value)
                    setFormData({
                      ...formData,
                      bill_id: value,
                      amount: bill ? bill.balance.toString() : formData.amount,
                    })
                  }}
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
                  <SelectValue placeholder="Piliin ang payment method" />
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
              <Label htmlFor="reference_number">Reference/Transaction Number</Label>
              <Input
                id="reference_number"
                placeholder="e.g., GCash Ref #, Bank Transaction ID"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional information about your payment"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-2">Mga Tanggap na Payment Methods:</p>
              <p className="text-muted-foreground">
                GCash, Maya, GoTyme, Maribank, PayPal, Bank Deposit (BDO, BPI, Metrobank, UnionBank, LandBank),
                Remittance Centers (Palawan, Cebuana, MLhuillier), Cash
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Upload className="mr-2 h-4 w-4" />
                Submit Payment
              </Button>
              <Button type="button" variant="outline" asChild className="bg-transparent">
                <Link href="/tenant/payments">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
