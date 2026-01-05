import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ConsentWithdrawalRequest {
  sessionId: string;
  participantUserId: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sessionId, participantUserId }: ConsentWithdrawalRequest = await req.json();

    console.log("Processing consent withdrawal notification:", { sessionId, participantUserId });

    // Get session details including host info
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, title, host_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Failed to fetch session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get host's profile (email)
    const { data: hostProfile, error: hostError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", session.host_id)
      .single();

    if (hostError || !hostProfile) {
      console.error("Failed to fetch host profile:", hostError);
      return new Response(
        JSON.stringify({ error: "Host profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get participant's profile
    const { data: participantProfile, error: participantError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", participantUserId)
      .single();

    if (participantError || !participantProfile) {
      console.error("Failed to fetch participant profile:", participantError);
      return new Response(
        JSON.stringify({ error: "Participant profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const participantName = participantProfile.full_name || participantProfile.email;
    const hostName = hostProfile.full_name || "Host";

    console.log("Sending email to host:", hostProfile.email);

    // Send email to host
    const emailResponse = await resend.emails.send({
      from: "EngageLens <onboarding@resend.dev>",
      to: [hostProfile.email],
      subject: `Consent Withdrawn: ${participantName} in "${session.title}"`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a; margin-bottom: 20px;">Consent Withdrawal Notification</h2>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Hello ${hostName},
          </p>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            A participant has withdrawn their consent for engagement tracking in your session.
          </p>
          
          <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; color: #1a1a1a;"><strong>Session:</strong> ${session.title}</p>
            <p style="margin: 0 0 8px 0; color: #1a1a1a;"><strong>Participant:</strong> ${participantName}</p>
            <p style="margin: 0; color: #1a1a1a;"><strong>Email:</strong> ${participantProfile.email}</p>
          </div>
          
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
            Engagement tracking data will no longer be collected for this participant during this session. They may rejoin the session to provide consent again if they choose.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
          
          <p style="color: #888; font-size: 14px;">
            This is an automated notification from EngageLens.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in notify-consent-withdrawal function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
