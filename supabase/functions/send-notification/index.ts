import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_id: string;
  notification_id: string;
  email: string;
  phone?: string;
  type: 'product_purchase' | 'product_update' | 'order_status';
  title: string;
  message: string;
  data: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, ...notificationData } = await req.json();
    console.log("Received notification request for user:", user_id);

    // Get user profile data including mobile phone
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user_id}&select=mobile_phone`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      }
    });

    const profileData = await profileResponse.json();
    const userProfile = profileData[0];
    const phone = userProfile?.mobile_phone;

    const notification = { 
      user_id, 
      phone,
      ...notificationData 
    } as NotificationRequest;

    // Send Email Notification
    if (notification.email) {
      try {
        const emailHtml = generateEmailTemplate(notification);
        
        const emailResponse = await resend.emails.send({
          from: "Shining Motors <noreply@shiningmotors.com>",
          to: [notification.email],
          subject: notification.title,
          html: emailHtml,
        });

        console.log("Email sent successfully:", emailResponse);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    // Send SMS Notification (using Twilio or similar service)
    if (notification.phone) {
      try {
        // Note: You'll need to configure Twilio or another SMS service
        console.log("SMS would be sent to:", notification.phone);
        console.log("SMS message:", notification.message);
        
        // Example Twilio integration (commented out - requires Twilio credentials)
        /*
        const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
        const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
        const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
        
        if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
          const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: twilioPhoneNumber,
              To: notification.phone,
              Body: `${notification.title}\n\n${notification.message}`,
            }),
          });
          
          const smsResult = await smsResponse.json();
          console.log("SMS sent successfully:", smsResult);
        }
        */
      } catch (smsError) {
        console.error("Error sending SMS:", smsError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notifications sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateEmailTemplate(notification: NotificationRequest): string {
  const { type, title, message, data } = notification;
  
  let productInfo = '';
  let actionButton = '';
  
  if (data.product_name) {
    productInfo = `
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Product Details</h3>
        <p style="margin: 0; font-weight: bold; color: #34495e;">${data.product_name}</p>
        ${data.order_id ? `<p style="margin: 5px 0 0 0; color: #7f8c8d; font-size: 14px;">Order ID: ${data.order_id}</p>` : ''}
      </div>
    `;
  }

  if (type === 'product_purchase') {
    actionButton = `
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://shiningmotors.com/orders" 
           style="background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          View Order Details
        </a>
      </div>
    `;
  } else if (type === 'product_update') {
    actionButton = `
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://shiningmotors.com/products/${data.product_id}" 
           style="background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          View Product
        </a>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            Shining Motors
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 16px;">
            Your Automotive Partner
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">
            ${title}
          </h2>
          
          <p style="color: #34495e; line-height: 1.6; font-size: 16px; margin: 0 0 20px 0;">
            ${message}
          </p>

          ${productInfo}
          ${actionButton}

          <div style="border-top: 1px solid #ecf0f1; padding-top: 20px; margin-top: 30px;">
            <p style="color: #7f8c8d; font-size: 14px; margin: 0 0 10px 0;">
              Thank you for choosing Shining Motors. We're committed to providing you with the best automotive experience.
            </p>
            <p style="color: #95a5a6; font-size: 12px; margin: 0;">
              If you have any questions, please contact our support team at support@shiningmotors.com
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #34495e; padding: 20px; text-align: center;">
          <p style="color: #bdc3c7; margin: 0; font-size: 14px;">
            © 2024 Shining Motors. All rights reserved.
          </p>
          <p style="color: #95a5a6; margin: 5px 0 0 0; font-size: 12px;">
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);