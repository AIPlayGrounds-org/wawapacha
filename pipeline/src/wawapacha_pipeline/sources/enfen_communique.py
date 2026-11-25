"""ENFEN official communiqué: the alert status. Its provenance is in sources.toml.

The module reads the RSS feed of the communiqué archive, which carries the full
text of each communiqué, and publishes the newest one as a single record.
"""

import html
import json
import os
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import UTC, date, datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

from wawapacha_pipeline import contract, registry
from wawapacha_pipeline.contract import (
    Unchanged,
    ValidationError,
    download_error,
    publish,
)

# Súbela cuando cambie la lógica: queda en cada JSON publicado.
VERSION = "0.2.0"

ID = "enfen-communique"
SOURCE = registry.get(ID)
URL = os.environ.get("ENFEN_FEED_URL", SOURCE["access"]["url"])
# The site answers HTTP 403 to curl's default User-Agent.
USER_AGENT = "WawaPacha/0.1"

# ENFEN publishes in Lima. Peru has no daylight saving time, so a fixed offset is exact.
LIMA = timezone(timedelta(hours=-5))
# ENFEN posts in the afternoon or evening of the due day and the update runs each
# morning, so a communiqué is late only from the second day after its due date.
LATE_AFTER = timedelta(days=1)

STATUSES = (
    "No Activo",
    "Vigilancia de El Niño Costero",
    "Alerta de El Niño Costero",
    "Vigilancia de La Niña Costera",
    "Alerta de La Niña Costera",
)
# ENFEN writes the inactive status as "No activo" or "No activa". The other
# phrases match only in their exact words, in any letter case.
STATUS_PATTERNS = [
    (re.compile(r"No\s+activ[oa]", re.I), "No Activo"),
    *((re.compile(re.escape(s).replace(r"\ ", r"\s+"), re.I), s) for s in STATUSES[1:]),
]
STATUS_LABEL = re.compile(r"Estado\s+del?\s+sistema\s+de\s+alerta\s*:\s*", re.I)
# The status follows the date near the top when the label is missing.
HEAD_CHARS = 200

TITLE = re.compile(
    r"Comunicado\s+(?:Oficial|Extraordinario)\s+ENFEN\s+N\s*°\s*(\d+)\s*[-–]\s*(\d{4})",
    re.I,
)
MONTHS = {
    name: number
    for number, name in enumerate(
        (
            "enero",
            "febrero",
            "marzo",
            "abril",
            "mayo",
            "junio",
            "julio",
            "agosto",
            "septiembre",
            "octubre",
            "noviembre",
            "diciembre",
        ),
        start=1,
    )
}
MONTHS["setiembre"] = 9
NEXT_DUE = re.compile(
    r"pr[óo]ximo\s+comunicado\s+oficial\b[^.]*?(\d{1,2})\s+de\s+([a-zé]+)\s+del?\s+(\d{4})",
    re.I,
)
DETAIL_PREFIX = "https://enfen.imarpe.gob.pe/download/"
CONTENT = "{http://purl.org/rss/1.0/modules/content/}encoded"


def fetch(url: str = URL, timeout: int = 60) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.read()
    except OSError as error:
        raise download_error(f"Could not download {url}", error) from None


def run(ingestion_time: datetime | None = None) -> tuple[int, Path]:
    """Return the record count and the path of the published JSON.

    Raise Unchanged when this version already published the same record, so
    `stale` is rewritten only on the day it turns true.
    """
    ingestion_time = ingestion_time or datetime.now(UTC)
    record = parse(fetch())
    today = ingestion_time.astimezone(LIMA).date()
    record["stale"] = today > date.fromisoformat(record["end"])
    if record == published_record():
        raise Unchanged(
            f"No communiqué after N° {record['number']}-{record['year']} yet."
        )
    return 1, publish(build([record], ingestion_time))


def parse(feed: bytes) -> dict:
    """Return the newest communiqué in the feed as a record, still without `stale`."""
    try:
        items = ET.fromstring(feed).findall("./channel/item")
    except ET.ParseError as error:
        raise ValidationError(f"The feed is not valid XML: {error}") from None
    if not items:
        raise ValidationError("The feed lists no communiqué.")
    return read_item(max(items, key=published_at))


