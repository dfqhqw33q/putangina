import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl =
    typeof window !== "undefined"
      ? (window as any).__NEXT_DATA__?.props?.pageProps?.env?.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey =
    typeof window !== "undefined"
      ? (window as any).__NEXT_DATA__?.props?.pageProps?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Supabase Client Init:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl?.substring(0, 30),
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "rental-mgmt-auth",
    },
    global: {
      headers: {
        "X-Client-Info": "rental-management-system",
      },
    },
  })
}

export { createClient as createBrowserSupabaseClient }
