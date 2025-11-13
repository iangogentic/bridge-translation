# Clerk Webhook Setup Guide

This guide explains how to configure the Clerk webhook to sync user data to your local database.

## Overview

The Clerk webhook endpoint (`/api/webhooks/clerk`) automatically syncs user data from Clerk to your PostgreSQL database when users:
- **Sign up** → Creates new user with freemium defaults
- **Update profile** → Updates name, email, image
- **Delete account** → Soft deletes user (sets `banned = true`)

## Setup Instructions

### 1. Get Your Webhook URL

**For Production:**
```
https://yourdomain.com/api/webhooks/clerk
```

**For Development (using Cloudflare Tunnel):**
```bash
# Start your Next.js dev server
npm run dev

# In another terminal, start Cloudflare tunnel
pwsh .\scripts\start-cloudflare-proxy.ps1
# Or if you have a direct tunnel to port 3000:
cloudflared tunnel --url http://localhost:3000
```

Copy the HTTPS URL (e.g., `https://random-name.trycloudflare.com`) and append `/api/webhooks/clerk`

Example: `https://random-name.trycloudflare.com/api/webhooks/clerk`

### 2. Configure Webhook in Clerk Dashboard

1. **Go to Clerk Dashboard** → [https://dashboard.clerk.com](https://dashboard.clerk.com)

2. **Navigate to Webhooks:**
   - Click on your application
   - Go to "Webhooks" in the left sidebar
   - Click "Add Endpoint"

3. **Configure Endpoint:**
   - **Endpoint URL:** Paste your webhook URL from step 1
   - **Description:** `Bridge User Sync` (or any descriptive name)
   - **Subscribe to events:**
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`

4. **Click "Create"**

5. **Copy Signing Secret:**
   - After creating, you'll see a "Signing Secret" (starts with `whsec_...`)
   - Click "Reveal" and copy the secret

### 3. Add Signing Secret to Environment Variables

Add the signing secret to your `.env.local` file:

```env
# Clerk Webhook
CLERK_WEBHOOK_SECRET=whsec_your_signing_secret_here
```

**For Production (Vercel):**

```bash
# Set the environment variable
vercel env add CLERK_WEBHOOK_SECRET

# Paste the signing secret when prompted
# Select: Production, Preview, Development (or as needed)

# Redeploy to apply changes
vercel --prod
```

### 4. Test the Webhook

#### Test in Clerk Dashboard:

1. Go to your webhook endpoint in Clerk Dashboard
2. Click "Testing" tab
3. Select event type (e.g., `user.created`)
4. Click "Send Example"
5. Check the response status (should be 200 OK)

#### Test with Real User Actions:

1. **Sign up a new user:**
   - Go to your app's sign-up page
   - Create a new account
   - Check database: `SELECT * FROM "user" ORDER BY "createdAt" DESC LIMIT 1;`
   - Verify: user created with `subscriptionPlan = 'free'`, `translationLimit = 5`

2. **Update user profile:**
   - Log in to Clerk User Portal (`https://yourdomain.com/user`)
   - Update name or email
   - Check database: `SELECT name, email, "updatedAt" FROM "user" WHERE id = 'user_xxx';`
   - Verify: name/email updated

3. **Delete user (optional):**
   - Delete user from Clerk Dashboard (Users → Actions → Delete)
   - Check database: `SELECT banned FROM "user" WHERE id = 'user_xxx';`
   - Verify: `banned = true`

### 5. Monitor Webhook Activity

#### In Clerk Dashboard:
- Go to Webhooks → Your Endpoint
- Click "Logs" tab
- View delivery attempts, status codes, and response times

#### In Your Application Logs:
```bash
# Development
npm run dev
# Watch console for webhook logs:
# "Creating user: user_xxx (email@example.com)"
# "✓ User created successfully: user_xxx"
```

#### Common Log Messages:
```
✓ User created successfully: user_2xxx
✓ User updated successfully: user_2xxx
✓ User soft deleted (banned): user_2xxx
⚠ User with email user@example.com already exists, updating instead
```

## Webhook Behavior

### user.created Event

**Extracts from Clerk:**
- User ID (`id`)
- Primary email address
- First name, last name
- Profile image URL

**Creates in Database:**
```sql
INSERT INTO "user" (
  id,                  -- Clerk user ID
  email,               -- Primary email
  name,                -- "First Last" or email
  image,               -- Profile image URL
  emailVerified,       -- true (Clerk handles verification)
  role,                -- 'customer' (default)
  banned,              -- false
  subscriptionPlan,    -- 'free' (freemium default)
  subscriptionStatus,  -- 'active'
  translationLimit,    -- 5 (free tier)
  translationCount,    -- 0
  createdAt,
  updatedAt
)
```

**Duplicate Email Handling:**
If a user with the same email already exists (e.g., from Better Auth migration):
- Updates existing user with Clerk ID
- Preserves existing subscription data
- Logs: `"User with email X already exists, updating instead"`

### user.updated Event

**Updates in Database:**
- `email` (if changed)
- `name` (if first_name or last_name changed)
- `image` (if profile image changed)
- `emailVerified` (set to true)
- `updatedAt` (timestamp)

**Preserves:**
- `role` (managed by admins)
- `subscriptionPlan`, `subscriptionStatus`, `stripeCustomerId`, etc. (managed by Stripe webhook)
- `translationCount`, `translationLimit` (managed by app logic)

### user.deleted Event

**Default Behavior (Soft Delete):**
```sql
UPDATE "user" SET
  banned = true,
  updatedAt = NOW()
WHERE id = 'user_xxx';
```

**Why Soft Delete?**
- Preserves audit logs (documents, translation history)
- Maintains referential integrity (foreign keys remain valid)
- Allows account recovery if needed

**Alternative (Hard Delete):**
Uncomment the hard delete code in `route.ts` if you prefer:
```typescript
await db.delete(userTable).where(eq(userTable.id, id));
```

**⚠️ Warning:** Hard delete will cascade-delete:
- All user's documents
- All translation results
- All family memberships
- All shares

## Troubleshooting

### Webhook Returns 400 "Missing webhook headers"

**Cause:** Request doesn't include Svix signature headers

**Fix:**
- Ensure request is coming from Clerk (not manual `curl`)
- Check Clerk Dashboard → Webhooks → Logs for delivery failures

### Webhook Returns 400 "Invalid signature"

**Cause:** Incorrect `CLERK_WEBHOOK_SECRET` or request tampered with

**Fix:**
1. Verify `CLERK_WEBHOOK_SECRET` in `.env.local` matches Clerk Dashboard
2. Re-copy signing secret from Clerk Dashboard
3. Restart your dev server: `npm run dev`

### Webhook Returns 500 "Webhook secret not configured"

**Cause:** `CLERK_WEBHOOK_SECRET` environment variable not set

**Fix:**
```bash
# Add to .env.local
echo "CLERK_WEBHOOK_SECRET=whsec_your_secret" >> .env.local

# Restart dev server
npm run dev
```

### User Created but Missing in Database

**Cause:** Webhook not configured or failing silently

**Check:**
1. Verify webhook is active in Clerk Dashboard
2. Check Clerk Dashboard → Webhooks → Logs for delivery status
3. Check your app logs for error messages
4. Test webhook manually from Clerk Dashboard

### Duplicate Key Error on user.created

**Cause:** User ID already exists in database

**This is normal behavior** if:
- User was created manually for testing
- User exists from Better Auth migration

**Webhook handles this gracefully:**
- Logs warning: `"User with email X already exists, updating instead"`
- Updates existing user with Clerk ID
- Returns 200 OK (no retry)

### Webhook Not Receiving Events

**Check:**
1. **Webhook URL is correct** (no typos)
2. **Webhook is active** in Clerk Dashboard
3. **Events are subscribed** (user.created, user.updated, user.deleted)
4. **Firewall/tunnel allows HTTPS** (if using Cloudflare Tunnel)
5. **Development tunnel is running** (if testing locally)

**Test connectivity:**
```bash
# From your local machine
curl -X POST https://yourdomain.com/api/webhooks/clerk
# Should return 400 "Missing webhook headers" (good - means endpoint is reachable)
```

## Security Considerations

### Webhook Verification

**The webhook endpoint:**
- ✅ Verifies Svix signature using `CLERK_WEBHOOK_SECRET`
- ✅ Rejects requests with missing or invalid signatures
- ✅ Prevents replay attacks (timestamp validation)

**Never disable signature verification in production!**

### Error Handling

**The webhook always returns 200 OK** to prevent Clerk from retrying failed events indefinitely.

**Why?**
- Database errors should not trigger retries (idempotency)
- Errors are logged for manual investigation
- Failed events can be replayed manually from Clerk Dashboard

**Monitoring:**
- Check webhook logs regularly
- Set up alerts for repeated failures
- Review database sync integrity periodically

### Environment Variables

**Never commit secrets to Git:**
```gitignore
# .gitignore
.env.local
.env.production
```

**Rotate secrets periodically:**
1. Generate new signing secret in Clerk Dashboard
2. Update `CLERK_WEBHOOK_SECRET` in environment
3. Restart application
4. Delete old webhook endpoint in Clerk

## Data Flow Diagram

```
┌─────────────────────────────────────────────────┐
│ User Action (Clerk)                             │
│  - Sign Up                                      │
│  - Update Profile                               │
│  - Delete Account                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Clerk Webhook System                            │
│  - Generates event (user.created, etc.)         │
│  - Signs payload with Svix                      │
│  - POSTs to your endpoint                       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Your Webhook Endpoint                           │
│  /api/webhooks/clerk                            │
│  1. Verify signature                            │
│  2. Parse event type                            │
│  3. Process event                               │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Database (PostgreSQL)                           │
│  - INSERT (user.created)                        │
│  - UPDATE (user.updated)                        │
│  - UPDATE banned=true (user.deleted)            │
└─────────────────────────────────────────────────┘
```

## Next Steps

After webhook is configured and tested:

1. **Update Middleware** (if needed):
   - Ensure Clerk middleware protects routes
   - Verify user roles/permissions are enforced

2. **Sync Existing Users** (if migrating from Better Auth):
   - Export users from Better Auth schema
   - Map to Clerk user IDs
   - Update `user.id` to Clerk IDs
   - Or let webhook handle on first login

3. **Configure Stripe Webhook** (for subscriptions):
   - Set up `/api/webhooks/stripe` (already exists)
   - Sync subscription data: plan, status, limits
   - Webhook URL: `https://yourdomain.com/api/webhooks/stripe`

4. **Monitor and Test:**
   - Create test users
   - Verify database sync
   - Test translation limits
   - Test subscription upgrades

## Support

**Clerk Documentation:**
- [Webhooks Guide](https://clerk.com/docs/integrations/webhooks/overview)
- [Webhook Events Reference](https://clerk.com/docs/integrations/webhooks/overview#supported-webhook-events)
- [Svix Verification](https://docs.svix.com/receiving/verifying-payloads/how)

**Need Help?**
- Check Clerk Dashboard → Webhooks → Logs
- Review application logs for errors
- Test webhook manually from Clerk Dashboard
- Verify environment variables are set correctly
