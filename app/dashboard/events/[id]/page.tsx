import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EventDetails } from "@/components/dashboard/event-details";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    redirect("/auth/login");
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("created_by", userData.user.id)
    .single();

  if (eventError || !event) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={userData.user} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <EventDetails event={event} userId={userData.user.id} />
        </div>
      </main>
    </div>
  );
}
