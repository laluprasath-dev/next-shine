-- Add product_ids column to Filters table to store filter values mapped to product IDs
ALTER TABLE "Filters" ADD COLUMN product_ids JSONB;

-- Add index for better query performance on product_ids
CREATE INDEX "Filters_product_ids_idx" ON "Filters" USING GIN (product_ids);

-- Add index for category and product_ids combination
CREATE INDEX "Filters_category_product_ids_idx" ON "Filters" (category, product_ids);
