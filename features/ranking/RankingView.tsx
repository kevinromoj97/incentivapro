'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { MONTHS_ES, MONTH_KEYS } from '@/types'
import { cn } from '@/lib/utils'
import { Trophy, Search } from 'lucide-react'
import type { Profile, Ranking, RankingEntry } from '@/types'

interface RankingViewProps {
  profile: Profile
  ranking: Ranking | null
  entries: RankingEntry[]
}

export function RankingView({ profile, ranking, entries }: RankingViewProps) {
  const [search, setSearch] = useState('')
  const [leagueFilter, setLeagueFilter] = useState('all')

  const leagues = Array.from(new Set(entries.map(e => e.league).filter(Boolean))) as string[]

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.employee_name.toLowerCase().includes(search.toLowerCase()) || e.employee_code?.includes(search)
    const matchLeague = leagueFilter === 'all' || e.league === leagueFilter
    return matchSearch && matchLeague
  })

  const myEntry = entries.find(e =>
    (profile.employee_code && e.employee_code === profile.employee_code) ||
    e.employee_name.toLowerCase().includes((profile.full_name ?? '').toLowerCase())
  )

  if (!ranking) {
    return (
      <div className="bg-white rounded-xl border border-border p-16 text-center">
        <Trophy className="w-12 h-12 text-text-secondary mx-auto mb-4 opacity-40" />
        <h3 className="font-semibold text-text-primary mb-2">Ranking no disponible</h3>
        <p className="text-text-secondary text-sm">
          El administrador aún no ha cargado el ranking nacional para este período.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* My position highlight */}
      {myEntry && (
        <div className="bg-primary text-white rounded-xl p-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Tu posición actual</p>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black">#{myEntry.rank_position}</span>
              <div>
                <p className="font-semibold">{myEntry.employee_name}</p>
                <p className="text-white/70 text-sm">{myEntry.league} · {myEntry.total_points.toFixed(2)} pts</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs mb-1">Total participantes</p>
            <p className="text-2xl font-bold">{entries.length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="input-clean pl-9" placeholder="Buscar ejecutivo..."
          />
        </div>
        <select value={leagueFilter} onChange={e => setLeagueFilter(e.target.value)} className="input-clean w-auto">
          <option value="all">Todas las ligas</option>
          {leagues.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <span className="text-sm text-text-secondary">{filtered.length} ejecutivos</span>
      </div>

      {/* Ranking table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gray-50">
          <h3 className="text-sm font-semibold text-text-primary">{ranking.period_name}</h3>
          <p className="text-xs text-text-secondary">
            Cargado el {new Date(ranking.uploaded_at).toLocaleDateString('es-MX')}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table min-w-[700px]">
            <thead>
              <tr>
                <th className="text-center w-16">#</th>
                <th className="text-left">Ejecutivo</th>
                <th className="text-left hidden md:table-cell">Liga</th>
                <th className="text-right">Total</th>
                {MONTHS_ES.slice(0, 6).map(m => (
                  <th key={m} className="text-right hidden lg:table-cell">{m.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => {
                const isMe = myEntry?.id === entry.id
                return (
                  <tr key={entry.id} className={cn(isMe && 'bg-primary/5 font-semibold border-l-2 border-l-primary')}>
                    <td className="text-center">
                      <span className={cn(
                        'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                        entry.rank_position <= 3 ? 'bg-amber-100 text-amber-700' : 'text-text-secondary'
                      )}>
                        {entry.rank_position}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className={cn('text-sm', isMe ? 'text-primary font-semibold' : 'text-text-primary font-medium')}>
                          {entry.employee_name}
                          {isMe && <span className="ml-2 text-xs bg-primary text-white px-1.5 py-0.5 rounded">Tú</span>}
                        </p>
                        <p className="text-xs text-text-secondary">{entry.employee_code} · {entry.position_name}</p>
                      </div>
                    </td>
                    <td className="hidden md:table-cell text-sm text-text-secondary">{entry.league ?? '—'}</td>
                    <td className="text-right tabular-nums text-sm font-bold text-text-primary">
                      {entry.total_points.toFixed(2)}
                    </td>
                    {MONTH_KEYS.slice(0, 6).map(key => (
                      <td key={key} className="text-right tabular-nums text-xs text-text-secondary hidden lg:table-cell">
                        {entry[key] != null ? Number(entry[key]).toFixed(1) : '—'}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
