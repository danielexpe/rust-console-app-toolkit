# Testes, qualidade e Definition of Done

## 1. Pirâmide

1. **Unitários de domínio** — regras, modelos, transições, RNG, placar.
2. **Propriedades/invariantes** — estados impossíveis, somas, simetria,
   invariantes de jogo/IA, limites.
3. **Snapshots de TUI** — texto por tela/idioma/breakpoint.
4. **Integração/PTY** — entrada real, resize, saída limpa.
5. **Sem hardware** — formatos, ABI, conversão, geometria, blend, telas.
6. **Manual em hardware** — TUI em terminais reais e fb no VT.

## 2. Testes específicos do framebuffer (sem `/dev/fb0`)

- Parse de formato 32/24/16 e rejeição de desconhecidos.
- Tamanho das structs ABI (160/80).
- Empacotamento de pixels e escrita de linha (incluindo padding).
- Geometria 70% e offsets em 1080p/1440p/768p.
- Blending com alpha 0, opaco e parcial; escala 1:1 e fracionária.
- Renderização das telas gera frame do tamanho esperado e não vazio.
- Captura determinística 1344 × 756 (arte + texto).
- Erro de permissão/console com mensagem e código 3.
- Função pura de escolha do buffer: `current == 0 -> yres`;
  `current == yres -> 0`; `current inesperado -> 0`.
- Validação de `yoffset > yres_virtual - yres`, stride menor que a linha,
  `smem_len` insuficiente e geometria virtual inconsistente.
- Plano de mapeamento: sem ypan usa `(yoffset + yres)` linhas; com ypan cobre
  os dois buffers e o visível usado no fallback.
- Pan com memória só para um buffer deve ser desabilitado, não fatal.

## 3. Portões automatizados

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

Adicione, se possível, `cargo test --release` e verificação de MSRV. Use
`run_quality_gates` para rodar a sequência e receber um resumo.

## 4. Snapshots de TUI

- Prefira comparador próprio (texto) a dependência extra.
- `UPDATE_SNAPSHOTS=1 cargo test` regenera; revise o diff antes de commitar.
- A versão da aplicação no rodapé muda snapshots a cada release — esperado.
- Cubra telas, idiomas, breakpoints e estados de erro.

## 5. Matriz manual mínima

- TUI: terminais principais, 80 × 24 e Wide.
- fb: 1920 × 1080 em 32 bpp; 24/16 bpp se houver hardware/VM.
- Fluxos completos em todos os modos.
- Redimensionar (TUI) e resoluções alternativas (fb).
- Idiomas, som, pausa, reinício, saída.
- Restauração: menu, `Ctrl+C`, SIGTERM, pânico.
- Troca de VT; registrar limitações.
- Nenhum resíduo visual ou cursor piscando.
- Rodar em **VT de texto real**: `tty` = `/dev/ttyN`, não `/dev/pts/N`; não
  usar Wayland, terminal gráfico ou SSH.
- Verificar `/sys/class/graphics/fb0/blank` antes do app e confirmar que chega
  a `0` após o startup; a primeira tela deve aparecer **sem `Ctrl+C`**.
- Testar com o console previamente blanked/DPMS off.
- Coletar driver, `virtual_size`, bpp, `stride`, `yoffset`, `yres_virtual`,
  `ypanstep`, `line_length`, `smem_len` e `strace -e ioctl` no hardware
  afetado.
- Se possível, validar em uma segunda máquina/driver; se não, registrar
  explicitamente como pendente.
- Testar o instalador em prefixo temporário
  (`PREFIX=/tmp/... SKIP_GROUP=1`) e o fluxo real com `sudo`/grupo `video`.

**Não declare validado o que não foi executado.** Marque como pendente.

## 6. Desempenho e orçamentos

| Métrica | Alvo sugerido |
| --- | --- |
| Startup até primeira tela | < 400 ms |
| Frame de animação (fb 1080p) | ≤ 16 ms |
| Frame ocioso | ≤ 33 ms, ~10 FPS |
| RSS | < 120 MB |
| CPU ocioso | < 2% |
| Binário release | < 15 MB |
| Assets embutidos | orçamento explícito (ex.: < 8 MB) |
| Latência de resposta a tecla | < 50 ms |
| Captura de frame | determinística e < 1 s |

Meça em release, na máquina alvo. Registre números e desvios nos docs.

## 7. Definition of Done

- [ ] Escopo da fase atendido e decisões registradas.
- [ ] Domínio puro com testes; invariantes cobertas.
- [ ] TUI completa e snapshots aprovados.
- [ ] Framebuffer (quando na fase): 32 bpp validado no console; 24/16 bpp
      validados ou explicitamente pendentes.
- [ ] Primeira tela aparece sem `Ctrl+C` em VT de texto real, inclusive com
      console previamente blanked/DPMS off.
- [ ] `yoffset`, `smem_len`, ypan e fallback validados/testados.
- [ ] Restauração validada em saída normal; `Ctrl+C`/SIGTERM/pânico testados ou
      registrados como pendentes.
- [ ] `testes_debug.sh` disponível e `install.sh` testado.
- [ ] Portões verdes com e sem features; builds release.
- [ ] Assets/manifesto/licenças/notices consistentes.
- [ ] README e docs atualizados; sem drift.
- [ ] `AGENTS.md` atualizado com status, pendências e próximos passos.
- [ ] Pacote `tar.gz` + `.sha256` e smoke em `/tmp` sem assets.
- [ ] Tag/release publicados, se solicitado.
- [ ] Nenhum terminal/console corrompido em nenhum caminho de saída.
