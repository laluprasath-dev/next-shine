-- Add product_id column to Filters table to track which product uses these filters
ALTER TABLE "Filters" ADD COLUMN product_id TEXT;

-- Add foreign key constraint to products table
ALTER TABLE "Filters" 
ADD CONSTRAINT "Filters_product_id_fkey" 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX "Filters_product_id_idx" ON "Filters" (product_id);

-- Add index for category and product_id combination
CREATE INDEX "Filters_category_product_id_idx" ON "Filters" (category, product_id);
