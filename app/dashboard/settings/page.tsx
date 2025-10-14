import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // Get or create user preferences
  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", data.user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader user={data.user} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>
          <SettingsForm userId={data.user.id} preferences={preferences} />
        </div>
      </main>
    </div>
  );
}
