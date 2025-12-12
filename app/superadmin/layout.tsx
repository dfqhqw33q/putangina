import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AppShell } from "@/components/layouts/app-shell"
import { LayoutDashboard, Building2, Users, Settings, FileText, Shield, AlertTriangle, Activity } from "lucide-react"

const navGroups = [
  {
    title: "Overview",
    titleFilipino: "Pangkalahatang-tanaw",
    items: [
      {
        title: "Dashboard",
        titleFilipino: "Dashboard",
        href: "/superadmin",
        icon: LayoutDashboard,
      },
      {
        title: "Activity Logs",
        titleFilipino: "Mga Tala ng Aktibidad",
        href: "/superadmin/audit-logs",
        icon: Activity,
      },
    ],
  },
  {
    title: "Management",
    titleFilipino: "Pamamahala",
    items: [
      {
        title: "Workspaces",
        titleFilipino: "Mga Workspace",
        href: "/superadmin/workspaces",
        icon: Building2,
      },
      {
        title: "Landlords",
        titleFilipino: "Mga May-ari",
        href: "/superadmin/landlords",
        icon: Users,
      },
      {
        title: "Kill Switch",
        titleFilipino: "Kill Switch",
        href: "/superadmin/kill-switch",
        icon: AlertTriangle,
      },
    ],
  },
  {
    title: "System",
    titleFilipino: "Sistema",
    items: [
      {
        title: "Plan Settings",
        titleFilipino: "Mga Setting ng Plano",
        href: "/superadmin/plans",
        icon: Shield,
      },
      {
        title: "Reports",
        titleFilipino: "Mga Ulat",
        href: "/superadmin/reports",
        icon: FileText,
      },
      {
        title: "Settings",
        titleFilipino: "Mga Setting",
        href: "/superadmin/settings",
        icon: Settings,
      },
    ],
  },
]

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
