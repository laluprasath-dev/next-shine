-- Add shipping_info column to orders table
-- This column will store courier information and shipping details

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
