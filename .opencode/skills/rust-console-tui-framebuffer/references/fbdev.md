# Backend framebuffer (fbdev)

## 1. Pré-requisitos e diagnóstico

```bash
ls -l /dev/fb0
cat /sys/class/graphics/fb0/name
cat /sys/class/graphics/fb0/virtual_size
cat /sys/class/graphics/fb0/bits_per_pixel
cat /sys/class/graphics/fb0/stride
cat /sys/class/graphics/fb0/blank   # 0 = ligado; qualquer outro = blank/DPMS
cat /proc/fb
cat /sys/class/tty/tty0/active
tty                                 # deve ser /dev/ttyN, nunca /dev/pts/N
id -nG                              # deve conter video
```

- Permissão típica `root:video 660`; adicionar ao grupo `video` exige **novo
  login** (ou `newgrp video`).
- `/dev/fb0` existir **não** significa que o processo está em um VT ativo.
- Fora de VT (X/Wayland/SSH), `KDSETMODE` falha com `ENOTTY`: recuse com
  mensagem acionável, sem adivinhar.
- Rode o diagnóstico **de dentro de um VT de texto**. Se `tty` retornar
  `/dev/pts/N`, o teste não exercita o framebuffer e gera falso negativo.
- Console blanked/DPMS é a primeira suspeita quando a tela só aparece ao
  pressionar `Ctrl+C`.
- Colete driver, `virtual_size`, bpp, `stride`, `blank`, `yoffset`,
  `yres_virtual`, `ypanstep`, `line_length`, `smem_len`, VT ativo e `strace`.
- Entregue um script reproduzível (`testes_debug.sh`) em vez de comandos soltos.

### Script de diagnóstico

O `testes_debug.sh` deve:

1. Avisar/recusar se não estiver em `/dev/ttyN`.
2. Coletar OS, kernel, usuário, grupos, `loginctl`, `tty`, VT ativo.
3. Coletar `/dev/fb*`, `/proc/fb`, `/sys/class/graphics/fb*/*`, `fbset -i`,
   `vtconsole`, `fbcon`, `/dev/dri`, drivers DRM e `dmesg` (quando acessível).
4. Rodar o app sob `strace -e ioctl,openat,mmap,munmap,write` com `timeout`.
5. Testar `FBIOBLANK`/`FB_BLANK_UNBLANK`, escrita de faixas RGB,
   `FBIOPAN_DISPLAY` e restauração de `KD_TEXT`.
6. Rodar o app novamente após o desbloqueio.
7. Restaurar `KD_TEXT`/cursor mesmo em erro/interrupção.

Nunca instala nada nem roda como root; o usuário roda no VT e envia o
`testes_debug.txt`.

## 2. Abertura e validação

- Abrir com `O_RDWR | O_CLOEXEC`.
- `FBIOGET_VSCREENINFO` (`0x4600`) e `FBIOGET_FSCREENINFO` (`0x4602`).
- Estruturas do kernel: `fb_var_screeninfo` (160 bytes) e
  `fb_fix_screeninfo` (80 bytes) em x86_64. Teste os tamanhos.
- Validar:
  - `xres/yres > 0`;
  - `line_length >= xres * bytes_por_pixel`;
  - `yres_virtual >= yres`;
  - `yoffset <= yres_virtual - yres`.
- Ler e guardar o `yoffset` atual. **Nunca assuma zero.**
- `smem_len` precisa cobrir o buffer visível
  (`line_length * (yoffset + yres)`) e, se houver pan, os dois buffers
  (`line_length * 2 * yres`). Mapeie exatamente o necessário.
- `yres_virtual == yres` (comum em `i915drmfb`) significa **sem ypan**.
- Mapear com `libc::mmap` (`PROT_READ|PROT_WRITE`, `MAP_SHARED`), desmapear em
  `Drop`. `memmap2` é dispensável.
- Validar o formato antes de desenhar; erro deve informar bpp e offsets.
- Respeite `line_length` como stride, inclusive no padding da última linha.

## 3. Formatos suportados

| bpp | Layout | Aceitação |
| --- | --- | --- |
| 32 | RGBX/BGRX/XRGB/XBGR | R/G/B com 8 bits; alpha 0 ou 8 |
| 24 | RGB/BGR | R/G/B com 8 bits; 3 bytes little-endian |
| 16 | RGB565 | R 5, G 6, B 5 |

```text
canal(valor8, offset, len) =
    len == 0 ? 0 : ((valor8 * ((1<<len)-1) + 127) / 255) << offset
```

- Little-endian é a ABI alvo; documente a premissa.
- Em 16 bpp a fidelidade é menor; documente.
- Formatos desconhecidos: erro claro, nunca "chutar".

