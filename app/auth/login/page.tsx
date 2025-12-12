import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

async function login(formData: FormData) {
  "use server"

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    redirect("/auth/login?error=missing_credentials")
  }

  const supabase = await createClient()

  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !authData.user) {
    redirect("/auth/login?error=invalid_credentials")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", authData.user.id)
    .single()

  if (profileError || !profile) {
    redirect("/auth/login?error=profile_not_found")
  }

  if (!profile.is_active) {
    redirect("/auth/login?error=account_inactive")
  }

  switch (profile.role) {
    case "superadmin":
      redirect("/superadmin")
    case "landlord":
      redirect("/landlord")
    case "tenant":
      redirect("/tenant")
    default:
      redirect("/auth/login?error=invalid_role")
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  const errorMessages: Record<string, string> = {
    missing_credentials: "Please enter your email and password",
    invalid_credentials: "Invalid email or password",
    profile_not_found: "Account profile not found",
    account_inactive: "Your account has been deactivated. Contact your administrator.",
    invalid_role: "Invalid account configuration. Please contact support.",
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gray-50 p-4 md:p-6 lg:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold">Rental Management</h1>
            <p className="text-sm text-muted-foreground">Sistema ng Pamamahala ng Upa</p>
          </div>

          {error && errorMessages[error] && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessages[error]}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Login / Mag-login</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={login}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password / Hudyat</Label>
                    <Input id="password" name="password" type="password" required className="h-11" />
                  </div>

                  <Button type="submit" className="h-11 w-full">
                    Login / Mag-login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account? Contact your landlord or administrator.
            <br />
            Walang account? Makipag-ugnayan sa iyong may-ari o administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
