import type { DatasetFor } from '~/types/datasets'

const source = {
  institution: 'Fuente de prueba',
  product: 'Producto de prueba',
  url: 'https://example.com/panels',
}

export const enfenFixture = {
  id: 'enfen-communique',
  source,
  variable: 'Estado del sistema de alerta de El Niño Costero',
  unit: 'Estado oficial',
  data_type: 'official',
  spatial_resolution: 'Costa del Perú',
  temporal_resolution: 'Por comunicado',
  ingestion_time: '2026-10-02T23:14:16+00:00',
  processing_version: 'test',
  records: [
    {
      number: 17,
      year: 2026,
      status: 'Alerta de El Niño Costero',
      url: 'https://example.com/comunicado-17-2026',
      start: '2026-09-28',
      end: '2026-10-15',
      stale: false,
    },
  ],
} satisfies DatasetFor<'enfen-communique'>
