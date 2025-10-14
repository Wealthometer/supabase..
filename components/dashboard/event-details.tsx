"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { TestNotificationButton } from "./test-notification-button";

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  discord_channel_id: string | null;
  google_calendar_event_id: string | null;
  created_at: string;
}

interface EventDetailsProps {
  event: Event;
  userId: string;
}

export function EventDetails({ event, userId }: EventDetailsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", event.id)
      .eq("created_by", userId);

    if (!error) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/events/${event.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this event? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Date</p>
              <p className="text-muted-foreground">
                {format(parseISO(event.start_time), "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Time</p>
              <p className="text-muted-foreground">
                {format(parseISO(event.start_time), "h:mm a")} -{" "}
                {format(parseISO(event.end_time), "h:mm a")}
              </p>
            </div>
          </div>

          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">{event.location}</p>
              </div>
            </div>
          )}

          {event.description && (
            <div>
              <p className="font-medium mb-2">Description</p>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="font-medium mb-3">Integrations</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {event.discord_channel_id ? (
                <Badge variant="secondary">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  Discord Notifications Enabled
                </Badge>
              ) : (
                <Badge variant="outline">Discord Not Configured</Badge>
              )}
              {event.google_calendar_event_id ? (
                <Badge variant="secondary">
                  <Calendar className="mr-1 h-3 w-3" />
                  Synced to Google Calendar
                </Badge>
              ) : (
                <Badge variant="outline">Google Calendar Not Synced</Badge>
              )}
            </div>
            <TestNotificationButton eventId={event.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
