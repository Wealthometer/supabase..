"use client";

import type React from "react";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface UserPreferences {
  user_id: string;
  discord_user_id: string | null;
  discord_webhook_url: string | null;
  google_calendar_enabled: boolean;
  notification_lead_time: string;
}

interface SettingsFormProps {
  userId: string;
  preferences: UserPreferences | null;
}

export function SettingsForm({ userId, preferences }: SettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    discord_webhook_url: preferences?.discord_webhook_url || "",
    discord_user_id: preferences?.discord_user_id || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    try {
      const { error: upsertError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: userId,
          discord_webhook_url: formData.discord_webhook_url || null,
          discord_user_id: formData.discord_user_id || null,
        });

      if (upsertError) throw upsertError;
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Discord Integration</CardTitle>
          <CardDescription>
            Configure Discord settings for event notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discord_webhook_url">Discord Webhook URL</Label>
            <Input
              id="discord_webhook_url"
              type="url"
              value={formData.discord_webhook_url}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discord_webhook_url: e.target.value,
                })
              }
              placeholder="https://discord.com/api/webhooks/..."
            />
            <p className="text-xs text-muted-foreground">
              Create a webhook in your Discord server settings to receive
              notifications
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discord_user_id">Discord User ID</Label>
            <Input
              id="discord_user_id"
              value={formData.discord_user_id}
              onChange={(e) =>
                setFormData({ ...formData, discord_user_id: e.target.value })
              }
              placeholder="123456789012345678"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Your Discord user ID for mentions
            </p>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">Settings saved successfully!</p>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
