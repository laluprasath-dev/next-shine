import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Helper function to delete old logo from storage
const deleteOldLogoFromStorage = async (logoUrl: string) => {
  try {
    // Extract the file path from the URL
    // URL format: https://project.supabase.co/storage/v1/object/public/vendor/path/to/file
    const url = new URL(logoUrl);
    const pathParts = url.pathname.split("/");
    const bucketIndex = pathParts.findIndex((part) => part === "vendor");

    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      throw new Error("Invalid logo URL format");
    }

    // Get the file path after the bucket name
    const filePath = pathParts.slice(bucketIndex + 1).join("/");

    console.log("Deleting old logo from storage:", filePath);

    const { error } = await supabase.storage.from("vendor").remove([filePath]);

    if (error) {
      console.error("Error deleting old logo:", error);
      throw error;
    }

    console.log("Old logo deleted successfully");
  } catch (error) {
    console.error("Failed to delete old logo:", error);
    throw error;
  }
};

export const useVendorLogoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadBusinessLogo = async (
    file: File,
    vendorId: string,
    currentLogoUrl?: string | null
  ) => {
    try {
      setUploading(true);

      if (!file) {
        throw new Error("You must select an image to upload.");
      }

      console.log("Uploading file:", {
        name: file.name,
        size: file.size,
        sizeInMB: (file.size / (1024 * 1024)).toFixed(2),
        type: file.type,
      });

      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select a valid image file.");
      }

      // Validate file size (max 5MB) - more precise calculation
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSizeInBytes) {
        const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        throw new Error(
          `Image size is ${fileSizeInMB}MB. Must be less than 5MB.`
        );
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${vendorId}/${Math.random()
        .toString(36)
        .slice(2)}-${Date.now()}.${fileExt}`;

      // Upload the file to Supabase storage in vendor bucket
      console.log("Uploading to Supabase storage:", fileName);
      const { error: uploadError } = await supabase.storage
        .from("vendor")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        if (
          uploadError.message.includes("bucket") ||
          uploadError.message.includes("not found")
        ) {
          throw new Error(
            "Vendor storage bucket not found. Please contact support to set up the vendor storage bucket."
          );
        }
        throw uploadError;
      }

      // Get the public URL
      const { data: publicUrlData } = await supabase.storage
        .from("vendor")
        .getPublicUrl(fileName);

      console.log("Public URL generated:", publicUrlData.publicUrl);

      // Update vendor registration with new business logo URL
      console.log("Updating vendor registration:", vendorId);
      const { error: updateError } = await supabase
        .from("vendor_registrations")
        .update({
          business_logo_url: publicUrlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendorId);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      // Delete old logo from storage if it exists
      if (currentLogoUrl) {
        try {
          await deleteOldLogoFromStorage(currentLogoUrl);
          console.log("Old logo deleted successfully");
        } catch (deleteError) {
          console.warn("Failed to delete old logo:", deleteError);
          // Don't fail the upload if old logo deletion fails
        }
      }

      toast({
        title: "Success",
        description: "Business logo updated successfully",
      });

      return publicUrlData.publicUrl;
    } catch (error: any) {
      console.error("Error uploading business logo:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload business logo",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteBusinessLogo = async (
    vendorId: string,
    currentLogoUrl?: string | null
  ) => {
    try {
      setUploading(true);

      // Delete the logo file from storage if URL exists
      if (currentLogoUrl) {
        try {
          await deleteOldLogoFromStorage(currentLogoUrl);
          console.log("Logo file deleted from storage");
        } catch (deleteError) {
          console.warn("Failed to delete logo file from storage:", deleteError);
          // Continue with database update even if file deletion fails
        }
      }

      // Update vendor registration to remove business logo URL
      const { error: updateError } = await supabase
        .from("vendor_registrations")
        .update({
          business_logo_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendorId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Business logo removed successfully",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting business logo:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove business logo",
        variant: "destructive",
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadBusinessLogo,
    deleteBusinessLogo,
    uploading,
  };
};
