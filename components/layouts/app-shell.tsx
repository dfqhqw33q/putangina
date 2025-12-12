"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { SidebarProvider, useSidebar } from "./sidebar-provider"
import { AppSidebar, type NavGroup } from "./app-sidebar"
import { AppHeader } from "./app-header"

interface AppShellProps {
  children: React.ReactNode
  navGroups: NavGroup[]
  userRole: "superadmin" | "landlord" | "tenant"
  user: {
    email: string
    fullName: string
    avatarUrl?: string | null
    role: string
  }
  workspaceName?: string
  pageTitle?: string
  pageTitleFilipino?: string
}

function AppShellContent({
  children,
  navGroups,
  userRole,
  user,
  workspaceName,
  pageTitle,
  pageTitleFilipino,
}: AppShellProps) {
  const { isCollapsed, isMobile } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar navGroups={navGroups} userRole={userRole} workspaceName={workspaceName} />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          !isMobile && (isCollapsed ? "ml-16" : "ml-64"),
        )}
      >
        <AppHeader user={user} title={pageTitle} titleFilipino={pageTitleFilipino} />

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

export function AppShell(props: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellContent {...props} />
    </SidebarProvider>
  )
}
