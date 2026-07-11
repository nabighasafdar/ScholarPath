import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Sign in to ScholarPath</h1>
        <p className="text-sm text-[var(--muted)]">Use your Google account to continue.</p>
        <GoogleSignInButton />
      </div>
    </main>
  );
}
