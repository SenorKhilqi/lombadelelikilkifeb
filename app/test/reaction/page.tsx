'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { findPegawaiByNip, type Pegawai } from '@/lib/supabase'
import { classifyFatigue, classifyBadge } from '@/lib/test-utils'

type ReactionMode = 'light' | 'sound'

const TOTAL_ROUNDS = 8
const PRACTICE_ROUNDS = 2
const MIN_DELAY_MS = 1500
const MAX_DELAY_MS = 4000

function ReactionTestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nip = searchParams.get('nip')

  const [pegawai, setPegawai] = useState<Pegawai | null>(null)
  const [loading, setLoading] = useState(true)

  const [mode, setMode] = useState<ReactionMode>('light')
  const [currentRound, setCurrentRound] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isTriggered, setIsTriggered] = useState(false)
  const [waitingForReaction, setWaitingForReaction] = useState(false)
  const [reactionTimes, setReactionTimes] = useState<number[]>([])
  const [avgReaction, setAvgReaction] = useState<number | null>(null)
  const [classification, setClassification] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isTooEarly, setIsTooEarly] = useState(false)

  const triggerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerStartRef = useRef<number>(0)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    async function loadPegawai() {
      if (!nip) {
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
  }, [nip, router])

  useEffect(() => {
    return () => { if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current) }
  }, [])

  const playBeep = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
  }, [])

  const scheduleNextTrigger = useCallback((roundNumber: number) => {
    if (roundNumber > TOTAL_ROUNDS) {
      setIsActive(false); setIsTriggered(false); setWaitingForReaction(false)
      setFeedback('Tes selesai! Menghitung rata-rata...')
      return
    }

    const delay = Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS) + MIN_DELAY_MS
    setIsTriggered(false); setWaitingForReaction(false); setIsTooEarly(false)

    const isPractice = roundNumber <= PRACTICE_ROUNDS
    setFeedback(isPractice
      ? `Latihan ${roundNumber}/${PRACTICE_ROUNDS} — Bersiap...`
      : `Ronde ${roundNumber - PRACTICE_ROUNDS}/${TOTAL_ROUNDS - PRACTICE_ROUNDS} — Bersiap...`
    )

    triggerTimeoutRef.current = setTimeout(() => {
      setIsTriggered(true); setWaitingForReaction(true)
      triggerStartRef.current = performance.now()
      if (mode === 'sound') playBeep()
      setFeedback(isPractice
        ? `Latihan ${roundNumber} — TEKAN SEKARANG!`
        : `Ronde ${roundNumber - PRACTICE_ROUNDS} — TEKAN SEKARANG!`
      )
    }, delay)
  }, [mode, playBeep])

  const handleStart = () => {
    setCurrentRound(1); setIsActive(true)
    setReactionTimes([]); setAvgReaction(null)
    setClassification(''); setIsTooEarly(false)
    scheduleNextTrigger(1)
  }

  const handleReactionPress = () => {
    if (!isActive) return
    if (!waitingForReaction) {
      if (triggerTimeoutRef.current) clearTimeout(triggerTimeoutRef.current)
      setIsTooEarly(true)
      setFeedback('⚠️ Terlalu cepat! Tunggu sinyal...')
      setTimeout(() => scheduleNextTrigger(currentRound), 1000)
      return
    }

    const reactionTime = Math.round(performance.now() - triggerStartRef.current)
    setIsTriggered(false); setWaitingForReaction(false)
    const isPractice = currentRound <= PRACTICE_ROUNDS

    if (!isPractice) {
      const newTimes = [...reactionTimes, reactionTime]
      setReactionTimes(newTimes)
      if (currentRound === TOTAL_ROUNDS) {
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length)
        setAvgReaction(avg); setClassification(classifyFatigue(avg))
        setIsActive(false); setFeedback(`Selesai! Rata-rata: ${avg} ms`)
        return
      }
    }

    setFeedback(isPractice
      ? `Latihan ${currentRound} selesai (${reactionTime} ms)`
      : `Ronde ${currentRound - PRACTICE_ROUNDS} — ${reactionTime} ms ✓`
    )
    const next = currentRound + 1
    setCurrentRound(next); scheduleNextTrigger(next)
  }

  const handleGoToPopIt = () => {
    if (avgReaction === null) return
    router.push(`/test/popit?nip=${nip}&reactionAvg=${avgReaction}`)
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500">Memuat...</div>
  }

  const completedRounds = Math.max(0, currentRound - 1)
  const progress = (completedRounds / TOTAL_ROUNDS) * 100

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-12 font-sans relative">
      <div className="absolute top-0 left-0 w-full h-80 bg-indigo-600 rounded-b-[3rem] shadow-lg pointer-events-none" />

      <div className="w-full max-w-3xl z-10 flex flex-col gap-6">
        {/* Header Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between text-white shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="text-center sm:text-left">
              <p className="font-bold text-xl">{pegawai?.nama}</p>
              <p className="text-white/80 font-medium">{pegawai?.jabatan}</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 text-center sm:text-right bg-black/20 px-4 py-2 rounded-xl">
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-0.5">NIP</p>
            <p className="font-mono text-base">{pegawai?.nip}</p>
          </div>
        </div>

        {/* Main Test Card */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center">
          
          <div className="w-full mb-10">
            <div className="flex justify-between text-sm font-bold text-slate-500 mb-3">
              <span>Fase Latihan: {Math.min(completedRounds, PRACTICE_ROUNDS)}/{PRACTICE_ROUNDS}</span>
              <span>Fase Penilaian: {reactionTimes.length}/{TOTAL_ROUNDS - PRACTICE_ROUNDS}</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stimulus Indicator */}
          <div className="relative w-40 h-40 flex items-center justify-center my-8">
            <div className={`absolute inset-0 rounded-full transition-all duration-75 ${
              isTriggered && mode === 'light'
                ? 'bg-emerald-400 scale-110 shadow-[0_0_80px_rgba(52,211,153,0.6)]'
                : 'bg-slate-100 border-4 border-slate-200 shadow-inner'
            }`} />
            <div className={`absolute inset-4 rounded-full transition-all duration-75 ${
              isTriggered && mode === 'light' ? 'bg-emerald-300' : 'bg-slate-200/50'
            }`} />
          </div>

          <div className="h-10 mb-8">
            <p className={`text-xl md:text-2xl font-bold transition-all ${
              isTooEarly ? 'text-red-500' : isTriggered ? 'text-emerald-500' : 'text-slate-400'
            }`}>
              {feedback || (isActive ? 'Siapkan diri Anda...' : 'Tekan Mulai untuk bersiap')}
            </p>
          </div>

          <button
            onPointerDown={(e) => { e.preventDefault(); handleReactionPress(); }}
            disabled={!isActive}
            className={`w-full max-w-md py-6 md:py-8 rounded-[2rem] text-2xl md:text-3xl font-black tracking-wider transition-all duration-75 select-none
              ${isActive
                ? isTriggered
                  ? 'bg-emerald-500 text-white scale-[1.02] shadow-xl shadow-emerald-500/30'
                  : 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95 shadow-xl'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-slate-200'
              }`}
          >
            {isTriggered ? 'TEKAN!' : 'TOMBOL REAKSI'}
          </button>

          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-4 mt-12 w-full max-w-md">
            <button
              onClick={handleStart}
              disabled={isActive}
              className="flex-1 py-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              Mulai Tes
            </button>
            <button
              onClick={() => setMode(m => m === 'light' ? 'sound' : 'light')}
              disabled={isActive}
              className="px-6 py-4 rounded-2xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition-all border border-slate-200"
            >
              {mode === 'light' ? 'Visual' : 'Audio'}
            </button>
          </div>

          {/* History */}
          {reactionTimes.length > 0 && (
            <div className="w-full mt-10 pt-8 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Rekaman Waktu</p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {reactionTimes.map((t, i) => (
                  <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono font-semibold text-sm">
                    R{i + 1}: {t}ms
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Results Summary */}
          {avgReaction !== null && (
            <div className="w-full mt-10 p-8 bg-slate-50 border border-slate-200 rounded-[2rem] text-center animate-in zoom-in-95 duration-500">
              <p className="text-slate-500 font-bold mb-2">Kecepatan Rata-rata</p>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="text-6xl font-black text-slate-900 tracking-tighter">{avgReaction}</span>
                <span className="text-2xl font-bold text-slate-400">ms</span>
              </div>
              <div className="mb-8">
                <span className={`inline-flex items-center px-5 py-2 rounded-xl text-sm font-bold border ${classifyBadge(classification)}`}>
                  {classification}
                </span>
              </div>
              <button
                onClick={handleGoToPopIt}
                className="w-full max-w-sm mx-auto py-4 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center justify-center gap-2"
              >
                Lanjut ke Pop It Game
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReactionTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <ReactionTestContent />
    </Suspense>
  )
}
