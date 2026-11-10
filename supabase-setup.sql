-- Run this in the Supabase SQL Editor after creating your admin account.
-- Replace the UUID below with your user's ID from Authentication > Users.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (length(trim(sku)) > 0),
  name text not null check (length(trim(name)) > 0),
  category text not null check (
    category in ('Perfumería', 'Oro Laminado', 'Gorras', 'Ropa/Sport')
  ),
  price numeric(10, 2) not null check (price >= 0),
  image text not null check (length(trim(image)) > 0),
  status text not null check (status in ('Disponible', 'Agotado')),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

drop policy if exists "Anyone can view products" on public.products;
create policy "Anyone can view products"
  on public.products for select
  using (true);

drop policy if exists "Only the admin can insert products" on public.products;
create policy "Only the admin can insert products"
  on public.products for insert to authenticated
  with check (auth.uid() = 'c7b0b38b-ce3a-4b0c-8cc1-bfd33eb612ef'::uuid);

drop policy if exists "Only the admin can update products" on public.products;
create policy "Only the admin can update products"
  on public.products for update to authenticated
  using (auth.uid() = 'c7b0b38b-ce3a-4b0c-8cc1-bfd33eb612ef'::uuid)
  with check (auth.uid() = 'c7b0b38b-ce3a-4b0c-8cc1-bfd33eb612ef'::uuid);

drop policy if exists "Only the admin can delete products" on public.products;
create policy "Only the admin can delete products"
  on public.products for delete to authenticated
  using (auth.uid() = 'c7b0b38b-ce3a-4b0c-8cc1-bfd33eb612ef'::uuid);

insert into public.products (sku, name, category, price, image, status)
values
  ('PER-001', 'Perfume Black Platinum 100ml', 'Perfumería', 1350.00, 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', 'Disponible'),
  ('PER-002', 'Fragancia Sauvage Intense', 'Perfumería', 1590.00, 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&q=80', 'Disponible'),
  ('ORO-001', 'Cadena Tejido Chino 14k Oro Laminado', 'Oro Laminado', 890.00, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80', 'Disponible'),
  ('ORO-002', 'Esclava Grumet 10mm Oro Laminado', 'Oro Laminado', 1120.00, 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=600&q=80', 'Disponible'),
  ('GOR-001', 'Gorra Snapback Classic', 'Gorras', 450.00, 'img/1g.webp', 'Disponible'),
  ('GOR-002', 'Gorra Deportiva Minimal Black', 'Gorras', 390.00, 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?auto=format&fit=crop&w=600&q=80', 'Disponible'),
  ('SPO-001', 'Playera Dry-Fit Stealth Black', 'Ropa/Sport', 380.00, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', 'Disponible'),
  ('SPO-002', 'Short Deportivo Running Pro', 'Ropa/Sport', 420.00, 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', 'Disponible')
on conflict (sku) do nothing;

update public.products
set image = 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=600&q=80'
where sku = 'ORO-002'
  and image = 'https://images.unsplash.com/photo-1611591475225-83e9b04f7572?auto=format&fit=crop&w=600&q=80';
