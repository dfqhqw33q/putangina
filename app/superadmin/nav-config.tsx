"use client"

import { LayoutDashboard, Building2, Users, Settings, FileText, Shield, AlertTriangle, Activity } from "lucide-react"

export const navGroups = [
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
