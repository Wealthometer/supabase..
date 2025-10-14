import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Bell, Users } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            <span className="text-xl font-semibold">EventSync</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight mb-6">
              Schedule Events, Send Notifications Automatically
            </h1>
            <p className="text-pretty text-xl text-muted-foreground mb-8">
              Manage your team events and send automated reminders to Discord channels. Sync with Google Calendar
              seamlessly.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-center text-3xl font-bold mb-12">Key Features</h2>
              <div className="grid gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Event Management</h3>
                  <p className="text-muted-foreground">
                    Create, edit, and manage events with an intuitive calendar interface
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Bell className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Discord Notifications</h3>
                  <p className="text-muted-foreground">Automatically send event reminders to your Discord channels</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">Calendar Sync</h3>
                  <p className="text-muted-foreground">Integrate with Google Calendar to keep everything in sync</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>EventSync - Event Scheduling and Notification System</p>
        </div>
      </footer>
    </div>
  )
}
