-- Always-blind-on-submit + remove the AI checklist / quality score features.
--
-- The partner-sharing opt-in moves to informed consent at the start of the
-- report (via the intro page), so the per-report flag is no longer collected.
-- The "what next" checklist and quality score are replaced by an evidence
-- upload step, so their persisted state is dropped from incident_reports.

drop index if exists incident_reports_partner_sharing_idx;

alter table public.incident_reports
  drop constraint if exists incident_reports_partner_sharing_consented_at_check,
  drop constraint if exists incident_reports_quality_score_check,
  drop column if exists partner_sharing_consent,
  drop column if exists partner_sharing_decided_at,
  drop column if exists partner_sharing_consented_at,
  drop column if exists quality_score,
  drop column if exists quality_feedback,
  drop column if exists checklist_state,
  drop column if exists analysis_metadata;
