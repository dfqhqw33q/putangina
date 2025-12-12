# Supabase CORS Configuration Guide

## The Problem
You're getting `CORS policy: No 'Access-Control-Allow-Origin'` errors because your production domain is not whitelisted in Supabase.

## Solution Steps

### 1. Configure Supabase Authentication URLs

Go to: **Supabase Dashboard → Your Project → Authentication → URL Configuration**

#### A. Site URL
Set the **Site URL** to your production domain:
\`\`\`
https://v0-rental-management-ecosystem-black.vercel.app
\`\`\`

#### B. Redirect URLs
Add these URLs to the **Redirect URLs** allow list:

\`\`\`
https://v0-rental-management-ecosystem-black.vercel.app/**
http://localhost:3000/**
https://*.vercel.app/**
\`\`\`

**Why wildcards?**
- `https://*.vercel.app/**` covers all Vercel preview deployments
- `http://localhost:3000/**` allows local development
- `https://v0-rental-management-ecosystem-black.vercel.app/**` allows production

### 2. Verify Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Ensure these variables are set for **Production**, **Preview**, and **Development**:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=https://uchbjfxwnyrpqrccxbiv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
\`\`\`

**Important**: After updating environment variables, you MUST redeploy your application.

### 3. Redeploy Your Application

After making the above changes:
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click the three dots on the latest deployment
3. Select **Redeploy** (do not use cache)

### 4. Test the Login

After redeployment:
1. Clear your browser cache and cookies for the site
2. Visit: `https://v0-rental-management-ecosystem-black.vercel.app/auth/login`
3. Try logging in with your Super Admin credentials

## Troubleshooting

### Still getting CORS errors?

1. **Check browser console** for the exact URL being called
2. **Verify Supabase URL** matches your environment variable
3. **Clear browser cache** completely
4. **Check Supabase logs**: Dashboard → Logs → Auth

### Environment variables not loading?

1. Make sure variable names start with `NEXT_PUBLIC_` for client-side access
2. Redeploy after adding variables (environment changes don't apply to existing deployments)
3. Check Vercel deployment logs for any environment variable warnings

### Login works locally but not in production?

This confirms it's a CORS/URL configuration issue. Double-check:
- Site URL in Supabase exactly matches your production domain
- Redirect URLs include your domain with wildcard (`/**`)
- Environment variables are set for "Production" environment in Vercel

## Additional Security (Optional)

For better security in production, you can:

1. **Remove wildcard after testing**: Replace `https://*.vercel.app/**` with specific preview URLs you need
2. **Enable email confirmations**: Supabase Dashboard → Authentication → Settings → Enable email confirmation
3. **Add RLS policies**: Already implemented in your `002-rls-policies.sql` script

## Need Help?

If you're still experiencing issues:
1. Check Supabase auth logs for error details
2. Verify the exact URL your app is calling (browser network tab)
3. Ensure SQL scripts have been run in correct order
4. Confirm Super Admin account exists in Supabase Auth
