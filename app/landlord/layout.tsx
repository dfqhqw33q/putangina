import type React from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layouts/app-shell"
import { landlordNavGroups } from "./nav-config"

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, workspace_members(workspace_id, workspaces(*))")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "landlord") {
    redirect("/auth/login")
  }

  const workspace = profile.workspace_members?.[0]?.workspaces

  if (!workspace || !workspace.is_active) {
    redirect("/auth/login?error=workspace_suspended")
  }

  return (
    <AppShell
      navGroups={landlordNavGroups}
      userRole="landlord"
      user={{
        email: profile.email,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        role: profile.role,
      }}
      workspaceName={workspace.name}
    >
      {children}
    </AppShell>
  )
}
