export const dynamic = "force-dynamic"

export default function DiagnosticsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const currentUrl = typeof window !== "undefined" ? window.location.origin : "server"

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h1 className="text-2xl font-bold mb-4">🔍 Supabase Configuration Diagnostics</h1>

          <div className="space-y-4">
            <div>
              <h2 className="font-semibold text-lg mb-2">Environment Variables</h2>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className={supabaseUrl ? "text-green-600" : "text-red-600"}>{supabaseUrl ? "✓" : "✗"}</span>
                  <span>NEXT_PUBLIC_SUPABASE_URL: {supabaseUrl || "MISSING"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={supabaseKey ? "text-green-600" : "text-red-600"}>{supabaseKey ? "✓" : "✗"}</span>
                  <span>NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseKey ? "SET (hidden)" : "MISSING"}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h2 className="font-semibold text-lg mb-2">Current Application URL</h2>
              <p className="font-mono text-sm bg-muted p-2 rounded">{currentUrl}</p>
            </div>

            <div className="border-t pt-4">
              <h2 className="font-semibold text-lg mb-2">Required Supabase Configuration</h2>
              <div className="space-y-3">
                <div>
                  <p className="font-medium mb-1">Go to Supabase Dashboard:</p>
                  <a
                    href={`https://supabase.com/dashboard/project/${supabaseUrl?.split("//")[1]?.split(".")[0]}/auth/url-configuration`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-mono text-sm"
                  >
                    Authentication → URL Configuration
                  </a>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded p-4 space-y-2">
                  <p className="font-semibold text-amber-900">Add these Redirect URLs:</p>
                  <div className="space-y-1 font-mono text-xs text-amber-900">
                    <div className="bg-white p-2 rounded">{currentUrl}/**</div>
                    <div className="bg-white p-2 rounded">https://*.vercel.app/**</div>
                    <div className="bg-white p-2 rounded">http://localhost:3000/**</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <p className="font-semibold text-blue-900 mb-2">Set Site URL to:</p>
                  <div className="bg-white p-2 rounded font-mono text-sm text-blue-900">{currentUrl}</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h2 className="font-semibold text-lg mb-2 text-red-600">⚠️ Current Issue</h2>
              <p className="text-sm">
                Your application URL (<code className="bg-muted px-1 py-0.5 rounded">{currentUrl}</code>) is not
                whitelisted in Supabase's allowed redirect URLs. This causes the CORS error you're seeing.
              </p>
            </div>

            <div className="border-t pt-4 bg-green-50 rounded p-4">
              <h2 className="font-semibold text-lg mb-2 text-green-800">After Configuration</h2>
              <ol className="list-decimal list-inside space-y-1 text-sm text-green-900">
                <li>Save the changes in Supabase Dashboard</li>
                <li>Wait 30 seconds for changes to propagate</li>
                <li>
                  Return to{" "}
                  <a href="/auth/login" className="text-blue-600 hover:underline font-semibold">
                    Login Page
                  </a>
                </li>
                <li>Try logging in again</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
