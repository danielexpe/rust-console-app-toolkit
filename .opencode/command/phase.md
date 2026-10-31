---
description: Implementa uma fase do roadmap de um app Rust console Linux (TUI + framebuffer)
---

Implemente somente a fase e o escopo abaixo. Não amplie o escopo.

<fase>
$ARGUMENTS
</fase>

Procedimento:

1. Leia o `AGENTS.md` do app alvo, `git status --short --branch` e os docs
   relevantes (`docs/06-roadmap.md` e o doc da área).
2. Carregue a skill `rust-console-tui-framebuffer` e a referência da área
   (`architecture.md`, `fbdev.md`, `testing-gates.md` ou
   `release-packaging.md`).
3. Antes de editar, liste os arquivos que pretende tocar e um plano curto.
4. Respeite as decisões congeladas; não reabra nada sem pedido. Se precisar
   mudar uma decisão, registre um ADR em `docs/07-decisions-and-risks.md`.
5. Implemente com testes. Mantenha `core/` puro, `unsafe` só em `platform/` e a
   restauração de terminal/console em todos os caminhos.
6. Rode `run_quality_gates` (ou os portões manualmente) e corrija falhas.
7. Atualize `docs/` e `AGENTS.md` com status, pendências e o que foi validado.
   Não invente validação manual: marque como pendente.
8. Não faça commit, push, tag ou release sem pedido explícito.

No final, entregue: o que foi feito, arquivos alterados, saída dos portões,
pendências e próximo passo.
