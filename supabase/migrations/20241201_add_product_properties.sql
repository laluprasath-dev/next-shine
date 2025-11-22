-- Add new required properties to products table
-- Migration: Add weight, length, breadth, height, pickup_postcode, and gst_percentage

-- Add physical properties columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS length DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS breadth DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS height DECIMAL(10,2);

-- Add shipping and tax properties columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS pickup_postcode VARCHAR(20),
ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5,2);

-- Add constraints for the new columns
-- Weight, length, breadth, height should be positive numbers
ALTER TABLE products 
ADD CONSTRAINT check_weight_positive CHECK (weight IS NULL OR weight > 0),
ADD CONSTRAINT check_length_positive CHECK (length IS NULL OR length > 0),
ADD CONSTRAINT check_breadth_positive CHECK (breadth IS NULL OR breadth > 0),
ADD CONSTRAINT check_height_positive CHECK (height IS NULL OR height > 0);

-- GST percentage should be between 0 and 100
ALTER TABLE products 
ADD CONSTRAINT check_gst_percentage_range CHECK (gst_percentage IS NULL OR (gst_percentage >= 0 AND gst_percentage <= 100));

-- Add comments for documentation
COMMENT ON COLUMN products.weight IS 'Product weight in kilograms';
COMMENT ON COLUMN products.length IS 'Product length in centimeters';
COMMENT ON COLUMN products.breadth IS 'Product breadth in centimeters';
COMMENT ON COLUMN products.height IS 'Product height in centimeters';
COMMENT ON COLUMN products.pickup_postcode IS 'Postcode for product pickup location';
COMMENT ON COLUMN products.gst_percentage IS 'GST percentage (0-100)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_weight ON products(weight);
CREATE INDEX IF NOT EXISTS idx_products_pickup_postcode ON products(pickup_postcode);
CREATE INDEX IF NOT EXISTS idx_products_gst_percentage ON products(gst_percentage);
