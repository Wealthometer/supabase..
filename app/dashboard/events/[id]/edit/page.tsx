import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EventForm } from "@/components/dashboard/event-form"

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    redirect("/auth/login")
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("created_by", userData.user.id)
    .single()

  if (eventError || !event) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={userData.user} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Edit Event</h1>
          <EventForm userId={userData.user.id} event={event} />
        </div>
      </main>
    </div>
  )
}
