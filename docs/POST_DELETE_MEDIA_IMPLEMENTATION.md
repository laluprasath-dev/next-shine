# Post Delete Media Implementation

## Overview

This implementation ensures that when a user deletes their own post, all associated media files are properly removed from Supabase storage.

## Changes Made

### Updated Social API Module (`src/integrations/supabase/modules/social.ts`)

The `deletePost` function was enhanced to:

1. **Verify Authorization**: Check if the user owns the post before deletion
2. **Delete Media**: Use the `deletePostAndMedia` utility to delete all media files from the `posts` storage bucket
3. **Delete Post**: Remove the post record from the database

### How It Works

When a user deletes their post:

1. **Authorization Check**: The system verifies that the user attempting to delete the post is the owner (`user_id` matches the logged-in user)

2. **Media Deletion**: If authorization passes, the system:

   - Fetches the post to get all media URLs (`media_urls` field)
   - Deletes all media files from the `posts` storage bucket
   - Handles errors gracefully (warns but continues with post deletion)

3. **Database Cleanup**: The post record is deleted from the database

4. **User Feedback**: Success or error messages are shown to the user via toast notifications

## Components Using This Feature

All post components that allow users to delete their own posts:

1. **`src/components/social/Post.tsx`** (line 515)

   - `handleDeletePost` function

2. **`src/components/social/PostCard.tsx`** (line 760)

   - `handleDeletePost` function

3. **`src/components/social/PostCardForHomePage.tsx`** (line 666)
   - `handleDeletePost` function

All these components call `socialApi.posts.deletePost(id, user.id)`, which now automatically handles media deletion.

## Storage Bucket

Media files are stored in the `posts` bucket with the structure:

- Path format: `posts/{file_name}`
- Public URL format: `https://{project_ref}.supabase.co/storage/v1/object/public/posts/{file_name}`

## Error Handling

- If media deletion fails, a warning is logged but the post will still be deleted from the database
- If the user is not the owner of the post, an "Unauthorized" error is returned
- If the post doesn't exist, a "Post not found" error is returned
- All errors are surfaced to the user via toast notifications

## Security

- Only the post owner can delete their post
- Media files are deleted from storage before the database record is removed
- Authorization is checked before any deletion operations

## Testing

To test the implementation:

1. Create a post with media (images/videos)
2. Delete the post
3. Verify in Supabase Storage that the media files are removed from the `posts` bucket
4. Verify in the database that the post record is deleted

## Notes

- The implementation uses the existing `deletePostAndMedia` utility function from `src/utils/storageHelpers.ts`
- Media deletion happens before database record deletion to ensure no orphaned files
- The system handles cases where posts have no media gracefully
- Error logging helps with debugging failed deletion attempts
