# Razorpay Payment Setup Guide

## Issue

The payment is failing with "Failed to create Razorpay order - no order ID returned" because the Razorpay configuration is not properly set up.

## Solution

### 1. Create Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
VITE_RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

### 2. Get Your Credentials

#### Supabase Credentials:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy the Project URL and anon/public key

#### Razorpay Credentials:

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to Settings > API Keys
3. Generate Test Keys (for development)
4. Copy the Key ID and Key Secret

### 3. Update Supabase Environment Variables

In your Supabase project, go to Settings > Edge Functions and add these environment variables:

```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 4. Deploy Supabase Functions

Make sure your Razorpay functions are deployed:

```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

### 5. Test the Payment Flow

1. Restart your development server
2. Try the payment flow again
3. Check the browser console for detailed error logs

## Troubleshooting

### Common Issues:

1. **Missing environment variables**: Make sure all required variables are set
2. **Invalid Razorpay keys**: Verify your keys are correct and active
3. **Supabase function not deployed**: Deploy the functions using the command above
4. **CORS issues**: Make sure your domain is whitelisted in Razorpay dashboard

### Debug Steps:

1. Check browser console for detailed error messages
2. Check Supabase function logs
3. Verify Razorpay dashboard for any API errors
4. Test with Razorpay's test credentials first

## Test Credentials (Development Only)

- Use Razorpay's test mode for development
- Test card numbers are available in Razorpay documentation
- Never use real payment details in development
