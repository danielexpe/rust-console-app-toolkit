---
description: Roda os portões automatizados de um app Rust console Linux
---

Rode os portões de qualidade no diretório informado (padrão: diretório atual).

<diretorio>
$ARGUMENTS
</diretorio>

1. Se o diretório estiver vazio, use `.`.
2. Chame a ferramenta `run_quality_gates` com `path` igual ao diretório e
   `quick=false`.
3. Apresente o resumo por portão (PASS/FAIL) e, se houver falhas, os trechos
   relevantes da saída.
4. Não corrija nada automaticamente sem pedir; apenas relacione as falhas e o
   próximo passo.
5. Lembre no final que validação em hardware (TUI/fb) é manual e deve ser
   registrada no `AGENTS.md` como executada ou pendente.
