import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking for sessions starting in ~30 minutes...");

    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const thirtyFiveMinutesFromNow = new Date(now.getTime() + 35 * 60 * 1000);

    // Find sessions scheduled to start in 30-35 minutes that haven't had reminders sent
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, title, description, scheduled_at, host_id")
      .eq("status", "scheduled")
      .is("reminder_sent_at", null)
      .gte("scheduled_at", thirtyMinutesFromNow.toISOString())
      .lte("scheduled_at", thirtyFiveMinutesFromNow.toISOString());

    if (sessionsError) {
      console.error("Failed to fetch sessions:", sessionsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch sessions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!sessions || sessions.length === 0) {
      console.log("No sessions need reminders");
      return new Response(
        JSON.stringify({ success: true, message: "No sessions need reminders" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${sessions.length} sessions needing reminders`);

    let totalSent = 0;
    let totalFailed = 0;

    for (const session of sessions) {
      // Get host profile
      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", session.host_id)
        .maybeSingle();

      const hostName = hostProfile?.full_name || "The host";

      // Get all participants for this session
      const { data: participants } = await supabase
        .from("participants")
        .select("user_id")
        .eq("session_id", session.id);

      // Collect all user IDs to notify (participants + host)
      const userIds = new Set<string>();
      if (hostProfile?.email) {
        userIds.add(session.host_id);
      }
      participants?.forEach(p => userIds.add(p.user_id));

      if (userIds.size === 0) {
        console.log(`No users to notify for session ${session.id}`);
        continue;
      }

      // Get profiles for all users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email, full_name, user_id")
        .in("user_id", Array.from(userIds));

      if (!profiles || profiles.length === 0) {
        console.log(`No profiles found for session ${session.id}`);
        continue;
      }

      // Format scheduled date
      const scheduledDate = new Date(session.scheduled_at!).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Send reminder emails
      const emailPromises = profiles.map(profile => {
        const isHost = profile.user_id === session.host_id;
        return resend.emails.send({
          from: "EngageLens <onboarding@resend.dev>",
          to: [profile.email],
          subject: `Reminder: "${session.title}" starts in 30 minutes`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a1a; margin-bottom: 20px;">⏰ Session Starting Soon</h2>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hello ${profile.full_name || 'there'},
              </p>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                ${isHost 
                  ? "Your session is starting in approximately 30 minutes!" 
                  : `A session hosted by ${hostName} is starting in approximately 30 minutes!`}
              </p>
              
              <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; color: #1a1a1a;"><strong>Session:</strong> ${session.title}</p>
                ${session.description ? `<p style="margin: 0 0 8px 0; color: #4a4a4a;">${session.description}</p>` : ''}
                <p style="margin: 0; color: #1a1a1a;"><strong>Starts at:</strong> ${scheduledDate}</p>
              </div>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                ${isHost 
                  ? "Make sure you're ready to start the session and track participant engagement."
                  : "Make sure your camera is ready for engagement tracking."}
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;" />
              
              <p style="color: #888; font-size: 14px;">
                This is an automated reminder from EngageLens.
              </p>
            </div>
          `,
        });
      });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      totalSent += successful;
      totalFailed += failed;

      console.log(`Session ${session.id}: ${successful} sent, ${failed} failed`);

      // Mark reminder as sent
      await supabase
        .from("sessions")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", session.id);
    }

    console.log(`Total reminders sent: ${totalSent}, failed: ${totalFailed}`);

    return new Response(
      JSON.stringify({ success: true, sent: totalSent, failed: totalFailed, sessions: sessions.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-session-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
