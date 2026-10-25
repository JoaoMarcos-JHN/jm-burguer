-- Initial schema for JM Burguer.
-- Money is always stored as integer cents (R$ 34,99 = 3499).
-- Decisions behind this schema: docs/decisoes.md

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type fulfillment_type as enum ('delivery', 'pickup');

create type payment_method as enum ('pix', 'credit_card', 'debit_card', 'cash');

create type order_status as enum (
  'received',
  'preparing',
  'out_for_delivery',
  'ready_for_pickup',
  'completed',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Store
-- ---------------------------------------------------------------------------

-- Exactly one row: the "id = true" trick makes a second insert impossible.
create table store_settings (
  id boolean primary key default true check (id),
  name text not null,
  tagline text,
  address text not null,
  whatsapp_number text not null check (whatsapp_number ~ '^[0-9]{12,13}$'), -- 55 + DDD + number
  pix_key text,
  instagram_url text,
  timezone text not null default 'America/Sao_Paulo',
  accepts_pickup boolean not null default true,
  min_order_cents integer not null default 0 check (min_order_cents >= 0),
  is_temporarily_closed boolean not null default false, -- V2 "fechar loja agora"
  updated_at timestamptz not null default now()
);

create trigger store_settings_updated_at before update on store_settings
  for each row execute function set_updated_at();

-- weekday follows JavaScript's Date.getDay(): 0 = Sunday ... 6 = Saturday.
-- A shift that crosses midnight has closes_at <= opens_at (e.g. 18:00 -> 02:00)
-- and belongs to the weekday it opens on. A day may have several shifts.
create table opening_hours (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  check (opens_at <> closes_at)
);

create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  neighborhood text not null unique,
  fee_cents integer not null check (fee_cents >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  price_cents integer not null check (price_cents >= 0),
  image_path text, -- path inside the "product-images" storage bucket
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on products (category_id);

create trigger products_updated_at before update on products
  for each row execute function set_updated_at();

-- A group is defined once and linked to many products (product_option_groups).
-- min_select = 0 makes it optional; min_select >= 1 makes it required.
create table option_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,           -- shown to the customer: "Ponto da carne"
  internal_name text,           -- for the owner, when two groups share a name
  min_select smallint not null default 0 check (min_select >= 0),
  max_select smallint not null default 1 check (max_select >= 1),
  check (min_select <= max_select)
);

create table options (
  id uuid primary key default gen_random_uuid(),
  option_group_id uuid not null references option_groups (id) on delete cascade,
  name text not null,
  price_cents integer not null default 0 check (price_cents >= 0),
  max_quantity smallint not null default 1 check (max_quantity >= 1), -- e.g. 2x bacon
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create index options_option_group_id_idx on options (option_group_id);

create table product_option_groups (
  product_id uuid not null references products (id) on delete cascade,
  option_group_id uuid not null references option_groups (id) on delete cascade,
  sort_order integer not null default 0,
  primary key (product_id, option_group_id)
);

create index product_option_groups_option_group_id_idx on product_option_groups (option_group_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

-- Orders are written only by the server (service role) after recalculating
-- every price from the menu tables. Names and prices are copied into the
-- order so later menu changes never rewrite history.
create table orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique, -- shown as #0142
  user_id uuid references auth.users (id) on delete set null, -- V2
  status order_status not null default 'received',

  customer_name text not null check (length(trim(customer_name)) > 0),
  customer_phone text not null check (customer_phone ~ '^[0-9]{10,11}$'), -- DDD + number

  fulfillment fulfillment_type not null,
  delivery_zone_id uuid references delivery_zones (id) on delete set null,
  address_cep text check (address_cep ~ '^[0-9]{8}$'),
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_reference text,

  payment_method payment_method not null,
  change_for_cents integer,

  subtotal_cents integer not null check (subtotal_cents >= 0),
  delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  total_cents integer not null,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (total_cents = subtotal_cents + delivery_fee_cents),
  check (
    fulfillment = 'pickup'
    or (
      address_cep is not null
      and address_street is not null
      and address_number is not null
      and address_neighborhood is not null
    )
  ),
  check (fulfillment = 'delivery' or delivery_fee_cents = 0),
  check (
    change_for_cents is null
    or (payment_method = 'cash' and change_for_cents >= total_cents)
  )
);

create index orders_created_at_idx on orders (created_at desc);
create index orders_status_idx on orders (status);
create index orders_user_id_idx on orders (user_id);

create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0), -- base price, without options
  quantity integer not null check (quantity > 0),
  line_total_cents integer not null check (line_total_cents >= 0), -- (base + options) * quantity
  notes text -- "sem cebola"
);

create index order_items_order_id_idx on order_items (order_id);

create table order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references order_items (id) on delete cascade,
  option_id uuid references options (id) on delete set null,
  group_name text not null,
  option_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null default 1 check (quantity > 0) -- per unit of the item
);

create index order_item_options_order_item_id_idx on order_item_options (order_item_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- The public (anon and logged-in users) can only read the active menu and
-- the store information. Orders have no public policy at all: the server
-- writes them with the service role key, which bypasses RLS.
-- V2 adds policies for customers (their own orders) and the store owner.

alter table store_settings enable row level security;
alter table opening_hours enable row level security;
alter table delivery_zones enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table option_groups enable row level security;
alter table options enable row level security;
alter table product_option_groups enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_item_options enable row level security;

create policy "Public can read store settings" on store_settings
  for select to anon, authenticated using (true);

create policy "Public can read opening hours" on opening_hours
  for select to anon, authenticated using (true);

create policy "Public can read active delivery zones" on delivery_zones
  for select to anon, authenticated using (is_active);

create policy "Public can read active categories" on categories
  for select to anon, authenticated using (is_active);

create policy "Public can read active products" on products
  for select to anon, authenticated using (is_active);

create policy "Public can read option groups" on option_groups
  for select to anon, authenticated using (true);

create policy "Public can read active options" on options
  for select to anon, authenticated using (is_active);

create policy "Public can read product option groups" on product_option_groups
  for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);
