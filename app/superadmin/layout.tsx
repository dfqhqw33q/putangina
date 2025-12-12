import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/layouts/app-shell"
import { navGroups } from "./nav-config"

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "superadmin") {
    redirect("/auth/login")
  }

  return (
    <AppShell
      navGroups={navGroups}
      userRole="superadmin"
      user={{
        email: profile.email,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        role: profile.role,
      }}
    >
      {children}
    </AppShell>
  )
}
