---
description: Diagnostica o framebuffer (fbdev/VT/blank/DRM) em um app Rust console Linux
---

Diagnostique o backend framebuffer no hardware afetado.

<contexto>
$ARGUMENTS
</contexto>

1. Carregue a skill `rust-console-tui-framebuffer` e leia
   `references/fbdev.md` e `references/anti-patterns.md`.
2. Chame a ferramenta `framebuffer_report` com o `device` (padrão `/dev/fb0`)
   e `output="testes_debug.txt"`.
3. Interprete o relatório em ordem:
   - `tty` é `/dev/ttyN`? Se for `/dev/pts/N`, X/Wayland ou SSH, o teste é
     inválido: peça para rodar em um VT de texto.
   - o usuário está no grupo `video`?
   - `blank` está em `0`? Se não, suspeite de blank/DPMS antes de mudar código.
   - registre `yoffset`, `yres_virtual`, `ypanstep`, `line_length`,
     `smem_len`, driver e bpp.
   - confira se o app chama `KDGETMODE`/`KDSETMODE`/`FBIOBLANK`/`FBIOPAN_DISPLAY`.
4. Se precisar de strace, rode o `testes_debug.sh` do app **dentro do VT**;
   nunca peça comandos soltos ao usuário.
5. Entregue: sintoma, evidência, causa provável, correção sugerida e o que
   ainda precisa ser validado. Não altere código de fbdev antes de confirmar
   que o diagnóstico foi feito em `/dev/ttyN`.
