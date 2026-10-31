# Arquitetura de referência

## 1. Camadas

```text
main.rs / cli.rs
      |
      v
app/ (máquina de telas, loop, timers, áudio, input)
  |        |              |
  v        v              v
state/   render/        audio/
  |      /      \          |
  v     v        v         v
core/  tui     fb     assets/
(puro)         |
               v
          platform/ (libc, ioctls, mmap, sinais)
```

Regras:

- `core/` é função pura sempre que possível; sem UI, IO, tempo ou aleatoriedade
  global. Testável sem terminal.
- `state/` modela a sessão, telas e transições; depende de `core/`.
- `app/` orquestra: única camada que chama backend, áudio e relógio.
- `render/scene.rs` descreve a cena lógica uma vez; `tui.rs` e `fb.rs` a
  consomem. `render/text.rs` é do fb; `render/layout.rs` trata breakpoints.
- `platform/` isola `unsafe`, ioctls, `mmap`, `termios` e sinais.
- `util/` contém utilitários sem estado global (RNG, guardas de terminal).

## 2. Estrutura de módulos

```text
src/
  main.rs            # parse da CLI, escolha do backend, códigos de saída
  lib.rs             # reexporta módulos (permite testes de integração)
  cli.rs             # flags e enums de opções
  app.rs             # estado, transições, loop TUI e loop fb
  input.rs           # Action + map_key
  error.rs           # erros de runtime/backends (thiserror)
  core/              # domínio puro + testes
  state/             # sessão, telas, configurações
  render/
    mod.rs
    layout.rs        # breakpoints e geometria
    scene.rs         # cena lógica compartilhada
    text.rs          # fontdue + cache de glifos (fb)
    tui.rs           # desenho ratatui
    fb.rs            # canvas, escala, blend, telas do fb
    image.rs         # protocolos de imagem e fallback (opcional)
  platform/
    mod.rs
    fb.rs            # device, console, ioctls, mmap, sinais
  audio.rs           # síntese e backend ALSA dinâmico
  assets.rs          # include_bytes!, decode e cache
  capture.rs         # PNG determinístico de QA
  i18n/              # catálogo de strings
  theme.rs           # tokens de cor e detecção de cor
  util/
    rng.rs           # RNG determinístico (SplitMix64)
    tty.rs           # guardas de terminal
assets/
  src/               # fontes originais (SVG etc.)
  generated/         # derivados versionados
  fonts/             # TTF + licenças
xtask/               # pipeline de assets
tests/snapshots/     # snapshots de TUI
docs/                # especificações e checklists
AGENTS.md            # memória operacional para IA
```

## 3. Máquina de estados e loop

Modele telas como enum e transições em métodos nomeados:

```text
Screen = Home | Selecting | Playing | Paused | Finished | ...
Action = Up | Down | Left | Right | Confirm | Back | ToggleLanguage | ...
```

- `handle(Action) -> bool` centraliza o roteamento.
- Ações globais (idioma, som, sair) são tratadas antes da tela.
- Seleções usam índices com `rem_euclid`.
- Timers ficam no `App` (`Instant`); nunca `sleep` dentro da lógica.
- Teclas não mapeadas são ignoradas; ignore `KeyEventKind::Release`.
- `Ctrl+C` em raw mode chega como tecla, não como SIGINT: mapeie para `Quit`.

Loop:

```text
while !quit:
    update(now)                 # vence timers, animações, status
    draw()                      # TUI flush ou fb presente
    poll(timeout) -> eventos    # timeout = pacing
    handle(action)
restore()
```

- Ocioso ~100 ms; animação 16 ms (60 FPS) ou 33 ms.
- Nunca bloqueie > ~100 ms sem tratar sinais/saída.
- Efeitos colaterais (áudio) ficam no `App`, não no renderer.
- Pausa cancela/reagenda tarefas pendentes.

## 4. Contrato dos backends

1. Entrar com guarda RAII (raw mode/alternate screen ou `KD_GRAPHICS`).
2. Desenhar a partir de `&App` sem mutar estado.
3. Apresentar (flush TUI ou presente no fb).
4. Ler eventos com timeout, mapeando para `Action`.
5. Restaurar terminal/console em saída normal, erro, pânico e sinais.
6. Nunca imprimir logs no meio da tela.

Não é obrigatório usar `trait Backend`; dois loops podem compartilhar o mesmo
`App`.

## 5. CLI e códigos de saída

