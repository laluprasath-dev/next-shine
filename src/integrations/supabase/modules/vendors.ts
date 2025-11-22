import { supabase } from "../client";

export interface VendorRegistration {
  id: string;
  user_id: string;
  personal_name: string;
  government_id_type?: "Aadhaar" | "Passport" | "VoterID" | "DriversLicense";
  government_id_number?: string;
  government_id_document_url?: string;
  business_name?: string;
  gst_certificate_url?: string;
  msme_or_udyam_url?: string;
  trade_license_url?: string;
  shop_certificate_url?: string;
  utility_bill_url?: string;
  rent_agreement_url?: string;
  property_tax_receipt_url?: string;
  account_holder_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  bank_proof_document_url?: string;
  mobile: string;
  is_mobile_verified: boolean;
  email: string;
  whatsapp_number?: string;
  business_logo_url?: string;
  categories: string[];
  category_specific_details: CategorySpecificDetails;
  branches: BranchInfo[];
  is_verified_by_admin: boolean;
  verified_at?: string;
  rejection_reason?: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  submitted_at?: string;
  last_updated_fields: string[];
  created_at: string;
  updated_at: string;
  step: string;
}

export interface VendorRegistrationHistory {
  id: string;
  vendor_registration_id: string;
  action_type: "submitted" | "approved" | "rejected" | "resubmitted";
  action_by?: string;
  action_date: string;
  details?: any;
  rejection_reason?: string;
  changes_made?: any;
}

export interface VendorUpdateRequest {
  id: string;
  vendor_registration_id: string;
  request_type: "add_category" | "add_branch" | "update_details";
  requested_changes: any;
  current_data: any;
  status: "pending" | "approved" | "rejected";
  requested_by: string;
  reviewed_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
}

export interface CategorySpecificDetails {
  shop?: {
    productCatalogUrl?: string;
    brandCertificateUrl?: string;
    returnPolicyUrl?: string;
  };
  vehicle?: {
    rcDocumentUrl?: string;
    dealershipLicenseUrl?: string;
    aviationOrMarineLicenseUrl?: string;
  };
  service?: {
    centerPhotosUrl?: string;
    certificationUrls?: string[];
    insuranceProofUrl?: string;
  };
  simRacing?: {
    hardwareProofUrl?: string;
    eventLicenseUrl?: string;
    pastEventMediaUrls?: string[];
  };
  events?:{
    eventLicenseUrl?: string;
    pastEventMediaUrls?: string[];
  }
}

export interface BranchInfo {
  branchName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  branchProofs?: {
    utilityBillUrl?: string;
    rentAgreementUrl?: string;
    propertyTaxReceiptUrl?: string;
  };
}

export interface VendorRegistrationInput {
  personal_name: string;
  government_id_type?: "Aadhaar" | "Passport" | "VoterID" | "DriversLicense";
  government_id_number?: string;
  government_id_document_url?: string;
  business_name?: string;
  gst_certificate_url?: string;
  msme_or_udyam_url?: string;
  trade_license_url?: string;
  shop_certificate_url?: string;
  utility_bill_url?: string;
  rent_agreement_url?: string;
  property_tax_receipt_url?: string;
  account_holder_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  bank_proof_document_url?: string;
  mobile: string;
  email: string;
  whatsapp_number?: string;
  business_logo_url?: string;
  categories: string[];
  category_specific_details?: CategorySpecificDetails;
  branches?: BranchInfo[];
  user_id: string;
}

export const sendVendorEmail = async (
  vendorEmail: string,
  vendorName: string,
  businessName?: string,
  emailType?: 'processing' | 'approval' | 'rejection' |"step one" |"step two" | "step rejection" |"step approval" | "vendor approval",
  requestType?: string,
  reason?: string
) => {
  try {
    const { data, error } = await supabase.functions.invoke(
      "send-vendor-email",
      {
        body: {
          vendorEmail,
          vendorName,
          businessName,
          emailType,
          requestType,
          reason,
        },
      }
    );

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error sending vendor email:", error);
    throw error;
  }
};

