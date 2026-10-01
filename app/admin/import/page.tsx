'use client'

import { useState, useRef } from 'react'
import { upsertPegawai, parseSpreadsheet, downloadExcelTemplate, exportToExcel, getAllPegawai, getAllTestResults, type Pegawai } from '@/lib/supabase'

type ImportStatus = 'idle' | 'parsing' | 'preview' | 'uploading' | 'done' | 'error'

export default function ImportPage() {
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importRows, setImportRows] = useState<Omit<Pegawai, 'id' | 'created_at' | 'updated_at'>[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importMessage, setImportMessage] = useState('')
  const [isLoadingData, setIsLoadingData] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportStatus('parsing')
    setImportErrors([])
    setImportMessage('Memproses file...')

    try {
      const rawRows = await parseSpreadsheet(file)

      const errors: string[] = []
      const validRows: Omit<Pegawai, 'id' | 'created_at' | 'updated_at'>[] = []

      rawRows.forEach((row, idx) => {
        const lineNum = idx + 2
        const nip = row['nip'] || row['no_induk'] || row['nomor_induk'] || ''
        const nama = row['nama'] || row['nama_lengkap'] || row['name'] || ''
        const jabatan = row['jabatan'] || row['posisi'] || row['position'] || ''

        if (!nip) { errors.push(`Baris ${lineNum}: kolom NIP kosong`); return }
        if (!nama) { errors.push(`Baris ${lineNum}: kolom NAMA kosong`); return }
        if (!jabatan) { errors.push(`Baris ${lineNum}: kolom JABATAN kosong`); return }

        validRows.push({ nip: nip.trim(), nama: nama.trim(), jabatan: jabatan.trim() })
      })

      setImportRows(validRows)
      setImportErrors(errors)
      setImportStatus('preview')
      setImportMessage(`${validRows.length} baris valid ditemukan${errors.length > 0 ? `, ${errors.length} baris diabaikan` : ''}`)
    } catch {
      setImportStatus('error')
      setImportMessage('Gagal membaca file. Pastikan format Excel (.xlsx) atau CSV benar.')
    }
  }

  const handleImport = async () => {
    if (importRows.length === 0) return
    setImportStatus('uploading')
    setImportMessage('Menyimpan ke database...')

    try {
      const { count, errors } = await upsertPegawai(importRows)
      setImportErrors(errors)
      setImportStatus('done')
      setImportMessage(`✅ Berhasil import ${count} data pegawai${errors.length > 0 ? ` (${errors.length} error)` : ''}!`)
    } catch (err: unknown) {
      setImportStatus('error')
      setImportMessage(`Gagal import: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleResetImport = () => {
    setImportStatus('idle')
    setImportRows([])
    setImportErrors([])
    setImportMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDownloadTemplate = async () => {
    await downloadExcelTemplate()
  }

  const handleExportPegawai = async () => {
    setIsLoadingData(true)
    try {
      const data = await getAllPegawai()
      await exportToExcel(
        data as unknown as Record<string, unknown>[],
        ['nip', 'nama', 'jabatan'],
        ['NIP', 'Nama', 'Jabatan'],
        `Data_Pegawai_${new Date().toISOString().slice(0, 10)}`,
        'Data Pegawai'
      )
    } catch (e) {
      console.error(e)
    }
    setIsLoadingData(false)
  }

  const handleExportHasil = async () => {
    setIsLoadingData(true)
    try {
      const data = await getAllTestResults()
      await exportToExcel(
        data.map(r => ({
          ...r,
          created_at: r.created_at ? new Date(r.created_at).toLocaleString('id-ID') : '',
        })) as Record<string, unknown>[],
        ['nip', 'nama', 'jabatan', 'rata_rata_reaksi', 'klasifikasi_kelelahan', 'status_pop_it', 'created_at'],
        ['NIP', 'Nama', 'Jabatan', 'Reaksi (ms)', 'Klasifikasi Kelelahan', 'Status Pop It', 'Tanggal & Waktu'],
        `Hasil_Tes_${new Date().toISOString().slice(0, 10)}`,
        'Hasil Tes'
      )
    } catch (e) {
      console.error(e)
    }
    setIsLoadingData(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-xl">
        <h2 className="text-white font-bold text-lg mb-1">Import Data Pegawai</h2>
        <p className="text-slate-400 text-sm mb-6">
          Upload file <strong className="text-white">Excel (.xlsx)</strong> dengan kolom <code className="text-cyan-400 bg-cyan-400/10 px-1 rounded text-xs">NIP</code>, <code className="text-cyan-400 bg-cyan-400/10 px-1 rounded text-xs">Nama</code>, <code className="text-cyan-400 bg-cyan-400/10 px-1 rounded text-xs">Jabatan</code>.
          Data yang sudah ada akan diperbarui (upsert by NIP).
        </p>

        {/* Drop zone */}
        {importStatus === 'idle' && (
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group">
            <div className="text-center">
              <svg className="w-10 h-10 text-slate-500 group-hover:text-cyan-400 mx-auto mb-3 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">
                Klik atau drag &amp; drop file Excel
              </p>
              <p className="text-slate-600 text-xs mt-1">Format: .xlsx (Excel) atau .csv</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}

        {/* Parsing */}
        {importStatus === 'parsing' && (
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <svg className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <p className="text-slate-400">Memproses file...</p>
            </div>
          </div>
        )}

        {/* Preview */}
        {(importStatus === 'preview' || importStatus === 'uploading') && (
          <div>
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${
              importErrors.length > 0
                ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            }`}>
              {importMessage}
            </div>

            {/* Preview table */}
            <div className="overflow-auto max-h-52 rounded-lg border border-white/10">
              <table className="w-full text-xs">
                <thead className="bg-white/8 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-slate-400 font-medium">NIP</th>
                    <th className="px-3 py-2 text-left text-slate-400 font-medium">Nama</th>
                    <th className="px-3 py-2 text-left text-slate-400 font-medium">Jabatan</th>
                  </tr>
                </thead>
                <tbody>
                  {importRows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="px-3 py-2 text-white font-mono">{row.nip}</td>
                      <td className="px-3 py-2 text-white">{row.nama}</td>
                      <td className="px-3 py-2 text-slate-300">{row.jabatan}</td>
                    </tr>
                  ))}
                  {importRows.length > 10 && (
                    <tr className="border-t border-white/5">
                      <td colSpan={3} className="px-3 py-2 text-slate-500 text-center">
                        ... dan {importRows.length - 10} baris lainnya
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Error list */}
            {importErrors.length > 0 && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-xs font-medium mb-1">Baris diabaikan:</p>
                {importErrors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-red-400/70 text-xs">{e}</p>
                ))}
                {importErrors.length > 5 && (
                  <p className="text-red-400/50 text-xs">...dan {importErrors.length - 5} lainnya</p>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleImport}
                disabled={importStatus === 'uploading' || importRows.length === 0}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
              >
                {importStatus === 'uploading' ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : `💾 Import ${importRows.length} Data`}
              </button>
              <button
                onClick={handleResetImport}
                className="px-4 py-3 rounded-xl text-slate-400 hover:text-white bg-white/8 hover:bg-white/15 border border-white/10 transition-all text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Done / Error */}
        {(importStatus === 'done' || importStatus === 'error') && (
          <div className="text-center py-6">
            <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl mb-5 text-sm font-medium ${
              importStatus === 'done'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {importMessage}
            </div>
            {importErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                {importErrors.map((e, i) => (
                  <p key={i} className="text-red-400/70 text-xs">{e}</p>
                ))}
              </div>
            )}
            <button
              onClick={handleResetImport}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 transition-all text-sm"
            >
              Import File Lain
            </button>
          </div>
        )}
      </div>

      {/* Template & Guide card */}
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-xl hover:border-white/20 transition-all">
          <h3 className="text-white font-semibold mb-3">📄 Template Excel</h3>
          <p className="text-slate-400 text-sm mb-4">
            Download template Excel (.xlsx) sebagai panduan format kolom yang benar.
          </p>
          <button
            onClick={handleDownloadTemplate}
            className="w-full py-3 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-sm flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Template (.xlsx)
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-xl hover:border-white/20 transition-all">
          <h3 className="text-white font-semibold mb-4">📋 Panduan Format</h3>
          <div className="space-y-3">
            {[
              { field: 'nip', desc: 'Nomor Induk Pegawai (wajib, unik)' },
              { field: 'nama', desc: 'Nama lengkap pegawai (wajib)' },
              { field: 'jabatan', desc: 'Jabatan atau posisi (wajib)' },
            ].map(({ field, desc }) => (
              <div key={field} className="flex gap-3">
                <code className="text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded text-xs font-mono shrink-0 self-start mt-0.5 border border-cyan-400/20">
                  {field}
                </code>
                <p className="text-slate-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-xs">
              💡 <strong>Tips:</strong> NIP yang sudah ada di database akan diperbarui datanya (upsert), bukan duplikat.
              File Excel (.xlsx) dan CSV keduanya didukung.
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur-xl hover:border-white/20 transition-all">
          <h3 className="text-white font-semibold mb-4">⬇️ Export Data</h3>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleExportPegawai}
              disabled={isLoadingData}
              className="w-full py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-white/8 hover:bg-white/15 border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
              Export Data Pegawai (.xlsx)
            </button>
            <button
              onClick={handleExportHasil}
              disabled={isLoadingData}
              className="w-full py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-white/8 hover:bg-white/15 border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Hasil Tes (.xlsx)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
