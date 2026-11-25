"""The source registry: loads and validates sources.toml, at the repository root."""

import importlib
import tomllib
from datetime import date, timedelta
from pathlib import Path

from wawapacha_pipeline.contract import DATA_TYPES, REPO_ROOT

REGISTRY_PATH = REPO_ROOT / "sources.toml"

BLOCKS = (
    "ENSO",
    "SST",
    "Forecasts",
    "Precipitation",
    "Territory",
    "Rivers",
    "Alerts",
    "History",
)
VERDICTS = ("automatable", "manual", "discard", "pending")
UPDATES = ("daily", "weekly", "monthly", "manual")
# `due` selects a source when its `due_after` threshold is reached.
# Freshness checks and page notices use `stale_after` for the same source.
CADENCE_RULES = {
    "daily": {
        "interval": timedelta(days=1),
        "due_after": timedelta(hours=20),
        "slack": timedelta(hours=4),
    },
    "weekly": {
        "interval": timedelta(days=7),
        "due_after": timedelta(days=6),
        "slack": timedelta(days=1),
    },
    "monthly": {
        "interval": timedelta(days=31),
        "due_after": timedelta(days=27),
        "slack": timedelta(days=1),
    },
}

REQUIRED = (
    "id",
    "institution",
    "product",
    "block",
    "verdict",
    "reviewed",
    "page",
    "update",
)
# These fields must be available to `contract.publish()` for an automated source.
REQUIRED_AUTOMATED = (
    "variable",
    "unit",
    "data_type",
    "spatial_resolution",
    "temporal_resolution",
)
OPTIONAL = ("history", "cadence", "license", "reference_period", "notes", "on_site")
ACCESS = ("kind", "url", "format", "auth")
SOURCE_PACKAGE = "wawapacha_pipeline.sources"


class RegistryError(Exception):
    """sources.toml does not follow the registry format."""


def load(path: Path = REGISTRY_PATH) -> dict[str, dict]:
    """Return the sources by id, in file order."""
    with open(path, "rb") as f:
        document = tomllib.load(f)
    entries = document.get("source", [])
    sources = {}
    for entry in entries:
        check(entry)
        if entry["id"] in sources:
            raise RegistryError(f"{entry['id']}: duplicate id.")
        sources[entry["id"]] = entry
    return sources


def get(source_id: str) -> dict:
    try:
        return load()[source_id]
    except KeyError:
        raise RegistryError(f"{source_id}: not in {REGISTRY_PATH.name}.") from None


def stale_after(update: str) -> timedelta | None:
    """Return the maximum age of a published file, or None for manual sources."""
    rule = CADENCE_RULES.get(update)
    return rule["interval"] * 2 + rule["slack"] if rule else None


def source_module_name(source_id: str) -> str:
    """Return the module name implied by a source id."""
    return f"{SOURCE_PACKAGE}.{source_id.replace('-', '_')}"


def discover(path: Path = REGISTRY_PATH) -> dict[str, object]:
    """Import the implementation for every automatable registry entry.

    The source id determines each module name, so no dispatcher edit is needed.
    """
    sources = load(path)
    modules = {}
    for source_id, entry in sources.items():
        if entry["verdict"] != "automatable":
            continue
        module_name = source_module_name(source_id)
        try:
            module = importlib.import_module(module_name)
        except ModuleNotFoundError as error:
            if error.name != module_name:
                raise
            raise RegistryError(
                f"{source_id}: automatable source is missing {module_name}.py."
            ) from None
        if getattr(module, "ID", None) != source_id:
            raise RegistryError(
                f"{source_id}: module ID does not match the registry id."
            )
        missing = [
            name
            for name in ("fetch", "parse", "run")
            if not callable(getattr(module, name, None))
        ]
        if missing:
            raise RegistryError(
                f"{source_id}: module is missing callable(s): {missing}."
            )
        modules[source_id] = module
    return modules


def check(entry: dict) -> None:
    name = entry.get("id", "(no id)")
    access = entry.get("access", {})

    unknown = (
        set(entry)
        - {"access"}
        - set(REQUIRED)
        - set(REQUIRED_AUTOMATED)
        - set(OPTIONAL)
    )
    unknown_access = set(access) - set(ACCESS)
    if unknown or unknown_access:
        raise RegistryError(
            f"{name}: unknown fields: {sorted(unknown) + sorted(unknown_access)}."
        )

    required = list(REQUIRED)
    if entry.get("verdict") == "automatable":
        required += REQUIRED_AUTOMATED
    missing = [key for key in required if not entry.get(key)]
    if entry.get("verdict") == "automatable" and not access.get("url"):
        missing.append("access.url")
    if missing:
        raise RegistryError(f"{name}: missing fields: {missing}.")

    for key, allowed in (
        ("block", BLOCKS),
        ("verdict", VERDICTS),
        ("update", UPDATES),
    ):
        if entry[key] not in allowed:
            raise RegistryError(
                f"{name}: {key} {entry[key]!r} is not one of {list(allowed)}."
            )
    if "data_type" in entry and entry["data_type"] not in DATA_TYPES:
        raise RegistryError(
            f"{name}: data_type {entry['data_type']!r} is not one of {DATA_TYPES}."
        )
    try:
        date.fromisoformat(entry["reviewed"])
    except (TypeError, ValueError):
        raise RegistryError(f"{name}: reviewed must be a YYYY-MM-DD date.") from None
    notes = entry.get("notes", [])
    if not isinstance(notes, list) or not all(isinstance(note, str) for note in notes):
        raise RegistryError(f"{name}: notes must be a list of strings.")
    if not isinstance(entry.get("on_site", False), bool):
        raise RegistryError(f"{name}: on_site must be true or false.")
