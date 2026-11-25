---
description: SDD · Mide el consumo real de tokens y pasos por sesión (solo lectura)
agent: build
---

Uso: `/tokens [N] [AAAA-MM-DD]`

Mide el consumo real de este proyecto leyendo la base local de OpenCode en modo lectura.
`N` limita la tabla de sesiones recientes (20 por defecto). La fecha opcional mueve el corte
entre «antes» y «después»; por defecto se usa la última modificación de
`.opencode/commands/task.md`, que marca cuándo cambió el comando.

No edites archivos ni la base. Ejecuta exactamente este script con `python3` desde la raíz del
proyecto, sin modificarlo. Puedes pasarlo por `python3 - <N> <FECHA> <<'PY'` o guardarlo en
`/tmp/opencode/tokens.py` y ejecutarlo con `python3 /tmp/opencode/tokens.py <N> <FECHA>`:

```python
import sqlite3
import os
import json
import sys
import statistics
import datetime

DB = os.environ.get("OPENCODE_DB", os.path.expanduser("~/.local/share/opencode/opencode.db"))


def find_root(start):
    p = start
    while True:
        if os.path.isdir(os.path.join(p, ".opencode", "commands")):
            return p
        parent = os.path.dirname(p)
        if parent == p:
            return start
        p = parent


CWD = find_root(os.getcwd())


def fmt(n):
    return f"{round(n):,}".replace(",", ".")


def first_user(con, sid):
    row = con.execute(
        "select data from session_message where session_id=? and type='user' order by seq limit 1",
        (sid,),
    ).fetchone()
    if not row:
        return ""
    try:
        return json.loads(row[0]).get("text", "")
    except Exception:
        return ""


def classify(text):
    if "Uso: `/task" in text:
        return "task"
    if "Valida la feature indicada" in text:
        return "validate"
    if "Quiero añadir esta funcionalidad" in text:
        return "feature"
    if "Uso: `/change" in text:
        return "change"
    if "Uso: `/clarify" in text:
        return "clarify"
    return "otro"


def steps_and_tools(con, sid):
    steps = 0
    tools = 0
    for (data,) in con.execute(
        "select data from session_message where session_id=? and type='assistant'", (sid,)
    ):
        steps += 1
        try:
            content = json.loads(data).get("content", [])
            tools += sum(1 for x in content if isinstance(x, dict) and x.get("type") == "tool")
        except Exception:
            pass
    return steps, tools


def med(xs):
    return statistics.median(xs) if xs else 0


