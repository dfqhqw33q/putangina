import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import Link from "next/link"

export default async function SuspendedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gray-50 p-4 md:p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Account Suspended</CardTitle>
            <p className="text-sm text-muted-foreground">Ang iyong account ay suspendido</p>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-2 text-sm text-muted-foreground">Your workspace has been temporarily suspended.</p>
            {params?.reason && (
              <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <strong>Reason:</strong> {params.reason}
              </p>
            )}
            <p className="mb-6 text-sm text-muted-foreground">
              Please contact your administrator or support to resolve this issue.
              <br />
              Mangyaring makipag-ugnayan sa iyong administrator o suporta upang malutas ang isyung ito.
            </p>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/auth/login">Back to Login / Bumalik sa Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
