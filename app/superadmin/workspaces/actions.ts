"use server"

import { createClient } from "@/lib/supabase/server"

interface CreateLandlordInput {
  email: string
  password: string
  fullName: string
  phone: string
  workspaceName: string
  workspaceSlug: string
  workspaceType: "homes_apartments" | "dormitory"
  planType: "starter" | "professional" | "empire"
  unitCap: number
  address: string
  contactEmail: string
  contactPhone: string
}

export async function createLandlordWithWorkspace(input: CreateLandlordInput) {
  const supabase = await createClient()

  try {
    // 1. Create auth user using admin API (server-side only)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        role: "landlord",
      },
    })

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error("Failed to create user account")
    }

    const userId = authData.user.id

    // 2. Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      email: input.email,
      full_name: input.fullName,
      phone: input.phone,
      role: "landlord",
      is_active: true,
    })

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    // 3. Create workspace
    const { error: workspaceError } = await supabase.from("workspaces").insert({
      owner_id: userId,
      name: input.workspaceName,
      slug: input.workspaceSlug,
      workspace_type: input.workspaceType,
      plan_type: input.planType,
      unit_cap: input.unitCap,
      address: input.address,
      contact_email: input.contactEmail || input.email,
      contact_phone: input.contactPhone || input.phone,
    })

    if (workspaceError) {
      throw new Error(`Failed to create workspace: ${workspaceError.message}`)
    }

    return {
      success: true,
      userId,
      message: "Landlord and workspace created successfully",
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred"
    return {
      success: false,
      message,
    }
  }
}
