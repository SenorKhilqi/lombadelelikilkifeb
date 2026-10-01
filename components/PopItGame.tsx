'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Tipe ─────────────────────────────────────────────────────────────────────
interface PopItGameProps {
  onComplete: (success: boolean) => void
}

type BubbleState = 'idle' | 'highlighted' | 'pressed' | 'wrong' | 'correct'

interface Bubble {
  id: number
  state: BubbleState
}

// ─── Konstanta ────────────────────────────────────────────────────────────────
const GRID_SIZE = 9        // 3x3 grid = 9 bubble
const SEQUENCE_LENGTH = 5  // panjang urutan yang harus diingat
const HIGHLIGHT_INTERVAL = 700 // ms per bubble saat menampilkan urutan

// Warna bubble per state
const BUBBLE_STYLE: Record<BubbleState, string> = {
  idle:        'bg-purple-900/60 border-purple-700/50 hover:bg-purple-800/70 hover:border-purple-600/70 cursor-pointer',
  highlighted: 'bg-pink-400 border-pink-300 shadow-[0_0_20px_6px_rgba(236,72,153,0.5)] scale-110 cursor-default',
  pressed:     'bg-blue-400 border-blue-300 shadow-[0_0_15px_4px_rgba(96,165,250,0.5)] scale-105 cursor-pointer',
  correct:     'bg-emerald-400 border-emerald-300 shadow-[0_0_15px_4px_rgba(52,211,153,0.5)] scale-105 cursor-pointer',
  wrong:       'bg-red-500 border-red-400 shadow-[0_0_20px_6px_rgba(239,68,68,0.6)] scale-95 cursor-pointer animate-bounce',
}

type GamePhase = 'idle' | 'showing' | 'input' | 'success' | 'fail'

