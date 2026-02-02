-- Create coffees table
create table if not exists public.coffees (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  origin text,
  process text,
  roast_level text,
  flavor text,
  features text,
  price_display text,
  myship_url text,
  image_url text,
  is_available boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.coffees enable row level security;

-- Create policy to allow public read access
-- Drop existing policy if it exists to avoid errors on re-run (or just create if not exists)
drop policy if exists "Allow public read access" on public.coffees;
create policy "Allow public read access"
  on public.coffees
  for select
  using (true);
