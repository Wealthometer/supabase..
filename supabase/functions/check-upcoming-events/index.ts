// ✅ Modern imports
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ✅ Initialize Supabase client using environment vars
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get current time and 15 minutes from now
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    // Fetch upcoming events
    const { data: upcomingEvents, error: eventsError } = await supabaseClient
      .from("events")
      .select("*, user_preferences!events_created_by_fkey(discord_webhook_url)")
      .gte("start_time", now.toISOString())
      .lte("start_time", fifteenMinutesFromNow.toISOString());

    if (eventsError) throw eventsError;

    const results: any[] = [];

    for (const event of upcomingEvents || []) {
      // Skip if already sent
      const { data: existingNotification } = await supabaseClient
        .from("notifications")
        .select("*")
        .eq("event_id", event.id)
        .eq("notification_type", "discord")
        .eq("sent", true)
        .single();

      if (existingNotification) continue;

      const webhookUrl = event.user_preferences?.discord_webhook_url;
      if (!webhookUrl) {
        console.log(`No webhook URL for event ${event.id}`);
        continue;
      }

      try {
        // Trigger your send-discord-notification function
        const notificationResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-discord-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              eventId: event.id,
              webhookUrl,
              channelId: event.discord_channel_id,
            }),
          },
        );

        if (notificationResponse.ok) {
          await supabaseClient.from("notifications").upsert({
            event_id: event.id,
            notification_type: "discord",
            scheduled_time: event.start_time,
            sent: true,
            sent_at: now.toISOString(),
          });

          results.push({ eventId: event.id, status: "sent" });
        } else {
          const errorText = await notificationResponse.text();

          await supabaseClient.from("notifications").upsert({
            event_id: event.id,
            notification_type: "discord",
            scheduled_time: event.start_time,
            sent: false,
            error_message: errorText,
          });

          results.push({
            eventId: event.id,
            status: "failed",
            error: errorText,
          });
        }
      } catch (error) {
        const errMsg =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error(`Error processing event ${event.id}:`, errMsg);
        results.push({ eventId: event.id, status: "error", error: errMsg });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const errMsg =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error checking upcoming events:", errMsg);
    return new Response(JSON.stringify({ error: errMsg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
