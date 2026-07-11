import { VENUES, type ConferenceVenue } from "@/lib/conferences/venues";

export type UpcomingVenue = ConferenceVenue & { daysUntil: number };

/** Venues with a future deadline, soonest first. `deadline` is an ISO YYYY-MM-DD string so lexical order == date order. */
export function getUpcomingDeadlines(limit = 4, today: Date = new Date()): UpcomingVenue[] {
  const todayStr = today.toISOString().slice(0, 10);
  const msPerDay = 1000 * 60 * 60 * 24;

  return [...VENUES]
    .filter((v) => v.deadline >= todayStr)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, limit)
    .map((v) => ({
      ...v,
      daysUntil: Math.round((new Date(v.deadline).getTime() - today.getTime()) / msPerDay),
    }));
}