```text
<BIN> [OPTIONS]

  --lang <pt|en>                     idioma inicial
  --backend <auto|tui|fb>            saída de vídeo
  --fb-device <PATH>                 padrão: /dev/fb0
  --seed <u64>                       determinismo
  --color <auto|truecolor|256|16|never>
  --image-protocol <auto|kitty|sixel|iterm2|halfblocks|none>
  --no-images
  --no-animations
  --no-audio
  --capture-frame <PATH>             PNG determinístico e sai
  -h, --help
  -V, --version
```

- `--backend auto` prefere TUI; nunca tenta fbdev sozinho.
- `--backend fb` é explícito e exige VT local + permissão.
- `--capture-frame` não abre áudio, framebuffer nem terminal interativo.
- `NO_COLOR` tem prioridade; `--color never` força monocromático.
- Determinismo: `--seed` controla RNG e decisões que afetam jogadas.

| Código | Significado |
| --- | --- |
| 0 | sucesso |
| 1 | erro de runtime/IO/captura |
| 2 | erro de CLI (clap) |
| 3 | backend indisponível (fb sem permissão/VT, TUI sem TTY) |

Mensagens de erro devem ser acionáveis: caminho, causa e o que fazer.

## 6. Stack e features

| Área | Crate | Observação |
| --- | --- | --- |
| CLI | `clap` (derive) | help/version e validação |
| TUI | `ratatui` + `crossterm` | crossterm lê `/dev/tty` quando necessário |
| Imagens no terminal | `ratatui-image` | Kitty/Sixel/iTerm2 + fallback |
| Raster | `tiny-skia` | cena, composição, PNG de QA |
| Imagens | `image` (png) | decode/encode |
| Texto no fb | `fontdue` | rasterização + layout com wrap |
| Sistema | `libc` | ioctls, termios, sinais, `mmap` |
| Erros | `thiserror` | erros de domínio/backends |
| Áudio | `libloading` | ALSA dinâmico, feature `audio` |
| Assets | `xtask` (workspace) | SVG → PNG, manifesto, `--check` |

```toml
[features]
default = ["audio"]
audio = ["dep:libloading"]
```

- Menos é mais: cada crate custa licença, tamanho, MSRV e risco.
- `--no-default-features` deve compilar e testar.
- Evite `memmap2`: `libc::mmap`/`munmap` direto já resolve.
- Nada de rede em runtime.

## 7. Renderização compartilhada

- Canvas lógico fixo (referência: 1344 × 756 = 70% de 1920 × 1080).
- No fb: fundo ocupa a tela inteira; composição escalada e centralizada.
- Na TUI: layout adaptativo por breakpoints (Wide/Compact/Minimal).
- A cena do domínio é desenhada uma vez e reutilizada pelos dois backends.

Assets e custo:

1. Cache de decode de imagens e glifos.
2. Fundo estático pré-renderizado no tamanho do dispositivo.
3. Caminho rápido 1:1 sem escala.
4. Escala bilinear apenas quando necessário (nunca nearest em texto).
5. Só então cache por assinatura da cena.

- `tiny-skia` usa RGBA **pré-multiplicado**; respeite isso no blend.
- Cores em tokens semânticos (`Surface`, `Text`, `Accent`, `Danger`…), com
  variantes truecolor/256/16/mono.
- Evite glifos exóticos; verifique cobertura das fontes.
- Layout de texto com `fontdue::layout` (wrap por palavra, alinhamento,
  `line_height`); meça antes de centralizar.
- Nunca decodifique PNG ou rasterize glifos a cada frame.

## 8. i18n, acessibilidade, áudio

- Catálogo com todas as strings; `F2` alterna idioma em todas as telas.
- Teste que strings longas não estouram o layout.
- `NO_COLOR`, modo mono, `--no-animations`, contraste adequado.
- Não dependa só de cor para indicar estado (use marcador/forma).
- Áudio sintetizado em runtime, sem arquivos; volume baixo (~0,32).
- ALSA carregado dinamicamente; ausência de lib/device = silêncio, não erro.
- Feature `audio` desligável; `M` alterna mudo; thread separada com canal
  limitado; não bloqueie o loop.
- Teste síntese (sem NaN, pico ≤ 1,0, duração) sem hardware.

## 9. Assets e licenças

- Originais em `assets/src/`; derivados em `assets/generated/` com manifesto.
- `cargo xtask assets` gera; `--check` falha se divergir; não edite PNG à mão.
- Embuta com `include_bytes!`; teste decodificação e execução copiada para
  `/tmp` sem a pasta de assets.
- Código MIT; arte CC BY 4.0; fontes OFL 1.1 com textos de licença.
- `THIRD_PARTY_NOTICES.md` com todas as crates e licenças.
