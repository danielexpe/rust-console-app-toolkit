# Processo de trabalho com IA

## 1. Fases

| Fase | Objetivo | Critério de saída |
| --- | --- | --- |
| 0 — Descoberta | escopo, regras, telas, hardware, licenças | specs aprovadas em escopo |
| 1 — Fundação | crate, núcleo puro, i18n, guards, CLI | testes de domínio + TUI placeholder |
| 2 — TUI funcional | fluxo principal completo | fluxo completo + snapshots |
| 3 — Lógica rica | regras/IA avançadas, determinismo | invariantes e seed |
| 4 — Arte/som/i18n | assets, pipeline, áudio, acessibilidade | tier de imagem + áudio |
| 5 — Release desktop | licenças, docs, medições, pacote | release vX.0 validado |
| 6 — Framebuffer | fbdev, texto, scaling, sinais | console validado + pacote |
| 7 — Backlog | DRM/KMS, persistência, temas | priorizado pelo usuário |

## 2. Regras para o agente

- Ler `AGENTS.md` e `git status` antes de agir.
- Não reimplementar fases concluídas.
- Não reabrir decisões congeladas sem pedido; proponha ADR.
- Não adicionar dependência/rede sem aprovação explícita.
- Não fazer commit, push, amend ou PR sem pedido explícito.
- Não configurar remote sem pedido.
- Manter `unsafe` isolado e comentado.
- Testar antes de declarar concluído; rodar portões.
- Não inventar validação manual; marcar pendente.
- Preservar terminal/console em qualquer saída.
- Atualizar `AGENTS.md` ao final de tarefas relevantes.
- Código/identificadores em inglês; UI nos idiomas do produto.
- Sem comentários desnecessários; siga o estilo existente.
- Diante de hardware/permissões indisponíveis, registrar bloqueio e seguir com
  o que for testável sem hardware.

## 3. Ordem de trabalho recomendada

1. Especificar antes de codar; validar escopo com o usuário.
2. Fundação e domínio puro com testes.
3. TUI funcional sem arte final.
4. Conteúdo/lógica avançada.
5. Arte, som, i18n e acessibilidade.
6. Fechar release desktop.
7. Só então framebuffer.
8. Validar em hardware real, incluindo uma segunda máquina/driver quando
   possível; se a tela falhar, rodar `testes_debug.sh` no VT antes de mudar o
   código.
9. Empacotar com `install.sh` e `testes_debug.sh`; publicar.

## 4. AGENTS.md do app

Todo app deve ter um índice e uma memória persistente:

```text
README.md                       # visão do usuário, instalação, controles
docs/01-<produto>.md            # regras, fluxos, aceite
docs/02-technical-spec.md       # arquitetura, crates, CLI, desempenho
docs/03-visual-design.md        # paleta, tipografia, layout
docs/04-assets-and-licenses.md  # pipeline, manifesto, licenças
docs/05-test-plan.md            # testes e matriz manual
docs/06-roadmap.md              # fases e critérios de saída
docs/07-decisions-and-risks.md  # ADRs, premissas, questões
docs/08-i18n-catalog.md         # strings e limites
AGENTS.md                       # estado operacional para IA
```

`AGENTS.md` deve conter:

1. Retomada rápida (ler arquivo, `git status`, docs).
2. Status atual (tabela por fase/item).
3. Resumo do produto.
4. Decisões congeladas (não reabrir sem o usuário).
5. Fontes de verdade (docs).
6. Pendências e questões abertas com prazo.
7. Comandos e portões.
8. Regras de trabalho do agente.
9. Protocolo de atualização do próprio arquivo.
10. Registro de atividades (data, resumo, arquivos, commits).
11. Fases.
12. Notas para a próxima sessão.

Regras: conciso, sem segredos, atualizar ao final da tarefa, registrar
bloqueios em vez de inventar progresso, registrar hash de commits e releases.

## 5. ADR

```markdown
### D-0NN — Título curto

- **Status:** proposta | aceita | adiada | substituída.
- **Contexto:** o problema e as forças em jogo.
- **Decisão:** o que será feito.
- **Consequências:** custos, riscos e o que fica fora.
```

## 6. Prompt para gerar especificações

```text
Você é o arquiteto de um novo projeto Rust para console Linux com TUI e
framebuffer. Use a skill rust-console-tui-framebuffer e o framework.md como
template obrigatório.

Produto: <descreva o app, público, fluxos e telas>.
Hardware alvo: <resolução, bpp, GPU/driver, console local>.
Restrições: <licenças, offline, acessibilidade, idiomas, prazo>.

Gere:
1. README.md com visão do usuário e índice.
2. docs/01 a docs/08 seguindo o template, com decisões explícitas.
3. AGENTS.md com estado inicial, decisões congeladas e protocolo.
4. Roadmap por fases com critérios de saída verificáveis.
5. Perguntas abertas apenas onde houver risco real; proponha defaults.

Não implemente código nesta etapa. Aponte conflitos e lacunas.
```

## 7. Prompt para implementar uma fase

```text
Leia AGENTS.md, git status e os docs relevantes. Implemente somente a Fase <N>
com escopo <...>. Respeite as decisões congeladas e o template de arquitetura.

Antes de editar: liste arquivos e plano curto.
Depois: rode fmt, clippy (com e sem features), testes e assets --check.
Atualize docs e AGENTS.md. Não faça commit/push sem pedido.
Se faltar hardware/permissão, registre o bloqueio e valide o que for possível
sem ele.
```

## 8. Prompt de validação final

```text
Revise o repositório como se fosse um release iminente. Verifique:
- portões automatizados e MSRV;
- restauração em saída normal, erro, pânico, Ctrl+C e SIGTERM;
- console: permissões, VT, KD_TEXT, cursor, frame completo;
- formatos 24/16 bpp e resoluções alternativas (ou marque pendente);
- snapshots, licenças, notices e docs sem drift;
- pacote em /tmp sem assets e checksum.
Entregue uma lista objetiva de bloqueios e pendências, sem inventar validação.
```
