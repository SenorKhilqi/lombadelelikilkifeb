'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { findPegawaiByNip, createPegawai, type Pegawai } from '@/lib/supabase'

type NipLookupState = 'idle' | 'searching' | 'found' | 'not-found' | 'error'

export default function Home() {
  const router = useRouter()

  const [nipInput, setNipInput] = useState('')
  const [nipLookup, setNipLookup] = useState<NipLookupState>('idle')
  const [pegawai, setPegawai] = useState<Pegawai | null>(null)

  const [newNama, setNewNama] = useState('')
  const [newJabatan, setNewJabatan] = useState('')
  const [isSavingEmployee, setIsSavingEmployee] = useState(false)
  const [employeeError, setEmployeeError] = useState('')

  const nipInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nipInputRef.current?.focus()
  }, [])

  const handleNipLookup = async () => {
    const nip = nipInput.trim()
    if (!nip) return

    setNipLookup('searching')
    setPegawai(null)
    setEmployeeError('')

    try {
      const found = await findPegawaiByNip(nip)
      if (found) {
        setPegawai(found)
        setNipLookup('found')
      } else {
        setNipLookup('not-found')
        setNewNama('')
        setNewJabatan('')
      }
    } catch {
      setNipLookup('error')
    }
  }

  const handleNipKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNipLookup()
  }

  const handleAddEmployee = async () => {
    if (!newNama.trim() || !newJabatan.trim()) return
    setIsSavingEmployee(true)
    setEmployeeError('')

    try {
      const created = await createPegawai({
        nip: nipInput.trim(),
        nama: newNama.trim(),
        jabatan: newJabatan.trim(),
      })
      setPegawai(created)
      setNipLookup('found')
    } catch (err: unknown) {
      setEmployeeError(err instanceof Error ? err.message : 'Gagal menyimpan data pegawai')
    } finally {
      setIsSavingEmployee(false)
    }
  }

  const handleProceedToTest = () => {
    if (!pegawai) return
    router.push(`/test/reaction?nip=${pegawai.nip}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative font-sans">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-indigo-600/5 rounded-b-[4rem] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-400/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-400/10 blur-3xl rounded-full pointer-events-none" />

      <Link
        href="/admin"
        className="absolute top-6 right-6 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 text-sm font-medium transition-all shadow-sm hover:shadow-md"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Portal Admin
      </Link>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-6 shadow-xl shadow-indigo-600/20 rotate-3">
            <svg className="w-8 h-8 -rotate-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">FocusTest</h1>
          <p className="text-slate-500 mt-2 text-base">Platform Evaluasi Kesiapan Kerja</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Identifikasi Pegawai</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Silakan masukkan Nomor Induk Pegawai Anda untuk memulai sesi pengujian.
          </p>

          <div className="flex gap-3">
            <input
              ref={nipInputRef}
              type="text"
              value={nipInput}
              onChange={(e) => {
                setNipInput(e.target.value)
                setNipLookup('idle')
                setPegawai(null)
              }}
              onKeyDown={handleNipKeyDown}
              placeholder="Masukkan NIP..."
              className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all text-base font-medium"
            />
            <button
              onClick={handleNipLookup}
              disabled={!nipInput.trim() || nipLookup === 'searching'}
              className="px-6 py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 active:scale-95"
            >
              {nipLookup === 'searching' ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {nipLookup === 'found' && pegawai && (
          <div className="mt-6 bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Data Ditemukan</p>
                <p className="text-slate-900 font-bold text-lg">{pegawai.nama}</p>
                <p className="text-slate-500 text-sm">{pegawai.jabatan} • <span className="font-mono text-xs">{pegawai.nip}</span></p>
              </div>
            </div>
            <button
              onClick={handleProceedToTest}
              className="w-full py-4 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              Mulai Pengujian →
            </button>
          </div>
        )}

        {nipLookup === 'not-found' && (
          <div className="mt-6 bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-slate-800 font-bold">NIP Tidak Terdaftar</h3>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                  NIP <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-xs">{nipInput}</code> belum ada dalam sistem. Silakan isi data di bawah untuk mendaftar.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap</label>
                <input
                  type="text"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jabatan</label>
                <input
                  type="text"
                  value={newJabatan}
                  onChange={(e) => setNewJabatan(e.target.value)}
                  placeholder="Contoh: Operator Alat Berat"
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                />
              </div>

              {employeeError && <p className="text-red-500 text-sm font-medium">{employeeError}</p>}

              <button
                onClick={handleAddEmployee}
                disabled={!newNama.trim() || !newJabatan.trim() || isSavingEmployee}
                className="w-full py-4 mt-2 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
              >
                {isSavingEmployee ? 'Memproses...' : 'Daftar & Mulai Tes'}
              </button>
            </div>
          </div>
        )}

        {nipLookup === 'error' && (
          <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Gagal menghubungi server. Silakan periksa koneksi internet Anda.
          </div>
        )}
      </div>
    </div>
  )
}
