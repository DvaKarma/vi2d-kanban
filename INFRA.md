# INFRA.md — VI2D Kanban

Referência rápida deste sistema. Para a topologia completa (incluindo o kanban VNCTEC original que compartilha o mesmo servidor), ver `INFRA.md` no repo `DvaKarma/kanban`.

---

## Este sistema

| Item | Valor |
|---|---|
| Diretório no servidor | `/home/vnctec/vi2d-kanban/` |
| Container API | `vi2d-kanban-api` — porta `8002` |
| Container DB | `vi2d-kanban-db` — Postgres 16 isolado |
| Repo GitHub | `DvaKarma/vi2d-kanban` |
| Site Netlify | `vi2dkanban.netlify.app` |
| Autenticação | não existe (dívida técnica aceita — uso restrito a Vinicius e Igor) |
| Board | único compartilhado, campo `responsavel` (array: `vinicius`, `igor`) |
| Colunas | Backlog, Stand-By, A Fazer, Em Andamento, Concluído, Não Concluído |

## Acesso ao servidor

```bash
ssh acesso@124.198.135.12
ssh vnc@10.0.10.110
cd /home/vnctec/vi2d-kanban
```

## Comandos úteis

```bash
docker logs -f vi2d-kanban-api
docker exec -it vi2d-kanban-db psql -U vi2d -d vi2d_kanban_db
docker compose up -d --force-recreate   # após editar app/main.py
```

## Firewall

DNAT `124.198.135.12:8002` → `10.0.10.110:8002`, configurado no OPNsense (host `124.198.135.12`, usuário `acesso`). **Não editar o firewall de dentro do servidor de aplicação** (`10.0.10.110`) — as regras internas que aparecem lá são geradas automaticamente pelo Docker, não são o firewall de borda real.

## Isolamento

Banco, API, DNAT, repo e site são todos isolados do kanban VNCTEC original. Não há compartilhamento de dados — só o servidor físico e o usuário SSH `vnc` são compartilhados.
