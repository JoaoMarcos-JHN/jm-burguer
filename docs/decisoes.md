# Decisões do projeto

Resumo público das decisões tomadas antes de começar o desenvolvimento (outubro de 2026). As notas de trabalho ficam num vault privado do Obsidian, que é a fonte de verdade; quando uma decisão mudar lá, atualize este resumo e anote o motivo.

## O produto

Cardápio digital para hamburgueria, com pedido enviado pelo WhatsApp. Serve como projeto de portfólio e como produto para vender a restaurantes.

- **Marca:** JM Burguer. A identidade visual é nova, inspirada em diner americano dos anos 50 (referência: Johnny Rockets).
- **Modelo de venda:** um site por cliente. O código é um só, configurável (logo, cores, cardápio, WhatsApp, horários). Cada restaurante recebe uma cópia publicada, com o próprio projeto Supabase e o próprio domínio, na conta dele.
- **Fora do escopo:** transações de pagamento. O site só registra a forma de pagamento escolhida.

## Stack

| Camada          | Escolha                                  | Por quê                                                                                                                 |
| --------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Framework       | Next.js (App Router) + TypeScript        | Páginas geradas no servidor (SEO e prévia de link no WhatsApp/Instagram), rotas de API para a V2, padrão de mercado     |
| Hospedagem      | Vercel, plano gratuito                   | Feita para Next.js, custo zero até haver cliente pagando                                                                |
| Banco de dados  | Supabase (Postgres) desde a V1           | Mesmo formato de dados na V1 e na V2; o painel admin só é acrescentado por cima                                         |
| Acesso ao banco | `supabase-js` com tipos gerados e RLS    | Menos peças que um ORM e integração direta com o Supabase Auth                                                          |
| Arquivos        | Supabase Storage + `next/image`          | 1 GB grátis, imagens otimizadas automaticamente                                                                         |
| Componentes     | Tailwind CSS + shadcn/ui                 | Componentes acessíveis e editáveis; a identidade visual é feita sob medida para não ficar com cara de shadcn            |
| Carrinho        | Zustand com persistência no localStorage | Estado simples, o carrinho sobrevive a recarregar a página                                                              |
| Formulários     | React Hook Form + Zod                    | Base do formulário do shadcn; o mesmo esquema Zod valida de novo no servidor                                            |
| Antispam        | Cloudflare Turnstile                     | Captcha invisível e gratuito para proteger a gravação de pedidos                                                        |
| Qualidade       | ESLint, Prettier, Vitest, GitHub Actions | Testes nas regras de dinheiro: total com adicionais, taxa por bairro, mensagem do WhatsApp. Playwright fica para depois |
| Pacotes         | pnpm                                     |                                                                                                                         |

**Convenção:** código, tabelas e colunas em inglês; todo texto que o cliente vê em português.

## V1: pedido pelo WhatsApp

