/**
 * Catálogo de indicadores DOR 2026.
 * Fuente: Manual de Incentivación DOR 2026 v3, Sección 1.1–1.5
 *
 * WEIGHTS_BY_POSITION define los pesos de cada indicador según el puesto.
 * Para cambiar pesos, edita solo este archivo.
 */

import type { Frequency } from '@/types'

export interface IndicatorDef {
  code: string
  name: string
  frequency: Frequency
  description?: string
}

/** Catálogo maestro de indicadores */
export const INDICATORS: IndicatorDef[] = [
  { code: 'RORC_CNN',          name: 'RORC / Compromisos CNN',               frequency: 'semestral'  },
  { code: 'INF_RECURRENTES',   name: 'INF Recurrentes',                      frequency: 'mensual'    },
  { code: 'INF_NO_RECURRENTES',name: 'INF No Recurrentes',                   frequency: 'trimestral' },
  { code: 'INF_TOTAL',         name: 'INF Total',                            frequency: 'trimestral' },
  { code: 'VISTA_MN',          name: 'Vista MN (sin Intereses)',              frequency: 'mensual'    },
  { code: 'RESTO_CAPTACION',   name: 'Resto de Captación',                   frequency: 'mensual'    },
  { code: 'CAPTACION_TOTAL',   name: 'Captación Total',                      frequency: 'mensual'    },
  { code: 'CARTERA_SEGMENTOS', name: 'Cartera por Segmentos',                frequency: 'trimestral' },
  { code: 'CARTERA_TOTAL',     name: 'Cartera Total',                        frequency: 'trimestral' },
  { code: 'COLOCACION_SOST',   name: 'Colocación Sostenible',                frequency: 'semestral'  },
  { code: 'NUEVOS_GRUPOS',     name: 'Nuevos Grupos Acreditados',            frequency: 'anual'      },
  { code: 'STOCK_NOMINA',      name: 'Stock Nómina',                         frequency: 'semestral'  },
  { code: 'CLIENTES_TARGET',   name: 'Clientes Target',                      frequency: 'semestral'  },
  { code: 'CLIENTES_NUEVOS',   name: 'Clientes Nuevos',                      frequency: 'semestral'  },
  { code: 'ONE_TEAM',          name: 'One Team',                             frequency: 'trimestral' },
  { code: 'AACC',              name: 'Acciones Comerciales',                 frequency: 'trimestral' },
  { code: 'PROD_ESTRATEGICOS', name: 'Productos Estratégicos',               frequency: 'semestral'  },
  // Penalizaciones (peso negativo, no cuentan en el 100 base)
  { code: 'EXP_UNICA',         name: 'Experiencia Única - RCP',             frequency: 'trimestral' },
  { code: 'CONTROL_INTERNO',   name: 'Control Interno',                      frequency: 'trimestral' },
  { code: 'IMPAGOS',           name: 'Impagos',                              frequency: 'mensual'    },
]

/** Mapa rápido code → def */
export const INDICATOR_MAP = Object.fromEntries(
  INDICATORS.map(i => [i.code, i])
)

// ─── Pesos por puesto (Manual DOR 2026, Sección 1.1) ─────────────────────────

export interface IndicatorWeight {
  code: string
  weight: number
}

/** Ejecutivo Empresarial — Mediana Empresa (EE_ME) */
export const WEIGHTS_EE_ME: IndicatorWeight[] = [
  { code: 'INF_RECURRENTES',    weight: 17 },
  { code: 'INF_NO_RECURRENTES', weight: 18 },
  { code: 'VISTA_MN',           weight:  7 },
  { code: 'RESTO_CAPTACION',    weight: 16 },
  { code: 'CARTERA_SEGMENTOS',  weight:  7 },
  { code: 'COLOCACION_SOST',    weight: 12 },
  { code: 'NUEVOS_GRUPOS',      weight:  7 },
  { code: 'STOCK_NOMINA',       weight:  9 },
  { code: 'ONE_TEAM',           weight:  7 },
  // Adicionales (no cuentan en el 100 base)
  { code: 'AACC',               weight: 10 },  // hasta +10
  { code: 'PROD_ESTRATEGICOS',  weight:  7 },  // hasta +7
]

