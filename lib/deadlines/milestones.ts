export type MilestoneDef = {
  id: "d30" | "d14" | "d7" | "d1";
  daysBefore: number;
  label: string;
};

/** The four countdown milestones shown on the Deadlines page. */
export const MILESTONES: MilestoneDef[] = [
  { id: "d30", daysBefore: 30, label: "30 days out — lock venue + outline" },
  { id: "d14", daysBefore: 14, label: "14 days out — finish core sections" },
  { id: "d7", daysBefore: 7, label: "7 days out — readiness check + polish" },
  { id: "d1", daysBefore: 1, label: "1 day out — final PDF + submit" },
];

export type ReminderKind = "day_before" | "day_of";

export type ReminderSlot = {
  /** Stable key, e.g. `d30:day_before`. */
  key: string;
  milestoneId: MilestoneDef["id"];
  kind: ReminderKind;
  label: string;
  /** YYYY-MM-DD when the reminder should fire. */
  date: string;
  /** Local wall-clock start for calendar events (no timezone suffix). */
  startDatetime: string;
};

function addDaysIso(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

/**
 * For each milestone, schedule two reminders:
 * - 1 day before the milestone day
 * - on the milestone day itself
 */
export function buildReminderSlots(
  deadlineIso: string,
  hour = 9,
  minute = 0
): ReminderSlot[] {
  const slots: ReminderSlot[] = [];

  for (const m of MILESTONES) {
    const milestoneDate = addDaysIso(deadlineIso, -m.daysBefore);
    const dayBefore = addDaysIso(milestoneDate, -1);

    const defs: Array<{ kind: ReminderKind; date: string; prefix: string }> = [
      { kind: "day_before", date: dayBefore, prefix: "Tomorrow:" },
      { kind: "day_of", date: milestoneDate, prefix: "Today:" },
    ];

    for (const def of defs) {
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute).padStart(2, "0");
      slots.push({
        key: `${m.id}:${def.kind}`,
        milestoneId: m.id,
        kind: def.kind,
        label: `${def.prefix} ${m.label}`,
        date: def.date,
        startDatetime: `${def.date}T${hh}:${mm}:00`,
      });
    }
  }

  return slots;
}

export function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T23:59:59Z`).getTime();
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

export function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
