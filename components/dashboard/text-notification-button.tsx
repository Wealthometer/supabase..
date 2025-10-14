"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface TestNotificationButtonProps {
  eventId: string
}

export function TestNotificationButton({ eventId }: TestNotificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleTestNotification = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()

      // Get user preferences
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error("Not authenticated")
      }

      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("discord_webhook_url")
        .eq("user_id", userData.user.id)
        .single()

      if (!preferences?.discord_webhook_url) {
        setMessage("Please configure Discord webhook URL in Settings first")
        return
      }

      // Get event details
      const { data: event } = await supabase.from("events").select("discord_channel_id").eq("id", eventId).single()

      // Call the edge function
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-discord-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          eventId,
          webhookUrl: preferences.discord_webhook_url,
          channelId: event?.discord_channel_id,
        }),
      })

      if (response.ok) {
        setMessage("Test notification sent successfully!")
      } else {
        const error = await response.json()
        setMessage(`Failed to send notification: ${error.error}`)
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleTestNotification} disabled={isLoading} variant="outline" size="sm">
        <Bell className="mr-2 h-4 w-4" />
        {isLoading ? "Sending..." : "Test Discord Notification"}
      </Button>
      {message && (
        <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-destructive"}`}>{message}</p>
      )}
    </div>
  )
}
