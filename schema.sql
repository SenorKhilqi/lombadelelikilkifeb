-- =============================================
-- Schema Lengkap — Aplikasi Tes Reaksi & Pop It
-- v2: Tambah tabel pegawai + relasi ke test_results
-- Jalankan seluruh query ini di Supabase SQL Editor
-- =============================================

-- ─── 1. Tabel Pegawai (master data) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pegawai (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nip        TEXT NOT NULL UNIQUE,   -- NIP unik sebagai identifier utama
  nama       TEXT NOT NULL,
  jabatan    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Pegawai
ALTER TABLE public.pegawai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pegawai_anon_insert"
  ON public.pegawai FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "pegawai_anon_select"
  ON public.pegawai FOR SELECT TO anon USING (true);

CREATE POLICY "pegawai_anon_update"
  ON public.pegawai FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Index NIP untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_pegawai_nip ON public.pegawai (nip);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pegawai_updated_at
  BEFORE UPDATE ON public.pegawai
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ─── 2. Tabel Test Results ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.test_results (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pegawai_id            UUID REFERENCES public.pegawai(id) ON DELETE SET NULL,
  nama                  TEXT NOT NULL,
  nip                   TEXT NOT NULL,
  jabatan               TEXT NOT NULL,
  rata_rata_reaksi      NUMERIC(10, 2) NOT NULL,
  klasifikasi_kelelahan TEXT NOT NULL,
  status_pop_it         TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Test Results
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "results_anon_insert"
  ON public.test_results FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "results_anon_select"
  ON public.test_results FOR SELECT TO anon USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_test_results_created_at
  ON public.test_results (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_nip
  ON public.test_results (nip);
