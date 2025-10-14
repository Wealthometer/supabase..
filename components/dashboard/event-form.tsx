"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface EventFormProps {
  userId: string;
  event?: {
    id: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    location: string | null;
    discord_channel_id: string | null;
  };
}

export function EventForm({ userId, event }: EventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    start_time: event?.start_time
      ? new Date(event.start_time).toISOString().slice(0, 16)
      : "",
    end_time: event?.end_time
      ? new Date(event.end_time).toISOString().slice(0, 16)
      : "",
    location: event?.location || "",
    discord_channel_id: event?.discord_channel_id || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      if (event) {
        // Update existing event
        const { error: updateError } = await supabase
          .from("events")
          .update({
            title: formData.title,
            description: formData.description || null,
            start_time: new Date(formData.start_time).toISOString(),
            end_time: new Date(formData.end_time).toISOString(),
            location: formData.location || null,
            discord_channel_id: formData.discord_channel_id || null,
          })
          .eq("id", event.id)
          .eq("created_by", userId);

        if (updateError) throw updateError;
        router.push(`/dashboard/events/${event.id}`);
      } else {
        // Create new event
        const { data, error: insertError } = await supabase
          .from("events")
          .insert({
            title: formData.title,
            description: formData.description || null,
            start_time: new Date(formData.start_time).toISOString(),
            end_time: new Date(formData.end_time).toISOString(),
            location: formData.location || null,
            discord_channel_id: formData.discord_channel_id || null,
            created_by: userId,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        router.push(`/dashboard/events/${data.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Team Meeting"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What is this event about?"
              rows={4}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                required
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="datetime-local"
                required
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Conference Room A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discord_channel_id">Discord Channel ID</Label>
            <Input
              id="discord_channel_id"
              value={formData.discord_channel_id}
              onChange={(e) =>
                setFormData({ ...formData, discord_channel_id: e.target.value })
              }
              placeholder="123456789012345678"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Enter Discord channel ID to send notifications
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : event
                  ? "Update Event"
                  : "Create Event"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
