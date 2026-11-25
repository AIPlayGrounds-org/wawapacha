# Data freshness

The freshness check reports published JSON that is missing, has no readable
`ingestion_time` or is older than its registry cadence allows. It is separate
from due selection and never blocks a deploy.

Run it from `pipeline/`:

```sh
uv run wawapacha-pipeline freshness --data-dir ../data
```

A passing run prints `Published datasets are within their registry cadence.` A
failing run prints one `::error title=data freshness::...` line per dataset on
stderr and exits with status 1. `--format tsv` prints `<id><TAB><reason>` lines
on stdout instead, for scripts. `--as-of <ISO-8601 time>` evaluates the check at
another time, which makes a result reproducible.

The command reads `ingestion_time` from the file of each automatable source and
skips `manual` sources. A dataset is stale when its age exceeds twice the
cadence interval plus a slack:

| `update`  | Interval | Slack   | Stale after |
| --------- | -------- | ------- | ----------- |
| `daily`   | 1 day    | 4 hours | 52 hours    |
| `weekly`  | 7 days   | 1 day   | 15 days     |
| `monthly` | 31 days  | 1 day   | 63 days     |

The values are `CADENCE_RULES` in
[`registry.py`](../pipeline/src/wawapacha_pipeline/registry.py), and
[`test_cli.py`](../pipeline/tests/test_cli.py) covers them.

A source module that defines `stale_reason(path, now)` replaces the age rule
with its own. `enfen-communique` uses it: a communiqué states the date of the
next one, so the source is stale from the second day after that date in Lima,
however recently the pipeline checked the feed.

[`freshness.yml`](../.github/workflows/freshness.yml) runs the same command
daily at 14:47 UTC against a worktree of the `data` branch. It keeps one open
issue labelled `stale-data`, titled `Stale data: <id>`, for each stale source.
Each run updates the issue's reason and closes the issue once the source is
fresh again. Stale data does not fail the job; the open issue is the signal. The
job fails only when the check itself cannot run.

## Upstream outages

A source whose server is down or throttling exits `wawapacha-pipeline run` with
status 75 and publishes nothing. The update workflow records a warning, not a
failure, because no change in this repository can fix it. A transient download
error is one of: HTTP 408, 425, 429 or any 5xx, a timeout, or a refused or reset
connection. Any other HTTP 4xx means our request is wrong and fails the run.
`UpstreamError` and `download_error` in
[`contract.py`](../pipeline/src/wawapacha_pipeline/contract.py) hold the rule.

A source whose server has nothing newer than the published JSON prints
`<id>: nothing new.` with the reason, publishes nothing and exits 0. `Unchanged`
in `contract.py` is that outcome. OISST raises it when PSL has no new day, and
ENFEN when the newest communiqué is already published.

An outage or a silent upstream that outlasts the cadence tolerance reaches this
check and opens the source's issue. A short one leaves no trace beyond the
warning.

## On the site

The site applies the same limit. `wawapacha-pipeline sources` writes each
non-manual source's limit, in hours, to the
[web catalog](../web/app/data/source-catalog.json) as `stale_after_hours`.
`bun run types` copies the limits into the generated
[`dataset.ts`](../web/app/types/dataset.ts) as `staleAfterHours`, which
[`ChartShell`](../web/app/components/ChartShell.vue) reads. A chart shows a
stale notice when:

- its `ingestion_time` is older than `stale_after_hours`, or
- its newest record ended 90 days ago or more, whatever the last run was.

A `manual` source has no `stale_after_hours`, so only the second condition
applies. Neither has a source with its own `stale_reason`: its records carry the
lateness, as the ENFEN communiqué's `stale` does. The site keeps showing the
last valid record and its age. The display rule is in
[`chart-rules.md`](chart-rules.md).
