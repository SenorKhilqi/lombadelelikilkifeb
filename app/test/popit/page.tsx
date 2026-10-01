'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PopItGame from '@/components/PopItGame'

function PopItContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nip = searchParams.get('nip')
  const reactionAvg = searchParams.get('reactionAvg')

  const [popItStatus, setPopItStatus] = useState<'pending' | 'aman' | 'retry'>('pending')

  useEffect(() => {
    if (!nip || !reactionAvg) {
      router.replace('/')
    }
  }, [nip, reactionAvg, router])

  const handlePopItComplete = (success: boolean) => {
    if (success) {
      setPopItStatus('aman')
      setTimeout(() => {
        router.push(`/test/result?nip=${nip}&reactionAvg=${reactionAvg}&popItStatus=Aman`)
      }, 1000)
    } else {
      setPopItStatus('retry')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-100 text-indigo-600 mb-6 border-2 border-indigo-200 shadow-sm">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Fokus Memori</h2>
        <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">
          Perhatikan pola yang menyala, lalu tekan kembali sesuai urutan untuk memverifikasi tingkat fokus Anda.
        </p>
        
        {popItStatus === 'retry' && (
          <div className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold text-sm animate-bounce">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Urutan salah. Perhatikan baik-baik dan coba lagi!
          </div>
        )}
        {popItStatus === 'aman' && (
          <div className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 font-bold text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Berhasil! Melanjutkan ke hasil akhir...
          </div>
        )}
      </div>
      
      <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100">
        <PopItGame onComplete={handlePopItComplete} />
      </div>
    </div>
  )
}

export default function PopItPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <PopItContent />
    </Suspense>
  )
}
