# Database Schema Fix - Missing shipping_info Column

## 🚨 **Issue Identified**

The error occurs because the `orders` table is missing the `shipping_info` column that the checkout code is trying to insert.

**Error**: `Could not find the 'shipping_info' column of 'orders' in the schema cache`

## 🔧 **Solution**

### **Step 1: Apply Database Migration**

Go to your Supabase Dashboard:

1. Navigate to **SQL Editor**
2. Copy and paste the following SQL:

```sql
-- Add shipping_info column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_info JSONB;

-- Add comment to describe the column
COMMENT ON COLUMN public.orders.shipping_info IS 'Stores courier information including courier_id, courier_name, shipping_cost, estimated_delivery_days, and estimated_delivery_date';

-- Create an index on shipping_info for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_shipping_info ON public.orders USING GIN (shipping_info);

-- Add payment_id column if it doesn't exist (for Razorpay integration)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Add comment for payment_id
COMMENT ON COLUMN public.orders.payment_id IS 'Razorpay payment ID for tracking payments';

-- Create index on payment_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders (payment_id);
```

3. Click **Run** to execute the migration

### **Step 2: Verify the Changes**

After running the migration, verify the columns exist:

```sql
-- Check if columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN ('shipping_info', 'payment_id');
```

### **Step 3: Test the Payment Flow**

1. **Restart your development server**
2. **Try the payment flow again**
3. **Check that the order is created successfully**

## 📋 **What This Fixes**

### **Before (Broken)**

```
Checkout → Insert order with shipping_info → ❌ Column not found → Error
```

### **After (Fixed)**

```
Checkout → Insert order with shipping_info → ✅ Column exists → Success
```

## 🗂️ **New Columns Added**

### **shipping_info (JSONB)**

Stores courier information:

```json
{
  "courier_id": 1,
  "courier_name": "Fast Delivery",
  "shipping_cost": 75,
  "estimated_delivery_days": "2",
  "estimated_delivery_date": "2025-10-21T00:00:00.000Z"
}
```

### **payment_id (TEXT)**

Stores Razorpay payment ID for tracking:

```
"pay_1234567890abcdef"
```

## 🔍 **Verification Steps**

### **1. Check Database Schema**

```sql
-- Verify columns exist
\d orders
```

### **2. Test Order Creation**

```sql
-- Test insert with shipping_info
INSERT INTO orders (user_id, total, status, shipping_info)
VALUES ('test-user-id', 100.00, 'pending', '{"courier_name": "Test Courier"}');
```

### **3. Check Application Logs**

- Look for successful order creation
- Verify no more "column not found" errors
- Check that shipping info is stored correctly

## 🚀 **Expected Results**

After applying this fix:

✅ **Payment flow works** - No more column errors  
✅ **Shipping info stored** - Courier details saved in database  
✅ **Payment tracking** - Razorpay payment IDs stored  
✅ **Inventory updates** - Product quantities decremented  
✅ **Order management** - Vendors can see shipping details

## 🛠️ **Alternative: Manual Column Addition**

If you prefer to add columns manually:

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `orders` table
3. Click **Add Column**
4. Add `shipping_info` as **JSONB** type
5. Add `payment_id` as **TEXT** type
6. Save changes

## ⚠️ **Important Notes**

- **Backup your data** before running migrations
- **Test in development** before applying to production
- **Monitor logs** after applying the fix
- **Verify all payment flows** work correctly

## 🎯 **Next Steps**

1. **Apply the migration** using the SQL above
2. **Test the payment flow** with a small amount
3. **Verify inventory updates** in vendor dashboard
4. **Check order details** include shipping information
5. **Monitor for any other issues**

The payment system should work perfectly after this fix!
