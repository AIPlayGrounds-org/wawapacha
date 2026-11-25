import json
import os
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

import pytest

from wawapacha_pipeline import contract, registry
from wawapacha_pipeline.contract import (
    Unchanged,
    UpstreamError,
    ValidationError,
    publish,
)
from wawapacha_pipeline.sources import enfen_communique as enfen

PIPELINE_DIR = Path(__file__).parents[1]
SAMPLES_DIR = Path(__file__).parent / "samples"
# The feed of 2026-11-25: communiqués N° 20-2026 and N° 19-2026.
ALERTA = SAMPLES_DIR / "enfen_feed_alerta.xml"
# 2026-11-20 12:00 in Lima, between N° 20-2026 and its next-due date.
NOW = datetime(2026, 11, 20, 17, tzinfo=UTC)


def feed(name: str) -> bytes:
    return (SAMPLES_DIR / f"enfen_feed_{name}.xml").read_bytes()


def edit(text: bytes, old: str, new: str) -> bytes:
    assert old.encode() in text
    return text.replace(old.encode(), new.encode())


def run_cli(source: Path, data_dir: Path) -> subprocess.CompletedProcess:
    """Run the CLI as in production, reading the feed at `source` and publishing in `data_dir`."""
    env = os.environ | {
        "ENFEN_FEED_URL": source.as_uri(),
        "WAWAPACHA_DATA_DIR": str(data_dir),
    }
    return subprocess.run(
        [sys.executable, "-m", "wawapacha_pipeline", "run", "enfen-communique"],
        cwd=PIPELINE_DIR,
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


@pytest.mark.parametrize(
    ("name", "record"),
    [
        (
            "alerta",
            {
                "number": 20,
                "year": 2026,
                "status": "Alerta de El Niño Costero",
                "url": "https://enfen.imarpe.gob.pe/download/comunicado-oficial-enfen-n-20-2026/",
                "start": "2026-11-13",
                "end": "2026-11-30",
            },
        ),
        (
            "vigilancia",
            {
                "number": 1,
                "year": 2026,
                "status": "Vigilancia de El Niño Costero",
                "url": "https://enfen.imarpe.gob.pe/download/comunicado-oficial-enfen-n-01-2026/",
                "start": "2026-01-16",
                "end": "2026-01-30",
            },
        ),
        (
            "no_activo",
            {
                "number": 13,
                "year": 2025,
                "status": "No Activo",
                "url": "https://enfen.imarpe.gob.pe/download/comunicado-oficial-enfen-n13-2025/",
                "start": "2025-12-18",
                "end": "2026-01-15",
            },
        ),
        (
            "extraordinario",
            {
                "number": 1,
                "year": 2025,
                "status": "Vigilancia de El Niño Costero",
                "url": "https://enfen.imarpe.gob.pe/download/comunicado-extraordinario-enfen-n-01-2025/",
                "start": "2025-02-28",
                "end": "2025-03-14",
            },
        ),
    ],
)
def test_reads_the_newest_communique_of_a_real_feed(name, record):
    assert enfen.parse(feed(name)) == record


def test_the_newest_item_wins_whatever_the_feed_order():
    text = feed("extraordinario")
    first = text.index(b"<item>")
    second = text.index(b"<item>", first + 1)
    end = text.index(b"</channel>")
    swapped = text[:first] + text[second:end] + text[first:second] + text[end:]

    assert enfen.parse(swapped)["number"] == 1


def test_no_activa_is_the_no_activo_status():
    # N° 02-2025 writes `No activa1`, with the footnote mark glued to the word.
    text = feed("extraordinario")
    first = text.index(b"<item>")
    second = text.index(b"<item>", first + 1)
    only_02 = text[:first] + text[second:]

    record = enfen.parse(only_02)

    assert (record["number"], record["status"]) == (2, "No Activo")


def test_the_publication_date_is_the_lima_date():
    # 19:38 UTC is 14:38 in Lima, the same day; 03:00 UTC is the previous evening.
    text = edit(feed("alerta"), "13 Nov 2026 19:38:00", "14 Nov 2026 03:00:00")

    assert enfen.parse(text)["start"] == "2026-11-13"


def test_without_the_label_the_status_is_the_first_phrase_near_the_top():
    text = feed("vigilancia").replace(b"Estado de sistema de alerta:", b"")

    assert enfen.parse(text)["status"] == "Vigilancia de El Niño Costero"


@pytest.mark.parametrize(
    ("old", "new", "message"),
    [
        ("Vigilancia de El Niño Costero<sup>1</sup>", "Emergencia", "unknown status"),
        (
            'Estado de sistema de alerta:</span><span style="color: #339966;"> '
            '<span style="color: #ff6600;">Vigilancia de El Niño Costero<sup>1</sup>',
            "Nada que reportar",
            "no status",
        ),
        ("próximo Comunicado Oficial", "siguiente boletín", "no date"),
        ("30 de enero de 2026", "30 de brumario de 2026", "unknown month"),
        ("30 de enero de 2026", "31 de febrero de 2026", "day is out of range"),
        ("30 de enero de 2026", "10 de enero de 2026", "not after"),
        ("N° 01-2026", "N° uno", "names no communiqué number"),
        (
            "<link>https://enfen.imarpe.gob.pe/download/",
            "<link>https://example.org/",
            "not a detail page",
        ),
        ("16 Jan 2026 08:39:57 +0000", "mañana", "Unreadable pubDate"),
    ],
)
def test_an_unreadable_communique_fails_rather_than_guesses(old, new, message):
    text = edit(feed("vigilancia"), old, new)

    with pytest.raises(ValidationError, match=message):
        enfen.parse(text)


@pytest.mark.parametrize(
    "text",
    [b"", b"<html>Mantenimiento</html>", b"<rss><channel></channel></rss>"],
)
def test_a_feed_without_communiques_fails_validation(text):
    with pytest.raises(ValidationError):
        enfen.parse(text)


def test_fetch_sends_the_user_agent_the_server_accepts(monkeypatch):
    seen = {}

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

        def read(self):
            return b"ok"

    def urlopen(request, timeout):
        seen["agent"] = request.get_header("User-agent")
        return Response()

    monkeypatch.setattr(enfen.urllib.request, "urlopen", urlopen)

    assert enfen.fetch("https://enfen.example/feed/") == b"ok"
    assert seen["agent"] == "WawaPacha/0.1"


@pytest.mark.parametrize(
    ("status", "error"),
    [(429, UpstreamError), (503, UpstreamError), (403, ValidationError)],
)
def test_a_busy_server_is_upstream_and_a_refused_request_is_ours(
    monkeypatch, status, error
):
    def urlopen(request, timeout):
        raise enfen.urllib.error.HTTPError(request.full_url, status, "", {}, None)

    monkeypatch.setattr(enfen.urllib.request, "urlopen", urlopen)

    with pytest.raises(error):
        enfen.fetch("https://enfen.example/feed/")


@pytest.fixture
def data_dir(tmp_path, monkeypatch):
    monkeypatch.setattr(contract, "DATA_DIR", tmp_path)
    monkeypatch.setattr(enfen, "publish", lambda dataset: publish(dataset, tmp_path))
    monkeypatch.setattr(enfen, "fetch", lambda: ALERTA.read_bytes())
    return tmp_path


def published(data_dir: Path) -> dict:
    return json.loads((data_dir / "enfen-communique.json").read_text(encoding="utf-8"))


def test_run_publishes_and_then_reports_nothing_new(data_dir):
    count, path = enfen.run(NOW)

    assert count == 1
    assert published(data_dir)["records"][0]["stale"] is False
    with pytest.raises(Unchanged, match="N° 20-2026"):
        enfen.run(datetime(2026, 11, 21, 17, tzinfo=UTC))


def test_run_republishes_when_the_record_turns_stale(data_dir):
    enfen.run(NOW)
    # 2026-12-01 03:00 UTC is still 2026-11-30 in Lima: the due day itself.
    with pytest.raises(Unchanged):
        enfen.run(datetime(2026, 12, 1, 3, tzinfo=UTC))

    enfen.run(datetime(2026, 12, 1, 17, tzinfo=UTC))

    assert published(data_dir)["records"][0]["stale"] is True


def test_run_republishes_what_an_older_version_wrote(data_dir):
    enfen.run(NOW)
    dataset = published(data_dir)
    dataset["processing_version"] = "0.1.0"
    (data_dir / "enfen-communique.json").write_text(json.dumps(dataset))

    enfen.run(NOW)

    assert published(data_dir)["processing_version"] == enfen.VERSION


@pytest.mark.parametrize(
    ("now", "stale"),
    [
        (datetime(2026, 11, 30, 23, tzinfo=UTC), False),
        # 2026-12-02 04:00 UTC is 2026-12-01 23:00 in Lima: one day late is allowed.
        (datetime(2026, 12, 2, 4, tzinfo=UTC), False),
        (datetime(2026, 12, 2, 5, tzinfo=UTC), True),
    ],
)
def test_freshness_follows_the_next_due_date(data_dir, now, stale):
    enfen.run(NOW)

    reason = enfen.stale_reason(data_dir / "enfen-communique.json", now)

    assert (reason is not None) == stale
    if stale:
        assert "N° 20-2026" in reason and "2026-11-30" in reason


def test_freshness_reports_a_missing_file(tmp_path):
    assert enfen.stale_reason(tmp_path / "enfen-communique.json", NOW) == (
        "missing or invalid communiqué record"
    )


def assert_matches_registry(dataset: dict) -> None:
    entry = registry.get(dataset["id"])

    assert dataset["source"] == {
        "institution": entry["institution"],
        "product": entry["product"],
        "url": entry["access"]["url"],
    }
    assert dataset["variable"] == entry["variable"]
    assert dataset["unit"] == entry["unit"]
    assert dataset["data_type"] == entry["data_type"] == "official"
    assert dataset["spatial_resolution"] == entry["spatial_resolution"]
    assert dataset["temporal_resolution"] == entry["temporal_resolution"]


def test_build_adds_provenance_metadata():
    record = enfen.parse(ALERTA.read_bytes()) | {"stale": False}
    dataset = enfen.build([record], datetime(2026, 11, 20, 12, tzinfo=UTC))

    assert dataset["id"] == "enfen-communique"
    assert dataset["ingestion_time"] == "2026-11-20T12:00:00+00:00"
    assert dataset["processing_version"] == enfen.VERSION
    assert dataset["records"] == [record]
    assert_matches_registry(dataset)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("status", "red"),
        ("stale", "no"),
        ("start", "2026-9-28"),
        ("url", "https://example.org/communique"),
        ("url", "https://enfen.imarpe.gob.pe/download/comunicado.pdf"),
        ("number", 0),
        ("extra", 1),
    ],
)
def test_the_schema_rejects_a_bad_record(tmp_path, field, value):
    record = enfen.parse(ALERTA.read_bytes()) | {"stale": False, field: value}
    dataset = enfen.build([record], NOW)

    with pytest.raises(ValidationError, match="schema"):
        publish(dataset, tmp_path)
    assert list(tmp_path.iterdir()) == []


