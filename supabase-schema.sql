-- 執行這個 SQL 來建立資料庫表格
-- 請在 Supabase → SQL Editor 貼上並執行

create table if not exists ingredients (
  id text primary key,
  name text not null,
  unit text not null default 'g',
  category text not null default 'veggie',
  stock numeric not null default 0,
  created_at timestamptz default now()
);

create table if not exists recipes (
  id text primary key,
  name text not null,
  type text not null default '晚餐',
  cost numeric not null default 0,
  plate211 jsonb not null default '{"veggie":false,"protein":false,"carb":false}',
  ingredients jsonb not null default '[]',
  created_at timestamptz default now()
);

create table if not exists purchases (
  id text primary key,
  ing_id text references ingredients(id) on delete set null,
  ing_name text,
  ing_unit text,
  qty numeric not null,
  price numeric not null,
  date text not null,
  created_at timestamptz default now()
);

create table if not exists dining_out (
  id text primary key,
  name text not null,
  type text not null default '早餐',
  price numeric not null,
  date text not null,
  note text default '',
  plate211 jsonb not null default '{"veggie":false,"protein":false,"carb":false}',
  created_at timestamptz default now()
);

create table if not exists week_plan (
  id text primary key default gen_random_uuid()::text,
  week_key text not null unique,
  plan jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- 開放讀寫（不需要登入，單人家用）
alter table ingredients enable row level security;
alter table recipes enable row level security;
alter table purchases enable row level security;
alter table dining_out enable row level security;
alter table week_plan enable row level security;

create policy "allow all" on ingredients for all using (true) with check (true);
create policy "allow all" on recipes for all using (true) with check (true);
create policy "allow all" on purchases for all using (true) with check (true);
create policy "allow all" on dining_out for all using (true) with check (true);
create policy "allow all" on week_plan for all using (true) with check (true);