def main():
    args = list(sys.argv[1:])
    limit = 20
    if args and args[0].isdigit():
        limit = int(args.pop(0))
    cutoff_arg = args[0] if args else None

    task_cmd = os.path.join(CWD, ".opencode", "commands", "task.md")
    if cutoff_arg:
        cutoff = datetime.datetime.fromisoformat(cutoff_arg).timestamp()
        cutoff_label = cutoff_arg
    elif os.path.exists(task_cmd):
        cutoff = os.path.getmtime(task_cmd)
        cutoff_label = datetime.datetime.fromtimestamp(cutoff).strftime("%Y-%m-%d %H:%M")
    else:
        cutoff = datetime.datetime.now().timestamp()
        cutoff_label = "ahora"

    if not os.path.exists(DB):
        print(f"No encuentro la base de OpenCode en {DB}")
        return

    con = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    projs = [r[0] for r in con.execute("select id from project where worktree=?", (CWD,))]
    if not projs:
        projs = [
            r[0]
            for r in con.execute(
                "select id from project where worktree like ?", (CWD.rstrip("/") + "/%",)
            )
        ]
    if not projs:
        print(f"No hay proyectos registrados para {CWD}")
        return

    placeholders = ",".join("?" * len(projs))
    rows = con.execute(
        f"""select id, title, time_created, tokens_input, tokens_output, tokens_reasoning,
                   tokens_cache_read
            from session_v2 where project_id in ({placeholders})
            order by time_created desc""",
        projs,
    ).fetchall()

    recs = []
    for sid, title, ts, inp, out, rea, cr in rows:
        text = first_user(con, sid)
        kind = classify(text)
        steps, tools = steps_and_tools(con, sid)
        if steps <= 1:
            continue
        inp, out, rea, cr = inp or 0, out or 0, rea or 0, cr or 0
        recs.append(
            {
                "ts": ts,
                "kind": kind,
                "title": (title or "(sin título)")[:52],
                "total": inp + out + rea + cr,
                "input": inp,
                "cache": cr,
                "gen": out + rea,
                "steps": steps,
                "tools": tools,
            }
        )

    print(f"Consumo de OpenCode · {CWD}")
    print(f"Base: {DB}")
    print(f"Corte (versión nueva de /task): {cutoff_label}")
    print()

    print(f"Sesiones recientes (últimas {min(limit, len(recs))})")
    print(f"{'fecha':<12}{'tipo':<10}{'total':>12}{'pasos':>7}{'tools':>7}  título")
    for r in recs[:limit]:
        d = datetime.datetime.fromtimestamp(r["ts"] / 1000).strftime("%m-%d %H:%M")
        print(
            f"{d:<12}{r['kind']:<10}{fmt(r['total']):>12}{r['steps']:>7}{r['tools']:>7}  {r['title']}"
        )
    print()

    print("Medianas por tipo")
    print(
        f"{'tipo':<10}{'n':>4}{'total':>13}{'input':>11}{'cache':>13}"
        f"{'gen':>10}{'pasos':>7}{'tools':>7}"
    )
    for kind in ("task", "validate", "feature", "change", "clarify", "otro"):
        group = [r for r in recs if r["kind"] == kind]
        if not group:
            continue
        print(
            f"{kind:<10}{len(group):>4}{fmt(med([g['total'] for g in group])):>13}"
            f"{fmt(med([g['input'] for g in group])):>11}"
            f"{fmt(med([g['cache'] for g in group])):>13}"
            f"{fmt(med([g['gen'] for g in group])):>10}"
            f"{med([g['steps'] for g in group]):>7.0f}"
            f"{med([g['tools'] for g in group]):>7.0f}"
        )
    print()

    print("Antes / después del corte, por tipo (pasos y tools)")
    print(
        f"{'tipo':<10}{'antes':>7}{'pasos':>7}{'tools':>7}"
        f"{'después':>9}{'pasos':>7}{'tools':>7}{'Δpasos':>9}{'Δtools':>9}"
    )
    for kind in ("task", "validate", "feature", "change", "clarify", "otro"):
        group = [r for r in recs if r["kind"] == kind]
        if not group:
            continue
        before = [r for r in group if r["ts"] / 1000 < cutoff]
        after = [r for r in group if r["ts"] / 1000 >= cutoff]
        b_steps = med([g["steps"] for g in before])
        b_tools = med([g["tools"] for g in before])
        a_steps = med([g["steps"] for g in after])
        a_tools = med([g["tools"] for g in after])
        if before and after:
            d_steps = f"{a_steps - b_steps:+.0f}"
            d_tools = f"{a_tools - b_tools:+.0f}"
        else:
            d_steps = d_tools = "-"
        b_steps_s = f"{b_steps:.0f}" if before else "-"
        b_tools_s = f"{b_tools:.0f}" if before else "-"
        a_steps_s = f"{a_steps:.0f}" if after else "-"
        a_tools_s = f"{a_tools:.0f}" if after else "-"
        print(
            f"{kind:<10}{len(before):>7}{b_steps_s:>7}{b_tools_s:>7}"
            f"{len(after):>9}{a_steps_s:>7}{a_tools_s:>7}"
            f"{d_steps:>9}{d_tools:>9}"
        )
    print()
    tasks = [r for r in recs if r["kind"] == "task"]
    before = [r for r in tasks if r["ts"] / 1000 < cutoff]
    after = [r for r in tasks if r["ts"] / 1000 >= cutoff]
    if before and after:
        a = med([g["total"] for g in before])
        b = med([g["total"] for g in after])
        if a:
            print(f"Delta de tokens en task: {(b - a) / a * 100:+.1f} %")
            print()
    print("Nota: compara medianas, no sesiones sueltas; el tipo de tarea pesa más que el comando.")


if __name__ == "__main__":
    main()
```

Interpreta la salida así:

- **Medianas por tipo**: compara `task` y `validate`; el resto es contexto.
- **Antes / después por tipo**: mira `pasos` y `tools`. Si «después» no tiene sesiones, dilo y no
  inventes el delta; si lo tiene, cita el delta real, no una estimación.
- **Qué explica el cambio**: menos lecturas por comando y el cierre de feature dentro de `/task`;
  el tamaño del prompt afecta a tokens, no a pasos.
- **Nota final**: recuérdame que el tipo de tarea pesa más que el comando.

No resumas la tabla con cifras inventadas: copia las medianas reales.
