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

export default function NewDormTenantPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [beds, setBeds] = useState<any[]>([])
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    emergency_contact: "",
    bed_id: "",
    school: "",
    course: "",
  })

  useEffect(() => {
    loadBeds()
  }, [])

  const loadBeds = async () => {
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
      .from("beds")
      .select("*, rooms(room_number, properties(name))")
      .eq("workspace_id", workspaceId)
      .eq("status", "vacant")

    setBeds(data || [])
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

      // Create tenant account record
      const { data: tenantAccount, error: tenantError } = await supabase
        .from("tenant_accounts")
        .insert({
          workspace_id: workspaceId,
          full_name: formData.full_name,
          email: tenantEmail,
          phone: formData.phone || null,
          emergency_contact: formData.emergency_contact || null,
          metadata: {
            school: formData.school,
            course: formData.course,
          },
          status: "active",
        })
        .select()
        .single()

      if (tenantError) throw tenantError

      // Create tenant binding to bed
      if (formData.bed_id) {
        const { error: bindingError } = await supabase.from("tenant_bindings").insert({
          tenant_id: tenantAccount.id,
          workspace_id: workspaceId,
          bed_id: formData.bed_id,
          binding_type: "bed",
          start_date: new Date().toISOString().split("T")[0],
          status: "active",
        })

        if (bindingError) throw bindingError

        // Update bed status
        await supabase.from("beds").update({ status: "occupied" }).eq("id", formData.bed_id)
      }

      setGeneratedCredentials({
        email: tenantEmail,
        password: tempPassword,
      })

      toast({
        title: "Tenant created",
        description: "Matagumpay na naidagdag ang boarder. I-copy ang credentials.",
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
        <PageHeader title="Boarder Created" description="I-share ang credentials sa boarder" />

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
              Ibigay ang credentials na ito sa boarder para makapag-login sila
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
        title="Add Boarder (Dorm)"
        description="Magdagdag ng bagong boarder at i-assign sa bed"
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
          <CardTitle>Boarder Information</CardTitle>
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
                  placeholder="boarder@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
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
                placeholder="Name and phone number ng magulang/guardian"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school">School/University</Label>
                <Input
                  id="school"
                  placeholder="e.g., UP, UST, Ateneo"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Course/Program</Label>
                <Input
                  id="course"
                  placeholder="e.g., BS Computer Science"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bed_id">Assign to Bed *</Label>
              <Select
                value={formData.bed_id}
                onValueChange={(value) => setFormData({ ...formData, bed_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vacant bed" />
                </SelectTrigger>
                <SelectContent>
                  {beds.map((bed) => (
                    <SelectItem key={bed.id} value={bed.id}>
                      Bed {bed.bed_number} - Room {bed.rooms?.room_number} ({bed.rooms?.properties?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Boarder
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
