# Stripe Setup Instructions for Food Truck Live

## Critical: Supabase Edge Function Secrets

Since you cannot access the Supabase dashboard directly, you'll need someone with access to add these secrets to your Supabase project.

### Required Secrets

Go to: https://supabase.com/dashboard/project/sulhngtqmfaawciyiymc/settings/functions

Add these two secrets:

#### 1. STRIPE_SECRET_KEY
```
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
```

#### 2. STRIPE_WEBHOOK_SECRET
```
whsec_ZGLw4Xy7YCh99iVmhzX4qWsRDEqgGdEn
```

### How to Add Secrets in Supabase

1. Go to your Supabase project settings
2. Navigate to "Edge Functions" section
3. Click "Add new secret"
4. Enter the secret name and value
5. Click "Save"

Repeat for both secrets above.

### Verification

Once the secrets are added:
- Your webhook endpoint will work: `https://sulhngtqmfaawciyiymc.supabase.co/functions/v1/stripe-webhook`
- Customers can purchase subscriptions and one-time payments
- Stripe webhooks will automatically sync subscription status

### Current Status

✅ Database tables configured
✅ Edge functions deployed
✅ Frontend configured with publishable key
✅ Webhook endpoint created in Stripe
⏳ Waiting for secrets to be added

### After Adding Secrets

Test the integration by:
1. Going to your app
2. Trying to purchase a subscription
3. Verifying the webhook receives events in Stripe dashboard
