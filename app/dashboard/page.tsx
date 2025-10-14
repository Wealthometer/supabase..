import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { EventCalendar } from "@/components/dashboard/event-calendar"
import { UpcomingEvents } from "@/components/dashboard/upcoming-events"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={data.user} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EventCalendar userId={data.user.id} />
          </div>
          <div>
            <UpcomingEvents userId={data.user.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
