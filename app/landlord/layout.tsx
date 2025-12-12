import type React from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layouts/app-shell"
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  CreditCard,
  FileText,
  Wrench,
  MessageSquareWarning,
  Megaphone,
  MessageCircle,
  BarChart3,
  Settings,
} from "lucide-react"

const landlordNavItems = [
  { href: "/landlord", label: "Dashboard", labelFil: "Dashboard", icon: LayoutDashboard },
  { href: "/landlord/properties", label: "Properties", labelFil: "Ari-arian", icon: Building2 },
  { href: "/landlord/tenants", label: "Tenants", labelFil: "Mga Nangungupahan", icon: Users },
  { href: "/landlord/billing", label: "Billing", labelFil: "Singil", icon: Receipt },
  { href: "/landlord/payments", label: "Payments", labelFil: "Mga Bayad", icon: CreditCard },
  { href: "/landlord/contracts", label: "Contracts", labelFil: "Mga Kontrata", icon: FileText },
  { href: "/landlord/maintenance", label: "Maintenance", labelFil: "Pagpapaayos", icon: Wrench },
  { href: "/landlord/complaints", label: "Complaints", labelFil: "Mga Reklamo", icon: MessageSquareWarning },
  { href: "/landlord/announcements", label: "Announcements", labelFil: "Mga Anunsyo", icon: Megaphone },
  { href: "/landlord/sms", label: "SMS Bridge", labelFil: "SMS Bridge", icon: MessageCircle },
  { href: "/landlord/reports", label: "Reports", labelFil: "Mga Ulat", icon: BarChart3 },
  { href: "/landlord/settings", label: "Settings", labelFil: "Mga Setting", icon: Settings },
]

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
      navItems={landlordNavItems}
      user={{
        name: profile.full_name || user.email || "Landlord",
        email: user.email || "",
        avatar: profile.avatar_url,
        role: "landlord",
      }}
      workspaceName={workspace.name}
    >
      {children}
    </AppShell>
  )
}
