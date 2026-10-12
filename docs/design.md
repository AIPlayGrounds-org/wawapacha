# Design

The site uses an editorial data-dashboard system. The home page answers the
official question first, then moves from map to measurements, comparison,
forecast and local tools. The shared chart frame remains the source for data
provenance.

## Tokens

| Token               | Light                         | Dark                    | Use                                           |
| ------------------- | ----------------------------- | ----------------------- | --------------------------------------------- |
| Typeface            | Source Serif 4 Variable       | Source Serif 4 Variable | Reading text and headings                     |
| Annotation typeface | Patrick Hand                  | Patrick Hand            | Short chart annotations only                  |
| Body size           | `1.125rem`                    | `1.125rem`              | Long-form reading                             |
| Small size          | `0.875rem`                    | `0.875rem`              | Metadata and labels                           |
| Heading scale       | `clamp(2rem, 4.7vw, 3.5rem)`  | same                    | Section headings                              |
| Hero scale          | `clamp(3.7rem, 10vw, 8.5rem)` | same                    | Home answer                                   |
| Text                | `#262626`                     | `#ececec`               | Primary text                                  |
| Muted text          | `#5e5e5e`                     | `#ababab`               | Secondary text                                |
| Paper               | `#ffffff`                     | `#131313`               | Page background                               |
| Raised surface      | `#ffffff`                     | `#1d1d1d`               | Status cards                                  |
| Border              | `#e2e2e2`                     | `#2d2d2d`               | Rules and card edges                          |
| Accent              | `#17676b`                     | `#7cc9c7`               | Links, focus and section markers              |
| Warm data           | `#d4581b`                     | `#f08a4b`               | Warm anomalies only                           |
| Cold data           | `#2f6db3`                     | `#74aaeb`               | Cold anomalies only                           |
| Sea surface         | `#e3f0ee`                     | `#112629`               | Evidence section and neutral chart range      |
| Sand surface        | `#f5eddd`                     | `#1e1a13`               | Historical context section                    |
| Content width       | `78rem`                       | `78rem`                 | Shared page rail                              |
| Reading width       | `42rem`                       | `42rem`                 | Prose measure                                 |
| Card radius         | `12px`                        | `12px`                  | Status and local link cards                   |
| Card spacing        | `1.25rem`                     | `1.25rem`               | Status and local link card padding            |
| Motion              | `160ms ease`                  | `160ms ease`            | Local link hover; disabled for reduced motion |

The tokens live in [`web/app/app.vue`](../web/app/app.vue). Components use the
same variables for charts and page surfaces. Warm and cold colours identify data
direction; they do not signal danger. The alert state uses a warm rule with the
official wording, not a red warning palette.

Light and dark primary text, muted text, accent, warm data and cold data use the
values above. The dark values are selected for readable contrast against
`#131313`; focus uses the accent with a visible outline.

## Layout rules

- The home page keeps one reading rail and uses a two-column split only when a
  chart or status card benefits from it.
- The first viewport contains the ENFEN state, its date and the next official
  action.
- Charted evidence blocks carry dataset provenance through `ChartShell`;
  comparison cards present derived values directly.
- Tables remain available through the existing accessible fallbacks.
- The home page uses no auto-playing motion. Hover motion is removed when the
  user requests reduced motion.
