-- Add tracking fields to orders table for shipment tracking
-- This migration adds fields needed for shipment tracking and status updates

-- Add tracking number field
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- Add AWB (Air Waybill) number field
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS awb_number TEXT;

-- Add shipment ID field
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipment_id TEXT;

-- Add shipment status field
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipment_status TEXT DEFAULT 'pending';

-- Add shipment status description field
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipment_status_description TEXT;

-- Add comments to describe the new columns
COMMENT ON COLUMN public.orders.tracking_number IS 'Tracking number provided by courier for shipment tracking';
COMMENT ON COLUMN public.orders.awb_number IS 'Air Waybill number for shipment tracking';
COMMENT ON COLUMN public.orders.shipment_id IS 'Internal shipment ID from courier service';
COMMENT ON COLUMN public.orders.shipment_status IS 'Current status of the shipment (pending, created, in_transit, delivered, etc.)';
COMMENT ON COLUMN public.orders.shipment_status_description IS 'Human readable description of current shipment status';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON public.orders (tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_shipment_status ON public.orders (shipment_status);
CREATE INDEX IF NOT EXISTS idx_orders_shipment_id ON public.orders (shipment_id);

-- Create a table for tracking events/history
CREATE TABLE IF NOT EXISTS public.shipment_tracking_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  status TEXT NOT NULL,
  status_code INTEGER,
  status_description TEXT,
  location TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment for tracking events table
COMMENT ON TABLE public.shipment_tracking_events IS 'Stores tracking events and status updates for shipments';

-- Create indexes for tracking events
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_events_order_id ON public.shipment_tracking_events (order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_events_tracking_number ON public.shipment_tracking_events (tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_events_timestamp ON public.shipment_tracking_events (timestamp);

-- Enable Row Level Security
ALTER TABLE public.shipment_tracking_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tracking events
CREATE POLICY "Users can view their own tracking events" ON public.shipment_tracking_events
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage tracking events" ON public.shipment_tracking_events
  FOR ALL USING (auth.role() = 'service_role');
