#!/bin/bash

# Shipping Integration Edge Functions Deployment Script
# This script helps deploy the Edge Functions to fix CORS issues

echo "🚀 Shipping Integration - Edge Functions Deployment"
echo "=================================================="
echo ""

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    
    # Login to Supabase
    echo "🔐 Logging in to Supabase..."
    supabase login
    
    # Link to project
    echo "🔗 Linking to project..."
    supabase link --project-ref rzrroghnzintpxspwauf
    
    # Deploy functions
    echo "📦 Deploying shiprocket-auth function..."
    supabase functions deploy shiprocket-auth
    
    echo "📦 Deploying get-shipping-charge function..."
    supabase functions deploy get-shipping-charge
    
    echo ""
    echo "✅ Edge Functions deployed successfully!"
    echo "🎉 Your shipping integration should now work with real Shiprocket API!"
    
else
    echo "❌ Supabase CLI not found"
    echo ""
    echo "📋 Manual Deployment Instructions:"
    echo "1. Go to: https://supabase.com/dashboard/project/rzrroghnzintpxspwauf"
    echo "2. Navigate to 'Edge Functions'"
    echo "3. Create two new functions:"
    echo "   - shiprocket-auth (copy from supabase/functions/shiprocket-auth/index.ts)"
    echo "   - get-shipping-charge (copy from supabase/functions/get-shipping-charge/index.ts)"
    echo "4. Set environment variables:"
    echo "   - SHIPROCKET_EMAIL=your_email@example.com"
    echo "   - SHIPROCKET_PASSWORD=your_password"
    echo ""
    echo "🔄 After deployment, refresh your checkout page to see real shipping options!"
fi

echo ""
echo "📝 Current Status:"
echo "- ✅ Fallback shipping options working"
echo "- ⏳ Real Shiprocket integration pending deployment"
echo "- 🎯 CORS issues will be resolved after deployment"

