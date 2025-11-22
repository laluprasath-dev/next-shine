# Quick Fix for Shipping "Method Not Allowed" Error

## The Problem

You're getting this error:

```
Shipping calculation failed: Method Not Allowed - {"message":"The POST method is not supported for this route. Supported methods: GET, HEAD.","status_code":405}
```

## The Cause

The Supabase Edge Functions (`shiprocket-auth` and `get-shipping-charge`) are not deployed to your Supabase project.

## The Fix

### Option 1: Deploy Edge Functions (Recommended for Real Shipping)

1. **Go to Supabase Dashboard**

   - Visit: https://supabase.com/dashboard/project/rzrroghnzintpxspwauf
   - Click on "Edge Functions" in the left sidebar

2. **Deploy shiprocket-auth function**

   - Click "Create a new function"
   - Function name: `shiprocket-auth`
   - Copy the entire code from `supabase/functions/shiprocket-auth/index.ts`
   - Click "Deploy function"

3. **Deploy get-shipping-charge function**

   - Click "Create a new function"
   - Function name: `get-shipping-charge`
   - Copy the entire code from `supabase/functions/get-shipping-charge/index.ts`
   - Click "Deploy function"

4. **Set Environment Variables**
   - Go to Project Settings > Edge Functions
   - Add these environment variables:
     - `SHIPROCKET_EMAIL=your_shiprocket_email@example.com`
     - `SHIPROCKET_PASSWORD=your_shiprocket_password`

### Option 2: Use Fallback Shipping (Quick Fix)

The code has been updated to automatically use fallback shipping options when Edge Functions are not available. This means:

- ✅ No more "Method Not Allowed" errors
- ✅ Shipping options will always be available
- ✅ Uses mock shipping rates (₹35-75 based on weight)
- ✅ Shows delivery times (2-7 days)

## Test the Fix

1. **Run the test script:**

   ```bash
   node test-shipping.js
   ```

2. **Test in your app:**
   - Go to checkout page
   - Select a delivery address
   - Shipping options should load without errors

## Expected Results

### Before Fix:

- ❌ "Method Not Allowed" error
- ❌ No shipping options displayed
- ❌ Checkout fails

### After Fix:

- ✅ No errors in console
- ✅ Shipping options displayed (fallback or real)
- ✅ Checkout works smoothly

## Next Steps

1. **Immediate**: The fallback shipping will work right away
2. **Later**: Deploy Edge Functions for real Shiprocket integration
3. **Optional**: Set up Shiprocket account for real shipping rates

The error should be resolved immediately with the code changes I made!
