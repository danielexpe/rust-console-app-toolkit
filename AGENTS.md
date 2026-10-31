# AGENTS.md — Toolkit de aplicações Rust para console Linux

> Este repositório não é um app: é o **kit de desenvolvimento** (skill + plugin +
> comandos) para criar apps Rust que rodam em terminal Linux (TUI) e em console
> via framebuffer (`/dev/fb0`).
>
> Leia este arquivo antes de alterar o kit. Para trabalhar **em um app**, leia o
> `AGENTS.md` daquele app — não este.

## 1. O que existe aqui

| Caminho | Papel |
| --- | --- |
| `framework_app_rust_console_linux_TUI_framebuffer.md` | Fonte de verdade arquitetural e de processo |
| `.opencode/skills/rust-console-tui-framebuffer/` | Skill que ensina o agente a construir esse tipo de app |
| `.opencode/skills/.../references/` | Referências detalhadas (arquitetura, fbdev, testes, release) |
| `.opencode/skills/.../assets/scaffold/` | Templates usados para gerar um projeto novo |
| `.opencode/plugins/console-app.ts` | Plugin com ferramentas de scaffold, gates e diagnóstico |
| `.opencode/command/` | Comandos `/new-app`, `/phase`, `/gates`, `/diagnose-fb`, `/release`, `/adr` |
| `opencode.json` | Config do projeto (instruções; plugin/skill/comandos são auto-descobertos) |

O plugin, a skill e os comandos são carregados quando o opencode inicia. Depois
de editar qualquer um deles, **saia e reinicie o opencode**.

## 2. Ferramentas do plugin

- `scaffold_console_app` — cria um projeto novo a partir dos templates
  (docs, AGENTS, README, `Cargo.toml`, `install.sh`, `testes_debug.sh`).
- `run_quality_gates` — roda fmt/clippy/test/assets/build com e sem features.
- `framebuffer_report` — coleta diagnóstico read-only de fbdev/VT/blank e grava
  um relatório reproduzível.

## 3. Comandos

| Comando | Uso |
| --- | --- |
| `/new-app <descrição>` | Especificar e criar o esqueleto de um app |
| `/phase <N e escopo>` | Implementar uma fase do roadmap |
| `/gates [caminho]` | Rodar os portões automatizados |
| `/diagnose-fb [caminho]` | Diagnosticar framebuffer no VT afetado |
| `/release` | Checklist de release e empacotamento |
| `/adr <título>` | Registrar uma decisão de arquitetura |

## 4. Como um agente deve trabalhar

1. Se a tarefa é criar/alterar um app, carregue a skill
   `rust-console-tui-framebuffer` e siga as referências dela.
2. Leia o `AGENTS.md` **do app alvo** e rode `git status` antes de editar.
3. Especifique antes de codar; não reabra decisões congeladas sem o usuário.
4. Respeite a separação: `core/` puro, `state/` de sessão, `app` orquestra,
   `render/` desenha, `platform/` isola `unsafe` e ioctls.
5. Nunca declare validação manual que não foi executada; marque como pendente.
6. Rode os portões antes de dizer que terminou.
7. Não faça commit, push, tag ou release sem pedido explícito.

## 5. Manutenção do kit

- Mantenha a skill e o `framework_*.md` coerentes. Se uma lição nova for
  aprendida em um app real, atualize a skill e, se for estrutural, o framework.
- Templates de scaffold devem continuar compilando com a MSRV declarada.
- Scripts em `assets/scaffold/` devem passar em `bash -n`.
- Não coloque segredos nem caminhos absolutos do usuário no kit.
- O plugin deve funcionar offline depois que as dependências estiverem
  instaladas; não adicione chamadas de rede em runtime.

## 6. Portões do próprio kit

```bash
python3 -m json.tool opencode.json >/dev/null
python3 -m json.tool .opencode/package.json >/dev/null
bash -n .opencode/skills/rust-console-tui-framebuffer/assets/scaffold/install.sh.template
bash -n .opencode/skills/rust-console-tui-framebuffer/assets/scaffold/testes_debug.sh.template
```