// ─── Komponen ─────────────────────────────────────────────────────────────────
export default function PopItGame({ onComplete }: PopItGameProps) {
  const [bubbles, setBubbles] = useState<Bubble[]>(
    Array.from({ length: GRID_SIZE }, (_, i) => ({ id: i, state: 'idle' }))
  )
  const [sequence, setSequence] = useState<number[]>([])
  const [playerInput, setPlayerInput] = useState<number[]>([])
  const [gamePhase, setGamePhase] = useState<GamePhase>('idle')
  const [score, setScore] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [message, setMessage] = useState('Tekan "Mulai" untuk memulai permainan')
  const [wrongBubble, setWrongBubble] = useState<number | null>(null)

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Bersihkan semua timeout saat unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  // ── Reset semua bubble ke idle ───────────────────────────────────────────
  const resetBubbles = () => {
    setBubbles(prev => prev.map(b => ({ ...b, state: 'idle' })))
  }

  // ── Buat urutan acak baru ─────────────────────────────────────────────────
  const generateSequence = (): number[] => {
    const seq: number[] = []
    while (seq.length < SEQUENCE_LENGTH) {
      const r = Math.floor(Math.random() * GRID_SIZE)
      if (seq[seq.length - 1] !== r) seq.push(r)
    }
    return seq
  }

  // ── Tampilkan urutan secara animasi ───────────────────────────────────────
  const showSequence = (seq: number[]) => {
    setGamePhase('showing')
    setMessage('Perhatikan urutan...')
    resetBubbles()

    // Clear previous timeouts
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    seq.forEach((bubbleId, index) => {
      // Nyalakan
      const onId = setTimeout(() => {
        setBubbles(prev =>
          prev.map(b => ({ ...b, state: b.id === bubbleId ? 'highlighted' : 'idle' }))
        )
      }, index * HIGHLIGHT_INTERVAL + 300)

      // Matikan
      const offId = setTimeout(() => {
        setBubbles(prev =>
          prev.map(b => ({ ...b, state: b.id === bubbleId ? 'idle' : b.state }))
        )
      }, index * HIGHLIGHT_INTERVAL + HIGHLIGHT_INTERVAL * 0.8)

      timeoutsRef.current.push(onId, offId)
    })

    // Selesai menampilkan — giliran pemain
    const doneId = setTimeout(() => {
      resetBubbles()
      setGamePhase('input')
      setPlayerInput([])
      setMessage('Sekarang giliran Anda! Tekan bubble sesuai urutan.')
    }, seq.length * HIGHLIGHT_INTERVAL + 400)

    timeoutsRef.current.push(doneId)
  }

  // ── Mulai game ────────────────────────────────────────────────────────────
  const handleStart = () => {
    const seq = generateSequence()
    setSequence(seq)
    setPlayerInput([])
    setScore(0)
    setAttempt(prev => prev + 1)
    setWrongBubble(null)
    showSequence(seq)
  }

  // ── Pemain tekan bubble ───────────────────────────────────────────────────
  const handleBubblePress = (bubbleId: number) => {
    if (gamePhase !== 'input') return

    const currentStep = playerInput.length
    const expected = sequence[currentStep]
    const newInput = [...playerInput, bubbleId]

    if (bubbleId === expected) {
      // Benar
      setBubbles(prev =>
        prev.map(b => ({ ...b, state: b.id === bubbleId ? 'correct' : b.state }))
      )
      setScore(s => s + 1)

      setTimeout(() => {
        setBubbles(prev =>
          prev.map(b => ({ ...b, state: b.id === bubbleId ? 'idle' : b.state }))
        )
      }, 350)

      if (newInput.length === sequence.length) {
        // Semua benar!
        setPlayerInput(newInput)
        setGamePhase('success')
        setMessage('🎉 Sempurna! Semua urutan benar!')
        setTimeout(() => onComplete(true), 1200)
      } else {
        setPlayerInput(newInput)
      }
    } else {
      // Salah
      setWrongBubble(bubbleId)
      setBubbles(prev =>
        prev.map(b => ({ ...b, state: b.id === bubbleId ? 'wrong' : b.state }))
      )
      setGamePhase('fail')
      setMessage(`❌ Salah! Anda menekan bubble ${bubbleId + 1}, seharusnya ${expected + 1}. Coba lagi...`)

      // Tidak langsung gagal — retry setelah jeda
      const retryId = setTimeout(() => {
        setWrongBubble(null)
        setAttempt(prev => prev + 1)
        setPlayerInput([])
        showSequence(sequence) // Tampilkan ulang urutan yang sama
        onComplete(false) // Beritahu parent bahwa ada salah (retry state)
      }, 2000)

      timeoutsRef.current.push(retryId)
    }
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm">
      {/* Info */}
      <div className="text-center mb-6">
        <div className="flex justify-center gap-6 text-sm text-slate-400 mb-3">
          <span>Percobaan: <span className="text-white font-semibold">{attempt}</span></span>
          <span>Progress: <span className="text-white font-semibold">
            {gamePhase === 'input' ? `${playerInput.length}/${SEQUENCE_LENGTH}` : `${SEQUENCE_LENGTH}/${SEQUENCE_LENGTH}`}
          </span></span>
        </div>
        <p className={`text-sm font-medium transition-colors duration-300 ${
          gamePhase === 'success' ? 'text-emerald-400' :
          gamePhase === 'fail' ? 'text-red-400' :
          gamePhase === 'showing' ? 'text-pink-400' :
          gamePhase === 'input' ? 'text-cyan-400' :
          'text-slate-400'
        }`}>
          {message}
        </p>
      </div>

      {/* Progress dots */}
      {gamePhase === 'input' && (
        <div className="flex justify-center gap-2 mb-5">
          {sequence.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                i < playerInput.length
                  ? 'bg-emerald-400 scale-125'
                  : i === playerInput.length
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-white/15'
              }`}
            />
          ))}
        </div>
      )}

      {/* Grid 3x3 */}
      <div className="grid grid-cols-3 gap-4 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl mb-6">
        {bubbles.map((bubble) => (
          <button
            key={bubble.id}
            onClick={() => handleBubblePress(bubble.id)}
            disabled={gamePhase !== 'input'}
            className={`
              aspect-square rounded-2xl border-2 flex items-center justify-center
              text-xl font-bold text-white/70 transition-all duration-150
              ${BUBBLE_STYLE[bubble.state]}
              ${gamePhase !== 'input' ? 'cursor-default' : ''}
            `}
          >
            {bubble.id + 1}
          </button>
        ))}
      </div>

      {/* Tombol Mulai / Ulangi */}
      {(gamePhase === 'idle' || gamePhase === 'success') && (
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/20 hover:-translate-y-0.5"
        >
          {gamePhase === 'idle' ? '▶ Mulai Game' : '🔄 Main Lagi'}
        </button>
      )}

      {gamePhase === 'showing' && (
        <div className="w-full py-4 rounded-xl text-center text-slate-400 bg-white/5 border border-white/10 text-sm">
          Perhatikan urutan bubble...
        </div>
      )}
    </div>
  )
}
