# Toolkit — apps Rust para console Linux (TUI + framebuffer)

Este diretório é o **kit de desenvolvimento** para criar aplicações Rust que
rodam em terminal Linux (TUI) e em console local via framebuffer (`/dev/fb0`).
Ele não é um app: é a skill, o plugin e os comandos que ensinam o agente a
construir e validar esse tipo de aplicação.

## Como usar

1. Reinicie o opencode para carregar o plugin, a skill e os comandos.
2. Crie um app novo:

   ```text
   /new-app <descrição curta do app>
   ```

   O comando pergunta o essencial, cria o esqueleto com
   `scaffold_console_app` e preenche `docs/01`–`08` e `AGENTS.md`.

3. Implemente por fases:

   ```text
   /phase 1 — fundação com domínio puro e placeholder TUI
   ```

4. Rode os portões:

   ```text
   /gates caminho/do/app
   ```

5. Diagnostique o console no VT afetado:

   ```text
   /diagnose-fb
   ```

6. Prepare o release:

   ```text
   /release
   ```

## O que está aqui

| Caminho | Papel |
| --- | --- |
| `framework_app_rust_console_linux_TUI_framebuffer.md` | Fonte de verdade arquitetural e de processo |
| `.opencode/skills/rust-console-tui-framebuffer/` | Skill + referências + templates de scaffold |
| `.opencode/plugins/console-app.ts` | Ferramentas `scaffold_console_app`, `run_quality_gates`, `framebuffer_report` |
| `.opencode/command/` | Comandos `/new-app`, `/phase`, `/gates`, `/diagnose-fb`, `/release`, `/adr` |
| `.opencode/package.json` | Dependência do plugin (`@opencode-ai/plugin`) |
| `AGENTS.md` | Memória operacional do próprio kit |

## Ferramentas do plugin

- `scaffold_console_app` — gera README, `AGENTS.md`, docs, `Cargo.toml`,
  `src/main.rs`, `install.sh`, `testes_debug.sh`, `xtask` e diretórios de
  assets/testes.
- `run_quality_gates` — fmt, clippy (com/sem features), testes, assets
  `--check` e builds release.
- `framebuffer_report` — diagnóstico read-only de VT, fbdev, blank, DRM e
  permissões; pode gravar `testes_debug.txt`.

## Aprendizado incorporado

O kit destila padrões observados em apps reais do mesmo workspace
(`tic_tac_toe`, `calculadora`, `audio_player`, `mouse`): camadas `core/`,
`state/`, `app`, `render/`, `platform/`; estado único com dois backends; CLI
com `--backend auto|tui|fb`; guardas de TTY e console; `KD_GRAPHICS` +
`FBIOBLANK`; pan/`yoffset` com fallback; texto com `fontdue`; áudio ALSA
dinâmico; captura PNG determinística; snapshots; `install.sh` e
`testes_debug.sh`; e as lições de fbdev documentadas em
`references/anti-patterns.md`.

## Manutenção

- Ao aprender uma lição nova em um app real, atualize a skill e, se for
  estrutural, o framework.
- Templates de scaffold devem continuar compilando com a MSRV declarada:
  `cargo fmt --check`, `cargo clippy -- -D warnings` e `cargo test`.
- Scripts devem passar em `bash -n`.
- Depois de alterar o plugin, a skill ou os comandos, reinicie o opencode.
