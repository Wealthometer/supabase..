import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Deno } from "https://deno.land/std@0.168.0/node/deno.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get current time and 15 minutes from now
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    // Find events starting in the next 15 minutes
    const { data: upcomingEvents, error: eventsError } = await supabaseClient
      .from("events")
      .select("*, user_preferences!events_created_by_fkey(discord_webhook_url)")
      .gte("start_time", now.toISOString())
      .lte("start_time", fifteenMinutesFromNow.toISOString());

    if (eventsError) {
      throw eventsError;
    }

    const results = [];

    for (const event of upcomingEvents || []) {
      // Check if notification already exists and was sent
      const { data: existingNotification } = await supabaseClient
        .from("notifications")
        .select("*")
        .eq("event_id", event.id)
        .eq("notification_type", "discord")
        .eq("sent", true)
        .single();

      if (existingNotification) {
        continue; // Skip if already sent
      }

      // Get user preferences for webhook URL
      const webhookUrl = event.user_preferences?.discord_webhook_url;

      if (!webhookUrl) {
        console.log(`No webhook URL for event ${event.id}`);
        continue;
      }

      try {
        // Send notification
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
              webhookUrl: webhookUrl,
              channelId: event.discord_channel_id,
            }),
          },
        );

        if (notificationResponse.ok) {
          // Create or update notification record
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
        console.error(`Error processing event ${event.id}:`, error);
        results.push({
          eventId: event.id,
          status: "error",
          error: error.message,
        });
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
    console.error("Error checking upcoming events:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
