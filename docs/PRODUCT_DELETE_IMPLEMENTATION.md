# Product Delete Implementation

## Overview

This implementation ensures that when a product is deleted, all associated resources are properly cleaned up from Supabase storage, including:

- Product images
- Associated social media posts
- Post media files

## Changes Made

### 1. Created Storage Helper Utility (`src/utils/storageHelpers.ts`)

A new utility file with three functions:

- `deleteImageFromStorage`: Deletes a single image from a storage bucket
- `deleteImagesFromStorage`: Deletes multiple images from a storage bucket
- `deletePostAndMedia`: Deletes a post and all its associated media files

These functions handle URL parsing, path extraction, and deletion from Supabase storage.

### 2. Updated Product Deletion in Shop Management (`src/pages/vendor/ShopManagement.tsx`)

Enhanced the `handleDeleteProduct` function to:

- Delete all product images from storage before deleting the product
- Check for and delete associated social media posts with their media files
- Provide better error handling and user feedback

### 3. Updated Product Deletion in Admin Product Management (`src/pages/admin/ProductManagement.tsx`)

Enhanced the `handleDeleteProduct` function to:

- Fetch product details to get image URLs
- Delete all product images from storage before deleting the product
- Check for and delete associated social media posts with their media files
- Update user confirmation message to inform about image and post deletion

### 4. Created Storage Bucket Migration (`supabase/migrations/20250121000001_add_product_images_bucket.sql`)

Created a migration file that:

- Creates the `product-images` storage bucket (if it doesn't exist)
- Creates the `products` storage bucket for compatibility
- Adds appropriate policies for viewing, uploading, updating, and deleting images

### 5. Created Standalone SQL File (`apply_product_images_migration.sql`)

A standalone SQL file that can be run directly in Supabase SQL editor to apply the storage bucket configuration.

## How to Apply

### Option 1: Apply Migration File

```bash
# In your project root, apply the migration
supabase db push
```

### Option 2: Run SQL Directly

Copy and paste the contents of `apply_product_images_migration.sql` into your Supabase SQL editor and execute it.

### Option 3: Apply via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the `apply_product_images_migration.sql` file

## How It Works

When a product is deleted:

1. **Image Deletion**: The system fetches all product image URLs and attempts to delete them from storage. It tries the `product-images` bucket first, then falls back to the `products` bucket for compatibility with different parts of the application.

2. **Post Deletion**: The system checks if there are any social media posts associated with the product (via `product_id`). If found, it:

   - Fetches all media URLs from the post
   - Deletes the media files from the `posts` bucket
   - Deletes the post record from the database

3. **Database Cleanup**: Finally, the product record itself is deleted from the database.

4. **Error Handling**: If any step fails, appropriate warnings are logged, but the deletion continues to ensure data consistency.

## Features

- **Comprehensive Cleanup**: Ensures no orphaned images or posts remain in storage
- **Error Resilience**: Continues with deletion even if some cleanup steps fail
- **Multiple Bucket Support**: Handles images stored in different buckets (`product-images` and `products`)
- **Type Safety**: Full TypeScript support with proper types
- **User Feedback**: Improved toast messages to inform users about what was deleted

## Storage Buckets

The implementation uses two storage buckets:

### `product-images` Bucket

- Primary bucket for product images
- Used in ProductEdit.tsx and SimProductEdit.tsx
- Has policies for viewing, uploading, updating, and deleting

### `products` Bucket

- Secondary bucket for backward compatibility
- Used in ProductCreate.tsx
- Same policies as `product-images` bucket

## Testing

To test the implementation:

1. Create a product with images
2. Optionally create a social media post for the product
3. Delete the product
4. Verify in Supabase Storage that:
   - All product images are removed from the storage bucket
   - Any associated post media is removed from the `posts` bucket
5. Verify in the database that:
   - The product record is deleted
   - Any associated posts are deleted

## Notes

- The deletion process is designed to be resilient: if image deletion fails, the product and posts will still be deleted from the database to maintain data consistency
- Warnings are logged to the console for any failed cleanup operations
- Users are informed via toast messages about the success or failure of the deletion operation
