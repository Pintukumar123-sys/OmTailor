-- Run once in Supabase Dashboard > SQL Editor.
-- Customer submitted reviews are published immediately on the website.

create table if not exists public.reviews (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 2 and 80),
    rating int not null check (rating between 1 and 5),
    message text not null check (char_length(message) between 10 and 2000),
    approved boolean not null default true,
    created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;
grant select, insert on public.reviews to anon, authenticated;

drop policy if exists "Visitors can read published reviews" on public.reviews;
create policy "Visitors can read published reviews"
    on public.reviews for select to anon, authenticated
    using (approved = true);

drop policy if exists "Visitors can publish customer reviews" on public.reviews;
create policy "Visitors can publish customer reviews"
    on public.reviews for insert to anon, authenticated
    with check (approved = true);
