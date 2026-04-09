'use client'

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine, RadarChart,
  Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { MONTHS_ES } from '@/types'

interface MonthResult {
  month: number
  monthName: string
  totalPoints: number
  hasData: boolean
  results: Array<{ indicator_name: string; points: number; logro_pct: number }>
}

interface DashboardChartsProps {
  monthlyResults: MonthResult[]
  currentMonth: number
}

export function DashboardCharts({ monthlyResults, currentMonth }: DashboardChartsProps) {
  // Data para barras mensuales
  const barData = monthlyResults.map(m => ({
    name: m.monthName.slice(0, 3),
    'Puntos': m.hasData ? Number(m.totalPoints.toFixed(2)) : 0,
    future: !m.hasData,
  }))

  // Acumulado
  let acc = 0
  const lineData = monthlyResults.map(m => {
    if (m.hasData) acc += m.totalPoints
    return {
      name: m.monthName.slice(0, 3),
      'Acumulado': m.hasData ? Number(acc.toFixed(2)) : undefined,
      'Proyección': m.hasData ? undefined : Number((acc + m.totalPoints * 0.9).toFixed(2)),
    }
  })

  // Radar — indicadores del último mes con datos
  const lastMonthWithData = [...monthlyResults].reverse().find(m => m.hasData)
  const radarData = lastMonthWithData?.results?.map(r => ({
    indicator: r.indicator_name.replace('Recurrentes', 'Rec.').replace('No Recurrentes', 'NR').slice(0, 15),
    value: Number((r.logro_pct * 100).toFixed(1)),
    fullMark: 150,
  })) ?? []

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      {/* Bar chart — puntos mensuales */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5 shadow-card">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Puntos DOR por mes</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={35} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
              formatter={(v: number) => [v.toFixed(2), 'Puntos']}
            />
            <ReferenceLine y={100} stroke="#004481" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: 'Meta 100', position: 'right', fontSize: 10, fill: '#004481' }} />
            <Bar dataKey="Puntos" fill="#004481" radius={[4,4,0,0]}
              label={{ position: 'top', fontSize: 9, fill: '#6B7280', formatter: (v: number) => v > 0 ? v.toFixed(1) : '' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar — consecución por indicador */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-card">
        <h3 className="text-sm font-semibold text-text-primary mb-4">
          Consecución por indicador
          {lastMonthWithData && <span className="text-text-secondary font-normal"> — {lastMonthWithData.monthName}</span>}
        </h3>
        {radarData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="indicator" tick={{ fontSize: 9, fill: '#6B7280' }} />
              <Radar name="Logro %" dataKey="value" stroke="#004481" fill="#004481" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Logro']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-52 flex items-center justify-center text-text-secondary text-sm">
            Sin datos para mostrar
          </div>
        )}
      </div>

      {/* Line chart — acumulado */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-border p-5 shadow-card">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Puntos acumulados en el año</h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} formatter={(v: number) => [v?.toFixed(2), '']} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="Acumulado" stroke="#004481" strokeWidth={2.5} dot={{ r: 3, fill: '#004481' }} connectNulls={false} />
            <Line type="monotone" dataKey="Proyección" stroke="#5AC4BE" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
