# Clerk Setup Instructions

## Webhook Configuration

1. Go to https://dashboard.clerk.com
2. Click **Webhooks** in the left sidebar
3. Click **Create Webhook**
4. Fill in these settings:
   - **Endpoint URL**: `https://bridge-umber-pi.vercel.app/api/webhooks/clerk`
   - **Events**: Check these boxes:
     - `user.created`
     - `user.updated` 
     - `user.deleted`
5. Click **Create Webhook**
6. Copy the **Signing Secret** (starts with `whsec_`)
7. Paste it into your `.env.local`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_your_secret_here
   ```
8. Add to Vercel:
   ```bash
   vercel env add CLERK_WEBHOOK_SECRET production
   # Paste your secret when prompted
   ```

## Sign In/Up URL Configuration

These are already configured in your application:
- Sign In URL: `/login`
- Sign Up URL: `/signup`
- After Sign In: `/dashboard`
- After Sign Up: `/dashboard`

## Environment Variables Status

✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bG92aW5nLXN0YWxsaW9uLTY0LmNsZXJrLmFjY291bnRzLmRldiQ
✅ CLERK_SECRET_KEY=sk_test_3XqXH0NnuxJTrmiweAMiiAPz1paud3hu8n4A9FUExI
⏳ CLERK_WEBHOOK_SECRET=whsec_... (Get from dashboard)

## Deployment

After setting the webhook secret:
```bash
# Deploy to production
vercel --prod
```
