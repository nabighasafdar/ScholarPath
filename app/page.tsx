import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-lg space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">ScholarPath</h1>
        <p className="text-lg text-[var(--muted)]">AI research co-pilot for students</p>
        <div className="rounded-lg border border-white/10 bg-[var(--card)] px-6 py-4">
          <p className="text-sm text-green-400 font-medium">Phase 1 — auth + app shell</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Sign in with Google to open your dashboard.
          </p>
        </div>
        <Link
          href={user ? "/dashboard" : "/login"}
          className="inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
        >
          {user ? "Go to dashboard" : "Sign in"}
        </Link>
      </div>
    </main>
  );
}
