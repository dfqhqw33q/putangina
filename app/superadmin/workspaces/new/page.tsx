"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormSection, FormRow, FormFieldWrapper } from "@/components/ui/responsive-form"
import { Loader2, AlertCircle } from "lucide-react"
import { generateSlug } from "@/lib/utils/format"
import { toast } from "sonner"

export default function NewWorkspacePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Landlord fields
  const [landlordEmail, setLandlordEmail] = useState("")
  const [landlordName, setLandlordName] = useState("")
  const [landlordPhone, setLandlordPhone] = useState("")
  const [landlordPassword, setLandlordPassword] = useState("")

  // Workspace fields
  const [workspaceName, setWorkspaceName] = useState("")
  const [workspaceSlug, setWorkspaceSlug] = useState("")
  const [workspaceType, setWorkspaceType] = useState<"homes_apartments" | "dormitory">("homes_apartments")
  const [planType, setPlanType] = useState<"starter" | "professional" | "empire">("starter")
  const [unitCap, setUnitCap] = useState(10)
  const [address, setAddress] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")

  const handleWorkspaceNameChange = (name: string) => {
    setWorkspaceName(name)
    setWorkspaceSlug(generateSlug(name))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // 1. Create auth user for landlord (admin creates, no email confirmation needed)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: landlordEmail,
        password: landlordPassword,
        email_confirm: true,
        user_metadata: {
          full_name: landlordName,
          role: "landlord",
        },
      })

      if (authError) {
        // Fallback: use regular signup if admin API not available
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: landlordEmail,
          password: landlordPassword,
          options: {
            data: {
              full_name: landlordName,
              role: "landlord",
            },
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          },
        })

        if (signUpError) throw signUpError

        if (!signUpData.user) {
          throw new Error("Failed to create user account")
        }

        // Create profile manually since trigger might not fire without confirmation
        const { error: profileError } = await supabase.from("profiles").insert({
          id: signUpData.user.id,
          email: landlordEmail,
          full_name: landlordName,
          phone: landlordPhone,
          role: "landlord",
          is_active: true,
        })

        if (profileError) throw profileError

        // Create workspace
        const { error: workspaceError } = await supabase.from("workspaces").insert({
          owner_id: signUpData.user.id,
          name: workspaceName,
          slug: workspaceSlug,
          workspace_type: workspaceType,
          plan_type: planType,
          unit_cap: unitCap,
          address,
          contact_email: contactEmail || landlordEmail,
          contact_phone: contactPhone || landlordPhone,
        })

        if (workspaceError) throw workspaceError
      } else {
        if (!authData.user) {
          throw new Error("Failed to create user account")
        }

        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          email: landlordEmail,
          full_name: landlordName,
          phone: landlordPhone,
          role: "landlord",
          is_active: true,
        })

        if (profileError) throw profileError

        // Create workspace
        const { error: workspaceError } = await supabase.from("workspaces").insert({
          owner_id: authData.user.id,
          name: workspaceName,
          slug: workspaceSlug,
          workspace_type: workspaceType,
          plan_type: planType,
          unit_cap: unitCap,
          address,
          contact_email: contactEmail || landlordEmail,
          contact_phone: contactPhone || landlordPhone,
        })

        if (workspaceError) throw workspaceError
      }

      toast.success("Workspace created successfully! / Matagumpay na nalikha ang workspace!")
      router.push("/superadmin/workspaces")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Create Workspace"
        titleFilipino="Lumikha ng Workspace"
        description="Create a new landlord account and workspace"
        descriptionFilipino="Lumikha ng bagong account ng may-ari at workspace"
      />

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Landlord Account */}
          <Card>
            <CardHeader>
              <CardTitle>Landlord Account / Account ng May-ari</CardTitle>
              <CardDescription>Create login credentials for the landlord</CardDescription>
            </CardHeader>
            <CardContent>
              <FormSection>
                <FormRow>
                  <FormFieldWrapper>
                    <Label htmlFor="landlordName">Full Name / Buong Pangalan *</Label>
                    <Input
                      id="landlordName"
                      value={landlordName}
                      onChange={(e) => setLandlordName(e.target.value)}
                      placeholder="Juan dela Cruz"
                      required
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper>
                    <Label htmlFor="landlordEmail">Email *</Label>
                    <Input
                      id="landlordEmail"
                      type="email"
                      value={landlordEmail}
                      onChange={(e) => setLandlordEmail(e.target.value)}
                      placeholder="landlord@example.com"
                      required
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper>
                    <Label htmlFor="landlordPhone">Phone / Telepono</Label>
                    <Input
                      id="landlordPhone"
                      value={landlordPhone}
                      onChange={(e) => setLandlordPhone(e.target.value)}
                      placeholder="+63 917 123 4567"
                    />
                  </FormFieldWrapper>
                </FormRow>
                <FormRow>
                  <FormFieldWrapper>
                    <Label htmlFor="landlordPassword">Password / Hudyat *</Label>
                    <Input
                      id="landlordPassword"
                      type="password"
                      value={landlordPassword}
                      onChange={(e) => setLandlordPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      The landlord will use this password to log in. Share it securely.
                    </p>
                  </FormFieldWrapper>
                </FormRow>
              </FormSection>
            </CardContent>
          </Card>

          {/* Workspace Details */}
          <Card>
            <CardHeader>
              <CardTitle>Workspace Details / Mga Detalye ng Workspace</CardTitle>
              <CardDescription>Configure the workspace settings and limits</CardDescription>
            </CardHeader>
            <CardContent>
              <FormSection>
                <FormRow>
                  <FormFieldWrapper>
                    <Label htmlFor="workspaceName">Workspace Name / Pangalan ng Workspace *</Label>
                    <Input
                      id="workspaceName"
                      value={workspaceName}
                      onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                      placeholder="Sunshine Apartments"
                      required
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper>
                    <Label htmlFor="workspaceSlug">URL Slug *</Label>
                    <Input
                      id="workspaceSlug"
                      value={workspaceSlug}
                      onChange={(e) => setWorkspaceSlug(e.target.value)}
                      placeholder="sunshine-apartments"
                      required
                    />
                  </FormFieldWrapper>
                </FormRow>
                <FormRow>
                  <FormFieldWrapper>
                    <Label htmlFor="workspaceType">Workspace Type / Uri ng Workspace *</Label>
                    <Select
                      value={workspaceType}
                      onValueChange={(v) => setWorkspaceType(v as "homes_apartments" | "dormitory")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homes_apartments">Homes & Apartments / Bahay at Apartment</SelectItem>
                        <SelectItem value="dormitory">Dormitory / Dormitoryo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormFieldWrapper>
                  <FormFieldWrapper>
                    <Label htmlFor="planType">Plan Type / Uri ng Plano *</Label>
                    <Select
                      value={planType}
                      onValueChange={(v) => setPlanType(v as "starter" | "professional" | "empire")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter / Panimula (10 units, 30-day data)</SelectItem>
                        <SelectItem value="professional">Professional / Propesyonal (50 units, permanent)</SelectItem>
                        <SelectItem value="empire">Empire / Imperyo (Unlimited, dorm mode)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormFieldWrapper>
                  <FormFieldWrapper>
                    <Label htmlFor="unitCap">Unit Cap / Limitasyon ng Unit</Label>
                    <Input
                      id="unitCap"
                      type="number"
                      value={unitCap}
                      onChange={(e) => setUnitCap(Number.parseInt(e.target.value) || 10)}
                      min={1}
                      max={9999}
                    />
                  </FormFieldWrapper>
                </FormRow>
              </FormSection>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information / Impormasyon sa Pakikipag-ugnayan</CardTitle>
              <CardDescription>Business contact details for the workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <FormSection>
                <FormRow>
                  <FormFieldWrapper fullWidth>
                    <Label htmlFor="address">Address / Tirahan</Label>
                    <Textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main St., Brgy. Centro, City, Province"
                      rows={2}
                    />
                  </FormFieldWrapper>
                </FormRow>
                <FormRow>
                  <FormFieldWrapper>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contact@property.com"
                    />
                  </FormFieldWrapper>
                  <FormFieldWrapper>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+63 917 123 4567"
                    />
                  </FormFieldWrapper>
                </FormRow>
              </FormSection>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel / Kanselahin
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Workspace / Lumikha ng Workspace"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
