# WawaPacha

![The home page: "¿Llegó El Niño?" with the latest ONI reading and the stripes of the series since 1950](docs/assets/site.png)

WawaPacha is a public web observatory for El Niño signals in Peru. It shows sea
temperature, rainfall, river discharge and the official ENFEN status, and every
chart names its source, unit, period and update age. The site is in Spanish.
Live at <https://aiplaygrounds-org.github.io/wawapacha/>.

The site is static. A Python pipeline reads registered public sources, validates
each dataset and publishes it as `data/<id>.json`. A [Nuxt 4](https://nuxt.com/)
build turns that JSON into pages for GitHub Pages. There is no runtime backend,
account system or public API, and the browser never calls an upstream source.

## Get started

You need [Git](https://git-scm.com/) and
[mise](https://mise.jdx.dev/getting-started). mise installs the Bun and uv
versions selected in [`mise.toml`](mise.toml).

```sh
mise install
cd web
mise exec -- bun install
mise exec -- bun run dev
```

Open <http://localhost:3100>. If mise is active in your shell, omit
`mise exec --`.

To publish one source, run it from `pipeline/`:

```sh
cd pipeline
uv run wawapacha-pipeline run noaa-cpc-oni
```

The command downloads the NOAA CPC table, validates it and replaces
[`data/noaa-cpc-oni.json`](data/noaa-cpc-oni.json). If validation fails, the
previous file stays in place.

## Features

- `/` opens on three press clippings and asks how worried to be, then tells
  the story in six questions: how hot the sea is this week against
  its normal, where the heat is on the OISST map, why Lima does not get rain,
  how it compares with 1983, 1998 and 2017, what ENFEN forecasts and what to do
  now.
- `/metodologia`, "Cómo lo sabemos", lists the sources the story shows with
  their last update, says how each chart is built and names the site's limits.
- Observed, estimated, forecast and official data stay visibly distinct.
- One registry, [`sources.toml`](sources.toml), holds the facts about each
  source. The source catalog is generated from it. The TypeScript types are
  generated from [`schema/dataset.schema.json`](schema/dataset.schema.json).

## Learn more

- [Documentation](docs/README.md): architecture, data workflow, contract and
  per-subsystem guides.
- [Contributing](.github/CONTRIBUTING.md): branches, checks and pull requests.
