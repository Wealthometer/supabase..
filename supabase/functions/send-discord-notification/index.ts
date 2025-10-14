import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Deno } from "https://deno.land/std@0.168.0/node/global.ts" // Declare Deno variable

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface NotificationRequest {
  eventId: string
  webhookUrl: string
  channelId?: string
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { eventId, webhookUrl, channelId }: NotificationRequest = await req.json()

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      throw new Error("Event not found")
    }

    // Format the notification message
    const startTime = new Date(event.start_time)
    const endTime = new Date(event.end_time)

    const message = {
      embeds: [
        {
          title: `📅 Event Reminder: ${event.title}`,
          description: event.description || "No description provided",
          color: 0x2563eb, // Blue color
          fields: [
            {
              name: "📆 Date",
              value: startTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              inline: false,
            },
            {
              name: "🕐 Time",
              value: `${startTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })} - ${endTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}`,
              inline: true,
            },
            ...(event.location
              ? [
                  {
                    name: "📍 Location",
                    value: event.location,
                    inline: true,
                  },
                ]
              : []),
          ],
          timestamp: startTime.toISOString(),
          footer: {
            text: "EventSync Notification",
          },
        },
      ],
    }

    // Send to Discord webhook
    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    })

    if (!discordResponse.ok) {
      throw new Error(`Discord API error: ${discordResponse.statusText}`)
    }

    // If channelId is provided and we have a bot token, send to specific channel
    if (channelId && Deno.env.get("DISCORD_BOT_TOKEN")) {
      const channelResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${Deno.env.get("DISCORD_BOT_TOKEN")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `**Reminder:** Event "${event.title}" starts at ${startTime.toLocaleTimeString()}`,
        }),
      })

      if (!channelResponse.ok) {
        console.error("Failed to send to Discord channel:", await channelResponse.text())
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Error sending Discord notification:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
