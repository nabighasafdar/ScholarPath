-- Extend paper_sessions for the post-uniqueness pipeline stages.
alter table public.paper_sessions
  add column if not exists selected_venue jsonb,
  add column if not exists outline jsonb,
  add column if not exists section_feedback jsonb,
  add column if not exists readiness jsonb,
  add column if not exists deadline_tracking jsonb;

comment on column public.paper_sessions.selected_venue is 'Chosen conference/venue match payload';
comment on column public.paper_sessions.outline is 'Venue-specific outline JSON';
comment on column public.paper_sessions.section_feedback is 'Array of section coaching results';
comment on column public.paper_sessions.readiness is 'Latest submission readiness check';
comment on column public.paper_sessions.deadline_tracking is 'Deadline reminder acknowledgements';
