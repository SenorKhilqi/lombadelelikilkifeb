export function classifyFatigue(avgMs: number): string {
  if (avgMs < 150) return 'Normal (Waspada)'
  if (avgMs <= 240) return 'Normal'
  if (avgMs <= 300) return 'Fatigue Ringan'
  if (avgMs <= 400) return 'Fatigue Sedang'
  return 'Fatigue Berat'
}

export function classifyBadge(c: string): string {
  if (c === 'Normal (Waspada)') return 'bg-emerald-100 border-emerald-200 text-emerald-700'
  if (c === 'Normal') return 'bg-green-100 border-green-200 text-green-700'
  if (c === 'Fatigue Ringan') return 'bg-amber-100 border-amber-200 text-amber-700'
  if (c === 'Fatigue Sedang') return 'bg-orange-100 border-orange-200 text-orange-700'
  return 'bg-red-100 border-red-200 text-red-700'
}
