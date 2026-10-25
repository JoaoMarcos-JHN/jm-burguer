# JM Burguer

Cardápio digital de hamburgueria com pedido pelo WhatsApp. O cliente monta a comanda, escolhe os adicionais, informa entrega e pagamento, e o pedido chega formatado no WhatsApp da loja, já com número.

Projeto de portfólio, feito para servir de base a cardápios reais de restaurantes. A JM Burguer é uma marca fictícia.

## O que ele faz

- Cardápio vindo do banco (Supabase), com fotos, categorias e destaque para o carro-chefe
- Produtos com grupos de opções no estilo iFood: obrigatórios ou opcionais, com mínimo, máximo e quantidade por opção ("2x bacon extra")
- Comanda salva no navegador, que sobrevive a recarregar a página
- Letreiro de aberto/fechado calculado pelos horários da loja, no fuso da loja; fora do horário o cardápio continua navegável, mas o envio fica bloqueado
- Entrega por bairro com taxa, ou retirada no local; o CEP preenche a rua pelo ViaCEP
- Pagamento informado no pedido: Pix (com a chave para copiar), cartão na entrega ou dinheiro com troco
- O servidor recalcula todos os preços a partir do banco antes de gravar: preço vindo do navegador nunca é aceito
- Captcha invisível (Cloudflare Turnstile) contra pedidos automatizados

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Supabase (Postgres, Storage, RLS) · Tailwind CSS 4 · shadcn/ui (Base UI) · Zustand · React Hook Form + Zod · Vitest · GitHub Actions

O porquê de cada escolha está em [`docs/decisoes.md`](docs/decisoes.md).

## Rodar localmente

Requisitos: Node 24 e pnpm.

1. Crie um projeto no [Supabase](https://supabase.com).
2. Copie `.env.example` para `.env.local` e preencha as chaves do projeto.
3. Instale e prepare o banco:

```bash
pnpm install
pnpm db:push     # cria as tabelas e os dados de demonstração
pnpm db:images   # envia as fotos dos produtos
pnpm dev
```

Abra http://localhost:3000.

## Comandos

| Comando                                              | O que faz                                                               |
| ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `pnpm dev`                                           | Servidor de desenvolvimento                                             |
| `pnpm test`                                          | Testes das regras de preço, horário e mensagem do WhatsApp              |
| `pnpm lint` / `pnpm typecheck` / `pnpm format:check` | Verificações que o CI roda a cada push                                  |
| `pnpm db:push`                                       | Aplica as migrações de `supabase/migrations` e o `seed.sql`             |
| `pnpm db:types`                                      | Regenera os tipos do banco (precisa do projeto linkado no Supabase CLI) |

## Estrutura

```
src/
  app/                 página do cardápio e layout
  components/menu/     cabeçalho, letreiro, linhas do cardápio, gaveta do produto
  components/cart/     comanda, formulário de entrega, confirmação
  lib/                 regras de negócio puras e testadas (preço, horário, WhatsApp, dinheiro)
  lib/orders/          cálculo e gravação do pedido (Server Action)
  stores/              estado da comanda e do checkout (Zustand)
supabase/
  migrations/          esquema do banco, regras de acesso e função de gravação do pedido
  seed.sql             cardápio de demonstração
```

## Próxima versão

Contas de cliente e painel do dono da loja, com pedidos chegando em tempo real. O banco já está preparado para isso (status do pedido e vínculo com usuário).

## Autor

João Marcos Ribeiro · [Portfólio](https://joaomarcos-jhn.github.io/portfolio/) · [LinkedIn](https://www.linkedin.com/in/jo%C3%A3o-marcos-ribeiro-088580347/)
