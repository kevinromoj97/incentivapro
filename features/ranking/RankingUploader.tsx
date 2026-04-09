'use client'

import { useState, useRef, useTransition } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/auth/client'
import { cn, formatCurrency } from '@/lib/utils'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Eye, Trash2 } from 'lucide-react'
import { MONTHS_ES } from '@/types'
import type { Profile, Period, Ranking } from '@/types'

interface RankingUploaderProps {
  profile: Profile
  period: Period | null
  rankings: Ranking[]
}

interface ParsedRow {
  rank_position: number
  employee_name: string
  employee_code: string
  position_name: string
  league: string
  total_points: number
  monthly: number[]  // 12 values
}

// Columnas requeridas (flexibles en nombre)
const REQUIRED_COLS = ['posicion', 'nombre', 'puntos']

export function RankingUploader({ profile, period, rankings }: RankingUploaderProps) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[] | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [periodName, setPeriodName] = useState<string>(`Ranking ${new Date().getFullYear()}`)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setParseError(null)
    setParsedRows(null)
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        if (!json.length) { setParseError('El archivo está vacío.'); return }

        // Detectar columnas
        const headers = Object.keys(json[0]).map(h => h.toLowerCase().trim())

        // Parsear filas con normalización flexible
        const rows: ParsedRow[] = json.map((row, i) => {
          const get = (patterns: string[]) => {
            for (const h of Object.keys(row)) {
              if (patterns.some(p => h.toLowerCase().includes(p))) return String(row[h] ?? '')
            }
            return ''
          }

          const monthly: number[] = []
          const monthPatterns = [
            ['ene','jan'], ['feb'], ['mar'], ['abr','apr'], ['may'], ['jun'],
            ['jul'], ['ago','aug'], ['sep'], ['oct'], ['nov'], ['dic','dec'],
          ]
          for (const pats of monthPatterns) {
            const val = get(pats)
            monthly.push(parseFloat(val) || 0)
          }

          const totalPts = get(['total','puntos']) || get(['pts_total'])
          const rank     = get(['pos','rank','lugar','#'])
          return {
            rank_position: parseInt(rank) || i + 1,
            employee_name: get(['nombre','name','ejecutivo','colaborador']),
            employee_code: get(['codigo','clave','code','empleado','emp']),
            position_name: get(['puesto','cargo','posicion','rol','position']),
            league:        get(['liga','league','segmento']),
            total_points:  parseFloat(totalPts) || monthly.reduce((s, v) => s + v, 0),
            monthly,
          }
        }).filter(r => r.employee_name)

        if (!rows.length) { setParseError('No se encontraron filas válidas. Verifica el formato del archivo.'); return }

        setParsedRows(rows)
      } catch (err) {
        setParseError('No se pudo leer el archivo. Verifica que sea .xlsx o .csv válido.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleImport() {
    if (!parsedRows || !period) return

    startTransition(async () => {
      const supabase = createClient()

      // Crear cabecera del ranking
      const { data: ranking, error: rankErr } = await supabase
        .from('rankings')
        .insert({
          period_id:        period.id,
          year:             period.year,
          period_name:      periodName,
          source_file_name: fileName,
          uploaded_by:      profile.id,
          uploaded_at:      new Date().toISOString(),
        })
        .select()
        .single()

      if (rankErr || !ranking) {
        setToast({ type: 'error', msg: `Error al crear el ranking: ${rankErr?.message}` })
        return
      }

      // Insertar entradas en lotes
      const MONTH_KEYS_DB = ['jan_pts','feb_pts','mar_pts','apr_pts','may_pts','jun_pts','jul_pts','aug_pts','sep_pts','oct_pts','nov_pts','dec_pts']
      const entries = parsedRows.map(r => {
        const entry: Record<string, unknown> = {
          ranking_id:    ranking.id,
          rank_position: r.rank_position,
          employee_name: r.employee_name,
          employee_code: r.employee_code || null,
          position_name: r.position_name || null,
          league:        r.league || null,
          total_points:  r.total_points,
        }
        MONTH_KEYS_DB.forEach((k, i) => { entry[k] = r.monthly[i] ?? null })
        return entry
      })

      const { error: entryErr } = await supabase.from('ranking_entries').insert(entries)
      if (entryErr) {
        setToast({ type: 'error', msg: `Error al insertar entradas: ${entryErr.message}` })
        return
      }

      setToast({ type: 'success', msg: `Ranking importado: ${parsedRows.length} registros guardados.` })
      setParsedRows(null)
      setFileName('')
    })
  }

  return (
    <div className="space-y-5">
      {/* Upload area */}
      <div className="bg-white rounded-xl border border-border shadow-card p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">1. Seleccionar archivo</h3>

        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
            parsedRows ? 'border-success/40 bg-success/3' : 'border-border hover:border-primary/40 hover:bg-primary/2'
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {parsedRows ? (
            <>
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <p className="font-semibold text-success">{fileName}</p>
              <p className="text-sm text-text-secondary mt-1">{parsedRows.length} registros detectados</p>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-10 h-10 text-text-secondary mx-auto mb-3 opacity-50" />
              <p className="font-semibold text-text-primary">Arrastra tu archivo aquí</p>
              <p className="text-sm text-text-secondary mt-1">o haz clic para seleccionar</p>
              <p className="text-xs text-text-secondary mt-2">Formatos: .xlsx, .xls, .csv</p>
            </>
          )}
        </div>

        {parseError && (
          <div className="mt-3 flex items-center gap-2 text-danger text-sm bg-danger/8 border border-danger/20 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {parseError}
          </div>
        )}
      </div>

      {/* Period name */}
      {parsedRows && (
        <>
          <div className="bg-white rounded-xl border border-border shadow-card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">2. Nombre del período</h3>
            <input
              type="text" value={periodName} onChange={e => setPeriodName(e.target.value)}
              className="input-clean max-w-sm" placeholder="Ej: Ranking 1er Semestre 2026"
            />
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-gray-50">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Eye className="w-4 h-4" /> 3. Vista previa (primeras 10 filas)
              </h3>
              <span className="text-xs text-text-secondary">{parsedRows.length} filas en total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table min-w-[600px]">
                <thead>
                  <tr>
                    <th className="text-center">#</th>
                    <th className="text-left">Nombre</th>
                    <th className="text-left">Código</th>
                    <th className="text-left">Liga</th>
                    <th className="text-right">Total Pts</th>
                    {MONTHS_ES.slice(0, 4).map(m => <th key={m} className="text-right">{m.slice(0,3)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 10).map((r, i) => (
                    <tr key={i}>
                      <td className="text-center font-bold text-text-secondary">{r.rank_position}</td>
                      <td className="font-medium text-sm text-text-primary">{r.employee_name}</td>
                      <td className="text-sm text-text-secondary">{r.employee_code || '—'}</td>
                      <td className="text-sm text-text-secondary">{r.league || '—'}</td>
                      <td className="text-right tabular-nums font-bold text-primary">{r.total_points.toFixed(2)}</td>
                      {r.monthly.slice(0, 4).map((v, j) => (
                        <td key={j} className="text-right tabular-nums text-sm text-text-secondary">{v > 0 ? v.toFixed(1) : '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import button */}
          <div className="flex justify-end gap-3">
            {toast && (
              <div className={cn(
                'flex items-center gap-2 text-sm font-medium',
                toast.type === 'success' ? 'text-success' : 'text-danger'
              )}>
                {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {toast.msg}
              </div>
            )}
            <button
              onClick={() => { setParsedRows(null); setFileName('') }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border border-border text-text-secondary hover:bg-muted transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={isPending || !period}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Confirmar importación
            </button>
          </div>
        </>
      )}

      {/* History */}
      {rankings.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-gray-50">
            <h3 className="text-sm font-semibold text-text-primary">Historial de rankings cargados</h3>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Período</th>
                <th className="text-left hidden md:table-cell">Archivo</th>
                <th className="text-left">Fecha de carga</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map(r => (
                <tr key={r.id}>
                  <td className="font-medium text-sm text-text-primary">{r.period_name}</td>
                  <td className="text-sm text-text-secondary hidden md:table-cell">{r.source_file_name ?? '—'}</td>
                  <td className="text-sm text-text-secondary">
                    {new Date(r.uploaded_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
