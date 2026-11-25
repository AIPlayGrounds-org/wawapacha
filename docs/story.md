# WawaPacha story

The homepage tells one story in seven steps. Each heading states what the data
shows, and the chart below it is the evidence. Registry links identify the
entries that support each step.

## How the headings are built

The first screen and the section headings are sentences built from the data at
build time: the latest ICEN month, value and rank, the warmest map cell, and the
latest weekly Niño 1+2 value. A heading falls back to a neutral sentence when
its dataset is empty.

Copy taken from an ENFEN communiqué is keyed to that communiqué's number and
year in `web/app/messages.ts`. A newer communiqué without a summary shows a
fallback sentence that points to the official link. The site never presents an
older communiqué's forecast as the current one.

## First screen: how strong is it?

The headline states the latest ICEN value and its rank since 1950. The category
line uses [icen-category-thresholds](../evidence/claims.toml). The lead quotes
the current communiqué; for N°20-2026 that is
[enfen-co20-coast-extraordinaria-feb2027](../evidence/claims.toml). The status
card shows the official state from
[enfen-alert-states](../evidence/claims.toml).

## 01 · The scale

The comparison places the latest ICEN beside the peaks of 1982-83, 1997-98 and
2017, using [historical-coastal-chronology](../evidence/claims.toml). A note
says magnitude does not measure damage:
[impact-2017-enfen-qualitative](../evidence/claims.toml).

## 02 · The map

The map heading names the warmest anomaly and its location. The lead uses
[global-and-coastal-can-differ](../evidence/claims.toml).

## 03 · Week by week

The weekly heading states the latest Niño 1+2 anomaly, using
[weekly-nino-anomalies](../evidence/claims.toml) and
[nino-region-definitions](../evidence/claims.toml). The ICEN subsection explains
why the monthly index lags the weekly value:
[icen-definition](../evidence/claims.toml).

## 04 · What ENFEN forecasts

The forecast points quote the current communiqué. For N°20-2026 they are
[enfen-co20-nov-jan-rain](../evidence/claims.toml),
[enfen-co20-summer2027-rain](../evidence/claims.toml),
[enfen-co20-rivers](../evidence/claims.toml),
[enfen-co20-air-temperature-records](../evidence/claims.toml) and
[enfen-co20-waves-dec-jan](../evidence/claims.toml). The NOAA outlook beside
them uses [noaa-enso-strength-probabilities](../evidence/claims.toml) and
[noaa-enso-probability-meaning](../evidence/claims.toml).

## 05 · The precedent

The precedent shows where the heaviest rain fell in 2017 and 2023:
[senamhi-69-2026-nino-costero-composite-coasts](../evidence/claims.toml), with
its limits in
[senamhi-69-2026-nino-costero-composite-limits](../evidence/claims.toml). The
station chart uses
[senamhi-hydrometeorological-stations](../evidence/claims.toml). A note lists
what the site does not show.

## 06 · What to do

The action lead quotes the current communiqué's recommendation; for N°20-2026
that is [enfen-co20-recommendation](../evidence/claims.toml). Links go to ENFEN
communiqués and SENAMHI warnings, then to `/territorio`, `/rios` and
`/historico`. The local views use
[chirps-rainfall-estimates](../evidence/claims.toml),
[chirps-pentad-latency](../evidence/claims.toml),
[era5-historical-reanalysis](../evidence/claims.toml),
[era5-latency-and-limitations](../evidence/claims.toml),
[glofas-river-discharge-forecast](../evidence/claims.toml),
[glofas-ensemble-percentiles](../evidence/claims.toml) and
[glofas-river-point-limits](../evidence/claims.toml).

## 07 · How we know

The last section lists each dataset with its institution and product link, and
links to `/metodologia`.

## Other routes

`/aprende` holds the ONI explorer, using
[enso-is-ocean-atmosphere-pattern](../evidence/claims.toml),
[oni-definition-and-threshold](../evidence/claims.toml) and
[roni-is-current-official-index](../evidence/claims.toml). `/historico` shows
the sea chronology, the coastal index and station observations in that order.
The coastal event rule is [coastal-event-criterion](../evidence/claims.toml).

The site makes no claim about how El Niño Costero rainfall differs between the
north and south coasts beyond the SENAMHI composite above.
