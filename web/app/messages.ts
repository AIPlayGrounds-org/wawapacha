import type { Dataset } from '~/types/dataset'
import { claim } from '~/data/claims'

// Communiqué copy is keyed by `${number}-${year}`. A newer communiqué falls back
// to a line that points to the official text, so an old forecast never reads
// as the current one.
const homeLeadByCommunique: Record<string, string> = {
  '17-2026': claim('enfen-co17-coast-extraordinaria-jan2027'),
  '20-2026': claim('enfen-co20-coast-extraordinaria-feb2027'),
}
const forecastByCommunique: Record<string, string> = {
  '17-2026': 'ENFEN prevé lluvias sobre lo normal en la costa norte y central',
  '20-2026': 'ENFEN prevé lluvias sobre lo normal y ríos más altos en la costa hasta el verano',
}
const actionByCommunique: Record<string, string> = {
  '20-2026': claim('enfen-co20-recommendation'),
}
const communiqueKey = (number: number, year: number) => `${number}-${year}`
const conjunction = new Intl.ListFormat('es', { type: 'conjunction' })
/** Lists year labels. A word joiner keeps a span such as "1982–83" on one line. */
const listFormat = {
  format: (years: string[]) => conjunction.format(years.map((year) => year.replace('–', '–⁠'))),
}
/** A value in degrees. The no-break space keeps "4,5 °C" on one line. */
const degrees = (value: string) => `${value} °C`

const dataTypeDescriptions = {
  observed: 'Un instrumento lo midió: boya, satélite o estación.',
  estimated: 'Un cálculo lo obtiene a partir de mediciones.',
  forecast: 'Un modelo lo proyecta hacia una fecha futura.',
  official: 'Una institución lo declara, como el estado de alerta de ENFEN.',
} satisfies Record<Dataset['data_type'], string>

