#!/bin/bash

# Script to set Supabase Edge Function secrets
# This requires the Supabase CLI to be installed and authenticated

echo "Setting Supabase Edge Function Secrets..."
echo "Project: sulhngtqmfaawciyiymc"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Set STRIPE_SECRET_KEY
echo "Setting STRIPE_SECRET_KEY..."
supabase secrets set STRIPE_SECRET_KEY=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 \
  --project-ref sulhngtqmfaawciyiymc

if [ $? -eq 0 ]; then
    echo "✅ STRIPE_SECRET_KEY set successfully"
else
    echo "❌ Failed to set STRIPE_SECRET_KEY"
    exit 1
fi

# Set STRIPE_WEBHOOK_SECRET
echo "Setting STRIPE_WEBHOOK_SECRET..."
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_ZGLw4Xy7YCh99iVmhzX4qWsRDEqgGdEn \
  --project-ref sulhngtqmfaawciyiymc

if [ $? -eq 0 ]; then
    echo "✅ STRIPE_WEBHOOK_SECRET set successfully"
else
    echo "❌ Failed to set STRIPE_WEBHOOK_SECRET"
    exit 1
fi

echo ""
echo "✅ All secrets set successfully!"
echo ""
echo "Your Stripe integration is now fully configured:"
echo "  - Webhook endpoint: https://sulhngtqmfaawciyiymc.supabase.co/functions/v1/stripe-webhook"
echo "  - Edge functions: stripe-checkout, stripe-webhook"
echo "  - Products configured: Basic ($9.95), Premium ($29.95), Event Organizer ($9.95)"
echo ""
echo "Test your integration by purchasing a subscription in the app!"