def test_cli_publishes_then_reports_nothing_new(tmp_path):
    result = run_cli(ALERTA, tmp_path)

    assert result.returncode == 0, result.stderr
    assert result.stdout.startswith("Published enfen-communique: 1 records in ")
    dataset = published(tmp_path)
    assert dataset["records"][0]["number"] == 20
    assert_matches_registry(dataset)

    again = run_cli(ALERTA, tmp_path)

    assert again.returncode == 0, again.stderr
    assert again.stdout == (
        "enfen-communique: nothing new. No communiqué after N° 20-2026 yet.\n"
    )


def test_cli_keeps_the_previous_json_when_the_communique_is_unreadable(tmp_path):
    broken = tmp_path / "feed.xml"
    broken.write_bytes(
        edit(
            ALERTA.read_bytes(), "<p>Alerta de El Niño Costero</p>", "<p>Emergencia</p>"
        )
    )
    previous = tmp_path / "enfen-communique.json"
    previous.write_text('{"previous": true}', encoding="utf-8")

    result = run_cli(broken, tmp_path)

    assert result.returncode == 1
    assert "no status near the top" in result.stderr
    assert previous.read_text(encoding="utf-8") == '{"previous": true}'


def test_the_published_json_is_the_registered_source():
    dataset = json.loads(
        (contract.REPO_ROOT / "data" / "enfen-communique.json").read_text(
            encoding="utf-8"
        )
    )

    assert dataset["processing_version"] == enfen.VERSION
    assert_matches_registry(dataset)
