'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, findPegawaiByNip, type Pegawai } from '@/lib/supabase'
import { classifyFatigue, classifyBadge } from '@/lib/test-utils'

function ResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const nip = searchParams.get('nip')
  const reactionAvgStr = searchParams.get('reactionAvg')
  const popItStatus = searchParams.get('popItStatus')

  const [pegawai, setPegawai] = useState<Pegawai | null>(null)
  const [loading, setLoading] = useState(true)

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    async function loadPegawai() {
      if (!nip || !reactionAvgStr || !popItStatus) {
        router.replace('/')
        return
      }
      try {
        const found = await findPegawaiByNip(nip)
        if (found) {
          setPegawai(found)
        } else {
          router.replace('/')
        }
      } catch (err) {
        console.error(err)
        router.replace('/')
      } finally {
        setLoading(false)
      }
    }
    loadPegawai()
  }, [nip, reactionAvgStr, popItStatus, router])

  if (loading || !pegawai || !reactionAvgStr) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-sans">Memuat...</div>
  }

  const avgReaction = parseInt(reactionAvgStr, 10)
  const classification = classifyFatigue(avgReaction)

  const handleSubmit = async () => {
    setIsSaving(true)
    setSaveError('')

    const { error } = await supabase.from('test_results').insert({
      pegawai_id: pegawai.id ?? null,
      nama: pegawai.nama,
      nip: pegawai.nip,
      jabatan: pegawai.jabatan,
      rata_rata_reaksi: avgReaction,
      klasifikasi_kelelahan: classification,
      status_pop_it: popItStatus === 'Aman' ? 'Aman' : 'Tidak Aman',
    })

    setIsSaving(false)
    if (error) {
      setSaveError(`Gagal menyimpan: ${error.message}`)
    } else {
      setSaveSuccess(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200/50 border border-slate-100">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 mb-6 border-4 border-emerald-50">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Evaluasi Selesai</h2>
            <p className="text-slate-500 mt-2 font-medium">Berikut adalah hasil penilaian Anda hari ini</p>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 mb-8 space-y-4">
            {[
              { label: 'Nama', value: pegawai.nama },
              { label: 'NIP', value: pegawai.nip, mono: true },
              { label: 'Jabatan', value: pegawai.jabatan },
              { label: 'Kecepatan', value: `${avgReaction} ms`, mono: true },
              { label: 'Kondisi', value: classification, badge: classifyBadge(classification) },
              { label: 'Fokus', value: 'Lulus ✓', badge: 'bg-indigo-100 border-indigo-200 text-indigo-700' },
            ].map(({ label, value, mono, badge }) => (
              <div key={label} className="flex justify-between items-center py-2">
                <span className="text-slate-500 font-bold text-sm">{label}</span>
                {badge ? (
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border ${badge}`}>{value}</span>
                ) : (
                  <span className={`font-bold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
                )}
              </div>
            ))}
          </div>

          {saveSuccess ? (
            <div className="text-center animate-in zoom-in-95 duration-300">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 font-bold text-sm mb-6 w-full justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Data berhasil direkam!
              </div>
              <div className="flex gap-3">
                <Link
                  href="/"
                  className="flex-1 py-4 rounded-2xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 block text-center"
                >
                  Tes Baru
                </Link>
                <Link
                  href="/admin"
                  className="flex-1 py-4 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all text-center flex items-center justify-center gap-2 shadow-lg"
                >
                  Portal Admin
                </Link>
              </div>
            </div>
          ) : (
            <>
              {saveError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-bold text-center">
                  {saveError}
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="w-full py-5 rounded-2xl font-black text-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {isSaving ? (
                  <>
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : 'Simpan Hasil Evaluasi'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <ResultContent />
    </Suspense>
  )
}