## 4. Apresentação e pan

- `ypan`/double buffer só se **todas** valerem:
  `ypanstep > 0`, `yres_virtual >= 2*yres`, `yres % ypanstep == 0` e
  `smem_len >= line_length * 2*yres`.
- O buffer de destino é o **não visível agora**, derivado do `yoffset` atual:
  `target = current_yoffset == 0 ? yres : 0`.
- Escreva o frame completo no `target`, chame `FBIOPAN_DISPLAY` (`0x4606`) com
  `yoffset = target` e só então atualize `current_yoffset`.
- Se `FBIOPAN_DISPLAY` falhar, **desabilite o pan** e escreva no buffer visível;
  não encerre o app.
- Sem `ypan`: escrever o frame completo em
  `current_yoffset * line_length`; nunca em `0` por suposição.
- Mapeie memória suficiente para o buffer de pan **e** para o visível usado no
  fallback.
- Um driver pode anunciar ypan e não honrá-lo; o fallback é obrigatório.

```text
current = var.yoffset
pan_ok = ypanstep > 0
         && yres_virtual >= 2*yres
         && yres % ypanstep == 0
         && smem_len >= line_length * 2*yres

map_len = pan_ok
    ? max(line_length * 2*yres, line_length * (current + yres))
    : line_length * (current + yres)

present(frame):
    if pan_ok:
        target = current == 0 ? yres : 0
        write_frame(frame, target * line_length)
        if pan(target):
            current = target
            return
        pan_ok = false
    write_frame(frame, current * line_length)
```

- Fundo pré-renderizado no tamanho do dispositivo.
- Composição escalada (70% do menor eixo) e centralizada; caminho rápido quando
  escala ≈ 1; bilinear para escala fracionária; alpha pré-multiplicado.
- Pacing: 60 FPS em animação, ~10 FPS ocioso. Sem vsync garantido.
- DRM/KMS fica no backlog; não misture APIs na primeira versão.

## 5. Console e entrada

- Abrir `/dev/tty` para ioctls e saída ANSI (cursor/limpeza).
- Guardar o modo com `KDGETMODE` (`0x4B3B`) e entrar em `KDSETMODE` (`0x4B3A`)
  com `KD_GRAPHICS` (`1`).
- **Desbloquear o console** logo depois: `FBIOBLANK` (`0x4611`) com
  `FB_BLANK_UNBLANK` (`0`). Ignorar falha é aceitável.
- `KD_GRAPHICS` **não** desbloqueia um console que chegou blanked/DPMS off.
- Restaurar `KD_TEXT` (`0`) na saída, erro, pânico e sinais.
- Raw mode via `crossterm`; ele prefere `/dev/tty`, não dependa de stdin.
- Esconder cursor e limpar ao entrar; mostrar cursor e limpar ao sair.
- Teste o cenário real: espere o console blankar e só então inicie o app; a
  primeira tela deve aparecer **sem tocar no teclado**.

## 6. Ordem das guardas

```text
1. Abrir e validar /dev/fb0, validar yoffset/smem_len e mapear memória
2. Abrir /dev/tty, salvar KDGETMODE, entrar em KD_GRAPHICS
3. FBIOBLANK(FB_BLANK_UNBLANK) — desbloquear blank/DPMS
4. enable_raw_mode
5. primeiro frame imediatamente (sem esperar tecla)
6. loop
7. disable_raw_mode
8. restaurar KD_TEXT, mostrar cursor, limpar
9. munmap e fechar descritores
```

Se qualquer passo falhar, desfaça os anteriores. Use RAII (`Drop`).

## 7. Sinais e pânico

- `SIGINT`, `SIGTERM`, `SIGHUP` com `sigaction` e flag atômica; `SA_RESTART`.
- Handler só marca a flag; restauração acontece no loop/`Drop`.
- `Ctrl+C` em raw mode chega como evento de tecla, não como sinal.
- Panic hook restaura o console **antes** de imprimir o erro.
- `unsafe` só no módulo de plataforma, com comentário `// SAFETY:`.

## 8. Limitações a documentar

- Troca de VT durante a execução pode deixar resíduos; sair e reiniciar.
- Sem vsync: tearing leve aceitável.
- Sem DRM/KMS; hardware sem `/dev/fb0` não é suportado.
- `auto` não escolhe fb.
- Resolução lida no início; mudanças de modo exigem reinício.
- O console pode chegar blanked/DPMS off; o app deve desbloquear no início.
- O blank por inatividade pode voltar; o primeiro frame não pode depender de
  tecla.
- Alguns drivers anunciam ypan e não o honram; o fallback faz parte do
  contrato.
