/**
 * Tabla de consecución — Anexo A del Manual DOR 2026.
 *
 * La siguiente tabla aplica para la mayoría de indicadores:
 *   Logro Objetivo   Consecución
 *   Mín  = 90%   →  50%
 *   Ppto = 100%  →  100%
 *   Máx  = 110%  →  150% (tope)
 *
 * Para cambiar los umbrales globales o por indicador, edita esta constante.
 */

export interface ScoringThresholds {
  /** % mínimo de logro para empezar a ganar puntos (0..1) */
  minLogro: number
  /** % de logro para consecución de presupuesto (0..1) */
  pptoLogro: number
  /** % máximo de logro (cap) (0..1) */
  maxLogro: number
  /** consecución mínima (0..1.5) */
  minCons: number
  /** consecución en presupuesto (0..1.5) */
  pptoCons: number
  /** consecución máxima / cap (0..1.5) */
  maxCons: number
}

/** Tabla del Anexo A — aplica a la mayoría de indicadores */
export const DEFAULT_SCORING: ScoringThresholds = {
  minLogro:  0.90,
  pptoLogro: 1.00,
  maxLogro:  1.10,
  minCons:   0.50,
  pptoCons:  1.00,
  maxCons:   1.50,
}

/**
 * Overrides por indicador (si el indicador tiene reglas distintas al Anexo A).
 * Ej: RORC/CNN tiene una tabla especial de 3 pasos.
 * Por ahora, todos usan DEFAULT_SCORING excepto los que se listen aquí.
 */
export const SCORING_OVERRIDES: Record<string, Partial<ScoringThresholds>> = {
  // RORC_CNN: tiene lógica especial (tabla 1 + tabla 2, suma 2 componentes)
  // Para el MVP se usa DEFAULT_SCORING y la lógica avanzada se activa en lib/calculations
  // ONE_TEAM: medición especial por cuestionario — se captura la consecución directamente
}

/** Escalas de bono final DOR (50–150 puntos base determinan el % de bono) */
export const BONUS_SCALE = {
  min: 50,
  max: 150,
} as const
