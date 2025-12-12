# Rental Management Ecosystem - Deployment Checklist

## Pre-Deployment Setup

### 1. Supabase Database Setup

Run SQL scripts in this exact order:

\`\`\`bash
# In Supabase SQL Editor, run these one by one:

1. scripts/000-setup-instructions.sql  # Follow instructions to create Super Admin
2. scripts/001-create-tables.sql       # Create all database tables
3. scripts/002-rls-policies.sql        # Set up Row Level Security
4. scripts/003-rpc-functions.sql       # Create database functions
5. scripts/005-default-sms-templates.sql  # Load SMS templates
6. scripts/006-create-profile-trigger.sql # Auto-create profiles
\`\`\`

**Note**: Skip script 004 if you already created Super Admin via script 000.

### 2. Supabase Authentication Configuration

**Go to**: Supabase Dashboard → Authentication → URL Configuration

#### Site URL:
\`\`\`
https://v0-rental-management-ecosystem-black.vercel.app
\`\`\`

#### Redirect URLs (add all):
\`\`\`
https://v0-rental-management-ecosystem-black.vercel.app/**
http://localhost:3000/**
https://*.vercel.app/**
\`\`\`

### 3. Vercel Environment Variables

**Go to**: Vercel Dashboard → Settings → Environment Variables

Add these for **ALL ENVIRONMENTS** (Production, Preview, Development):

\`\`\`bash
# Supabase (already set from integration)
NEXT_PUBLIC_SUPABASE_URL=https://uchbjfxwnyrpqrccxbiv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# These should already be set:
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
# ... etc
\`\`\`

### 4. Deploy to Vercel

\`\`\`bash
# Push to GitHub (if connected to Vercel)
git add .
git commit -m "Initial deployment"
git push origin main

# Or deploy via Vercel CLI
vercel --prod
\`\`\`

## Post-Deployment Verification

### 1. Check Super Admin Login

1. Visit: `https://your-domain.vercel.app/auth/login`
2. Login with Super Admin credentials
3. Verify redirect to `/superadmin` dashboard

### 2. Create Test Workspace

1. Go to: Super Admin → Workspaces → Create New
2. Fill in landlord details
3. Verify workspace appears in list

### 3. Test Landlord Access

1. Logout from Super Admin
2. Login with landlord credentials (check email for system-generated password)
3. Verify redirect to `/landlord` dashboard
4. Add a test property

### 4. Test Tenant Portal (Professional Plan Only)

1. Create a Professional plan workspace
2. Add a tenant
3. Logout and login as tenant
4. Verify access to `/tenant` dashboard

## Common Issues and Fixes

### CORS Errors
- **Issue**: "Access-Control-Allow-Origin" error
- **Fix**: Update Supabase redirect URLs (see step 2 above)

### Login Failed
- **Issue**: "Failed to fetch" on login
- **Fix**: 
  1. Clear browser cache
  2. Verify Supabase URL configuration
  3. Redeploy Vercel app

### Database Errors
- **Issue**: "relation does not exist"
- **Fix**: Ensure all SQL scripts ran successfully in order

### Environment Variables Not Loading
- **Issue**: "Missing Supabase environment variables"
- **Fix**: 
  1. Verify variables in Vercel settings
  2. Redeploy (env vars need redeployment)

### 500 Errors on Dashboard
- **Issue**: Server errors after login
- **Fix**:
  1. Check Vercel function logs
  2. Verify RLS policies ran correctly
  3. Ensure profile exists for user

## Performance Optimization

### Enable Vercel Analytics (Optional)
\`\`\`bash
npm install @vercel/analytics
\`\`\`

### Enable Supabase Connection Pooling
Already configured via `POSTGRES_PRISMA_URL`

## Monitoring

### Supabase Logs
- **Auth Logs**: Dashboard → Logs → Auth
- **Database Logs**: Dashboard → Logs → Database
- **API Logs**: Dashboard → Logs → API

### Vercel Logs
- **Function Logs**: Vercel Dashboard → Deployments → [Latest] → Function Logs
- **Edge Logs**: Vercel Dashboard → Deployments → [Latest] → Edge Logs

## Backup Strategy

### Database Backups
- Supabase automatically backs up daily
- Manual backup: Dashboard → Database → Backups

### Code Backups
- GitHub repository (recommended)
- Vercel deployment history

## Security Checklist

- [x] RLS policies enabled on all tables
- [x] Service role key stored securely in environment variables
- [x] No public sign-up routes (only `/auth/login`)
- [x] Authentication required on all dashboard routes
- [x] Workspace isolation enforced via RLS
- [x] SQL injection protection via parameterized queries
- [x] CORS properly configured

## Support

If you encounter issues not covered here:
1. Check Supabase auth logs
2. Check Vercel function logs
3. Verify all SQL scripts ran successfully
4. Clear browser cache and try incognito mode
