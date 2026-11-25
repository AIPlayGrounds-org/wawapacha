# Manual snapshots

The SENAMHI station data has no download the pipeline can run on a schedule. A
person copies the input into the repository, and the pipeline validates it with
the same publication boundary as any download (see
[`data-contract.md`](data-contract.md)). Its registry entry has
`update = "manual"`, so `due` never selects it. Refresh it by running it
yourself.

## SENAMHI station snapshot

SENAMHI's public histogram map and station pages have no download. A person
reads them and saves the daily series as a gzip JSON file named
`pipeline/inputs/senamhi-estaciones-YYYY-MM-DD.json.gz`. The module reads the
file with the newest name and makes no network request.

The file has two top-level objects:

- `snapshot`: the strings `taken` (an ISO date), `by`, `page`, `station_page`
  and `note`. All are required.
- `stations`: one object per station code, with `dep`, `name`, `lat`, `lon`,
  `years` and the daily arrays `precipitation_mm`, `tmax_c` and `tmin_c`.
  `years` is a list of `[year, number of days]` pairs for consecutive years.
  Only the first and last year may be partial. Each daily array has exactly the
  days that `years` sums to, with `null` for a missing day.

The module rejects non-finite coordinates, non-consecutive years, incomplete
interior years, daily arrays of the wrong length and negative precipitation. It
publishes monthly precipitation totals, monthly mean maximum and minimum
temperatures, the day counts behind them and, per calendar month, the median of
the monthly precipitation totals across years. A monthly value is `null` when
fewer than 80% of the month's days are present. The published JSON holds only
these monthly aggregates; the daily arrays stay in the snapshot.

To refresh, add the new snapshot file and run, from `pipeline/`:

```sh
uv run wawapacha-pipeline snapshot-check inputs/senamhi-estaciones-YYYY-MM-DD.json.gz
uv run wawapacha-pipeline run senamhi-estaciones
uv run pytest tests/test_senamhi_estaciones.py
```

`snapshot-check` validates the file and prints its station count, year range and
`taken` date without publishing. The refresh needs no code change. The published
`ingestion_time` is the snapshot's `taken` date, not the time of the run. Then
run the checks in [`CONTRIBUTING.md`](../.github/CONTRIBUTING.md#checks).
