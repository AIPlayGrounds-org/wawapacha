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
  paperCard: {
    read: (outlet: string) => `Leer en ${outlet}`,
  },
  story: {
    apertura: {
      words:
        'Cada vez que llega un Niño, la televisión usa las mismas palabras. «Devastador», en 1983. «Devastador», en 1997. «El más brutal», en 2017.',
      headlines:
        '«El Niño sería más devastador que el de 1997». Así lo tituló un canal de televisión en septiembre. Una consultora escribió que el mar «sigue una trayectoria muy similar a la del FEN 1997-1998». En noviembre, el río Tumbes pasó el umbral naranja.',
      question: '¿Qué tanto hay que preocuparse?',
      promise: 'Aquí miramos de dónde salen esos números.',
    },
    hero: {
      question: '¿Qué tan caliente está el mar?',
      /** `gap` is the signed difference already formatted without its sign. */
      answer: (gap: string, warmer: boolean | null) =>
        warmer === null
          ? 'Como lo normal'
          : `${degrees(gap)} ${warmer ? 'más' : 'menos'} que lo normal`,
      empty: 'Sin datos semanales del mar',
      week: (day: string, sst: string, normal: string) =>
        `La semana del ${day}, frente a Piura, el mar está a ${degrees(sst)}. Lo normal para esta semana es ${degrees(normal)}.`,
      yearBefore: (
        sst: string,
        relation: 'below' | 'slightlyBelow' | 'normal' | 'slightlyAbove' | 'above',
      ) =>
        `Hace un año estaba a ${degrees(sst)}: ${
          {
            below: 'por debajo de lo normal',
            slightlyBelow: 'un poco por debajo de lo normal',
            normal: 'lo normal para esa semana',
            slightlyAbove: 'un poco por encima de lo normal',
            above: 'por encima de lo normal',
          }[relation]
        }.`,
      warmerThanPeak: (gap: string, month: string, peakMonth: string, peak: string) =>
        `¿${degrees(gap)} más es mucho? Hoy, en ${month}, el mar está más caliente que en un ${peakMonth} normal, y ${peakMonth} es el mes más caliente del año (${degrees(peak)}).`,
      peak: (peakMonth: string, peak: string) =>
        `En un año normal, el mes más caliente es ${peakMonth}, con ${degrees(peak)}.`,
      handoff: 'Pero esa es una sola línea, medida en un solo lugar. ¿Hasta dónde llega el calor?',
      normal: 'lo normal',
      gap: (value: string) => degrees(value),
      arrow: (peakMonth: string) => `más que un ${peakMonth} normal`,
      scrub: 'Temperatura del mar por semana',
      chartSummary:
        'Esta línea muestra la temperatura del mar frente a Piura, semana a semana, en la región Niño 1+2: un recuadro de mar frente a Ecuador y el norte del Perú.',
      table: 'Temperatura del mar en Niño 1+2 por semana, de julio a junio.',
    },
    porque: {
      question: '¿Por qué no llueve en Lima si está junto al mar?',
      answer: 'Porque el mar está frío.',
      physicist: 'Un físico del IGP lo explica así:',
      stable: claim('igp-woodman-2014-stable'),
      threshold: claim('igp-woodman-2014-threshold'),
      season: claim('igp-woodman-2014-season'),
      line: 'desde aquí, lluvia fuerte',
      normalAbove: (months: string[]) =>
        months.length === 0
          ? 'En un año normal, el mar no pasa de 26 °C.'
          : `En un año normal, el mar pasa de 26 °C solo en ${conjunction.format(months)}.`,
      seasonAbove: (season: string, month: string) =>
        `En ${season}, el mar ya lo pasó en ${month}.`,
      press1925: claim('elcomercio-1925-alisio'),
      seaAbsent: 'En esa explicación, el mar no aparece.',
      conditions:
        'Ahí están las dos primeras condiciones. La tercera no es del mar: es si el país está preparado.',
      punch: 'En el verano de 1983 se juntaron las tres.',
      table: 'Temperatura del mar en Niño 1+2 por semana, con la línea de 26 °C.',
    },
    timeline: {
      mark: (label: string, value: string) => `${label}\n${degrees(value)}`,
      today: 'hoy',
    },
    map: {
      legend: '°C sobre lo normal',
      normal: 'lo normal',
      today: 'hoy',
      yearBefore: 'hace un año',
      ecuador: 'ECUADOR',
      peru: 'PERÚ',
      ocean: 'OCÉANO\nPACÍFICO',
      ring: degrees,
      summary: (today: string, before: string | null) =>
        before
          ? `Cuánto se aparta el mar de lo normal el ${today} y el mismo día un año antes, el ${before}.`
          : `Cuánto se aparta el mar de lo normal el ${today}.`,
    },
    calor: {
      question: '¿Dónde está ese calor?',
      /** `to` is null when the heat reaches the south end of the coast the map draws. */
      answer: (from: string, to: string | null) =>
        from === to
          ? `Está solo frente a ${from}.`
          : `No está en un punto: cubre el mar desde ${from} hasta ${to ?? 'el sur del Perú'}.`,
      unreached: 'Junto a la costa del Perú, no pasa de 2 °C sobre lo normal.',
      warmest: (value: string) => `El punto más caliente está a ${degrees(value)} sobre lo normal.`,
      yearBefore: (value: string, relation: 'above' | 'normal' | 'below') =>
        relation === 'normal'
          ? 'Hace un año, ese mismo punto estaba en lo normal.'
          : `Hace un año, ese mismo punto estaba a ${degrees(value)} ${relation === 'above' ? 'sobre' : 'bajo'} lo normal.`,
      handoff: 'Un mar caliente no hace daño por sí solo. El daño llega con la lluvia.',
      empty: 'Sin mapa de temperatura del mar',
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
      /** Each value is a number its texts state, so a bar or a dot count is never ours. */
      rain1983: {
        unit: 'mm',
        bars: [
          { id: 'normal', label: 'Lluvia de un año normal en Piura', value: 60 },
          { id: '1983', label: 'Lluvia de 1983', value: 2400 },
        ],
        texts: [claim('igp-woodman-2014-piura-1983')],
      },
      dead1983: {
        question: '¿Cuántos murieron? Depende de a quién le preguntes.',
        unit: 'Cada punto, una persona.',
        rows: [
          {
            id: 'gobierno',
            count: 512,
            label: 'muertos, según el gobierno, julio de 1983',
            text: claim('elperuano-2023-1983-cronica'),
          },
          {
            id: 'ops',
            count: 380,
            label: 'muertos, según un conteo preliminar de la OPS',
            muted: true,
            text: claim('impact-1983-paho-deaths'),
          },
        ],
      },
      river: {
        unit: 'm³/s',
        bars: [
          { id: '1983', label: 'El río Piura en 1983', value: 3200 },
          { id: '1998', label: 'En 1998', value: 4424 },
        ],
        line: { value: 2300, label: 'se cierran los puentes' },
        texts: [
          claim('uni-sanchez-piura-1983'),
          claim('uni-sanchez-piura-1998'),
          claim('tv-america-1998-03-16-2300'),
        ],
      },
      damage8298: claim('impact-8283-9798-caf-comparison'),
      woodman: claim('igp-woodman-1997-4c'),
      overlay: {
        band: 'normal',
        lejos: '«lejos»',
        scrub: 'Recorrer el índice mes a mes',
        table: (first: string, second: string) => `El índice de ${first} y de ${second}, mes a mes`,
        caption: 'El índice mes a mes, de abril del primer año a diciembre del segundo.',
      },
      before1983: (value: string) => `El de 1983 había llegado a ${degrees(value)}.`,
      /** The share is said only when the data bears it out. */
      third2017: (value: string, value1983: string, underThird: boolean) =>
        underThird
          ? `${degrees(value)}: menos de un tercio de los ${degrees(value1983)} de 1983.`
          : `${degrees(value)}, frente a ${degrees(value1983)} en 1983.`,
      low2017: 'En el gráfico casi no se ve. En tierra fue otra cosa.',
      todayStep: (value: string, month: string) =>
        `Hoy: ${degrees(value)} en ${month}. La línea punteada lleva ese nivel hacia atrás.`,
      people: claim('impact-2017-people'),
      punch: 'El índice mide el mar. No mide el daño.',
      chartSummary: 'El mismo índice, con los picos de 1982–83, 1997–98 y 2017.',
    },
    palabra: {
      question: 'Si los Niños se pronostican, ¿por qué siempre nos sorprenden?',
      answer: 'La palabra y el agua',
      intro: 'Mira cómo se nombró el Niño de 2017 mientras pasaba.',
      water: (sst: string, normal: string) =>
        `El mar, ${degrees(sst)}. Lo normal, ${degrees(normal)}.`,
      /** Each `word` is a part of its card's lift and each `toll` a number in its claim text. */
      steps2017: {
        enero: { word: '1%', text: claim('enfen-co01-2017-probabilities') },
        febrero: { word: 'débil', text: claim('enfen-co03-2017-debil') },
        marzo: { word: 'débil', toll: '26', text: claim('elcomercio-2017-03-04-debil') },
        moderada: { word: 'moderada', text: claim('enfen-co06-2017-moderada') },
        mayo: { toll: '143', text: claim('impact-2017-paho-sinpad-may') },
        junio: { toll: '159', text: claim('impact-2017-people') },
      },
      toll: (count: string) => `${count} fallecidos`,
      scale: 'Débil y moderada miden el calor del mar. No miden el daño.',
      punch: 'La palabra llegó después que el agua.',
      ranking: claim('impact-2017-plain'),
      before: 'Hubo una razón más para no creer.',
      prevention: claim('bausate-2017-2015-prevention'),
      credibility: claim('ramirez-2017-credibility'),
      open2026: 'En 2026, la palabra no esperó al agua.',
      steps2026: {
        debil: { word: 'débil' },
        alerta: {
          texts: [
            claim('tv-tvperu-2026-02-16-inminente'),
            claim('andina-2026-02-19-tumbes-rojo'),
            claim('tv-rpp-2026-02-24-alerta'),
          ],
        },
        fuerte: { word: 'fuerte', text: 'Y la palabra siguió subiendo.' },
        extraordinaria: { word: 'extraordinaria' },
        titular: {
          word: 'más devastador',
          text: 'Lo que el ENFEN escribió esa quincena fue otra cosa.',
          report: claim('enfen-it17-ai-model-e-index'),
        },
      },
      handoff: 'La palabra del ENFEN es una. La que llega a la casa la pone la prensa.',
      sst: 'el mar',
      chart2017:
        'La temperatura del mar en Niño 1+2 por semana, de enero a junio de 2017, con las palabras de la prensa y del ENFEN en sus fechas.',
      chart2026:
        'La temperatura del mar en Niño 1+2 por semana, de enero a septiembre de 2026, con las palabras del ENFEN y de la prensa en sus fechas.',
      table2017: 'Temperatura del mar en Niño 1+2 por semana, enero a junio de 2017.',
      table2026: 'Temperatura del mar en Niño 1+2 por semana, enero a septiembre de 2026.',
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
      season: {
        title: 'La línea de la temporada',
        body: 'Cada punto es la temperatura semanal del mar en la región Niño 1+2, del producto OISST semanal de NOAA CPC. Lo normal de cada semana es esa temperatura menos su anomalía frente a 1991–2020. El eje va de julio a junio, para que el verano quede entero en el medio.',
        where: 'Aparece en «¿Qué tan caliente está el mar?» y «¿Por qué no llueve en Lima?».',
      },
      icen: {
        title: 'La línea del índice',
        body: claim('icen-definition'),
        where: 'Aparece en la comparación con 1983, 1998 y 2017.',
      },
      press: {
        title: 'La línea de las palabras',
        body: 'La misma temperatura semanal del mar en Niño 1+2, sobre un eje de fechas. Cada palabra está en la fecha del comunicado o de la nota que la dijo, y cada cifra de fallecidos en la fecha de su corte.',
        where: 'Aparece en «¿Por qué siempre nos sorprenden?».',
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
