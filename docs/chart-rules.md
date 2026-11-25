# Chart rules

Rules for every chart and data table on the site. Product copy is in Spanish.

## Provenance

Every chart gets its dataset from `useDataset(id, shape?)`. The server loader
validates the JSON against the schema, an optional `shape` function reduces it
before the page payload is serialized, and
[`ChartShell.vue`](../web/app/components/ChartShell.vue) prints the provenance
block from the result. The fields come from the
[data contract](data-contract.md).

| Question                                         | Dataset fields                                                   |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| What does it show, and in which unit?            | `variable`, `unit`                                               |
| What period does it cover?                       | First and last record, `temporal_resolution`, `reference_period` |
| Is it observed, estimated, forecast or official? | `data_type`                                                      |
| Where does it come from?                         | `source.institution`, `source.product`, `source.url`             |
| When was it last updated?                        | `ingestion_time` and the last record's date                      |

Below the chart, one visible line gives the source link, unit, period and update
age. The full block sits in a "Cómo se mide" disclosure. It stays in the static
HTML, so it remains readable without JavaScript.

The home story uses `bare` mode instead: one caption line with the summary and
the source link. The full method for each chart is on `/metodologia`.

`ChartShell` also prints the accessible summary and the age of the data. It
shows a stale-source notice when `ingestion_time` is older than the source's
limit from the [freshness check](freshness.md#on-the-site) or the newest record
ended 90 days ago or more.

## Display

- Head each chart section with the finding the chart supports, built from the
  data, such as "El ICEN de septiembre de 2026 es +4,50 °C". A topic label goes
  in the eyebrow, not in the heading.
- Keep observed, estimated, forecast and official data visibly distinct.
- Put the definition, resolution, reference period and method below the chart.
- State both direction and size for a trend. An arrow alone is not enough.
- Keep the last valid value visible when a source stops updating, and show its
  age.
- Render the update date and data period in static HTML. Add the current age
  after mount.
- Give empty and error states a useful next action.
- Link alerts to the official source.
- Link to the original dataset.
- A count or a size taken from a source, not from a dataset, is drawn as a unit
  grid or as scale bars. It draws only numbers its claims state, and the claim
  texts are its caption. Scale bars share one scale from zero, with no break, so
  a small value stays a sliver beside a big one. `web/test/units.test.ts` checks
  that each drawn number appears in its claims.

## Reading a value

A chart that plots a series a reader may want to read at any point has a scrub
control: a slider over the plot. Pointer movement or the arrow keys move a rule
along the axis, and the rule shows each series' value at that point. Its
accessible value text names the point and every value, so a screen reader hears
the same numbers. The chart also carries a visually hidden table with one row
per point; the slider points to it with `aria-describedby`.

## Attribution

A chart that shows an Open-Meteo dataset (ERA5 or GloFAS) prints the Open-Meteo
credit and names the Copernicus product. A map that draws the INEI–IGN
boundaries prints their attribution and license from the geometry record.
Source-specific facts and license notes are in [`sources.md`](sources.md).
