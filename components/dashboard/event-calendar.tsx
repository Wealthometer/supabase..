"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  description: string | null;
}

interface EventCalendarProps {
  userId: string;
}

export function EventCalendar({ userId }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [currentDate, userId]);

  const loadEvents = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("created_by", userId)
      .gte("start_time", monthStart.toISOString())
      .lte("start_time", monthEnd.toISOString())
      .order("start_time", { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setIsLoading(false);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(parseISO(event.start_time), day));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{format(currentDate, "MMMM yyyy")}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 border rounded-lg p-2 ${
                  !isCurrentMonth ? "bg-muted/50" : ""
                } ${isCurrentDay ? "border-primary" : ""}`}
              >
                <div
                  className={`text-sm font-medium mb-1 ${isCurrentDay ? "text-primary" : ""}`}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <Link
                      key={event.id}
                      href={`/dashboard/events/${event.id}`}
                      className="block"
                    >
                      <Badge
                        variant="secondary"
                        className="w-full text-xs truncate cursor-pointer hover:bg-secondary/80"
                      >
                        {format(parseISO(event.start_time), "HH:mm")}{" "}
                        {event.title}
                      </Badge>
                    </Link>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
