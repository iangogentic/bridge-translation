# Clerk Webhook Quick Start

## ⚡ 5-Minute Setup

### 1. Get Signing Secret (2 min)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click your app → **Webhooks** → **Add Endpoint**
3. Enter webhook URL:
   ```
   https://yourdomain.com/api/webhooks/clerk
   ```
4. Subscribe to events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
5. Click **Create**
6. Copy the **Signing Secret** (starts with `whsec_...`)

### 2. Add to Environment (1 min)

**Local (.env.local):**
```bash
CLERK_WEBHOOK_SECRET=whsec_paste_your_secret_here
```

**Production (Vercel):**
```bash
vercel env add CLERK_WEBHOOK_SECRET
# Paste secret when prompted
```

### 3. Test It (2 min)

**Option A: Clerk Dashboard Test**
1. Clerk Dashboard → Webhooks → Your Endpoint
2. Click **Testing** tab
3. Select `user.created` event
4. Click **Send Example**
5. Verify **200 OK** response

**Option B: Real User Test**
1. Sign up a new user in your app
2. Check database:
   ```sql
   SELECT id, email, subscriptionPlan, translationLimit
   FROM "user"
   ORDER BY "createdAt" DESC
   LIMIT 1;
   ```
3. Should see: `subscriptionPlan = 'free'`, `translationLimit = 5`

### ✅ Done!

Users will now automatically sync to your database when they:
- ✅ Sign up → Created with freemium defaults
- ✅ Update profile → Name, email, image synced
- ✅ Delete account → Soft deleted (banned = true)

---

## 📖 Need More Info?

- **Full Setup Guide:** [CLERK_WEBHOOK_SETUP.md](./CLERK_WEBHOOK_SETUP.md)
- **Testing Procedures:** [TEST_WEBHOOK.md](./TEST_WEBHOOK.md)
- **Implementation Details:** [WEBHOOK_IMPLEMENTATION_SUMMARY.md](./WEBHOOK_IMPLEMENTATION_SUMMARY.md)

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| 400 "Invalid signature" | Re-copy `CLERK_WEBHOOK_SECRET` from Clerk Dashboard |
| 500 "Secret not configured" | Add `CLERK_WEBHOOK_SECRET` to `.env.local` and restart server |
| User not created | Check app logs for errors, verify DATABASE_URL is correct |
| 404 Not Found | Ensure webhook URL ends with `/api/webhooks/clerk` |

## 📊 What Gets Synced?

| Clerk Event | Database Action | Fields Created |
|------------|----------------|----------------|
| `user.created` | INSERT new user | id, email, name, image, role='customer', subscriptionPlan='free', translationLimit=5 |
| `user.updated` | UPDATE user | email, name, image (preserves subscription data) |
| `user.deleted` | UPDATE user | banned=true (soft delete, preserves data) |

## 🔐 Security Checklist

- [x] Signature verification enabled (Svix)
- [x] CLERK_WEBHOOK_SECRET in environment (not hardcoded)
- [x] Always returns 200 OK (idempotent)
- [x] Errors logged but not exposed
- [ ] Monitor webhook logs regularly
- [ ] Rotate secrets quarterly

## 📍 Files Location

```
bridge/
├── src/app/api/webhooks/clerk/route.ts    # Webhook handler
├── CLERK_WEBHOOK_SETUP.md                 # Full setup guide
├── TEST_WEBHOOK.md                        # Testing guide
├── WEBHOOK_IMPLEMENTATION_SUMMARY.md      # Implementation details
└── CLERK_WEBHOOK_QUICKSTART.md           # This file
```

---

**Implementation:** ✅ Complete
**Configuration:** ⏳ Pending (5 minutes)
**Status:** Ready for production
