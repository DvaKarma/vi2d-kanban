#!/usr/bin/env python3
"""Importa cards exportados do Trello (JSON, um arquivo por lista) para a API do kanban VI2D.

Uso:
    python3 scripts/import_trello.py [arquivo1.json arquivo2.json ...]

Sem argumentos, procura por "Kanban_Intankavel*.json" em ~/Downloads (é assim que o
Trello nomeia exports repetidos de listas separadas: "Kanban_Intankavel v2.0.json",
"Kanban_Intankavel v2.0 (1).json", etc).

Idempotente: antes de criar um card, verifica via GET /tasks se já existe uma task
com o mesmo title na API e pula se sim — pode rodar de novo sem duplicar.
"""

import glob
import os
import sys
import uuid

import requests

API_BASE = "http://124.198.135.12:8002"

COLUMN_MAP = {
    "Backlog": "backlog",
    "Stand-By": "stand_by",
    "To Do": "a_fazer",
    "Em Andamento": "em_andamento",
    "Concluído": "concluido",
    "Não Concluído": "nao_concluido",
}

MEMBER_MAP = {
    "Igor Deungaro": "igor",
    "Vinicius Dutra": "vinicius",
}

# Cada lista do Trello tem um card fixado no topo (menor "Pos") só com a
# descrição do propósito da coluna — não é uma tarefa real. Identificados
# por inspeção manual do export; pulados no import.
HEADER_CARDS = {
    ("Backlog", "Backlog - VI2D"),
    ("Stand-By", "Stand-By"),
    ("To Do", "A Fazer"),
    ("Em Andamento", "Em Andamento"),
    ("Concluído", "Concluído"),
    ("Não Concluído", "Não Concluído"),
}


def find_input_files():
    pattern = os.path.expanduser("~/Downloads/Kanban_Intankavel*.json")
    files = sorted(glob.glob(pattern))
    if not files:
        sys.exit(f"Nenhum arquivo encontrado em {pattern}")
    return files


def load_cards(paths):
    cards = []
    for path in paths:
        with open(path, encoding="utf-8") as f:
            data = __import__("json").load(f)
        cards.extend(data)
    return cards


def parse_members(raw):
    if not raw:
        return []
    result = []
    for block in raw.split("\n\n"):
        for full_name, code in MEMBER_MAP.items():
            if full_name in block and code not in result:
                result.append(code)
    return result


def parse_labels(raw):
    if not raw:
        return []
    tags = []
    for block in raw.split("\n\n"):
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if not lines:
            continue
        name = lines[0].rstrip(",").strip()
        if name:
            tags.append(name.lower())
    return tags


def parse_checklist(raw):
    if not raw:
        return []
    items = []
    for block in raw.split("\n\n\n"):
        lines = [l for l in block.split("\n") if l.strip() != ""]
        if not lines:
            continue
        status = lines[-1].strip().lower()
        if status in ("complete", "incomplete"):
            texto = "\n".join(lines[:-1]).strip()
            feito = status == "complete"
        else:
            # status inesperado — mantém o texto inteiro e avisa
            texto = "\n".join(lines).strip()
            feito = False
            print(f"    aviso: item de checklist sem status complete/incomplete reconhecível: {texto!r}")
        if texto:
            items.append({"id": uuid.uuid4().hex[:8], "texto": texto, "feito": feito})
    return items


def parse_due_date(raw):
    if not raw:
        return None
    return str(raw)[:10]


def parse_card(card):
    list_name = card.get("List Name")
    column_name = COLUMN_MAP.get(list_name)
    if column_name is None:
        print(f"    aviso: List Name desconhecida {list_name!r}, pulando card {card.get('Name')!r}")
        return None
    return {
        "title": card.get("Name", "").strip(),
        "description": (card.get("Desc") or "").strip(),
        "column_name": column_name,
        "priority": "media",
        "responsavel": parse_members(card.get("Members")),
        "tags": ",".join(parse_labels(card.get("Labels"))),
        "checklist": parse_checklist(card.get("Checklist")),
        "due_date": parse_due_date(card.get("Due")),
    }


def fetch_existing_titles():
    res = requests.get(f"{API_BASE}/tasks", timeout=15)
    res.raise_for_status()
    return {t["title"] for t in res.json()}


def main():
    paths = sys.argv[1:] if len(sys.argv) > 1 else find_input_files()
    print("Arquivos de entrada:")
    for p in paths:
        print(f"  - {p}")
    print()

    raw_cards = load_cards(paths)
    existing_titles = fetch_existing_titles()

    counts = {col: {"criado": 0, "pulado_duplicado": 0, "pulado_header": 0} for col in COLUMN_MAP.values()}

    for raw_card in raw_cards:
        list_name = raw_card.get("List Name")
        name = raw_card.get("Name", "")
        column_name = COLUMN_MAP.get(list_name)

        if (list_name, name) in HEADER_CARDS:
            print(f"[{list_name}] pulando card-cabeçalho {name!r}")
            if column_name:
                counts[column_name]["pulado_header"] += 1
            continue

        task = parse_card(raw_card)
        if task is None:
            continue

        if task["title"] in existing_titles:
            print(f"[{list_name}] já existe, pulando: {task['title']!r}")
            counts[column_name]["pulado_duplicado"] += 1
            continue

        res = requests.post(f"{API_BASE}/tasks", json=task, timeout=15)
        if res.status_code >= 400:
            print(f"[{list_name}] ERRO ao criar {task['title']!r}: {res.status_code} {res.text}")
            continue

        print(f"[{list_name}] criado: {task['title']!r} (responsavel={task['responsavel']}, tags={task['tags']!r}, checklist={len(task['checklist'])} itens)")
        existing_titles.add(task["title"])
        counts[column_name]["criado"] += 1

    print()
    print("=== Resumo por coluna ===")
    total_criado = total_dup = total_header = 0
    for list_name, col in COLUMN_MAP.items():
        c = counts[col]
        print(f"{list_name:16s} ({col:14s}) — criados: {c['criado']:2d} | pulados (duplicado): {c['pulado_duplicado']:2d} | pulados (cabeçalho): {c['pulado_header']:2d}")
        total_criado += c["criado"]
        total_dup += c["pulado_duplicado"]
        total_header += c["pulado_header"]
    print(f"{'TOTAL':16s} {'':16s} — criados: {total_criado:2d} | pulados (duplicado): {total_dup:2d} | pulados (cabeçalho): {total_header:2d}")


if __name__ == "__main__":
    main()
