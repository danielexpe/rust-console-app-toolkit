# Empacotamento e release

## 1. Sequência

1. Congelar escopo e atualizar versão (`Cargo.toml` + `Cargo.lock`).
2. Rodar todos os portões (com e sem features).
3. Regenerar snapshots e revisar (mudança de versão afeta rodapé).
4. Validar manualmente o máximo possível; registrar pendências.
5. `cargo build --release`.
6. Montar a pasta do pacote: binário, README, licenças, notas, créditos,
   licenças de fontes, `install.sh` e `testes_debug.sh`.
7. `tar.gz` + `.sha256`.
8. Smoke test **fora do projeto** (`/tmp`), sem assets; testar o `install.sh`
   com `PREFIX=/tmp/... SKIP_GROUP=1`.
9. Tag e release com notas + artefatos, incluindo os dois scripts como assets
   separados.
10. Registrar hash e URL no `AGENTS.md`.

## 2. Regras

- `dist/` e `*.tar.gz` no `.gitignore`; não versionar binários.
- Notas de release **não** devem conter o hash do próprio pacote (referência
  circular: o hash muda ao alterar as notas). Coloque o hash no checklist e no
  `AGENTS.md`/página da release.
- Valide o `.sha256` no diretório do pacote.
- Releases públicas: licença e créditos devem viajar junto.
- Nunca publique um pacote cujo binário não foi testado copiado sozinho.

## 3. Instalador (`install.sh`)

Requisitos:

- Instalar binário em `/usr/local/bin` e documentos em
  `/usr/local/share/<APP>`; aceitar `--prefix` e `PREFIX=...`.
- Adicionar o usuário que executou o script ao grupo `video` (criar o grupo se
  faltar) e avisar que é preciso sair/entrar ou usar `newgrp video`.
- Usar `sudo` interativo quando necessário; **nunca** rodar o app como root
  para "resolver" permissão.
- Aceitar o `.tar.gz` como argumento, encontrar um pacote adjacente ou usar o
  diretório já extraído; validar o `.sha256` quando disponível.
- Restaurar nada no sistema além dos arquivos instalados e do grupo.
- Oferecer `--skip-group` para testes/CI; testar com prefixo temporário.
- Incluir `testes_debug.sh` no pacote e como asset separado.

## 4. Checklist de release

```markdown
## Funcional
- [ ] fluxo principal completo em todos os modos
- [ ] idiomas, som, atalhos e pausa
- [ ] captura determinística
- [ ] binário funciona copiado, sem assets

## Qualidade
- [ ] fmt / clippy / clippy no-default / test / assets --check
- [ ] build release com e sem features
- [ ] snapshots revisados
- [ ] MSRV verificada (se possível)

## Manual
- [ ] terminal(is) principais
- [ ] console: resolução e bpp alvo
- [ ] console em VT de texto real (tty = /dev/ttyN), não pts/Wayland/SSH
- [ ] fb0/blank chega a 0 e a primeira tela aparece sem Ctrl+C
- [ ] yoffset/yres_virtual/ypanstep/smem_len registrados
- [ ] fallback sem pan e com pan não honrado
- [ ] restauração: menu, Ctrl+C, SIGTERM, pânico
- [ ] redimensionar / trocar resolução
- [ ] áudio ou silêncio sem dispositivo
- [ ] diagnósticos (testes_debug.txt) anexados quando houver bug de hardware

## Release
- [ ] versão e lock atualizados
- [ ] pacote + sha256
- [ ] install.sh + testes_debug.sh no pacote e como assets
- [ ] smoke em /tmp
- [ ] instalação testada com prefixo temporário e com sudo/grupo video
- [ ] tag + release com notas e artefatos
- [ ] hash e URL no AGENTS.md
```
