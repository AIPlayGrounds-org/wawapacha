import { useAsyncData } from '#imports'
import type { ClaimId } from '~/data/claims'

export type ClaimQuote = { ref: string; quote: string }

/**
 * Loads the quoted source passages of the given claims on the server, so the page
 * payload carries only the quotes it prints and never the whole registry.
 */
export const useClaimSources = async <Id extends ClaimId>(
  ids: readonly Id[],
): Promise<Record<Id, ClaimQuote[]>> => {
  const { data, error } = await useAsyncData(`claim-sources:${ids.join(',')}`, async () => {
    const isServer = (import.meta as ImportMeta & { readonly server: boolean }).server
    if (!isServer) {
      throw new Error('[useClaimSources] claim sources were not loaded in the server payload')
    }
    const { loadClaimSources } = await import('~/../server/utils/loadClaimSources')
    return loadClaimSources(ids)
  })

  if (error.value) throw error.value
  if (!data.value) {
    throw new Error('[useClaimSources] claim sources were not found in the server payload')
  }
  return data.value as Record<Id, ClaimQuote[]>
}
