'use client'

import { useState, useEffect } from 'react'
import { getAllTestResults, exportToExcel, type TestResult } from '@/lib/supabase'

export default function HasilPage() {
  const [resultList, setResultList] = useState<TestResult[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    handleRefresh()
  }, [])

  const handleRefresh = async () => {
    setIsLoadingData(true)
    try {
      setResultList(await getAllTestResults())
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

  const filteredResults = resultList.filter(r =>
    [r.nip, r.nama, r.jabatan, r.klasifikasi_kelelahan].some(v =>
      v?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const classColor: Record<string, string> = {
    'Normal (Waspada)': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    'Normal': 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]',
    'Fatigue Ringan': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]',
    'Fatigue Sedang': 'bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
    'Fatigue Berat': 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama, NIP, klasifikasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/8 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoadingData}
            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white bg-white/8 hover:bg-white/15 border border-white/10 transition-all text-sm flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={handleExportHasil}
            className="px-4 py-2.5 rounded-xl text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 transition-all text-sm flex items-center gap-2 shadow-[0_4px_12px_rgba(14,165,233,0.3)] hover:scale-[1.02]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {isLoadingData ? (
        <div className="flex justify-center py-20">
          <svg className="w-8 h-8 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="px-5 py-3 border-b border-white/8">
            <p className="text-slate-400 text-sm">
              Total: <span className="text-white font-semibold">{filteredResults.length}</span> hasil tes
            </p>
          </div>
          {filteredResults.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-500">Belum ada hasil tes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    {['No', 'Tanggal', 'NIP', 'Nama', 'Jabatan', 'Reaksi (ms)', 'Klasifikasi', 'Pop It'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-xs text-slate-400 font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredResults.map((r, i) => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-4 text-slate-500">{i + 1}</td>
                      <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                        {r.created_at ? new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </td>
                      <td className="px-5 py-4 text-cyan-400 font-mono font-medium group-hover:text-cyan-300 transition-colors">{r.nip}</td>
                      <td className="px-5 py-4 text-white font-medium whitespace-nowrap">{r.nama}</td>
                      <td className="px-5 py-4 text-slate-300 whitespace-nowrap">{r.jabatan}</td>
                      <td className="px-5 py-4 text-white font-mono font-bold">{r.rata_rata_reaksi}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${classColor[r.klasifikasi_kelelahan] || 'bg-white/10 text-white border-white/20'}`}>
                          {r.klasifikasi_kelelahan}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          r.status_pop_it === 'Aman'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                        }`}>
                          {r.status_pop_it}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
