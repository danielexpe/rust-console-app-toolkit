---
description: Especifica e cria o esqueleto de um novo app Rust para console Linux (TUI + framebuffer)
---

Você vai iniciar um novo app Rust para console Linux com TUI e backend fbdev.
Contexto do usuário:

<contexto>
$ARGUMENTS
</contexto>

Antes de qualquer código:

1. Carregue a skill `rust-console-tui-framebuffer` e leia
   `references/workflow.md` e `references/architecture.md`.
2. Faça apenas as perguntas de produto que mudam a arquitetura: telas e fluxo
   principal, regras de domínio, idiomas, áudio, imagens, persistência,
   licenças e hardware alvo (`/dev/fb0`, resolução, bpp, driver, VT).
   Proponha defaults quando a resposta não for crítica.
3. Com o escopo confirmado, use a ferramenta `scaffold_console_app` para criar
   o projeto no diretório escolhido:
   - `target`: diretório do novo app
   - `name`: nome de exibição
   - `bin`: nome do crate/binário (slug)
   - `description`: uma linha
   - `audio`: conforme o produto
4. Preencha `docs/01`–`08`, `README.md` e `AGENTS.md` do app com as decisões
   congeladas. Substitua todos os `[PREENCHER]`.
5. Registre as decisões estruturais em `docs/07-decisions-and-risks.md`.
6. Não implemente código de produção nesta etapa. Se algo for ambíguo,
   pergunte; se for conflito, aponte e proponha uma decisão.

Ao terminar, mostre: diretório criado, decisões congeladas, questões abertas e
o próximo passo (Fase 1). Não faça commit nem push.
