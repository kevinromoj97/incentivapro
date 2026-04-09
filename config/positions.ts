/**
 * Catálogo de puestos y ligas.
 * Fuente: Manual DOR 2026, Sección I y 1.10
 */

export interface PositionDef {
  code: string
  name: string
  shortName: string
  segment: 'empresas' | 'instituciones' | 'direccion'
}

export interface LeagueDef {
  code: string
  name: string
}

export const POSITIONS: PositionDef[] = [
  // Ejecutivos / Banqueros
  { code: 'EE_ME',  name: 'Ejecutivo Empresarial (Mediana Empresa)', shortName: 'EE ME',  segment: 'empresas' },
  { code: 'EE_EMP', name: 'Ejecutivo Empresarial (Empresas)',         shortName: 'EE Emp', segment: 'empresas' },
  { code: 'BC',     name: 'Banquero Corporativo',                     shortName: 'BC',     segment: 'empresas' },
  { code: 'BE_GE',  name: 'Banquero Empresarial Grandes Empresas',   shortName: 'BE GE',  segment: 'empresas' },
  { code: 'BI',     name: 'Banquero Institucional',                   shortName: 'BI',     segment: 'instituciones' },
  { code: 'BGC',    name: 'Banquero Grandes Cuentas',                 shortName: 'BGC',    segment: 'instituciones' },
  { code: 'EG',     name: 'Ejecutivo Gobierno',                       shortName: 'EG',     segment: 'instituciones' },
  // Directores
  { code: 'DO',     name: 'Director de Oficina',                      shortName: 'DO',     segment: 'direccion' },
  { code: 'DR',     name: 'Director Regional',                        shortName: 'DR',     segment: 'direccion' },
  { code: 'DD',     name: 'Director Divisional',                      shortName: 'DD',     segment: 'direccion' },
  { code: 'DCE',    name: 'Director Centro Empresarial',              shortName: 'DCE',    segment: 'direccion' },
  { code: 'DRC',    name: 'Director Regional Corporativo',            shortName: 'DRC',    segment: 'direccion' },
]

export const LEAGUES: LeagueDef[] = [
  { code: 'CORPORATIVO',    name: 'Corporativo'    },
  { code: 'GRANDES_EMP',   name: 'Grandes Empresas' },
  { code: 'EMPRESARIAL',   name: 'Empresarial'    },
  { code: 'MEDIANA_EMP',   name: 'Mediana Empresa' },
  { code: 'GOBIERNO',      name: 'Gobierno'       },
  { code: 'INSTITUCIONES', name: 'Instituciones'  },
]

export const POSITION_MAP = Object.fromEntries(POSITIONS.map(p => [p.code, p]))
export const LEAGUE_MAP   = Object.fromEntries(LEAGUES.map(l => [l.code, l]))
