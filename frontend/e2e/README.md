# Bateria E2E

Testes de fluxo real em Chrome headless (puppeteer-core, usa o Chrome já instalado —
não baixa Chromium). Cada teste **age pela UI** e depois **confere o resultado na API**,
para não passar só porque um texto apareceu na tela.

## Pré-requisitos

- `backend` no ar em `http://localhost:3011`
- o frontend a testar no ar (v3 em `:3013`)
- Chrome em `C:\Program Files\Google\Chrome\Application\chrome.exe`
  (ajuste a constante `CHROME` no topo dos scripts se estiver em outro caminho)

## Rodando

```bash
npm run e2e            # as três suítes contra o v3
npm run e2e:crud       # só a primeira

# contra outra origem (outra porta, staging, etc.):
node e2e/crud-basico.mjs http://localhost:3013 v3
```

## Suítes

| Arquivo | Cobre |
| --- | --- |
| `crud-basico.mjs` | CRUD de tabela lookup (`/admin/genres`), CRUD de listas, ciclo completo de manga: criar pelo modal do header → +capítulo → mudar status → editar título → excluir |
| `crud-modais-filtros.mjs` | CRUD de `/admin/sites`, adicionar/remover manga de lista pelo modal, criar/excluir lembrete, busca por título e filtro de status |
| `edicao-subabas.mjs` | Abas da tela de edição: Basic (rating/capítulos/sinopse), Tags (multi-select de gênero), Names (nome alternativo), Links (link externo) |

## Dados de teste

Tudo que é criado leva o prefixo `ZZE2E-<timestamp>` e é apagado no fim, inclusive uma
limpeza de segurança via API caso um passo da UI falhe no meio. Os testes **escrevem no
banco de desenvolvimento real** — não aponte para produção.

## Quando um teste falha

Um `fail-<label>-<n>.png` é salvo na raiz do `frontend/` (ignorado pelo git), junto do
`url=` e de um trecho do texto da tela no stdout. Os timeouts são folgados (45s por espera,
90s por navegação) para tolerar máquina lenta — em caso de falha real, demora a reportar.

## Ainda não coberto

- página `/duplicates` (merge e delete) — destrutivo sobre dados reais, deixado de fora
- upload/atualização de capa (`useUpdateImage`)
- infinite scroll da listagem
- dispensar lembrete pelo dashboard
- aba de histórico de leitura
