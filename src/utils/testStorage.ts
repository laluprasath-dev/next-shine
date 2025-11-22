import { supabase } from "@/integrations/supabase/client";

export const testVendorStorage = async () => {
  try {
    console.log("Testing vendor storage bucket...");

    // Test if we can list files in the vendor bucket
    const { data, error } = await supabase.storage
      .from("vendor")
      .list("", { limit: 1 });

    if (error) {
      console.error("Storage bucket error:", error);
      if (
        error.message.includes("bucket") ||
        error.message.includes("not found")
      ) {
        console.error(
          "Vendor storage bucket does not exist. Please run the migration to create it."
        );
      }
      return false;
    }

    console.log("Vendor storage bucket is accessible");
    return true;
  } catch (error) {
    console.error("Storage test failed:", error);
    return false;
  }
};

export const testFileUpload = async (file: File, vendorId: string) => {
  try {
    const fileName = `${vendorId}/test-${Date.now()}.${file.name
      .split(".")
      .pop()}`;

    console.log("Testing file upload:", {
      fileName,
      fileSize: file.size,
      fileType: file.type,
    });

    const { error } = await supabase.storage
      .from("vendor")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Upload test failed:", error);
      return false;
    }

    console.log("Upload test successful");
    return true;
  } catch (error) {
    console.error("Upload test error:", error);
    return false;
  }
};
