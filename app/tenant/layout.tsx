import type React from "react"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/layouts/app-shell"
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  FileText,
  Wrench,
  MessageSquareWarning,
  Megaphone,
  FolderArchive,
} from "lucide-react"

const tenantNavItems = [
  { href: "/tenant", label: "Dashboard", labelFil: "Dashboard", icon: LayoutDashboard },
  { href: "/tenant/bills", label: "My Bills", labelFil: "Mga Singil Ko", icon: Receipt },
  { href: "/tenant/payments", label: "Payments", labelFil: "Mga Bayad Ko", icon: CreditCard },
  { href: "/tenant/receipts", label: "Receipts", labelFil: "Mga Resibo", icon: FileText },
  { href: "/tenant/contracts", label: "Contract", labelFil: "Kontrata", icon: FileText },
  { href: "/tenant/maintenance", label: "Maintenance", labelFil: "Pagpapaayos", icon: Wrench },
  { href: "/tenant/complaints", label: "Complaints", labelFil: "Mga Reklamo", icon: MessageSquareWarning },
  { href: "/tenant/announcements", label: "Announcements", labelFil: "Mga Anunsyo", icon: Megaphone },
  { href: "/tenant/documents", label: "Documents", labelFil: "Mga Dokumento", icon: FolderArchive },
]

export default async function TenantLayout({
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

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "tenant") {
    redirect("/auth/login")
  }

  // Get tenant account and workspace info
  const { data: tenantAccount } = await supabase
    .from("tenant_accounts")
    .select(
      "*, tenant_bindings(units(unit_number, properties(name)), beds(bed_number, rooms(room_number, properties(name)))), workspaces(name, is_active, plan_type)",
    )
    .eq("user_id", user.id)
    .single()

  if (!tenantAccount?.workspaces?.is_active) {
    redirect("/auth/login?error=workspace_suspended")
  }

  // Check if workspace plan allows tenant portal (Professional or Empire only)
  if (tenantAccount?.workspaces?.plan_type === "starter") {
    redirect("/auth/login?error=plan_restricted")
  }

  const binding = tenantAccount?.tenant_bindings?.[0]
  const unitInfo = binding?.units
    ? `Unit ${binding.units.unit_number} - ${binding.units.properties?.name}`
    : binding?.beds
      ? `Bed ${binding.beds.bed_number}, Room ${binding.beds.rooms?.room_number}`
      : "Not assigned"

  return (
    <AppShell
      navItems={tenantNavItems}
      user={{
        name: tenantAccount?.full_name || profile.full_name || user.email || "Tenant",
        email: tenantAccount?.email || user.email || "",
        avatar: profile.avatar_url,
        role: "tenant",
      }}
      workspaceName={unitInfo}
    >
      {children}
    </AppShell>
  )
}
