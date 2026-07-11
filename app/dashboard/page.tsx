import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user}>
      <main className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-lg space-y-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-[var(--muted)]">Signed in as {user.email}</p>
          <div className="rounded-lg border border-white/10 bg-[var(--card)] px-6 py-4 text-left text-sm text-[var(--muted)]">
            Tabbed shell (Overview · Phases · Conferences · Uniqueness · Tech stack) — still to
            build per Phase 1.
          </div>
          <SignOutButton />
        </div>
      </main>
    </AuthProvider>
  );
}
