export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          ScholarPath
        </h1>
        <p className="text-lg text-[var(--muted)]">
          AI research co-pilot for students
        </p>
        <div className="rounded-lg border border-white/10 bg-[var(--card)] px-6 py-4">
          <p className="text-sm text-green-400 font-medium">
            Phase 0 setup complete
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Copy <code className="text-white/80">.env.example</code> to{" "}
            <code className="text-white/80">.env.local</code> and fill in your
            API keys to continue.
          </p>
        </div>
      </div>
    </main>
  );
}
