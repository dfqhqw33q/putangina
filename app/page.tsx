import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile to determine redirect
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile) {
    switch (profile.role) {
      case "superadmin":
        redirect("/superadmin")
      case "landlord":
        redirect("/landlord")
      case "tenant":
        redirect("/tenant")
    }
  }

  redirect("/auth/login")
}
