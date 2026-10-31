---
description: Registra uma decisão de arquitetura (ADR) no app atual
---

Registre um ADR para a decisão abaixo.

<decisao>
$ARGUMENTS
</decisao>

1. Leia `docs/07-decisions-and-risks.md` e verifique se já existe uma decisão
   relacionada. Se existir, proponha substituir/estender em vez de duplicar.
2. Use o formato:

```markdown
### D-0NN — Título curto

- **Status:** proposta | aceita | adiada | substituída.
- **Contexto:** o problema e as forças em jogo.
- **Decisão:** o que será feito.
- **Consequências:** custos, riscos e o que fica fora.
```

3. Numere de forma sequencial, acrescente ao documento e atualize a seção de
   decisões congeladas do `AGENTS.md` se a decisão for aceita.
4. Não implemente a decisão sem pedido explícito.
