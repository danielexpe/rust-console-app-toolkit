# Anti-patterns e lições de campo

## Caso real — tela só aparece ao pressionar `Ctrl+C`

**Sintoma:** no VT o app roda, mas a tela fica em branco; ao pressionar
`Ctrl+C`, a imagem aparece por instantes antes da restauração. Funcionava em
uma máquina e falhava em outra.

**Diagnóstico:** `testes_debug.txt` mostrou `i915drmfb`, 1920 × 1080, 32 bpp,
sem ypan (`yres_virtual == yres`) e `fb0/blank: 4` antes do app. O app entrava
em `KD_GRAPHICS` e desenhava, mas nunca desbloqueava o console.
`FBIOBLANK`/`FB_BLANK_UNBLANK` levava o estado para `0`; o `Ctrl+C` (entrada de
teclado) acordava o console.

**Correção:** após `KDSETMODE(KD_GRAPHICS)`, chamar
`FBIOBLANK(FB_BLANK_UNBLANK)`; falha é não fatal.

**Lição:** não presuma `yoffset`, permissão, Wayland ou instalação. Em tela em
branco, confirme primeiro o VT de texto, o `blank`/DPMS e os ioctls
`KDSETMODE`/`FBIOBLANK`/`FBIOPAN_DISPLAY` no hardware afetado.

## Lista

1. **Decodificar PNG ou rasterizar glifos a cada frame.** Cacheie decode, fundo
   e glifos; a diferença é de ordens de magnitude.
2. **Escalar texto com nearest neighbor.** Use bilinear ou renderize no tamanho
   final; texto serrilhado é inaceitável.
3. **Achar que `/dev/fb0` basta.** Sem VT e sem grupo `video`, não funciona.
   Trate os dois erros separadamente.
4. **Usar `memmap2` sem necessidade.** `libc::mmap`/`munmap` já resolve.
5. **Esquecer `line_length` e padding.** Imagem "torta" por stride errado.
6. **Ignorar ordem de canais/bitfields.** Um formato pode ser BGRX.
7. **Assumir `ypan`.** Só use double buffer se o driver reportar suporte.
8. **Esquecer alpha pré-multiplicado.** Blending escurece/clareia errado.
9. **Depender de SIGINT em raw mode.** `Ctrl+C` chega como tecla.
10. **Restaurar na ordem errada ou só no caminho feliz.** Use RAII + sinais +
    panic hook.
11. **Imprimir logs na tela.** Corrompe a TUI e o console gráfico.
12. **Auto-detectar framebuffer.** É frágil; mantenha `auto` na TUI.
13. **Colocar o hash do pacote nas próprias notas.** Referência circular; o
    hash muda quando as notas mudam.
14. **Esquecer a versão nos snapshots.** Bump de versão quebra testes; é
    esperado, revise o diff.
15. **Confiar em glifos exóticos.** Verifique cobertura das fontes; desenhe
    primitivas quando necessário.
16. **Ajustar arte por "fit" quando a intenção era "cover".** Um painel retrato
    num card paisagem deixa faixas vazias; use fundo sólido ou cover.
17. **Declarar validação manual sem hardware.** Registre "pendente" e o que
    falta.
18. **Empacotar antes de testar o binário copiado.** Sempre teste em `/tmp`.
19. **Deixar docs e decisões divergirem do código.** Atualize spec/ADR/README
    na mesma tarefa; o próximo agente confia neles.
20. **Adicionar dependências por conveniência.** Cada crate custa licença,
    tamanho, MSRV e risco.
21. **Assumir que `KD_GRAPHICS` desbloqueia o console.** Verifique `blank` e
    chame `FBIOBLANK(FB_BLANK_UNBLANK)` após `KD_GRAPHICS`.
22. **Diagnosticar a partir de Wayland/SSH/`/dev/pts/N`.** O teste não exercita
    o VT e gera falso negativo; confirme `tty` = `/dev/ttyN`.
23. **Escolher o buffer de pan por contador fixo.** Use o `yoffset` atual e
    valide `yoffset <= yres_virtual - yres`.
24. **Mapear só `line_length * yres`.** Cubra o buffer visível e, com pan, os
    dois buffers; valide `smem_len`.
25. **Tratar falha de `FBIOPAN_DISPLAY` como fatal.** Desabilite o pan e escreva
    no buffer visível; o app continua.
26. **Ignorar que um driver pode anunciar ypan sem honrá-lo.** Tenha fallback.
27. **Instalar sem liberar o framebuffer.** Adicione o usuário ao grupo
    `video`; não peça para rodar como root.
28. **Pedir diagnóstico por comandos soltos.** Entregue um script reproduzível
    que gera um arquivo único.
