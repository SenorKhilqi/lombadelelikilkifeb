'use client'

import { useState, useEffect } from 'react'
import { getAllPegawai, exportToExcel, type Pegawai } from '@/lib/supabase'

export default function PegawaiPage() {
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    handleRefresh()
  }, [])

  const handleRefresh = async () => {
    setIsLoadingData(true)
    try {
      setPegawaiList(await getAllPegawai())
    } catch (e) {
      console.error(e)
    }
    setIsLoadingData(false)
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

  const filteredPegawai = pegawaiList.filter(p =>
    [p.nip, p.nama, p.jabatan].some(v => v?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari NIP, nama, jabatan..."
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
            onClick={handleExportPegawai}
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
          <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              Total: <span className="text-white font-semibold">{filteredPegawai.length}</span> pegawai
            </p>
          </div>
          {filteredPegawai.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
              </svg>
              <p className="text-slate-500">Belum ada data pegawai</p>
              <p className="text-slate-600 text-sm mt-1">Import data dari tab &quot;Import Pegawai&quot;</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    {['No', 'NIP', 'Nama', 'Jabatan', 'Terdaftar'].map(h => (
                      <th key={h} className="px-5 py-4 text-left text-xs text-slate-400 font-medium uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPegawai.map((p, i) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-5 py-4 text-slate-500">{i + 1}</td>
                      <td className="px-5 py-4 text-cyan-400 font-mono font-medium group-hover:text-cyan-300 transition-colors">{p.nip}</td>
                      <td className="px-5 py-4 text-white font-medium">{p.nama}</td>
                      <td className="px-5 py-4 text-slate-300">{p.jabatan}</td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID') : '-'}
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