export const vendorApi = {
  // Get vendor registration by user ID - updated to handle multiple records
  getByUserId: async (userId: string) => {
    const { data, error } = await supabase
      .from("vendor_registrations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    // Return the most recent record or null if none found
    return {
      data: data && data.length > 0 ? data[0] : null,
      error:
        data && data.length === 0
          ? { code: "PGRST116", message: "No records found" }
          : error,
    };
  },

  // Create Step 1 vendor registration
  createStepOne: async (registration: any) => {
    const { data, error } = await supabase
      .from("vendor_registrations")
      .insert({
        user_id: registration.user_id,
        personal_name: registration.personal_name,
        mobile: registration.mobile,
        email: registration.email,
        whatsapp_number: registration.whatsapp_number || null,
        categories: registration.categories,
        category_specific_details:registration.category_specific_details,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        step: "1",
      })
      .select()
      .single();
      try {
          await sendVendorEmail(
            registration.email,
            registration.personal_name,
            "not verified",
            'step one',
            "registration"
          );
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
        }
    return {data,error};
  },

  // Update Step 2 vendor registration
  updateStepTwo: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from("vendor_registrations")
      .update({
        ...updates,
        status: "under_review",
        submitted_at: new Date().toISOString(),
        step: "2",
        updated_at: new Date().toISOString(),
        rejection_reason:null,
        is_verified_by_admin: false // Reset approval status for Step 2 review
      })
      .eq("id", id)
      .select()
      .single();

      try {
          await sendVendorEmail(
            data.email,
            data.personal_name,
            updates.business_name,
            'step two',
            "registration"
          );
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError);
        }
    
    return { data, error };
  },

  // Create vendor registration (legacy - for backward compatibility)
  create: async (registration: VendorRegistrationInput) => {
    const { data, error } = await supabase
      .from("vendor_registrations")
      .insert({
        ...registration,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },

  // Update vendor registration (for reapplication)
  update: async (
    id: string,
    updates: Partial<VendorRegistrationInput>,
    updatedFields?: string[]
  ) => {
    const { data, error } = await supabase
      .from("vendor_registrations")
      .update({
        ...updates,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        last_updated_fields: updatedFields || [],
        rejection_reason: null,
        is_verified_by_admin: false,
      })
      .eq("id", id)
      .select()
      .single();

    return { data, error };
  },

  // Get vendor registration history
  getHistory: async (vendorRegistrationId: string) => {
    const { data, error } = await supabase
      .from("vendor_registration_history")
      .select(
        `
        *,
        action_by_profile:profiles!action_by(full_name, username)
      `
      )
      .eq("vendor_registration_id", vendorRegistrationId)
      .order("action_date", { ascending: false });

    return { data, error };
  },

  // Create update request for approved vendors
  createUpdateRequest: async (
    request: Omit<
      VendorUpdateRequest,
      "id" | "status" | "created_at" | "updated_at"
    >
  ) => {
    const { data, error } = await supabase
      .from("vendor_update_requests")
      .insert(request)
      .select(
        `
        *,
        vendor_registration:vendor_registrations(
          business_name,
          personal_name,
          email
        )
      `
      )
      .single();

    if (data && data.vendor_registration) {
      try {
        await sendVendorEmail(
          data.vendor_registration.email,
          data.vendor_registration.personal_name,
          data.vendor_registration.business_name,
          "processing",
          data.request_type
        );
      } catch (emailError) {
        console.error("Failed to send processing email:", emailError);
      }
    }

    return { data, error };
  },

  // Get update requests for a vendor
  getUpdateRequests: async (vendorRegistrationId: string) => {
    const { data, error } = await supabase
      .from("vendor_update_requests")
      .select("*")
      .eq("vendor_registration_id", vendorRegistrationId)
      .order("created_at", { ascending: false });

    return { data, error };
  },

  // Admin functions
  admin: {
    // Get all vendor registrations with enhanced details
    getAll: async () => {
      const { data, error } = await supabase
        .from("vendor_registrations")
        .select(
          `
          *,
          profiles:user_id(
            full_name,
            username,
            avatar_url
          )
        `
        )
        .order("created_at", { ascending: false });

      return { data, error };
    },

    // Get all update requests
    getAllUpdateRequests: async () => {
      const { data, error } = await supabase
        .from("vendor_update_requests")
        .select(
          `
          *,
          vendor_registration:vendor_registrations(
            business_name,
            personal_name,
            email
          ),
          requester:profiles!requested_by(
            full_name,
            username
          )
        `
        )
        .order("created_at", { ascending: false });

      return { data, error };
    },

    // Approve Step 1
    approveStepOne: async (id: string) => {
      const { data, error } = await supabase
        .from("vendor_registrations")
        .update({
          status: "approved",
          verified_at: new Date().toISOString(),
          rejection_reason: null,
          is_verified_by_admin: true,
        })
        .eq("id", id)
        .select()
        .single();

      return { data, error };
    },

    // Reject Step 1
    rejectStepOne: async (id: string, reason: string) => {
      const { data, error } = await supabase
        .from("vendor_registrations")
        .update({
          status: "rejected",
          rejection_reason: reason,
          verified_at: null,
          is_verified_by_admin: false,
        })
        .eq("id", id)
        .select()
        .single();

      return { data, error };
    },

    // Approve vendor registration (Step 2) - Updated to only grant vendor access for Step 2
    approve: async (id: string) => {
      const { data, error } = await supabase
        .from("vendor_registrations")
        .update({
          is_verified_by_admin: true,
          verified_at: new Date().toISOString(),
          rejection_reason: null,
          status: "approved",
        })
        .eq("id", id)
        .select()
        .single();

      return { data, error };
    },

    // Reject vendor registration (Step 2)
    reject: async (id: string, reason: string) => {
      const { data, error } = await supabase
        .from("vendor_registrations")
        .update({
          is_verified_by_admin: false,
          verified_at: null,
          rejection_reason: reason,
          status: "rejected",
        })
        .eq("id", id)
        .select()
        .single();

      return { data, error };
    },

    // Approve update request - Fixed to properly merge data
    approveUpdateRequest: async (
      requestId: string,
      vendorRegistrationId: string,
      requestedChanges: any
    ) => {
      // Get request details for email
      const { data: requestData } = await supabase
        .from("vendor_update_requests")
        .select(
          `
          *,
          vendor_registration:vendor_registrations(
            business_name,
            personal_name,
            email,
            categories,
            branches,
            category_specific_details
          )
        `
        )
        .eq("id", requestId)
        .single();

      // First approve the update request
      const { error: requestError } = await supabase
        .from("vendor_update_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (requestError) return { error: requestError };

      // Get current vendor data
      const { data: currentVendor } = await supabase
        .from("vendor_registrations")
        .select("*")
        .eq("id", vendorRegistrationId)
        .single();

      if (!currentVendor) return { error: new Error("Vendor not found") };

      // Prepare merged data based on request type
      let mergedData: any = {};

      switch (requestData?.request_type) {
        case "add_category":
          // Merge categories
          const existingCategories = currentVendor.categories || [];
          const newCategories = requestedChanges.categories || [];
          const mergedCategories = [
            ...new Set([...existingCategories, ...newCategories]),
          ];

          // Merge category specific details
          const existingCategoryDetails =
            currentVendor.category_specific_details || {};
          const newCategoryDetails =
            requestedChanges.category_specific_details || {};

          mergedData = {
            categories: mergedCategories,
            category_specific_details: {
              ...existingCategoryDetails,
              ...newCategoryDetails,
            },
          };
          break;

        case "add_branch":
          // Merge branches
          const existingBranches = currentVendor.branches || [];
          const newBranches = requestedChanges.branches || [];

          mergedData = {
            branches: [...existingBranches, ...newBranches],
          };
          break;

        case "update_details":
          // For update details, apply all changes except justification
          const { justification, ...updateData } = requestedChanges;
          mergedData = updateData;
          break;

        default:
          mergedData = requestedChanges;
      }

      // Apply the changes to the vendor registration
      const { data, error } = await supabase
        .from("vendor_registrations")
        .update({
          ...mergedData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendorRegistrationId)
        .select()
        .single();

      // Send approval email
      if (requestData && requestData.vendor_registration) {
        try {
          await sendVendorEmail(
            requestData.vendor_registration.email,
            requestData.vendor_registration.personal_name,
            requestData.vendor_registration.business_name,
            "approval",
            requestData.request_type
          );
        } catch (emailError) {
          console.error("Failed to send approval email:", emailError);
        }
      }

      return { data, error };
    },

    // Reject update request
    rejectUpdateRequest: async (requestId: string, reason: string) => {
      // Get request details for email
      const { data: requestData } = await supabase
        .from("vendor_update_requests")
        .select(
          `
          *,
          vendor_registration:vendor_registrations(
            business_name,
            personal_name,
            email
          )
        `
        )
        .eq("id", requestId)
        .single();

      const { data, error } = await supabase
        .from("vendor_update_requests")
        .update({
          status: "rejected",
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      // Send rejection email
      if (requestData && requestData.vendor_registration) {
        try {
          await sendVendorEmail(
            requestData.vendor_registration.email,
            requestData.vendor_registration.personal_name,
            requestData.vendor_registration.business_name,
            "rejection",
            requestData.request_type,
            reason
          );
        } catch (emailError) {
          console.error("Failed to send rejection email:", emailError);
        }
      }

      return { data, error };
    },
  },
};
