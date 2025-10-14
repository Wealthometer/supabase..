import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EventForm } from "@/components/dashboard/event-form"

export default async function NewEventPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={data.user} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Create New Event</h1>
          <EventForm userId={data.user.id} />
        </div>
      </main>
    </div>
  )
}
