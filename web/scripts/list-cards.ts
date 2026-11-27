import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generatedValues } from './generate-claims'

/** Every paper card's source, for scripts/capture_press.py. */
const registry = readFileSync(resolve(import.meta.dir, '../../evidence/claims.toml'), 'utf8')
const { claimCards } = generatedValues(registry)
const cards = Object.values(claimCards).flat()
const paper = cards
  .filter((card) => !card.clip)
  .map(({ href, lift, outlet, published }) => ({ href, lift, outlet, published }))
console.log(JSON.stringify({ paper }, null, 2))
