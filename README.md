# Toolkit — apps Rust para console Linux (TUI + framebuffer)

Este diretório é o **kit de desenvolvimento** para criar aplicações Rust que
rodam em terminal Linux (TUI) e em console local via framebuffer (`/dev/fb0`).
Ele não é um app: é a skill, o plugin e os comandos que ensinam o agente a
construir e validar esse tipo de aplicação.

## Requisitos

- **opencode** 1.19+ (testado com 1.19.3) e Git.
- **Rust stable** com `cargo` (MSRV 1.88) para compilar os apps gerados.
- **Linux** para rodar os apps. Para o backend framebuffer: VT de texto local
  (`tty` = `/dev/ttyN`), `/dev/fb0` e usuário no grupo `video`.
- Opcional: `gh` (GitHub CLI) para releases, `strace` e `python3` para o
  diagnóstico de console.

## Instalação

### Opção A — usar o kit como workspace (recomendada)

Clone o repositório e abra o opencode na pasta do kit:

```bash
git clone git@github.com:danielexpe/rust-console-app-toolkit.git
cd rust-console-app-toolkit
opencode
```

Na primeira inicialização o opencode instala a dependência do plugin
(`@opencode-ai/plugin`) dentro de `.opencode/`. Se a instalação automática não
rodar, faça manualmente:

```bash
cd .opencode && npm install && cd ..
```

Crie os apps como diretórios irmãos do kit, por exemplo
`/new-app ../meu-app`. O kit permanece limpo e pode ser atualizado com
`git pull`.

### Opção B — adicionar o kit a um projeto existente

Copie a skill, o plugin, os comandos e o framework para a raiz do projeto:

```bash
KIT=/caminho/para/rust-console-app-toolkit
mkdir -p .opencode
cp -r "$KIT/.opencode/skills" "$KIT/.opencode/plugins" "$KIT/.opencode/command" .opencode/
cp "$KIT/.opencode/package.json" "$KIT/.opencode/.gitignore" .opencode/
cp "$KIT/opencode.json" .
cp "$KIT/framework_app_rust_console_linux_TUI_framebuffer.md" .
```

Reinicie o opencode dentro do projeto. O plugin, a skill e os comandos passam a
valer apenas naquele projeto.

> Depois de instalar ou atualizar o kit, **reinicie o opencode** para carregar
> plugin, skill e comandos. Configuração não é recarregada a quente.

## Uso rápido

Com o opencode aberto na pasta do kit:

1. Crie um app novo:

   ```text
   /new-app <descrição curta do app>
   ```

   O comando pergunta o essencial, cria o esqueleto com
   `scaffold_console_app` e preenche `docs/01`–`08` e `AGENTS.md`.

2. Implemente por fases:

   ```text
   /phase 1 — fundação com domínio puro e placeholder TUI
   ```

3. Rode os portões:

   ```text
   /gates caminho/do/app
   ```

4. Diagnostique o console no VT afetado:

   ```text
   /diagnose-fb
   ```

5. Prepare o release:

   ```text
   /release
   ```

Depois de gerado, compile e rode o app:

```bash
cd ../meu-app
cargo run                        # TUI (backend auto)
cargo run -- --backend fb        # console, em VT local
```

Para instalar o app gerado:

```bash
./install.sh --prefix "$HOME/.local"
# ou, no sistema (pede sudo e adiciona o usuário ao grupo video):
./install.sh --prefix /usr/local
```

Para atualizar o kit:

```bash
cd rust-console-app-toolkit
git pull
# reinicie o opencode
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
