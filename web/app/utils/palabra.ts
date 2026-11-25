import { paperCard, paperCards, type PaperCard } from '~/data/claims'
import { messages } from '~/messages'

/** A dated word or number set on the chart: a word above the sea line, a toll below it. */
export type PressMark = { id: string; date: string; label: string }

/**
 * One scroll step of «La palabra y el agua»: the date the chart draws to, the card
 * that said the word, and the word or death count set on the chart at that date.
 */
export type PressStep = {
  id: string
  date: string
  card?: PaperCard
  word?: string
  toll?: string
  texts: readonly string[]
  /** What the forecaster wrote the same fortnight, set beside the card. */
  report?: { card: PaperCard; text: string }
}

const words = messages.story.palabra
const s17 = words.steps2017
const s26 = words.steps2026
const [debil2026, fuerte2026, extraordinaria2026] = paperCards('enfen-2026-coast-magnitude-wording')

const fromCard = (card: PaperCard) => card.published

type Entry = { word?: string; toll?: string; text: string }
const cardStep = (id: string, card: PaperCard, { text, ...entry }: Entry): PressStep => ({
  id,
  date: fromCard(card),
  card,
  ...entry,
  texts: [text],
})
// A death count carries the cut date of its report, not a press date.
const tollStep = (id: string, date: string, { text, ...entry }: Entry): PressStep => ({
  id,
  date,
  ...entry,
  texts: [text],
})

export const STEPS_2017: readonly PressStep[] = [
  cardStep('enero', paperCard('enfen-co01-2017-probabilities'), s17.enero),
  cardStep('febrero', paperCard('enfen-co03-2017-debil'), s17.febrero),
  cardStep('marzo', paperCard('elcomercio-2017-03-04-debil'), s17.marzo),
  cardStep('moderada', paperCard('enfen-co06-2017-moderada'), s17.moderada),
  tollStep('mayo', '2017-05-17', s17.mayo),
  tollStep('junio', '2017-06-28', s17.junio),
]

export const STEPS_2026: readonly PressStep[] = [
  { id: 'debil', date: fromCard(debil2026!), card: debil2026, word: s26.debil.word, texts: [] },
  { id: 'alerta', date: '2026-02-24', texts: s26.alerta.texts },
  {
    id: 'fuerte',
    date: fromCard(fuerte2026!),
    card: fuerte2026,
    word: s26.fuerte.word,
    texts: [s26.fuerte.text],
  },
  {
    id: 'extraordinaria',
    date: fromCard(extraordinaria2026!),
    card: extraordinaria2026,
    word: s26.extraordinaria.word,
    texts: [],
  },
  {
    id: 'titular',
    date: fromCard(paperCard('panamericana-2026-09-16-devastador')),
    card: paperCard('panamericana-2026-09-16-devastador'),
    word: s26.titular.word,
    texts: [s26.titular.text],
    report: { card: paperCard('enfen-it17-ai-model-e-index'), text: s26.titular.report },
  },
]

export const wordMarks = (steps: readonly PressStep[]): PressMark[] =>
  steps.flatMap((step) =>
    step.word ? [{ id: step.id, date: step.date, label: `«${step.word}»` }] : [],
  )

export const tollMarks = (steps: readonly PressStep[]): PressMark[] =>
  steps.flatMap((step) =>
    step.toll ? [{ id: step.id, date: step.date, label: words.toll(step.toll) }] : [],
  )