- Cardápio, categorias, configurações da loja, bairros e horários vêm do Supabase. Até existir o painel admin, o conteúdo é editado pelo painel do próprio Supabase.
- Produtos com **grupos de opções** no estilo iFood: cada grupo é obrigatório ou opcional, com mínimo e máximo de escolhas (ex.: "Ponto da carne", obrigatório, 1; "Adicionais", opcional, até 5). O formato comporta meio a meio no futuro, mas não é prioridade.
- **Taxa de entrega por bairro**, com opção de retirar no local. O CEP preenche a rua pelo ViaCEP.
- **Loja aberta/fechada** calculada pelos horários cadastrados. Com a loja fechada, o cardápio continua navegável, mas o envio do pedido é bloqueado.
- **Pagamento informativo:** Pix (mostra a chave da loja com botão de copiar e pede o comprovante no WhatsApp), cartão na entrega (crédito ou débito) ou dinheiro (pergunta o troco).
- **Envio:** uma Server Action confere o captcha, recalcula todos os preços a partir do banco e grava o pedido, que recebe um número (ex.: #0142). Só então o site abre o link `wa.me` com a mensagem formatada. O público não grava nem lê pedidos direto no banco.
- **Dados do cliente:** nome e telefone são obrigatórios. Na entrega, CEP, rua, número e bairro também; complemento e ponto de referência são opcionais.
- **Pedidos não enviados:** se o cliente desistir com o WhatsApp já aberto, o pedido fica gravado mesmo assim. É uma limitação aceita do `wa.me`; na V2 o dono cancela esses pedidos pelo painel.

## Banco de dados

O esquema está em `supabase/migrations/` e os dados de demonstração em `supabase/seed.sql`.

- **Dinheiro em centavos inteiros** (R$ 34,99 = `3499`), para evitar erros de arredondamento.
- **Grupos de opções reutilizáveis:** um grupo ("Adicionais") é cadastrado uma vez e ligado a vários produtos pela tabela `product_option_groups`.
- **Cópia no pedido:** cada item guarda nome e preço como eram na hora da compra, para o histórico não mudar quando o cardápio mudar.
- **Numeração contínua** dos pedidos, sem reiniciar. Pode haver saltos na sequência (um pedido recusado consome um número), o que é normal no Postgres.
- **Regras no próprio banco:** só uma linha de configuração da loja, total = subtotal + taxa, endereço obrigatório na entrega, troco só no dinheiro e maior que o total.
- **RLS:** o público só lê o cardápio ativo e as informações da loja. Os pedidos não têm nenhuma política pública; o servidor grava com a chave de serviço.
- **Horários:** `weekday` segue o `Date.getDay()` do JavaScript (0 = domingo). Um turno que passa da meia-noite tem `closes_at` menor que `opens_at` e pertence ao dia em que abre.

## V2: contas e painel admin

Decidido agora para que o banco da V1 já preveja usuários e status de pedido.

- **Login** com Supabase Auth: o cliente entra por Google ou por link no e-mail; o dono por e-mail e senha. Login por SMS/WhatsApp fica de fora por ter custo por mensagem.
- **Painel do dono:** pedidos chegando em tempo real (Supabase Realtime) com aviso sonoro; status recebido → em preparo → saiu para entrega → entregue.
- **Gestão:** produtos, fotos, bairros, horários e um botão para fechar a loja na hora.

## Identidade visual

Conceito **"A comanda"**: o carrinho é o bloco de comanda verde pautado dos diners dos anos 50, com picote no topo, número do pedido e total em "tinta vermelha". É a única peça ousada; o resto é sóbrio, como um cardápio impresso.

- **Fora de propósito:** piso xadrez, neon decorativo, fonte cursiva tipo Lobster/Pacifico, cards iguais com sombra. São o template genérico de "diner".
- **Paleta:** Ketchup `#C8102E` (ações, total, neon aberto), Mostarda `#F2B807` (raro: carro-chefe e foco do teclado), Comanda `#E3EFDD` (papel), Tinta da comanda `#3E7A5C` (pautas e texto secundário na comanda), Azul jukebox `#1D2A44` (texto), Azulejo `#F6F8F7` (fundo).
- **Tipografia:** Shrikhand só no logotipo, nos títulos de categoria e no número do pedido. Archivo no resto: condensada nos nomes dos produtos, normal no corpo e na interface, algarismos tabulares nos preços. Escala 14/16/20/28/40 px, corpo 16 px, altura de linha 1,5.
- **Cardápio:** linhas no estilo cardápio de parede (nome, pontilhado, preço) com foto redonda como um prato. Tudo alinhado à esquerda.
- **Status da loja:** letreiro "Aberto" em neon, aceso quando aberta e apagado (cinza) quando fechada, com o horário de abertura.
- **Produto:** gaveta de baixo para cima com foto, grupos de opções e "Adicionar à comanda · R$ 35,99".
- **Computador:** cardápio numa coluna central (~720 px) e a comanda sempre visível à direita.
- **Animação:** só em resposta a uma ação (o item "entra" na comanda). Nada de animações de entrada ao rolar.
- **Textos:** diretos e no ponto de vista do cliente: "Adicionar à comanda", "Enviar pedido pelo WhatsApp", "Fechado agora. Abrimos quinta às 18h.".
- **Tema:** só claro na V1.

## Limitações conhecidas do plano gratuito do Supabase

- **O projeto é pausado após cerca de 7 dias sem uso.** As páginas do cardápio ficam em cache no Next.js, então o site continua no ar; os pedidos novos dependem do banco ativo.
- **Cada conta tem até 2 projetos gratuitos.** Por isso cada cliente usa a própria conta.

## Próximos passos

1. ~~Registrar as decisões~~ (este arquivo)
2. ~~Desenhar o banco: tabelas, relações e regras de acesso (RLS)~~
3. ~~Definir a identidade visual: paleta, tipografia e layout~~
4. ~~Criar o projeto Next.js e construir a V1~~ (testado de ponta a ponta em 25/10/2026)
5. Publicar: repositório no GitHub e deploy na Vercel
6. V2: contas de cliente e painel admin
