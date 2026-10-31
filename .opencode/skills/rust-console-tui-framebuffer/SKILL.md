---
name: rust-console-tui-framebuffer
description: Use when creating, implementing, testing, packaging or debugging a Rust application for the Linux console with a TUI (ratatui/crossterm) and a fbdev framebuffer backend (/dev/fb0) — games, calculators, audio players, visualizers, utilities. Trigger on "novo app Rust console", "TUI + framebuffer", framework.md, AGENTS.md, fbdev, KD_GRAPHICS, FBIOBLANK, FBIOPAN_DISPLAY, ypan, testes_debug.sh, install.sh, cargo xtask assets, TUI snapshot tests.
license: MIT
---

# Aplicações Rust para console Linux (TUI + framebuffer)

Este kit codifica o que funcionou em apps reais entregues e validados em VT
local. A fonte de verdade completa é
`framework_app_rust_console_linux_TUI_framebuffer.md`, na raiz do projeto.

## Quando usar

Use esta skill para qualquer app Rust que precise de **uma lógica de domínio
pura** e **duas saídas** que compartilham o mesmo estado: `ratatui`/`crossterm`
no terminal e fbdev em `/dev/fb0`. Também vale para partes isoladas: renderer
fb, guardas de TTY, áudio ALSA dinâmico, captura PNG de QA, pipeline de assets,
snapshots, instalador e diagnóstico de console.

## Regra de ouro

```text
core/ (puro) <- state/ <- app/ -> render/{scene,tui,fb} -> platform/fb
                         \-> audio/, assets/, i18n/, capture/
```

- `core/` não conhece `ratatui`, `crossterm`, `libc`, framebuffer, áudio nem
  assets.
- `state/` modela a sessão e as transições; pode depender de `core/`.
- `app/` é o único que chama backend, áudio e relógio.
- `render/tui.rs` pode depender de `ratatui`; `render/fb.rs` de `tiny-skia`,
  `fontdue` e assets; `render/scene.rs` e `render/text.rs` são compartilhados.
- `platform/` é o **único** lugar com `unsafe` de sistema (ioctls, `mmap`,
  `termios`, sinais), sempre com comentário `// SAFETY:`.
- Os backends apenas desenham e capturam eventos. Nenhum módulo de domínio
  imprime logs na tela.

## Fluxo obrigatório

1. **Fase 0 — especificar e congelar.** Preencha `docs/01`–`08` e `AGENTS.md`
   antes de codar. Use `/new-app` ou o template de scaffold.
2. **Fase 1 — fundação.** Crate, domínio puro com testes, i18n, guards de TTY,
   CLI e placeholder TUI.
3. **Fase 2 — TUI funcional.** Fluxo principal completo + snapshots.
4. **Fase 3 — lógica rica.** Regras/IA, determinismo (`--seed`), invariantes.
5. **Fase 4 — arte, som, i18n e acessibilidade.** Pipeline `xtask`, áudio
   sintetizado, fallbacks de imagem.
6. **Fase 5 — release desktop.** Licenças, docs, medições, pacote `.tar.gz`.
7. **Fase 6 — framebuffer.** fbdev, texto, scaling, sinais, validação em VT.
8. **Fase 7 — backlog.** DRM/KMS, persistência, temas.

Não pule a Fase 0. Não declare uma fase concluída sem rodar os portões e sem
registrar em `AGENTS.md` o que foi validado e o que ficou pendente.

## Não negociáveis

- Conservador por padrão: `--backend auto` usa **TUI**; framebuffer é sempre
  explícito (`--backend fb`). Nunca auto-detecte fbdev.
- Restaure terminal/console em saída normal, erro, `Ctrl+C`, SIGTERM/SIGHUP e
  pânico. Use RAII, panic hook e flag atômica de sinal.
- Após `KD_GRAPHICS`, chame `FBIOBLANK(FB_BLANK_UNBLANK)` (falha não é fatal).
  Sem isso, um console que chega blanked/DPMS off desenha invisível.
- Nunca assuma `yoffset == 0`. Valide `line_length`, `smem_len`,
  `yres_virtual`, `ypanstep`; use o `yoffset` real para escolher o buffer.
- `unsafe` só em `platform/`, com `// SAFETY:` e testes de ABI (160/80 bytes).
- Determinismo: RNG próprio com `--seed`; timers via `Instant`, sem `sleep` no
  domínio.
- Assets embutidos com `include_bytes!`; cache de decode/glifos/fundo; nada de
  rede em runtime.
- Nunca imprima logs na tela. Erros vão para stderr ou diário.
- Código/identificadores em inglês; UI nos idiomas do produto (pt-BR padrão).
- Sem comentários desnecessários; siga o estilo do projeto.
- Não adicione dependência, commit, push, tag ou release sem pedido explícito.

## Portões mínimos

```bash
cargo fmt --check
cargo clippy --workspace --all-targets -- -D warnings
cargo clippy --workspace --all-targets --no-default-features -- -D warnings
cargo test
cargo test --no-default-features
cargo xtask assets --check     # se houver xtask
cargo build --release
cargo build --release --no-default-features
```

Use a ferramenta `run_quality_gates` do plugin para rodar isso de uma vez.
`cargo test` deve passar sem `/dev/fb0`; validação em hardware é manual e
precisa ser registrada como executada ou pendente.

## Ferramentas deste kit

- `scaffold_console_app` — gera docs, `AGENTS.md`, `Cargo.toml`, scripts e
  estrutura inicial a partir dos templates.
- `run_quality_gates` — roda os portões e devolve um resumo por comando.
- `framebuffer_report` — coleta VT, fbdev, blank, DRM e permissões; grava
  `testes_debug.txt` para anexar a um bug de hardware.
- Comandos: `/new-app`, `/phase`, `/gates`, `/diagnose-fb`, `/release`, `/adr`.

## Referências (leia conforme a tarefa)

| Arquivo | Conteúdo |
| --- | --- |
| `references/architecture.md` | Camadas, módulos, CLI, loop, render, stack, i18n, áudio, assets |
| `references/fbdev.md` | Abertura, formatos, pan, console, guardas, sinais, diagnóstico |
| `references/testing-gates.md` | Pirâmide de testes, testes de fb sem hardware, matriz manual, DoD |
| `references/release-packaging.md` | Empacotamento, `install.sh`, notas, smoke test |
| `references/anti-patterns.md` | Lições de campo e erros que custaram tempo |
| `references/workflow.md` | Fases, regras do agente, `AGENTS.md`, ADRs, prompts |

Em conflito: primeiro `AGENTS.md` do app para **estado operacional**; depois
`docs/` para **especificação**; depois esta skill para **forma**.
