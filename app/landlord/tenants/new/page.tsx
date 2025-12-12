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
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Copy, Check } from "lucide-react"
import Link from "next/link"

export default function NewTenantPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [units, setUnits] = useState<any[]>([])
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    emergency_contact: "",
    unit_id: "",
  })

  useEffect(() => {
    loadUnits()
  }, [])

  const loadUnits = async () => {
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
      .from("units")
      .select("*, properties(name)")
      .eq("workspace_id", workspaceId)
      .eq("status", "vacant")

    setUnits(data || [])
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    let password = ""
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
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

      // Generate credentials
      const tempPassword = generatePassword()
      const tenantEmail = formData.email || `tenant-${Date.now()}@rental.local`

      // Create tenant account record first
      const { data: tenantAccount, error: tenantError } = await supabase
        .from("tenant_accounts")
        .insert({
          workspace_id: workspaceId,
          full_name: formData.full_name,
          email: tenantEmail,
          phone: formData.phone || null,
          emergency_contact: formData.emergency_contact || null,
          status: "active",
        })
        .select()
        .single()

      if (tenantError) throw tenantError

      // Create tenant binding if unit selected
      if (formData.unit_id) {
        const { error: bindingError } = await supabase.from("tenant_bindings").insert({
          tenant_id: tenantAccount.id,
          workspace_id: workspaceId,
          unit_id: formData.unit_id,
          binding_type: "unit",
          start_date: new Date().toISOString().split("T")[0],
          status: "active",
        })

        if (bindingError) throw bindingError

        // Update unit status
        await supabase.from("units").update({ status: "occupied" }).eq("id", formData.unit_id)
      }

      setGeneratedCredentials({
        email: tenantEmail,
        password: tempPassword,
      })

      toast({
        title: "Tenant created",
        description: "Matagumpay na naidagdag ang tenant. I-copy ang credentials.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create tenant",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyCredentials = () => {
    if (generatedCredentials) {
      navigator.clipboard.writeText(`Email: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (generatedCredentials) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tenant Created" description="I-share ang credentials sa tenant" />

        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Login Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-mono">{generatedCredentials.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Password</p>
                <p className="font-mono">{generatedCredentials.password}</p>
              </div>
            </div>

            <Button onClick={copyCredentials} className="w-full">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Credentials
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Ibigay ang credentials na ito sa tenant para makapag-login sila sa /auth/login
            </p>

            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/landlord/tenants">Back to Tenants</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Tenant"
        description="Magdagdag ng bagong tenant at i-assign sa unit"
        actions={
          <Button variant="ghost" asChild>
            <Link href="/landlord/tenants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="Juan Dela Cruz"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tenant@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Kung walang email, auto-generate ang system</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="09XX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact">Emergency Contact</Label>
              <Input
                id="emergency_contact"
                placeholder="Name and phone number"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_id">Assign to Unit</Label>
              <Select value={formData.unit_id} onValueChange={(value) => setFormData({ ...formData, unit_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vacant unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      Unit {unit.unit_number} - {unit.properties?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Maaaring i-assign ang tenant sa unit mamaya</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Tenant
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/landlord/tenants">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
