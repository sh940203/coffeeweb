-- Add new columns to coffees table
alter table public.coffees 
add column if not exists stock integer default 10,
add column if not exists acid integer default 3 check (acid between 1 and 5),
add column if not exists aroma integer default 3 check (aroma between 1 and 5),
add column if not exists bitter integer default 3 check (bitter between 1 and 5),
add column if not exists body integer default 3 check (body between 1 and 5);

-- Create reviews table
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  coffee_id uuid references public.coffees(id) on delete cascade not null,
  user_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for reviews
alter table public.reviews enable row level security;

-- Create policy for reviews
drop policy if exists "Allow public read access" on public.reviews;
create policy "Allow public read access"
  on public.reviews
  for select
  using (true);

drop policy if exists "Allow public insert" on public.reviews;
create policy "Allow public insert"
  on public.reviews
  for insert
  with check (true);