/** Ejecutivo Empresarial — Empresas (EE_EMP) */
export const WEIGHTS_EE_EMP: IndicatorWeight[] = [
  { code: 'RORC_CNN',           weight:  7 },
  { code: 'INF_RECURRENTES',    weight: 10 },
  { code: 'INF_NO_RECURRENTES', weight:  7 },
  { code: 'VISTA_MN',           weight: 15 },
  { code: 'RESTO_CAPTACION',    weight:  7 },
  { code: 'CARTERA_SEGMENTOS',  weight: 16 },
  { code: 'COLOCACION_SOST',    weight:  7 },
  { code: 'NUEVOS_GRUPOS',      weight: 10 },
  { code: 'STOCK_NOMINA',       weight:  7 },
  { code: 'CLIENTES_TARGET',    weight:  7 },
  { code: 'ONE_TEAM',           weight:  7 },
  { code: 'AACC',               weight: 10 },
  { code: 'PROD_ESTRATEGICOS',  weight:  7 },
]

/** Banquero Corporativo (BC) */
export const WEIGHTS_BC: IndicatorWeight[] = [
  { code: 'RORC_CNN',           weight:  8 },
  { code: 'INF_RECURRENTES',    weight: 12 },
  { code: 'INF_NO_RECURRENTES', weight: 11 },
  { code: 'VISTA_MN',           weight: 13 },
  { code: 'RESTO_CAPTACION',    weight:  8 },
  { code: 'CARTERA_SEGMENTOS',  weight: 22 },
  { code: 'COLOCACION_SOST',    weight:  7 },
  { code: 'STOCK_NOMINA',       weight:  7 },
  { code: 'CLIENTES_TARGET',    weight:  5 },
  { code: 'ONE_TEAM',           weight:  7 },
  { code: 'AACC',               weight: 10 },
  { code: 'PROD_ESTRATEGICOS',  weight:  7 },
]

/** Banquero Empresarial Grandes Empresas (BE_GE) */
export const WEIGHTS_BE_GE: IndicatorWeight[] = [
  { code: 'RORC_CNN',           weight:  7 },
  { code: 'INF_RECURRENTES',    weight:  9 },
  { code: 'INF_NO_RECURRENTES', weight:  8 },
  { code: 'VISTA_MN',           weight: 14 },
  { code: 'RESTO_CAPTACION',    weight:  7 },
  { code: 'CARTERA_SEGMENTOS',  weight: 20 },
  { code: 'COLOCACION_SOST',    weight:  7 },
  { code: 'NUEVOS_GRUPOS',      weight:  8 },
  { code: 'STOCK_NOMINA',       weight:  7 },
  { code: 'CLIENTES_TARGET',    weight:  6 },
  { code: 'ONE_TEAM',           weight:  7 },
  { code: 'AACC',               weight: 10 },
  { code: 'PROD_ESTRATEGICOS',  weight:  7 },
]

/** Mapa puesto code → pesos */
export const WEIGHTS_BY_POSITION: Record<string, IndicatorWeight[]> = {
  EE_ME:  WEIGHTS_EE_ME,
  EE_EMP: WEIGHTS_EE_EMP,
  BC:     WEIGHTS_BC,
  BE_GE:  WEIGHTS_BE_GE,
}

/** Indicadores "base" (que suman al 100) — excluye adicionales y penalizaciones */
export const BASE_INDICATOR_CODES = new Set([
  'RORC_CNN','INF_RECURRENTES','INF_NO_RECURRENTES','INF_TOTAL',
  'VISTA_MN','RESTO_CAPTACION','CAPTACION_TOTAL',
  'CARTERA_SEGMENTOS','CARTERA_TOTAL','COLOCACION_SOST',
  'NUEVOS_GRUPOS','STOCK_NOMINA','CLIENTES_TARGET','CLIENTES_NUEVOS','ONE_TEAM',
])

export const PENALTY_CODES = new Set(['EXP_UNICA','CONTROL_INTERNO','IMPAGOS'])
export const BONUS_CODES   = new Set(['AACC','PROD_ESTRATEGICOS'])
