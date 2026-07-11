"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function CallbackInner() {
  const params = useSearchParams();
  const toolkit = params.get("toolkit") ?? "";

  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(
        { type: "composio-oauth-done", toolkit },
        window.location.origin
      );
      window.close();
      return;
    }
    window.location.replace(`/dashboard/settings?connected=${encodeURIComponent(toolkit)}`);
  }, [toolkit]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <p className="text-sm text-muted-foreground">
        Finishing Google authorization… you can close this window.
      </p>
    </main>
  );
}

export default function ComposioCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-6">
          <p className="text-sm text-muted-foreground">Finishing authorization…</p>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
