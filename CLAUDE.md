# CLAUDE.md — Kanban VI2D

Leia este arquivo antes de qualquer tarefa de código.

---

## O que é este projeto

Kanban compartilhado self-hosted da **VI2D**, empresa da qual Vinicius e Igor são sócios (negócio próprio, não é subsidiária nem projeto da VNCTEC — apenas reaproveita infraestrutura de servidor).
Board único compartilhado entre os dois sócios, sem conceito de workspace — as tarefas têm um ou mais **responsáveis** (Vinicius, Igor, ou ambos).
Frontend no Netlify (deploy automático via GitHub). API no servidor VNCTEC, rodando isolada da API do kanban pessoal/VNCTEC.

---

## Repositório

- **Local:** `/Users/viniciusdutra/Documents/GitHub/vi2d-kanban`
- **GitHub:** `DvaKarma/vi2d-kanban`, conectado ao Netlify via push no `main`
- **Estrutura esperada:**
  ```
  vi2d-kanban/
  ├── CLAUDE.md
  ├── package.json
  ├── next.config.js
  ├── tailwind.config.js
  ├── src/
  │   ├── app/
  │   │   ├── layout.tsx
  │   │   ├── page.tsx
  │   │   └── globals.css
  │   ├── components/
  │   │   ├── KanbanBoard.tsx
  │   │   ├── KanbanColumn.tsx
  │   │   ├── TaskCard.tsx
  │   │   └── TaskModal.tsx
  │   └── lib/
  │       └── api.ts
  └── public/
  ```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 + TypeScript + shadcn/ui |
| Drag and drop | @hello-pangea/dnd |
| Estilo | Tailwind CSS — dark mode obrigatório |
| Deploy | Netlify (build: `next build`, publish: `.next`) |
| API | FastAPI rodando no servidor VNCTEC, isolada da API do kanban pessoal/VNCTEC |

---

## Identidade visual (VI2D PRO)

- **Background:** `#050c1a` (navy)
- **Accent:** `#00e5ff` (cyan)
- **Modo:** dark mode fixo, sem toggle
- **Referência:** estilo Trello mas dark, cards com borda sutil cyan no hover

---

## API

- **URL de produção:** a definir — nova instância na porta `8002` do servidor VNCTEC (deploy manual via SSH, ver Passo 6 do plano geral, fora do escopo desta tarefa)
- **URL local (variável de ambiente):** `NEXT_PUBLIC_API_URL`
- **Endpoints disponíveis:**

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/tasks?responsavel=vinicius` | Listar tasks (filtro opcional por responsável) |
| POST | `/tasks` | Criar task |
| PATCH | `/tasks/{id}` | Atualizar task (qualquer campo) |
| DELETE | `/tasks/{id}` | Deletar task |

- **Schema de uma task:**
  ```typescript
  {
    id: number
    title: string
    description: string
    responsavel: ('vinicius' | 'igor')[]   // array multi-select, 1 ou 2 valores
    column_name: 'backlog' | 'a_fazer' | 'em_andamento' | 'concluido'
    priority: 'baixa' | 'media' | 'alta'
    due_date: string | null   // formato: "YYYY-MM-DD"
    tags: string              // CSV: "infra,urgente"
    position: number
    created_at: string
    updated_at: string
  }
  ```

---

## Funcionalidades do MVP

### Obrigatórias
- [ ] Board único compartilhado (sem workspaces)
- [ ] Quatro colunas: `Backlog`, `A Fazer`, `Em Andamento`, `Concluído`
- [ ] Cards com: título, prioridade (cor), data limite, tags, responsáveis (avatares/iniciais)
- [ ] Pills de filtro no header: "Todos | Vinicius | Igor" — filtra tarefas por `responsavel`
- [ ] Drag and drop entre colunas (atualiza `column_name` via PATCH)
- [ ] Modal para criar/editar task (todos os campos, incluindo multi-select de responsável)
- [ ] Deletar task (botão no card ou no modal)
- [ ] Persistência real via API (não localStorage)

### Fora do MVP (não implementar agora)
- **Autenticação/login** — dívida técnica conhecida e aceita para este MVP, não um esquecimento. Board fica acessível sem login enquanto for uso restrito aos dois sócios.
- Anexos de arquivo
- Arquivamento mensal
- Múltiplos boards/projetos

---

## Variáveis de ambiente

Criar `.env.local` na raiz (não commitar):
```
NEXT_PUBLIC_API_URL=http://124.198.135.12:8002
```

No Netlify, configurar a mesma variável em:
`Site settings → Environment variables → NEXT_PUBLIC_API_URL`

---

## Netlify

- **Build command:** `next build`
- **Publish directory:** `.next`
- **Node version:** 20
- O deploy acontece automaticamente a cada push no `main`

---

## Servidor VNCTEC

Infraestrutura compartilhada com o kanban pessoal/VNCTEC, mas com containers e banco isolados para o VI2D.

- **IP público:** `124.198.135.12`
- **IP interno:** `10.0.10.110`
- **SSH:** `ssh -p 2223 vnc@124.198.135.12`
- **Diretório do kanban VI2D:** `/home/vnctec/vi2d-kanban/` (a criar no deploy — Passo 6, fora do escopo desta tarefa)
- **Containers planejados:** `vi2d-kanban-api` (porta 8002), `vi2d-kanban-db` (Postgres 16 isolado, banco próprio)

### Comandos úteis no servidor (após deploy)
```bash
# Ver logs da API
docker logs -f vi2d-kanban-api

# Reiniciar API após editar main.py
docker restart vi2d-kanban-api

# Acessar banco
docker exec -it vi2d-kanban-db psql -U vi2d -d vi2d_kanban_db

# Ver tasks no banco
docker exec vi2d-kanban-db psql -U vi2d -d vi2d_kanban_db -c "SELECT id, title, responsavel, column_name FROM tasks;"
```

---

## Integração futura (não implementar no MVP)

Nenhuma integração externa (Telegram, sistema financeiro etc.) está definida para esta instância no momento. Se surgir necessidade, seguir o mesmo padrão do kanban pessoal/VNCTEC (endpoint de leitura filtrado, ex: `GET /tasks?responsavel=igor&column_name=em_andamento`), sem antecipar contrato antes de haver demanda real.

---

## Critério de done do MVP

Abrir o site no Netlify → criar card com responsável "Vinicius" → criar card com responsável "Igor" → criar card com os dois → filtrar pelos três pills → arrastar entre colunas → recarregar página → tudo persiste.
