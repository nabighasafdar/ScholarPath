import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default async function SignUpPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <GraduationCap className="h-5 w-5 text-[hsl(var(--accent))]" />
            <span className="font-medium tracking-tight">ScholarPath</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <SignUpForm />

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <GoogleSignInButton />
      </div>
    </main>
  );
}
