"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-provider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Building2, ChevronLeft, ChevronRight, X } from "lucide-react"

export interface NavItem {
  title: string
  titleFilipino?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  badgeColor?: "default" | "success" | "warning" | "danger"
}

export interface NavGroup {
  title: string
  titleFilipino?: string
  items: NavItem[]
}

interface AppSidebarProps {
  navGroups: NavGroup[]
  userRole: "superadmin" | "landlord" | "tenant"
  workspaceName?: string
}

export function AppSidebar({ navGroups, userRole, workspaceName }: AppSidebarProps) {
  const pathname = usePathname()
  const { isOpen, isCollapsed, isMobile, toggle, close } = useSidebar()

  const roleLabels = {
    superadmin: "Super Admin",
    landlord: "Landlord / May-ari",
    tenant: "Tenant / Umuupa",
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={cn("flex h-16 items-center border-b px-4", isCollapsed && !isMobile && "justify-center px-2")}>
        <Link href={`/${userRole}`} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Rental Management</span>
              <span className="text-xs text-muted-foreground">{workspaceName || roleLabels[userRole]}</span>
            </div>
          )}
        </Link>
        {isMobile && (
          <Button variant="ghost" size="icon" className="ml-auto" onClick={close}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <TooltipProvider delayDuration={0}>
          <nav className="flex flex-col gap-1 px-2">
            {navGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                {(!isCollapsed || isMobile) && group.title && (
                  <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {group.title}
                    {group.titleFilipino && (
                      <span className="ml-1 text-muted-foreground/60">/ {group.titleFilipino}</span>
                    )}
                  </h3>
                )}
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  const Icon = item.icon

                  const linkContent = (
                    <Link
                      href={item.href}
                      onClick={isMobile ? close : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive && "bg-accent text-accent-foreground",
                        isCollapsed && !isMobile && "justify-center px-2",
                      )}
                    >
                      <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                      {(!isCollapsed || isMobile) && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                "ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium",
                                item.badgeColor === "success" && "bg-green-100 text-green-700",
                                item.badgeColor === "warning" && "bg-yellow-100 text-yellow-700",
                                item.badgeColor === "danger" && "bg-red-100 text-red-700",
                                !item.badgeColor && "bg-muted text-muted-foreground",
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )

                  if (isCollapsed && !isMobile) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="flex flex-col gap-0.5">
                          <span>{item.title}</span>
                          {item.titleFilipino && (
                            <span className="text-xs text-muted-foreground">{item.titleFilipino}</span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return <div key={item.href}>{linkContent}</div>
                })}
              </div>
            ))}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      {/* Collapse Toggle (Desktop/Tablet only) */}
      {!isMobile && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={toggle}
            title={isCollapsed ? "Expand sidebar / Palawakin" : "Collapse sidebar / Paliitin"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!isCollapsed && <span className="ml-2">Collapse / Paliitin</span>}
          </Button>
        </div>
      )}
    </div>
  )

  // Mobile: Sheet/Drawer
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => (open ? undefined : close())}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop/Tablet: Fixed sidebar
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <SidebarContent />
    </aside>
  )
}
