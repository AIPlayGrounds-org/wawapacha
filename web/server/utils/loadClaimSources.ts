import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseClaims, type ClaimSource } from '../../scripts/claim-registry'

// The build runs from web/, so the claim registry is one level up.
const registryPath = resolve(process.cwd(), '..', 'evidence', 'claims.toml')

/** The quoted passages behind each verified claim, keyed by claim id. */
export const pickClaimSources = (
  registryText: string,
  ids: readonly string[],
): Record<string, ClaimSource[]> => {
  const claims = new Map(parseClaims(registryText).map((claim) => [claim.id, claim]))
  return Object.fromEntries(
    ids.map((id) => {
      const claim = claims.get(id)
      if (!claim || claim.status !== 'verified') {
        throw new Error(`[useClaimSources] unknown or unverified claim id: ${id}`)
      }
      return [id, claim.sources]
    }),
  )
}

export const loadClaimSources = async (ids: readonly string[]) =>
  pickClaimSources(await readFile(registryPath, 'utf8'), ids)
