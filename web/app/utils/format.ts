const valueFormat = new Intl.NumberFormat('es', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
})
const dayFormat = new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: 'America/Lima' })
const monthFormat = new Intl.DateTimeFormat('es', {
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Lima',
})
const dischargeFormat = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 2,
})

const degreesFormat = new Intl.NumberFormat('es', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** «27,5»: one decimal and no plus sign, for a value the sentence already places. */
export const formatDegrees = (value: number) => degreesFormat.format(value).replace('-', '−')

/** «+0,5» o «−0,5»: un decimal y el signo menos tipográfico. */
export const formatValue = (value: number) => valueFormat.format(value).replace('-', '−')

/** A discharge value keeps two decimals so small modeled flows do not become «0,0». */
export const formatDischarge = (value: number) => dischargeFormat.format(value)

/** «28 de septiembre de 2026», a partir de AAAA-MM-DD. */
export const formatDay = (date: string) => dayFormat.format(new Date(`${date}T12:00:00Z`))

const seasonDayFormat = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const monthNameFormat = new Intl.DateTimeFormat('es', { month: 'long', timeZone: 'UTC' })

/** «18 nov», for a day counted from 1 July. The reference season has no 29 February. */
export const formatSeasonDay = (day: number) =>
  seasonDayFormat.format(new Date(Date.UTC(2025, 6, 1 + day))).replace('.', '')

const dayMonthFormat = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

/** «21 de octubre», a partir de AAAA-MM-DD, when the sentence already gives the year. */
export const formatDayMonth = (date: string) => dayMonthFormat.format(new Date(`${date}T12:00:00Z`))

/** «marzo», for a month from 1 to 12. */
export const formatMonthName = (month: number) =>
  monthNameFormat.format(new Date(Date.UTC(2025, month - 1, 15)))

/** «septiembre de 2026», a partir de AAAA-MM. */
export const formatMonth = (date: string) => {
  const [year, month] = date.split('-').map(Number)
  return monthFormat.format(new Date(Date.UTC(year!, month! - 1, 1, 12)))
}

/** «6:52» or «1:02:05»: a moment in a video, written as YouTube writes it. */
export const formatClipTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
}

/** A source's date at the precision it was given: a day, a month or a year. */
export const formatPublished = (date: string) =>
  date.length === 4 ? date : date.length === 7 ? formatMonth(date) : formatDay(date)
