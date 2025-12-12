"use server"

import { createAdminClient } from "@/lib/supabase/server"

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
  const supabase = await createAdminClient()

  try {
    let userId: string | null = null

    // 1. Try to create auth user, or get existing user if already registered
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
      // If user already exists, try to retrieve it
      if (authError.message.includes("already been registered")) {
        const { data: users, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) {
          throw new Error(`Failed to retrieve existing user: ${listError.message}`)
        }
        
        const existingUser = users?.users?.find((u) => u.email === input.email)
        if (!existingUser) {
          throw new Error(`User with email ${input.email} not found`)
        }
        userId = existingUser.id
      } else {
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }
    } else {
      if (!authData.user) {
        throw new Error("Failed to create user account")
      }
      userId = authData.user.id
    }

    if (!userId) {
      throw new Error("Could not determine user ID")
    }

    // 2. Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (!existingProfile) {
      // Create profile only if it doesn't exist
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
    }

    // 3. Check if workspace already exists for this owner
    const { data: existingWorkspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", userId)
      .eq("slug", input.workspaceSlug)
      .single()

    if (!existingWorkspace) {
      // Create workspace only if it doesn't exist
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
