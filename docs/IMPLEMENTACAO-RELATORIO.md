# Plano de implementação — Relatório i3 (paridade PDF Condor)

Referência: PDF *Relatório de Análise de Maturidade - Condor* e AppScript legado (`appScript/script.html`).

**Status geral: plano concluído (Fases 0–6).**

---

## Fase 0 — Infraestrutura

- [x] Schema `MacroDimensao` (`macroIndice`, `nivel`, `titulo`, `texto`)
- [x] Import aba **Macro Dimensões** (`parse-macro-dimensoes.ts`)
- [x] Scripts `reimport:macro` / `reimport:macro:docker`
- [x] Textos em `relatorio-textos.ts`, templates em `relatorio-templates.ts`
- [x] Tipos em `relatorio-types.ts`

---

## Fase 1 — Metodologia e resultados (cap. 2)

- [x] Capa (título PDF, empresa, representante, data)
- [x] Seção 1 — Introdução + escala de maturidade (6 dimensões)
- [x] **2.1** Estruturas avaliadas
- [x] **2.2** Princípios avaliados (`calcularMediasPorPrincipio`)
- [x] **2.3** Capacidades — Tabela 1
- [x] **2.4** Aplicação prática
- [x] **2.5** Processos operacionais

---

## Fase 2 — Direcionamento estratégico (cap. 3)

- [x] `relatorio-direcionamento.ts`
- [x] Resumo das 4 macros digitais
- [x] Seções **3.1–3.4** com sub-dimensões e “Resultado da análise”
- [x] API: `direcionamento`, `mediasPorPrincipio`, `dimensoesOperacionais`

---

## Fase 3 — Análise TEOR (cap. 4)

- [x] `relatorio-teor.ts` + textos TEOR
- [x] Tabelas 2–4 (custos, SIRI, priorizações)
- [x] Compatibilidade dados importados (`benchmark` / `horizonte`)
- [x] Seção omitida se `MemoriaSIRI` vazia

---

## Fase 4 — Conclusão e Anexo A (cap. 5–6)

- [x] **5.** Conclusão narrativa (`relatorio-conclusao.ts`, `CONCLUSAO_TEMPLATE`)
- [x] **6.1** Ações por capacidade (Tabela 5)
- [x] **6.2** SWOT tabular interno/externo (Tabela 6)
- [x] **6.3** OKR + Metas SMART (Tabela 7)
- [x] **6.4** Plano de ação por KR (Tabela 8)

---

## Fase 5 — Visual, gráficos e impressão

- [x] Numeração sequencial de figuras
- [x] Gráficos Chart.js (global, estruturas, princípios, TEOR)
- [x] Impressão A4 com quebras por capítulo
- [x] Sumário navegável no overlay (`RelatorioSumarioNav`)
- [x] Logo i3 no rodapé (IST/FIESC)

---

## Fase 6 — Consolidação e entrega

- [x] Sumário imprimível no documento (`RelatorioSumarioDoc`, após a capa)
- [x] Numeração completa de tabelas (1–8: cap. 2, TEOR e anexo)
- [x] Envio por e-mail via SMTP (`relatorio-email.ts`, `POST /api/relatorio`)
- [x] Mensagem clara quando SMTP não está configurado

### Configuração SMTP (opcional)

Variáveis no ambiente do servidor (`docker-compose` / `.env`):

| Variável | Descrição |
|----------|-----------|
| `SMTP_HOST` | Servidor SMTP |
| `SMTP_PORT` | Porta (padrão `587`) |
| `SMTP_USER` / `SMTP_PASS` | Credenciais (se exigidas) |
| `SMTP_FROM` | Remetente (obrigatório) |
| `SMTP_SECURE` | `true` para TLS implícito (porta 465) |

Sem SMTP, o botão **Enviar por E-mail** informa que a funcionalidade depende da configuração; use **Imprimir → Salvar como PDF**.

---

## Arquitetura de arquivos

```
src/lib/relatorio/
  relatorio-textos.ts
  relatorio-templates.ts
  relatorio-types.ts
  relatorio-capacidade.ts
  relatorio-direcionamento.ts
  relatorio-teor.ts
  relatorio-conclusao.ts
  relatorio-anexo.ts
  relatorio-sumario.ts
  relatorio-email.ts
  parse-macro-dimensoes.ts

src/components/tabs/relatorio/
  RelatorioGraficos.tsx
  RelatorioSumarioNav.tsx      # overlay
  RelatorioSumarioDoc.tsx      # documento / impressão

src/lib/relatorio-service.ts
src/components/tabs/RelatorioTab.tsx
src/app/api/relatorio/route.ts
```

---

## Critérios de aceite (paridade PDF)

- [x] Capítulos 1–6 com textos padrão e dados dinâmicos
- [x] TEOR condicional (Memória SIRI)
- [x] Conclusão + Anexo A formatados
- [x] Impressão A4 com sumário e quebras por capítulo
- [x] Gráficos e tabelas numeradas
- [x] Notificação por e-mail (com SMTP configurado)

---

## Comandos

```bash
cd i3
npm install                    # inclui nodemailer
docker compose up --build -d   # ou docker restart i3-app
npm run reimport:macro:docker  # após alteração de schema MacroDimensao
```

---

## Referências

| Recurso | Caminho |
|---------|---------|
| Visualizador | `src/components/tabs/RelatorioTab.tsx` |
| API relatório | `src/app/api/relatorio/route.ts` |
| E-mail | `src/lib/relatorio/relatorio-email.ts` |
| Estilos | `src/app/globals.css` (`.i3-print-relatorio`) |
