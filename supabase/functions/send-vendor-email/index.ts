
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VendorEmailRequest {
  vendorEmail: string;
  vendorName: string;
  businessName?: string;
  emailType: 'processing' | 'approval' | 'rejection';
  requestType?: string;
  reason?: string;
}

const getEmailContent = (emailType: string, data: VendorEmailRequest) => {
  const companyFooter = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
      <p><strong>Moto Revolution</strong></p>
      <p>Leading Motorcycle & Automotive Platform</p>
      <p>Email: support@motorevolution.com | Phone: +91-XXXXXXXXXX</p>
      <p>© 2024 Moto Revolution. All rights reserved.</p>
    </div>
  `;

  switch (emailType) {
    case 'processing':
      return {
        subject: `Update Request Received - ${data.businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Update Request Received</h2>
            <p>Dear ${data.vendorName},</p>
            <p>We have received your update request for <strong>${data.businessName}</strong>.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #495057;">Request Details:</h3>
              <p style="margin: 5px 0;"><strong>Request Type:</strong> ${data.requestType?.replace('_', ' ') || 'Update Request'}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> Under Review</p>
            </div>
            <p>Our admin team will review your request and get back to you within 2-3 business days.</p>
            <p>You can track the status of your request in your vendor dashboard.</p>
            <p>Best regards,<br>The Moto Revolution Team</p>
            ${companyFooter}
          </div>
        `,
      };
      
    case 'approval':
      return {
        subject: `Update Request Approved - ${data.businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Update Request Approved! 🎉</h2>
            <p>Dear ${data.vendorName},</p>
            <p>Great news! Your update request for <strong>${data.businessName}</strong> has been approved.</p>
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="margin: 0 0 10px 0; color: #155724;">Request Details:</h3>
              <p style="margin: 5px 0;"><strong>Request Type:</strong> ${data.requestType?.replace('_', ' ') || 'Update Request'}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> Approved</p>
            </div>
            <p>The changes have been applied to your vendor profile and are now live on the platform.</p>
            <p>You can view the updated information in your vendor dashboard.</p>
            <p>Thank you for keeping your information up to date!</p>
            <p>Best regards,<br>The Moto Revolution Team</p>
            ${companyFooter}
          </div>
        `,
      };
      
    case 'rejection':
      return {
        subject: `Update Request Rejected - ${data.businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Update Request Rejected</h2>
            <p>Dear ${data.vendorName},</p>
            <p>We regret to inform you that your update request for <strong>${data.businessName}</strong> has been rejected.</p>
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h3 style="margin: 0 0 10px 0; color: #721c24;">Request Details:</h3>
              <p style="margin: 5px 0;"><strong>Request Type:</strong> ${data.requestType?.replace('_', ' ') || 'Update Request'}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> Rejected</p>
              ${data.reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
            </div>
            <p>You can submit a new update request with the necessary corrections through your vendor dashboard.</p>
            <p>If you have any questions or need clarification, please contact our support team.</p>
            <p>Best regards,<br>The Moto Revolution Team</p>
            ${companyFooter}
          </div>
        `,
      };
      case 'step one':
      return {
        subject: `Step One - seller Request Received - Seller Registration`,
        html: `
         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #28a745;">Seller Request Received</h2>
  <p>Dear ${data.vendorName},</p>
  <p>Thank you for your interest in joining Shining Motors.</p>
  <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
    <h3 style="margin: 0 0 10px 0; color: #155724;">Request Details:</h3>
    <p style="margin: 5px 0;"><strong>Request Type:</strong> Seller Registration</p>
    <p style="margin: 5px 0;"><strong>Status:</strong> Received</p>
  </div>
  <p>Your request has been successfully received and is now under review by our team.</p>
  <p>We will verify the details and get back to you within a few business days with an update.</p>
  <p>If you have any questions in the meantime, feel free to contact our support team.</p>
  <p>Best regards,<br>The Shining Motors Team</p>
  ${companyFooter}
</div>
        `,
      };
      case 'step two':
      return {
        subject: `Step Two - Seller Request Received - ${data.businessName}`,
        html: `
       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #28a745;">Seller Request Received</h2>
  <p>Dear ${data.vendorName},</p>
  <p>Thank you for your interest in joining Shining Motors</p>
  <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
    <h3 style="margin: 0 0 10px 0; color: #155724;">Request Details:</h3>
    <p style="margin: 5px 0;"><strong>Request Type:</strong> ${data.requestType?.replace('_', ' ') || 'Seller Registration'}</p>
    <p style="margin: 5px 0;"><strong>Status:</strong> Received</p>
  </div>
  <p>Your request has been successfully received and is now under review by our team.</p>
  <p>We will verify the details and get back to you within a few business days with an update.</p>
  <p>If you have any questions in the meantime, feel free to contact our support team.</p>
  <p>Best regards,<br>The shining motors Team</p>
  ${companyFooter}
</div>anyFooter}
</div>
        `,
      };
      case "step approval":
        return {
            subject:`Step Update - Seller Request Approved`,
            html:`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #28a745;">Seller Request Approved</h2>
  <p>Dear ${data.vendorName},</p>
  <p>We’re pleased to inform you that your recent request has been successfully reviewed and approved by our team.</p>
  <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
    <h3 style="margin: 0 0 10px 0; color: #155724;">Request Details:</h3>
    <p style="margin: 5px 0;"><strong>Request Type:</strong> ${data.requestType?.replace('_', ' ') || 'Update Request'}</p>
    <p style="margin: 5px 0;"><strong>Status:</strong> Approved</p>
  </div>
  <p>You can now proceed with the next steps</p>
  <p>If you have any questions or need assistance, our support team is always here to help.</p>
  <p>Best regards,<br>The Moto Revolution Team</p>
  ${companyFooter}
</div>`
        }
      case 'vendor approval':
        return {
            subject:`Welcome Aboard - Vendor Approval Confirmed for ${data.businessName}`,
            html:`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #28a745;">Your Vendor Account is Approved!</h2>
  <p>Dear ${data.vendorName},</p>
  <p>We’re excited to inform you that your vendor registration for <strong>${data.businessName}</strong> has been successfully reviewed and approved.</p>
  <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
    <h3 style="margin: 0 0 10px 0; color: #155724;">Account Status:</h3>
    <p style="margin: 5px 0;"><strong>Request Type:</strong> Vendor Registration</p>
    <p style="margin: 5px 0;"><strong>Status:</strong> Approved</p>
  </div>
  <p>You can now log in to your vendor dashboard and start listing your products, managing orders, and exploring all the features available to you.</p>
  <p><a href="${""}" style="background-color: #28a745; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
  <p>If you have any questions or need help getting started, don’t hesitate to reach out to our support team.</p>
  <p>Welcome to the Moto Revolution community!</p>
  <p>Best regards,<br>The Moto Revolution Team</p>
  ${companyFooter}
</div>
            `
        }
      case 'step rejection':
      return {
        subject: `Step Update - Seller Request Rejected ${data.businessName?`- ${data.businessName}`:''}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Request Rejected</h2>
            <p>Dear ${data.vendorName},</p>
            <p>We regret to inform you that your update request for <strong>${data.businessName || 'registration'}</strong> has been rejected.</p>
            <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
              <h3 style="margin: 0 0 10px 0; color: #721c24;">Request Details:</h3>
              <p style="margin: 5px 0;"><strong>Request Type:</strong> ${data.requestType?.replace('_', ' ') || 'Registration'}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> Rejected</p>
              ${data.reason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${data.reason}</p>` : ''}
            </div>
            <p>You can submit a new update request with the necessary corrections through your vendor dashboard.</p>
            <p>If you have any questions or need clarification, please contact our support team.</p>
            <p>Best regards,<br>The Shining Motors Team</p>
            ${companyFooter}
          </div>
        `,
      };
    default:
      throw new Error('Invalid email type');
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend("re_bba4vuXm_2xo4ewXMN1Dy29HKDkevA1ke");
    const body: VendorEmailRequest = await req.json();
    
    if (!body.vendorEmail || !body.vendorName || !body.businessName || !body.emailType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailContent = getEmailContent(body.emailType, body);

    const emailResponse = await resend.emails.send({
      from: "shining motors <onboarding@resend.dev>",
      to: ["alpinedev2025@gmail.com"],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Vendor email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailId: emailResponse.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-vendor-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
