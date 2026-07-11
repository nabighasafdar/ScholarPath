import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  // Fail open if the column/migration isn't there yet — never lock existing users out.
  if (!profileError && profile && !profile.onboarding_completed_at) {
    redirect("/onboarding");
  }

  return (
    <AuthProvider initialUser={user}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar userEmail={user.email ?? ""} />
        <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </AuthProvider>
  );
}
