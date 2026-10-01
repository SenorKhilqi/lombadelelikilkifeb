import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Types ────────────────────────────────────────────────────────────────────

export type Pegawai = {
  id?: string
  nip: string
  nama: string
  jabatan: string
  created_at?: string
  updated_at?: string
}

export type TestResult = {
  id?: string
  pegawai_id?: string | null
  nama: string
  nip: string
  jabatan: string
  rata_rata_reaksi: number
  klasifikasi_kelelahan: string
  status_pop_it: string
  created_at?: string
}

// ─── Pegawai Helpers ──────────────────────────────────────────────────────────

/** Cari pegawai berdasarkan NIP */
export async function findPegawaiByNip(nip: string): Promise<Pegawai | null> {
  const { data, error } = await supabase
    .from('pegawai')
    .select('*')
    .eq('nip', nip.trim())
    .maybeSingle()

  if (error) throw error
  return data
}

/** Tambah pegawai baru */
export async function createPegawai(pegawai: Omit<Pegawai, 'id' | 'created_at' | 'updated_at'>): Promise<Pegawai> {
  const { data, error } = await supabase
    .from('pegawai')
    .insert(pegawai)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Bulk insert pegawai (untuk import Excel/CSV) — upsert by NIP */
export async function upsertPegawai(rows: Omit<Pegawai, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ count: number; errors: string[] }> {
  const errors: string[] = []
  let count = 0

  // Proses per-batch 50 baris
  const BATCH = 50
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from('pegawai')
      .upsert(batch, { onConflict: 'nip' })

    if (error) {
      errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${error.message}`)
    } else {
      count += batch.length
    }
  }

  return { count, errors }
}

/** Ambil semua pegawai */
export async function getAllPegawai(): Promise<Pegawai[]> {
  const { data, error } = await supabase
    .from('pegawai')
    .select('*')
    .order('nama', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** Ambil semua hasil tes */
export async function getAllTestResults(): Promise<TestResult[]> {
  const { data, error } = await supabase
    .from('test_results')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// ─── Excel Helpers (SheetJS) ─────────────────────────────────────────────────

/**
 * Parse file Excel (.xlsx) atau CSV menjadi array of row objects.
 * Header baris pertama dijadikan key (lowercase, trimmed).
 */
export async function parseSpreadsheet(
  file: File
): Promise<Record<string, string>[]> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]

  // header_row: 1 → baris pertama jadi header
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    defval: '',
    raw: false,
  })

  // Normalisasi key header ke lowercase
  return raw.map(row => {
    const normalized: Record<string, string> = {}
    for (const [k, v] of Object.entries(row)) {
      normalized[k.trim().toLowerCase()] = String(v ?? '').trim()
    }
    return normalized
  })
}

/**
 * Export array of objects ke file Excel (.xlsx) dan trigger download.
 * @param rows      Data baris
 * @param headers   Urutan kolom yang akan di-export
 * @param colLabels Label header yang tampil di baris pertama (optional)
 * @param filename  Nama file output (tanpa ekstensi)
 * @param sheetName Nama sheet
 */
export async function exportToExcel(
  rows: Record<string, unknown>[],
  headers: string[],
  colLabels: string[],
  filename: string,
  sheetName = 'Sheet1'
): Promise<void> {
  const XLSX = await import('xlsx')

  // Susun data: label row + data rows
  const wsData: unknown[][] = [
    colLabels,
    ...rows.map(row => headers.map(h => row[h] ?? '')),
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Lebar kolom otomatis berdasarkan konten
  const colWidths = headers.map((h, i) => {
    const label = colLabels[i] ?? h
    const maxLen = Math.max(
      label.length,
      ...rows.map(r => String(r[h] ?? '').length)
    )
    return { wch: Math.min(maxLen + 4, 40) }
  })
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * Download template Excel kosong untuk import data pegawai.
 */
export async function downloadExcelTemplate(): Promise<void> {
  const XLSX = await import('xlsx')

  const wsData = [
    ['NIP', 'Nama', 'Jabatan'],   // header
    ['12345678', 'Budi Santoso', 'Operator'],
    ['87654321', 'Siti Rahayu', 'Supervisor'],
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 25 }]

  XLSX.utils.book_append_sheet(wb, ws, 'Data Pegawai')
  XLSX.writeFile(wb, 'template_import_pegawai.xlsx')
}
