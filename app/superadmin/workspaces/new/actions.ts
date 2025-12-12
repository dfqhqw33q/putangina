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

    // 2. Call RPC function to create/update landlord profile
    const { data: profileResult, error: profileError } = await supabase.rpc(
      "create_landlord_profile",
      {
        p_user_id: userId,
        p_email: input.email,
        p_full_name: input.fullName,
        p_phone: input.phone,
      }
    )

    if (profileError) {
      console.error("Profile RPC error:", profileError)
      throw new Error(`Failed to create landlord profile: ${profileError.message}`)
    }

    console.log("Profile created via RPC:", profileResult)

    // 3. Create workspace
    const { data: workspaceResult, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
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
      .select()

    if (workspaceError) {
      console.error("Workspace error:", workspaceError)
      // If workspace already exists with this slug, don't fail - it's okay
      if (!workspaceError.message.includes("duplicate")) {
        throw new Error(`Failed to create workspace: ${workspaceError.message}`)
      }
    }

    console.log("Workspace created:", workspaceResult)

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
