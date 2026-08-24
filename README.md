# Menttalis Flow

Um espaço para focar, respirar e fazer uma coisa de cada vez.

Ferramenta gratuita de foco e pausa da Menttalis. Funciona no navegador, sem
login, sem cadastro, sem backend. Tudo que você configura fica salvo apenas no
seu navegador.

## Rodando o projeto

```bash
npm install
```

```bash
npm run dev
```

Outros comandos:

```bash
npm run build
```

```bash
npm run lint
```

## Como funciona

Dois contextos:

- **Foco** — escolha uma duração, opcionalmente escreva uma intenção, e comece.
  Ao terminar, o app conduz para uma pausa. Depois de algumas sessões, sugere
  uma pausa maior.
- **Relógio** — o mesmo relógio, mostrando as horas.

Três layouts de relógio (Digital, Anel, Analógico) compartilham a mesma fonte de
tempo e o mesmo estado. Trocar de layout nunca interrompe uma sessão.

Dois temas, claro por padrão, alternáveis no rodapé e lembrados no navegador.

### Atalhos

| Tecla | Ação |
| --- | --- |
| `Espaço` | Começar / pausar / continuar |
| `F` | Entrar e sair do modo foco |
| `Esc` | Sair do modo foco |
| `R` | Reiniciar a sessão atual |

Os atalhos ficam inativos enquanto você digita em um campo de texto.

## Decisões técnicas

**O timer é baseado em timestamps.** O tempo restante é sempre
`fim previsto - agora`, nunca um contador que decrementa. Isso significa que
trocar de aba, deixar o navegador em segundo plano ou suspender o computador não
causa desvio: quando o timer volta a rodar, ele lê o relógio real e mostra o
valor correto. O intervalo de atualização (200ms) só controla a frequência do
desenho, não a contagem.

**O relógio não depende de frames de animação.** Ponteiros, arcos e dígitos são
posicionados por atributo SVG e transições CSS, então a hora aparece correta
mesmo que nenhuma animação chegue a rodar. Os ponteiros avançam em passos, como
um movimento quartz — o que também faz o relógio voltar do repouso direto na
posição certa, em vez de girar as voltas que perdeu.

**Os dígitos são um odômetro.** Cada coluna contém 0–9 e desliza até o valor
atual. A janela de corte é mais alta que os glifos para os dígitos vizinhos não
invadirem; a margem negativa devolve esse espaço extra ao layout. A coluna
inteira é escondida de leitores de tela (`aria-hidden`), que recebem o valor
como texto.

**Sons são sintetizados.** Web Audio API, sem arquivos de áudio. Nada toca antes
de uma interação do usuário.

**Dois verdes, não um.** O verde da marca sobre cinza claro fica muito abaixo do
contraste legível, então `--accent` é o verde vivo usado como preenchimento (com
tinta escura em cima) e `--accent-line` é o verde de traço e texto, que escurece
no tema claro. Os números do relógio usam um token próprio: no claro ficam navy
em qualquer estado da sessão.

**O contorno dos números é derivado, não traçado.** `-webkit-text-stroke`
contorna todos os contornos de que um glifo é feito, o que expõe as emendas
internas de formas sobrepostas como linhas soltas dentro do número (acontece no
2, 4 e 5 do Instrument Sans, e no 4 do Inter). Em vez disso, um filtro SVG erode
o alfa do glifo e subtrai do glifo cheio, sobrando um anel limpo em volta da
silhueta real — independente da fonte. O filtro é aplicado só nas colunas de
dígitos: os pontos dos dois-pontos são menores que o raio de erosão e virariam
um bloco sólido.

**Um único rastreador de cursor.** Grid de fundo, contorno dos números e a
bolinha do cursor leem a mesma posição, de um listener e um `requestAnimationFrame`
só. As revelações usam a posição suavizada (que arrasta atrás do cursor); a
bolinha usa a posição bruta, porque um cursor atrasado parece defeito. O laço
para sozinho quando a posição assenta, então parado não custa nada.

**Acessibilidade.** HTML semântico, navegação por teclado, foco sempre visível,
`prefers-reduced-motion` respeitado em todas as animações, e contraste de texto
verificado em AA contra o fundo e contra as superfícies.

## Estrutura

```
src/
  components/
    clock/       Clock + Digital, Anel, Analógico e o odômetro
    focus/       Intenção e seleção de duração
    settings/    Painel de preferências e histórico
    ui/          Botão, controle segmentado, marca, cursor, grid, intro
  hooks/         Timer, sessão, histórico, tela cheia, tema, preferências
  lib/           Tempo, som, armazenamento local, rastreador de cursor
  types/
```

## Deploy

Servido em **menttalis.com/flow**. O app é um site Netlify próprio, e o site
principal (Next.js, outro repositório) faz um rewrite `/flow/*` com status 200
apontando para cá — a URL que o visitante vê continua sendo `menttalis.com/flow`.

Por isso o Vite é construído com `base: '/flow/'`, e o manifesto do PWA declara
`start_url` e `scope` em `/flow/`. Caminhos montados em tempo de execução (o
logo no topo) usam `import.meta.env.BASE_URL`, porque o Vite só reescreve os
caminhos que consegue resolver em tempo de build.

Cada push na `main` dispara um build. As configurações vivem em `netlify.toml`
(comando, pasta publicada, versão do Node e cabeçalhos de cache), então não é
preciso configurar nada pela interface.

```bash
npm run build
```

A saída vai para `dist/`.

## Limitações conhecidas

- As transições animadas (entrada do painel, troca de relógio, contração da
  interface ao iniciar) foram implementadas mas não pudemos verificá-las
  visualmente em execução — o ambiente de desenvolvimento usado não executava
  frames de animação. Vale conferir num navegador real.
- Sem verificação visual em iOS Safari e Android Chrome reais.
