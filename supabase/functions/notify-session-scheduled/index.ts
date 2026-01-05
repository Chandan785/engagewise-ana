import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SessionScheduledRequest {
  sessionId: string;
  hostId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sessionId, hostId }: SessionScheduledRequest = await req.json();

    console.log("Processing session scheduled notification:", { sessionId, hostId });

    // Get the new session details
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, title, description, scheduled_at")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Failed to fetch session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get host's profile
    const { data: hostProfile } = await supabase
      .from("profiles")
      .select("full_name, organization")
      .eq("user_id", hostId)
      .single();

    const hostName = hostProfile?.full_name || "A host";
    const organization = hostProfile?.organization;

    // Get all unique past participants from this host's sessions (excluding the host)
    const { data: pastParticipants, error: participantsError } = await supabase
      .from("participants")
      .select(`
        user_id,
        sessions!inner(host_id)
      `)
      .eq("sessions.host_id", hostId)
      .neq("user_id", hostId);

    if (participantsError) {
      console.error("Failed to fetch past participants:", participantsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch participants" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!pastParticipants || pastParticipants.length === 0) {
      console.log("No past participants to notify");
      return new Response(
        JSON.stringify({ success: true, message: "No past participants to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(pastParticipants.map(p => p.user_id))];

    // Get participant emails
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("email, full_name, user_id")
      .in("user_id", uniqueUserIds);

    if (profilesError || !profiles) {
      console.error("Failed to fetch participant profiles:", profilesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch participant profiles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending session scheduled emails to ${profiles.length} past participants`);

    // Format scheduled date
    const scheduledDate = session.scheduled_at 
      ? new Date(session.scheduled_at).toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : "To be announced";

    // Send emails to all past participants
    const emailPromises = profiles.map(profile =>
      resend.emails.send({
        from: "EngageLens <onboarding@resend.dev>",
        to: [profile.email],
        subject: `New Session: "${session.title}" by ${hostName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a1a; margin-bottom: 20px;">New Session Scheduled</h2>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              Hello ${profile.full_name || 'there'},
            </p>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              ${hostName}${organization ? ` from ${organization}` : ''} has scheduled a new session that you might be interested in!
            </p>
            
            <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; color: #1a1a1a;"><strong>Session:</strong> ${session.title}</p>
              ${session.description ? `<p style="margin: 0 0 8px 0; color: #4a4a4a;">${session.description}</p>` : ''}
              <p style="margin: 0; color: #1a1a1a;"><strong>Scheduled:</strong> ${scheduledDate}</p>
            </div>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
              You're receiving this email because you've previously participated in sessions hosted by ${hostName}.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
            
            <p style="color: #888; font-size: 14px;">
              This is an automated notification from EngageLens.
            </p>
          </div>
        `,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Emails sent: ${successful} successful, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: successful, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in notify-session-scheduled function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
