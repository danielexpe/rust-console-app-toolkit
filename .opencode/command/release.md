---
description: Prepara e valida o release de um app Rust console Linux (TUI + framebuffer)
---

Prepare o release do app no diretório atual. Contexto adicional:

<contexto>
$ARGUMENTS
</contexto>

Siga `references/release-packaging.md` e `references/testing-gates.md`:

1. Leia `AGENTS.md`, `docs/06-roadmap.md` e o checklist de release existente.
2. Confirme a versão em `Cargo.toml`/`Cargo.lock` e congele o escopo.
3. Rode `run_quality_gates` com e sem features; exigir tudo verde.
4. Regenere snapshots se a versão aparecer na UI; revise o diff.
5. Verifique licenças (`LICENSE`, `LICENSE-ART`, `THIRD_PARTY_NOTICES.md`,
   licenças de fontes) e créditos.
6. Gere `cargo build --release` e monte o pacote com binário, README,
   licenças, notas, `install.sh` e `testes_debug.sh`.
7. Crie `tar.gz` + `.sha256` em `dist/` (fora do Git) e faça smoke test em
   `/tmp`, sem a pasta de assets.
8. Teste `install.sh` com `PREFIX=/tmp/... SKIP_GROUP=1`.
9. Registre no `AGENTS.md`: versão, hash do pacote, URL da release, o que foi
   validado e o que ficou pendente.
10. Não crie tag, release, commit ou push sem pedido explícito do usuário.
    Notas de release não devem conter o hash do próprio pacote.

Entregue um checklist final com [x] para o que foi executado e [ ] para o que
ficou pendente, sem inventar validação.
