-- Fase 14.5: persistencia musical versionada.
-- Rollback lógico: la aplicación puede dejar de leer estas columnas; eliminarlas
-- solo después de verificar que ningún consumidor depende de ellas.

alter table public.beats
  add column if not exists analysis_version text,
  add column if not exists analysis_confidence double precision,
  add column if not exists analyzed_at timestamptz,
  add column if not exists analysis_source text,
  add column if not exists analysis_review_status text,
  add column if not exists detected_bpm integer,
  add column if not exists detected_key text,
  add column if not exists detected_genre text,
  add column if not exists detected_subgenres text[],
  add column if not exists detected_mood text,
  add column if not exists quality_score integer,
  add column if not exists preview_recommendation jsonb,
  add column if not exists analysis_features jsonb;

alter table public.beats
  add constraint beats_analysis_confidence_check
    check (analysis_confidence is null or analysis_confidence between 0 and 1),
  add constraint beats_analysis_source_check
    check (analysis_source is null or analysis_source in ('automatic', 'manual')),
  add constraint beats_analysis_review_status_check
    check (analysis_review_status is null or analysis_review_status in ('pending', 'reviewed')),
  add constraint beats_detected_bpm_check
    check (detected_bpm is null or detected_bpm between 40 and 240),
  add constraint beats_quality_score_check
    check (quality_score is null or quality_score between 0 and 100),
  add constraint beats_preview_recommendation_object_check
    check (preview_recommendation is null or jsonb_typeof(preview_recommendation) = 'object'),
  add constraint beats_analysis_features_object_check
    check (analysis_features is null or jsonb_typeof(analysis_features) = 'object');

comment on column public.beats.analysis_confidence is
  'Media de confidencias reales disponibles: clasificación, key, preview y features; NULL sin evidencia.';
comment on column public.beats.preview_recommendation is
  'Recomendación automática; no representa ni sustituye el preview publicado por el administrador.';
comment on column public.beats.analysis_features is
  'Resultados derivados compactos; excluye audio, FFT/chroma crudos y frames extensos.';
