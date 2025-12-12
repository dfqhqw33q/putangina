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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function NewMaintenanceRequestPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [tenantData, setTenantData] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "normal",
  })

  useEffect(() => {
    loadTenantData()
  }, [])

  const loadTenantData = async () => {
    const supabase = createBrowserSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: tenant } = await supabase
      .from("tenant_accounts")
      .select("*, tenant_bindings(unit_id, workspace_id)")
      .eq("user_id", user?.id)
      .single()

    setTenantData(tenant)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const binding = tenantData?.tenant_bindings?.[0]

      const { error } = await supabase.from("maintenance_requests").insert({
        workspace_id: binding?.workspace_id,
        tenant_id: tenantData.id,
        unit_id: binding?.unit_id,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: "pending",
      })

      if (error) throw error

      setSubmitted(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Request Submitted" description="Hinihintay ang aksyon ng landlord" />

        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Request Submitted!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Nai-submit na ang iyong maintenance request. Aabisuhan ka kapag may update.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/tenant/maintenance">View My Requests</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Maintenance Request"
        description="I-report ang problema sa iyong unit"
        actions={
          <Button variant="ghost" asChild>
            <Link href="/tenant/maintenance">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Issue Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Leaking faucet, Broken door lock"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Ilarawan ang problema ng detalyado..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Hindi urgent</SelectItem>
                  <SelectItem value="normal">Normal - Regular priority</SelectItem>
                  <SelectItem value="high">High - Kailangan agad</SelectItem>
                  <SelectItem value="urgent">Urgent - Emergency!</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
              <Button type="button" variant="outline" asChild className="bg-transparent">
                <Link href="/tenant/maintenance">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
