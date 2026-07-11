-- Upgrade script for databases created with an older 001_init.sql.
-- Safe to re-run (idempotent). Skip if you already ran the latest 001_init.sql.

-- ---------------------------------------------------------------------------
-- Pipeline JSONB columns on paper_sessions
-- ---------------------------------------------------------------------------
alter table public.paper_sessions
  add column if not exists selected_venue jsonb,
  add column if not exists outline jsonb,
  add column if not exists section_feedback jsonb,
  add column if not exists readiness jsonb,
  add column if not exists deadline_tracking jsonb;

comment on column public.paper_sessions.selected_venue is
  'Chosen conference/venue (ConferenceVenue + selectedAt)';
comment on column public.paper_sessions.outline is
  'Venue-specific outline (PaperOutline + generatedAt/degraded/edited)';
comment on column public.paper_sessions.section_feedback is
  'Array of section coaching results (max 20 entries, appended by coaching action)';
comment on column public.paper_sessions.readiness is
  'Latest submission readiness report (ReadinessReport + checkedAt/degraded)';
comment on column public.paper_sessions.deadline_tracking is
  'Deadline milestones: venueId, deadline, acknowledgedMilestones[], updatedAt';

-- ---------------------------------------------------------------------------
-- Expand status constraint to match dashboard server actions
-- ---------------------------------------------------------------------------
alter table public.paper_sessions
  drop constraint if exists paper_sessions_status_check;

alter table public.paper_sessions
  add constraint paper_sessions_status_check
  check (status in (
    'draft',
    'scoring',
    'scored',
    'archived',
    'venue_selected',
    'outline_ready',
    'coaching',
    'readiness_checked'
  ));

-- ---------------------------------------------------------------------------
-- Query indexes used by uniqueness history + session listing
-- ---------------------------------------------------------------------------
create index if not exists score_attempts_session_created_idx
  on public.score_attempts (session_id, created_at desc);

comment on column public.score_attempts.explanation is
  'UniquenessExplanation + candidates[] + meta { corpusEmpty, explanationDegraded, warnings }';
