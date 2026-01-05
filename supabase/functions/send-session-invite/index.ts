import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  sessionId: string;
  emails: string[];
  hostName: string;
  sessionTitle: string;
  sessionDescription?: string;
  scheduledAt?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, emails, hostName, sessionTitle, sessionDescription, scheduledAt }: InviteRequest = await req.json();

    if (!sessionId || !emails || emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "Session ID and emails are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emails.filter(email => emailRegex.test(email.trim()));

    if (validEmails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid email addresses provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const joinLink = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/join/${sessionId}`;
    
    // Format scheduled time if provided
    let scheduledText = "";
    if (scheduledAt) {
      const date = new Date(scheduledAt);
      scheduledText = `<p style="color: #666; margin: 10px 0;"><strong>Scheduled for:</strong> ${date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>`;
    }

    const results = [];

    for (const email of validEmails) {
      try {
        const emailResponse = await resend.emails.send({
          from: "FocusTrack <onboarding@resend.dev>",
          to: [email.trim()],
          subject: `You're invited to join: ${sessionTitle}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #8b5cf6; }
                .card { background: #f8f9fa; border-radius: 12px; padding: 30px; margin: 20px 0; }
                .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { text-align: center; color: #888; font-size: 12px; margin-top: 40px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">FocusTrack</div>
                </div>
                
                <h2>You're Invited! 🎉</h2>
                
                <p><strong>${hostName}</strong> has invited you to join an engagement tracking session.</p>
                
                <div class="card">
                  <h3 style="margin-top: 0; color: #8b5cf6;">${sessionTitle}</h3>
                  ${sessionDescription ? `<p style="color: #666;">${sessionDescription}</p>` : ''}
                  ${scheduledText}
                </div>
                
                <p>Click the button below to join the session. You'll need to sign in or create an account to participate.</p>
                
                <div style="text-align: center;">
                  <a href="${joinLink}" class="button">Join Session</a>
                </div>
                
                <p style="color: #888; font-size: 14px;">Or copy this link: ${joinLink}</p>
                
                <div class="footer">
                  <p>FocusTrack - Real-time engagement analytics</p>
                  <p>This invitation was sent by ${hostName}.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        results.push({ email, success: true });
      } catch (emailError: any) {
        console.error(`Failed to send to ${email}:`, emailError);
        results.push({ email, success: false, error: emailError.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successCount} of ${validEmails.length} invitations`,
        results 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-session-invite function:", error);
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
