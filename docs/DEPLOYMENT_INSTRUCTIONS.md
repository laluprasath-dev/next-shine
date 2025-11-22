# Shipping Integration Deployment Instructions

## Issue Identified

The shipping integration is failing due to CORS errors and missing Edge Functions. The Supabase Edge Functions for `shiprocket-auth` and `get-shipping-charge` need to be deployed.

## Solution Steps

### 1. Deploy Edge Functions

You need to deploy the two Edge Functions I created:

**Function 1: `shiprocket-auth`**

- File: `supabase/functions/shiprocket-auth/index.ts`
- Purpose: Authenticates with Shiprocket API

**Function 2: `get-shipping-charge`**

- File: `supabase/functions/get-shipping-charge/index.ts`
- Purpose: Calculates shipping charges using Shiprocket API

### 2. Deploy via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions" section
3. Create two new functions:
   - `shiprocket-auth`
   - `get-shipping-charge`
4. Copy the code from the respective files
5. Deploy both functions

### 3. Set Environment Variables

In your Supabase project settings, add these environment variables:

```
SHIPROCKET_EMAIL=your_shiprocket_email@example.com
SHIPROCKET_PASSWORD=your_shiprocket_password
```

### 4. Alternative: Deploy via CLI (if available)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref rzrroghnzintpxspwauf

# Deploy functions
supabase functions deploy shiprocket-auth
supabase functions deploy get-shipping-charge
```

### 5. Test the Integration

After deployment, the shipping integration should work:

1. Go to checkout page
2. Select a delivery address
3. Shipping options should load automatically
4. Select a courier option
5. Proceed to payment

## Expected Behavior

Once deployed, you should see:

- ✅ No CORS errors in console
- ✅ Shipping options loading successfully
- ✅ Courier options displayed with rates and delivery times
- ✅ Dynamic shipping costs in cart summary
- ✅ Successful checkout with shipping info

## Troubleshooting

If you still see errors:

1. **CORS Issues**: Ensure the Edge Functions have proper CORS headers (already included in the code)
2. **Authentication Errors**: Verify Shiprocket credentials are correct
3. **Network Errors**: Check if the functions are deployed and accessible
4. **Missing Data**: Ensure products have shipping properties (weight, dimensions, pickup_postcode)

## Fallback Option

If Shiprocket integration doesn't work immediately, the system will show fallback shipping options with standard rates until the API is properly configured.

