import marimo

__generated_with = "0.25.1"
app = marimo.App(width="medium")

with app.setup:
    from datetime import datetime, timezone

    import marimo as mo

    from wawapacha_pipeline.contract import ValidationError
    from wawapacha_pipeline.sources import enfen_communique as source


@app.cell(hide_code=True)
def _():
    mo.md(r"""
    # ENFEN — Comunicado Oficial

    El estado oficial del sistema de alerta de El Niño Costero, tal como lo declara la Comisión Multisectorial ENFEN en cada comunicado.

    - La fuente: [`docs/sources.md`](../docs/sources.md#enfen-communique)
    - Reglas de los datos: [`docs/data-contract.md`](../docs/data-contract.md)

    Este notebook muestra paso a paso lo que hace [`pipeline/`](../pipeline/src/wawapacha_pipeline/sources/enfen_communique.py): **descargar → leer y validar → comprobar si está vencido → armar el JSON**. No define lógica de la fuente y no escribe en `data/`; para publicar, usa `wawapacha-pipeline run enfen-communique`.
    """)
    return


@app.cell(hide_code=True)
def _():
    mo.md(r"""
    ## Paso 1 · Descargar

    El archivo de comunicados tiene un feed RSS. Cada entrada trae el título, el enlace a la página del comunicado, la hora de publicación y el texto completo.
    """)
    return


@app.cell
def _():
    raw = source.fetch()

    mo.md(f"Descargados {len(raw):,} bytes de `{source.URL}`.")
    return (raw,)


@app.cell(hide_code=True)
def _():
    mo.md(r"""
    ## Paso 2 · Leer y validar

    `source.parse()` toma la entrada más reciente por hora de publicación y extrae:

    - el número y el año, del título;
    - el estado, tras «Estado del sistema de alerta:», que debe ser una de las cinco frases oficiales; «No activa» cuenta como «No Activo»;
    - la fecha del próximo comunicado, de la frase «próximo Comunicado Oficial … el <día> de <mes> de <año>», que debe ser posterior a la publicación.

    Si algo no se puede leer, la ejecución falla y no se publica nada: nunca se adivina un estado.
    """)
    return


@app.cell
def _(raw):
    try:
        record = source.parse(raw)
        validation_error = None
    except ValidationError as error:
        record = None
        validation_error = str(error)
        # Sin interfaz (producción), un error debe detener la ejecución.
        if mo.app_meta().mode == "script":
            raise

    if validation_error:
        _out = mo.callout(mo.md(f"**No pasa la validación.** {validation_error}\n\nNo se publicará nada."), kind="danger")
    else:
        _out = mo.callout(mo.md(f"**Validación correcta:** comunicado {record['number']}-{record['year']}."), kind="success")
    _out
    return (record,)


@app.cell(hide_code=True)
def _():
    mo.md(r"""
    ## Paso 3 · ¿Está vencido?

    El estado rige hasta el siguiente comunicado. Si hoy, en hora de Lima, es posterior a la fecha que el comunicado anuncia (guardada como `end`), el registro se marca `stale`: ENFEN no ha publicado el siguiente y la web debe avisarlo.
    """)
    return


@app.cell
def _(record):
    mo.stop(record is None, mo.md("_Sin datos válidos._"))

    _today = datetime.now(source.LIMA).date().isoformat()
    records = [record | {"stale": _today > record["end"]}]
    mo.hstack([
        mo.stat(record["status"], label="Estado oficial", caption=f"Comunicado {record['number']}-{record['year']}, {record['start']}"),
        mo.stat("Vencido" if records[0]["stale"] else "Vigente", label="Próximo comunicado", caption=f"previsto el {record['end']}"),
    ], justify="start", gap=2)
    return (records,)


@app.cell(hide_code=True)
def _():
    mo.md(r"""
    ## Paso 4 · Armar el JSON

    `source.build()` añade al registro la procedencia que declara [`sources.toml`](../sources.toml), según el [esquema](../schema/dataset.schema.json). Aquí solo se muestra: el JSON no se guarda.
    """)
    return


@app.cell
def _(records):
    dataset = source.build(records, datetime.now(timezone.utc))
    mo.tree(dataset)
    return (dataset,)


if __name__ == "__main__":
    app.run()
