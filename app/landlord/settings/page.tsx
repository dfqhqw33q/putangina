"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [workspace, setWorkspace] = useState<any>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createBrowserSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*, workspace_members(workspaces(*))")
      .eq("id", user?.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      setWorkspace(profileData.workspace_members?.[0]?.workspaces)
      setFormData({
        full_name: profileData.full_name || "",
        phone: profileData.phone || "",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createBrowserSupabaseClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq("id", user?.id)

      if (error) throw error

      toast({
        title: "Settings saved",
        description: "Matagumpay na na-update ang iyong profile",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Pamahalaan ang iyong account at workspace settings" />

      <div className="grid gap-6 max-w-2xl">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>I-update ang iyong personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email || ""} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="09XX XXX XXXX"
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Workspace Info */}
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Ang iyong workspace information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Workspace Name</Label>
              <p className="font-medium">{workspace?.name || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Plan</Label>
              <p className="font-medium capitalize">{workspace?.plan_type || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Workspace Type</Label>
              <p className="font-medium capitalize">{workspace?.workspace_type || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <p className={`font-medium ${workspace?.is_active ? "text-green-600" : "text-red-600"}`}>
                {workspace?.is_active ? "Active" : "Suspended"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