export const messages = {
  calendar: {
    month: (name: string, year: number) => `${name} de ${year}`,
    sameYearRange: (start: string, end: string) => `${start} a ${end}`,
    crossYearRange: (start: string, end: string) => `${start} a ${end}`,
  },
  dataType: {
    observed: 'Observado',
    estimated: 'Estimado',
    forecast: 'Pronóstico',
    official: 'Oficial',
  } satisfies Record<Dataset['data_type'], string>,
  oisst: {
    summary: (date: string, value: string, unit: string, location: string) =>
      `Máxima ${value} ${unit} · ${location}`,
    empty: (date: string) => `Sin datos para ${date}`,
    coordinate: (value: string, direction: string) => `${value}° ${direction}`,
    band: (start: string, end: string) => `${start}–${end}`,
    directions: {
      north: 'N',
      south: 'S',
      east: 'E',
      west: 'O',
    },
  },
  provenance: {
    variable: 'Variable',
    unit: 'Unidad',
    period: 'Periodo',
    periodBase: 'Base',
    periodValue: (value: string) => `${messages.provenance.periodBase} · ${value}`,
    dataType: 'Tipo de dato',
    source: 'Fuente',
    lastUpdate: 'Última actualización',
    latestData: 'Último dato',
    staleSource: 'Último dato disponible',
    howMeasured: 'Cómo se mide',
    ageToday: 'hoy',
    ageDay: (days: number) => `hace ${days} día${days === 1 ? '' : 's'}`,
    ageMonth: (months: number) => `hace ${months} mes${months === 1 ? '' : 'es'}`,
    ageYear: (years: number) => `hace ${years} año${years === 1 ? '' : 's'}`,
  },
  page: {
    brand: 'WawaPacha',
    skipLink: 'Saltar al contenido principal',
    seoTitle: 'El Niño Costero · WawaPacha',
    seoDescription: 'Estado oficial, evidencia y pronóstico para la costa del Perú',
    mainNav: 'Navegación principal',
    homeLead: (number: number, year: number) =>
      homeLeadByCommunique[communiqueKey(number, year)] ??
      `ENFEN publicó el comunicado ${number}-${year}. Este sitio aún no resume su pronóstico; léelo en el enlace oficial.`,
    forecastTitle: (number: number, year: number) =>
      forecastByCommunique[communiqueKey(number, year)] ??
      `ENFEN publicó el comunicado ${number}-${year}`,
    forecastSource: (number: number, year: number, date: string) =>
      `Comunicado Oficial ENFEN N° ${number}-${year}, ${date}.`,
    forecastEmptyTitle: 'Sin comunicado oficial vigente',
    nextDueStale: (date: string) => `Próximo comunicado · ${date}`,
    notShown:
      'Ningún gráfico de esta página dice dónde ni cuánto lloverá en tu localidad. Esos avisos los emiten SENAMHI y las autoridades locales.',
    actionTitle: 'Si vives en una zona expuesta, prepárate y sigue los avisos oficiales',
    actionLead: (number: number, year: number) =>
      actionByCommunique[communiqueKey(number, year)] ?? null,
    reviewSource: 'Ver la fuente',
    newTab: ' (se abre en una pestaña nueva)',
    enfenLink: 'Comunicados oficiales de ENFEN',
    senamhiLink: 'Avisos meteorológicos de SENAMHI',
    methodologyLink: 'Cómo lo sabemos',
    officialSources: 'Fuentes oficiales',
  },
  story: {
    hero: {
      question: '¿Qué tan caliente está el mar frente al Perú?',
      answer: (above: string[], since: string) =>
        above.length === 0
          ? `Más que nunca desde ${since}.`
          : above.length <= 3
            ? `Más que nunca desde ${since}, salvo en ${listFormat.format(above)}.`
            : `Lo superaron ${above.length} episodios desde ${since}.`,
      empty: 'Sin datos del ICEN',
      detail: (month: string, value: string) =>
        `En ${month}, el índice oficial del Perú marcó ${degrees(value)} sobre lo normal.`,
      chartSummary: (since: string) =>
        `Índice Costero El Niño (ICEN), mes a mes desde ${since}. Arriba de la línea, mar más caliente que lo normal.`,
    },
    timeline: {
      mark: (label: string, value: string) => `${label}\n${degrees(value)}`,
      today: 'hoy',
    },
    map: {
      legend: '°C sobre lo normal',
      warmest: degrees,
      summary: (day: string) => `Cuánto se aparta el mar de lo normal, ${day}.`,
    },
    calor: {
      question: '¿Dónde está ese calor?',
      answer: (value: string) => `En su punto más caliente, ${degrees(value)} sobre lo normal.`,
      empty: 'Sin mapa de temperatura del mar',
      week: (day: string, sst: string, normal: string) =>
        `La semana del ${day}, el mar de la costa norte estuvo a ${degrees(sst)}. Lo normal son unos ${degrees(normal)}.`,
    },
    historia: {
      question: '¿Es como 1983, 1998 o 2017?',
      answer: (above: string[], below: string[]) =>
        below.length === 0
          ? `En el índice, hoy supera los picos de ${listFormat.format(above)}`
          : above.length === 0
            ? `En el índice, hoy todavía no alcanza los picos de ${listFormat.format(below)}`
            : `En el índice, hoy supera el pico de ${listFormat.format(above)}, pero no el de ${listFormat.format(below)}`,
      empty: 'Sin datos para comparar',
      events: {
        '1982-83': '1982–83',
        '1997-98': '1997–98',
        '2017': '2017',
      },
      peak: (value: string, month: string) => `El índice llegó a ${degrees(value)} en ${month}.`,
      damage8298: claim('impact-8283-9798-caf-comparison'),
      low2017: 'En el gráfico casi no se ve. En tierra fue otra cosa.',
      todayStep: (value: string, month: string) =>
        `Hoy: ${degrees(value)} en ${month}. La línea punteada lleva ese nivel hacia atrás.`,
      people: claim('impact-2017-people'),
      punch: 'El índice mide el mar. No mide el daño.',
      chartSummary: 'El mismo índice, con los picos de 1982–83, 1997–98 y 2017.',
    },
    lluvia: {
      question: '¿Va a llover donde vivo?',
    },
    hacer: {
      question: '¿Qué hago ahora?',
    },
  },
  metodologia: {
    seoTitle: 'Cómo lo sabemos · WawaPacha',
    seoDescription: 'De dónde sale cada dato del sitio y cómo se construye cada gráfico',
    title: 'Cómo lo sabemos',
    lead: 'Cada número del sitio viene de una fuente pública. Aquí están las fuentes, cómo se dibuja cada gráfico y lo que este sitio no hace.',
    chartsTitle: 'Cómo se construye cada gráfico',
    charts: {
      icen: {
        title: 'La línea del índice',
        body: claim('icen-definition'),
        where: 'Aparece al inicio y en la comparación con 1983, 1998 y 2017.',
      },
      sea: {
        title: 'El mapa del mar',
        body: 'Cada celda de 0,5° es la temperatura del mar del último día de NOAA OISST menos su promedio de 1991–2020 para ese mismo día del año.',
        where: 'Aparece en «¿Dónde está ese calor?».',
      },
    },
    sourcesTitle: 'Las fuentes',
    provider: 'Proveedor',
    variable: 'Variable',
    unit: 'Unidad',
    resolution: 'Resolución',
    spatialResolution: 'Espacial',
    temporalResolution: 'Temporal',
    referencePeriod: 'Periodo de referencia',
    noReferencePeriod: 'Sin periodo declarado',
    license: 'Licencia o atribución',
    noLicense: 'Sin licencia declarada',
    lastUpdate: 'Última actualización del archivo',
    dataLink: 'Archivo o servicio consultado',
    dataTypeTitle: 'Qué significa cada tipo de dato',
    dataTypeDescription: (type: Dataset['data_type']) => dataTypeDescriptions[type],
    limitsTitle: 'Lo que este sitio no hace',
    limits: [
      'No hace pronósticos propios: el pronóstico es el de ENFEN.',
      'No emite alertas: los avisos son de SENAMHI y las autoridades locales.',
      'No atribuye daños a un evento sin una fuente que lo diga.',
    ],
  },
}

export const dataTypeLabel = (type: Dataset['data_type']) => messages.dataType[type]
const dateAtEndOfPeriod = (date: string) => {
  const month = /^(\d{4})-(\d{2})$/.exec(date)
  return month ? new Date(Date.UTC(Number(month[1]), Number(month[2]), 0)) : new Date(date)
}

export const ageDays = (date: string, now = new Date()) =>
  Math.max(0, Math.floor((now.getTime() - dateAtEndOfPeriod(date).getTime()) / 86_400_000))

export const ageLabel = (date: string, now = new Date()) => {
  const days = ageDays(date, now)
  if (days === 0) return messages.provenance.ageToday
  if (days < 30) return messages.provenance.ageDay(days)
  const months = Math.floor(days / 30.4375)
  if (months < 12) return messages.provenance.ageMonth(months)
  return messages.provenance.ageYear(Math.floor(months / 12))
}
