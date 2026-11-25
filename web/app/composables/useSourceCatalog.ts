import { useAsyncData } from '#imports'
import sourceCatalogJson from '~/data/source-catalog.json'
import { buildSourceCatalog, validateSourceCatalog } from '~/utils/sourceCatalog'

const shownSources = validateSourceCatalog(sourceCatalogJson).sources.filter(
  (source) => source.on_site,
)

export const useSourceCatalog = async () => {
  const { data, error } = await useAsyncData('source-catalog', async () => {
    const isServer = (import.meta as ImportMeta & { readonly server: boolean }).server
    if (!isServer) {
      throw new Error('[sourceCatalog] datasets were not loaded in the server payload')
    }
    const { isDatasetId, loadDataset } = await import('~/../server/utils/loadDataset')
    const datasets = await Promise.all(
      shownSources.map(async (source) => {
        if (!isDatasetId(source.id)) {
          throw new Error(
            `[sourceCatalog] data/${source.id}.json is not available through loadDataset`,
          )
        }
        const dataset = await loadDataset(source.id)
        return { id: dataset.id, ingestion_time: dataset.ingestion_time }
      }),
    )
    return buildSourceCatalog(shownSources, datasets)
  })

  if (error.value) throw error.value
  if (!data.value) {
    throw new Error('[sourceCatalog] source catalogue was not found in the server payload')
  }
  return data.value
}
