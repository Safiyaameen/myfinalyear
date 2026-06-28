
-- Roles
create type public.app_role as enum ('admin', 'seller', 'customer');
create type public.seller_type as enum ('physical', 'online', 'new');
create type public.shop_status as enum ('pending', 'approved', 'rejected');
create type public.order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create policy "Users view their own roles"
  on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins view all roles"
  on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles"
  on public.user_roles for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + default role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Shops
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  category text not null,
  description text not null default '',
  seller_type public.seller_type not null,
  status public.shop_status not null default 'pending',
  city text not null,
  district text not null,
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  logo_hue int not null default 200,
  rating numeric(3,2) not null default 0,
  reviews_count int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.shops enable row level security;

create policy "Anyone can view approved shops"
  on public.shops for select using (status = 'approved');
create policy "Owners view own shops"
  on public.shops for select using (auth.uid() = owner_id);
create policy "Admins view all shops"
  on public.shops for select using (public.has_role(auth.uid(), 'admin'));
create policy "Owners create shops"
  on public.shops for insert with check (auth.uid() = owner_id);
create policy "Owners update own shops"
  on public.shops for update using (auth.uid() = owner_id);
create policy "Admins update any shop"
  on public.shops for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete shops"
  on public.shops for delete using (public.has_role(auth.uid(), 'admin'));

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  slug text not null,
  title text not null,
  category text not null,
  description text not null default '',
  price numeric(12,2) not null,
  stock int not null default 0,
  image_hue int not null default 200,
  delivery text not null default '3 day courier',
  created_at timestamptz not null default now(),
  unique (shop_id, slug)
);
alter table public.products enable row level security;

create policy "Anyone can view products of approved shops"
  on public.products for select
  using (exists (select 1 from public.shops s where s.id = shop_id and s.status = 'approved'));
create policy "Owners view own products"
  on public.products for select
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));
create policy "Owners manage own products"
  on public.products for all
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity int not null default 1,
  unit_price numeric(12,2) not null,
  total numeric(12,2) not null,
  payment_method text not null default 'cod',
  delivery_method text not null default 'delivery',
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;

create policy "Customers view own orders"
  on public.orders for select using (auth.uid() = customer_id);
create policy "Sellers view own shop orders"
  on public.orders for select
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));
create policy "Admins view all orders"
  on public.orders for select using (public.has_role(auth.uid(), 'admin'));
create policy "Customers create own orders"
  on public.orders for insert with check (auth.uid() = customer_id);
create policy "Sellers update own shop orders"
  on public.orders for update
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- Reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (shop_id, customer_id)
);
alter table public.reviews enable row level security;

create policy "Anyone can view reviews"
  on public.reviews for select using (true);
create policy "Customers create own reviews"
  on public.reviews for insert with check (auth.uid() = customer_id);
create policy "Customers update own reviews"
  on public.reviews for update using (auth.uid() = customer_id);
create policy "Customers delete own reviews"
  on public.reviews for delete using (auth.uid() = customer_id);
