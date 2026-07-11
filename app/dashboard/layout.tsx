import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user}>
      <div className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <header className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">ScholarPath</p>
              <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
            </div>
            <SignOutButton />
          </header>
          <DashboardNav />
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
