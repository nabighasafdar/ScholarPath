import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <div className="rounded-lg border border-border p-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-3xl font-semibold tracking-tight text-foreground",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
