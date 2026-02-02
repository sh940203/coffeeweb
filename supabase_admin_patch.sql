-- 1. 啟用 RLS (確保安全機制開啟)
alter table profiles enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- 2. 建立/更新 is_admin 函數 (Security Definer 是關鍵)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 3. 清除舊 Policies
drop policy if exists "Admins view all orders" on orders;
drop policy if exists "Users view own orders" on orders;
drop policy if exists "Admins view all items" on order_items;
drop policy if exists "Users view own items" on order_items;
drop policy if exists "Admins view all profiles" on profiles;
drop policy if exists "Users view own profile" on profiles;
drop policy if exists "Public profiles" on profiles;

-- 4. 設定 Profiles 權限
-- 允許使用者看自己的
create policy "Users view own profile" on profiles for select using (auth.uid() = id);
-- 允許 Admin 看全部
create policy "Admins view all profiles" on profiles for select using (is_admin());

-- 5. 設定 Orders 權限
-- 允許使用者看自己的
create policy "Users view own orders" on orders for select using (auth.uid() = user_id);
-- 允許 Admin 看全部
create policy "Admins view all orders" on orders for select using (is_admin());

-- 6. 設定 Order Items 權限
-- 允許使用者看自己的訂單明細 (透過 order_id 關聯)
create policy "Users view own items" on order_items for select using (
  exists (
    select 1 from orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  )
);
-- 允許 Admin 看全部
create policy "Admins view all items" on order_items for select using (is_admin());

-- 7. 緊急修復：確保您是 Admin
update profiles set role = 'admin' where id = auth.uid();
