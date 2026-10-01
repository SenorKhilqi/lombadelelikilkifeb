'use client'

import { useState, useEffect } from 'react'
import { getAllPegawai, getAllTestResults, type Pegawai, type TestResult } from '@/lib/supabase'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboardPage() {
  const [pegawai, setPegawai] = useState<Pegawai[]>([])
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [pData, rData] = await Promise.all([
          getAllPegawai(),
          getAllTestResults()
        ])
        setPegawai(pData)
        setResults(rData)
      } catch (e) {
        console.error(e)
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <svg className="w-10 h-10 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    )
  }

  // Calculate Statistics
  const totalPegawai = pegawai.length
  const totalTes = results.length
  
  const popItAman = results.filter(r => r.status_pop_it === 'Aman').length
  const popItGagal = results.filter(r => r.status_pop_it === 'Gagal').length

  const classCount: Record<string, number> = {
    'Normal (Waspada)': 0,
    'Normal': 0,
    'Fatigue Ringan': 0,
    'Fatigue Sedang': 0,
    'Fatigue Berat': 0,
  }

  results.forEach(r => {
    if (classCount[r.klasifikasi_kelelahan] !== undefined) {
      classCount[r.klasifikasi_kelelahan]++
    }
  })

  // Prepare data for stock-like chart (Reaction Time over time)
  // Sort results by date ascending
  const chartData = [...results]
    .sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime())
    .map(r => ({
      name: r.nama.split(' ')[0], // First name
      date: r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '',
      reaksi: r.rata_rata_reaksi,
    }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Pegawai */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Pegawai</p>
              <h3 className="text-3xl font-bold text-white">{totalPegawai}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Tes */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Hasil Tes</p>
              <h3 className="text-3xl font-bold text-white">{totalTes}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pop It Aman */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Pop It - Aman</p>
              <h3 className="text-3xl font-bold text-white">{popItAman}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pop It Gagal */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Pop It - Gagal</p>
              <h3 className="text-3xl font-bold text-white">{popItGagal}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30 text-red-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Reaksi Chart (Stock-like) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-2">Tren Waktu Reaksi</h3>
          <p className="text-slate-400 text-sm mb-6">Grafik pergerakan nilai reaksi (ms) tes dari waktu ke waktu</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReaksi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.3)" 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#06b6d4' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  formatter={(value: number) => [`${value} ms`, 'Waktu Reaksi']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.name ? `${payload[0].payload.name} (${label})` : label}
                />
                <Area 
                  type="monotone" 
                  dataKey="reaksi" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorReaksi)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart Kelelahan */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Distribusi Tingkat Kelelahan</h3>
          <div className="space-y-4">
            {Object.entries(classCount).map(([label, count]) => {
              const percentage = totalTes > 0 ? Math.round((count / totalTes) * 100) : 0
              let barColor = 'bg-white/20'
              if (label.includes('Normal (Waspada)')) barColor = 'bg-emerald-500'
              else if (label === 'Normal') barColor = 'bg-green-500'
              else if (label.includes('Ringan')) barColor = 'bg-yellow-500'
              else if (label.includes('Sedang')) barColor = 'bg-orange-500'
              else if (label.includes('Berat')) barColor = 'bg-red-500'

              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 font-medium">{label}</span>
                    <span className="text-slate-400">{count} tes ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${barColor} shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Insight Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl flex flex-col justify-center">
          <div className="text-center p-6 bg-blue-500/5 rounded-xl border border-blue-500/10">
            <svg className="w-12 h-12 text-blue-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">Insight Analitik</h3>
            <p className="text-slate-400 text-sm">
              Terdapat <strong>{totalTes}</strong> hasil tes tercatat dari total <strong>{totalPegawai}</strong> pegawai.
              Dari semua tes, <strong>{popItGagal}</strong> mengalami kegagalan pada uji fokus (Pop It).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
