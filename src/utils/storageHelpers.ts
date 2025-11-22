import { supabase } from "@/integrations/supabase/client";

/**
 * Delete an image from a Supabase storage bucket
 * @param bucketName - The name of the storage bucket
 * @param url - The full public URL of the image
 * @returns Object with success status and error if any
 */
export const deleteImageFromStorage = async (
  bucketName: string,
  url: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Parse the URL to extract the file path
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const bucketIndex = pathParts.findIndex((part) => part === bucketName);

    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      console.error("Invalid image URL format");
      return { success: false, error: new Error("Invalid image URL format") };
    }

    // Get the file path after the bucket name
    const filePath = pathParts.slice(bucketIndex + 1).join("/");

    console.log(`Deleting image from storage: ${bucketName}/${filePath}`);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error("Error deleting image:", error);
      return { success: false, error };
    }

    console.log("Image deleted successfully");
    return { success: true, error: null };
  } catch (error) {
    console.error("Failed to delete image:", error);
    return { success: false, error };
  }
};

/**
 * Delete multiple images from a Supabase storage bucket
 * @param bucketName - The name of the storage bucket
 * @param urls - Array of full public URLs of the images
 * @returns Object with success status and error if any
 */
export const deleteImagesFromStorage = async (
  bucketName: string,
  urls: string[]
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const filePaths: string[] = [];

    for (const url of urls) {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const bucketIndex = pathParts.findIndex((part) => part === bucketName);

      if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
        console.warn("Invalid image URL format:", url);
        continue;
      }

      const filePath = pathParts.slice(bucketIndex + 1).join("/");
      filePaths.push(filePath);
    }

    if (filePaths.length === 0) {
      return { success: true, error: null };
    }

    console.log(
      `Deleting ${filePaths.length} images from storage: ${bucketName}`
    );

    const { error } = await supabase.storage.from(bucketName).remove(filePaths);

    if (error) {
      console.error("Error deleting images:", error);
      return { success: false, error };
    }

    console.log("All images deleted successfully");
    return { success: true, error: null };
  } catch (error) {
    console.error("Failed to delete images:", error);
    return { success: false, error };
  }
};

/**
 * Delete a post and its associated media from storage
 * @param postId - The ID of the post to delete
 * @returns Object with success status and error if any
 */
export const deletePostAndMedia = async (
  postId: string
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // First, fetch the post to get media URLs
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("id, media_urls")
      .eq("id", postId)
      .single();

    if (fetchError) {
      console.error("Error fetching post:", fetchError);
      return { success: false, error: fetchError };
    }

    if (post && post.media_urls && post.media_urls.length > 0) {
      // Delete media files from posts bucket
      const result = await deleteImagesFromStorage("posts", post.media_urls);
      if (!result.success) {
        console.warn(
          "Failed to delete post media, but continuing with post deletion"
        );
      }
    }

    // Delete the post
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      return { success: false, error: deleteError };
    }

    console.log("Post and media deleted successfully");
    return { success: true, error: null };
  } catch (error) {
    console.error("Failed to delete post and media:", error);
    return { success: false, error };
  }
};