def published_at(item: ET.Element) -> datetime:
    value = item.findtext("pubDate") or ""
    try:
        return parsedate_to_datetime(value)
    except (TypeError, ValueError):
        raise ValidationError(f"Unreadable pubDate {value!r}.") from None


def read_item(item: ET.Element) -> dict:
    title = item.findtext("title") or ""
    match = TITLE.search(title)
    if match is None:
        raise ValidationError(f"Title {title!r} names no communiqué number.")
    number, year = int(match[1]), int(match[2])

    url = (item.findtext("link") or "").strip()
    if not url.startswith(DETAIL_PREFIX):
        raise ValidationError(f"{title}: link {url!r} is not a detail page.")

    text = plain_text(item.findtext(CONTENT) or item.findtext("description") or "")
    published = published_at(item).astimezone(LIMA).date()
    next_due = read_next_due(text, title)
    if next_due <= published:
        raise ValidationError(
            f"{title}: next communiqué {next_due} is not after {published}."
        )
    return {
        "number": number,
        "year": year,
        "status": read_status(text, title),
        "url": url,
        "start": published.isoformat(),
        "end": next_due.isoformat(),
    }


def plain_text(markup: str) -> str:
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", markup)).split())


def read_status(text: str, title: str) -> str:
    """Return the status the communiqué declares, or fail rather than guess."""
    label = STATUS_LABEL.search(text)
    if label:
        for pattern, status in STATUS_PATTERNS:
            if pattern.match(text, label.end()):
                return status
        raise ValidationError(
            f"{title}: unknown status after the label: {text[label.end() : label.end() + 60]!r}."
        )
    head = text[:HEAD_CHARS]
    found = [
        (match.start(), status)
        for pattern, status in STATUS_PATTERNS
        if (match := pattern.search(head))
    ]
    if not found:
        raise ValidationError(f"{title}: no status near the top: {head!r}.")
    return min(found)[1]


def read_next_due(text: str, title: str) -> date:
    match = NEXT_DUE.search(text)
    if match is None:
        raise ValidationError(f"{title}: it states no date for the next communiqué.")
    day, month, year = int(match[1]), match[2].lower(), int(match[3])
    if month not in MONTHS:
        raise ValidationError(f"{title}: unknown month {match[2]!r}.")
    try:
        return date(year, MONTHS[month], day)
    except ValueError as error:
        raise ValidationError(f"{title}: {error}.") from None


def read_published(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def published_record() -> dict | None:
    """Return the published record when this version wrote it."""
    dataset = read_published(contract.DATA_DIR / f"{ID}.json")
    if not dataset or dataset.get("processing_version") != VERSION:
        return None
    return dataset["records"][0]


def stale_reason(path: Path, now: datetime) -> str | None:
    """Freshness follows the next-due date the communiqué states, not the ingestion time."""
    dataset = read_published(path)
    try:
        record = dataset["records"][0]
        due = date.fromisoformat(record["end"])
    except (TypeError, KeyError, IndexError, ValueError):
        return "missing or invalid communiqué record"
    today = now.astimezone(LIMA).date()
    if today - due > LATE_AFTER:
        return (
            f"communiqué N° {record['number']}-{record['year']} said the next one "
            f"was due {due}; today is {today} in Lima"
        )
    return None


def build(records: list[dict], ingestion_time: datetime) -> dict:
    """Add to the records the provenance the registry declares, the ingestion time and the version."""
    return {
        "id": ID,
        "source": {
            "institution": SOURCE["institution"],
            "product": SOURCE["product"],
            "url": SOURCE["access"]["url"],
        },
        "variable": SOURCE["variable"],
        "unit": SOURCE["unit"],
        "data_type": SOURCE["data_type"],
        "spatial_resolution": SOURCE["spatial_resolution"],
        "temporal_resolution": SOURCE["temporal_resolution"],
        "ingestion_time": ingestion_time.astimezone(UTC).isoformat(timespec="seconds"),
        "processing_version": VERSION,
        "records": records,
    }
