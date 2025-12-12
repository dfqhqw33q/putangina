"use client"

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

export const landlordNavGroups = [
  {
    title: "Main",
    titleFilipino: "Pangunahin",
    items: [
      { title: "Dashboard", titleFilipino: "Dashboard", href: "/landlord", icon: LayoutDashboard },
    ],
  },
  {
    title: "Management",
    titleFilipino: "Pamamahala",
    items: [
      { title: "Properties", titleFilipino: "Ari-arian", href: "/landlord/properties", icon: Building2 },
      { title: "Tenants", titleFilipino: "Mga Nangungupahan", href: "/landlord/tenants", icon: Users },
      { title: "Billing", titleFilipino: "Singil", href: "/landlord/billing", icon: Receipt },
      { title: "Payments", titleFilipino: "Mga Bayad", href: "/landlord/payments", icon: CreditCard },
      { title: "Contracts", titleFilipino: "Mga Kontrata", href: "/landlord/contracts", icon: FileText },
      { title: "Maintenance", titleFilipino: "Pagpapaayos", href: "/landlord/maintenance", icon: Wrench },
    ],
  },
  {
    title: "Communications",
    titleFilipino: "Komunikasyon",
    items: [
      { title: "Complaints", titleFilipino: "Mga Reklamo", href: "/landlord/complaints", icon: MessageSquareWarning },
      { title: "Announcements", titleFilipino: "Mga Anunsyo", href: "/landlord/announcements", icon: Megaphone },
      { title: "SMS Bridge", titleFilipino: "SMS Bridge", href: "/landlord/sms", icon: MessageCircle },
    ],
  },
  {
    title: "Analytics",
    titleFilipino: "Analytics",
    items: [
      { title: "Reports", titleFilipino: "Mga Ulat", href: "/landlord/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Account",
    titleFilipino: "Account",
    items: [
      { title: "Settings", titleFilipino: "Mga Setting", href: "/landlord/settings", icon: Settings },
    ],
  },
]
