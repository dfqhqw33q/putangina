import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/error"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // If user is not logged in and trying to access protected route
  if (!user && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If user is logged in, get their profile and role
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", user.id).single()

    // If no profile exists or account is inactive
    if (!profile || !profile.is_active) {
      // Sign out and redirect to login
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("error", "account_inactive")
      return NextResponse.redirect(url)
    }

    const role = profile.role

    // Role-based route protection
    const superadminRoutes = ["/superadmin"]
    const landlordRoutes = ["/landlord"]
    const tenantRoutes = ["/tenant"]

    const isSuperadminRoute = superadminRoutes.some((route) => pathname.startsWith(route))
    const isLandlordRoute = landlordRoutes.some((route) => pathname.startsWith(route))
    const isTenantRoute = tenantRoutes.some((route) => pathname.startsWith(route))

    // Redirect to appropriate dashboard based on role
    if (pathname === "/" || pathname === "/auth/login") {
      const url = request.nextUrl.clone()
      switch (role) {
        case "superadmin":
          url.pathname = "/superadmin"
          break
        case "landlord":
          url.pathname = "/landlord"
          break
        case "tenant":
          url.pathname = "/tenant"
          break
        default:
          url.pathname = "/auth/login"
          url.searchParams.set("error", "invalid_role")
      }
      return NextResponse.redirect(url)
    }

    // Prevent access to wrong role routes
    if (isSuperadminRoute && role !== "superadmin") {
      const url = request.nextUrl.clone()
      url.pathname = `/${role}`
      return NextResponse.redirect(url)
    }

    if (isLandlordRoute && role !== "landlord" && role !== "superadmin") {
      const url = request.nextUrl.clone()
      url.pathname = `/${role}`
      return NextResponse.redirect(url)
    }

    if (isTenantRoute && role !== "tenant" && role !== "superadmin") {
      const url = request.nextUrl.clone()
      url.pathname = `/${role}`
      return NextResponse.redirect(url)
    }

    // Check workspace kill switch for landlords and tenants
    if (role === "landlord" || role === "tenant") {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("kill_switch_enabled, kill_switch_reason")
        .or(
          role === "landlord"
            ? `owner_id.eq.${user.id}`
            : `id.in.(select workspace_id from tenant_accounts where user_id = '${user.id}')`,
        )
        .single()

      if (workspace?.kill_switch_enabled) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/suspended"
        url.searchParams.set("reason", workspace.kill_switch_reason || "")
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
