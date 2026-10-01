'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const tabs = [
    { id: '/admin', label: '📈 Statistik', icon: null },
    { id: '/admin/import', label: '📥 Import Pegawai', icon: null },
    { id: '/admin/pegawai', label: '👥 Data Pegawai', icon: null },
    { id: '/admin/hasil', label: '📊 Hasil Tes', icon: null },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Topbar */}
      <header className="border-b border-white/8 bg-black/20 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-sm">Panel Admin</h1>
              <p className="text-slate-500 text-xs">Manajemen Data Pegawai & Hasil Tes</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white text-sm transition-all hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Mulai Tes
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-white/5 border border-white/10 rounded-xl p-1 w-fit overflow-x-auto shadow-lg backdrop-blur-sm">
          {tabs.map(t => (
            <Link
              key={t.id}
              href={t.id}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                pathname === t.id
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-[0_4px_12px_rgba(14,165,233,0.3)] scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </div>
    </div>
  )
}
