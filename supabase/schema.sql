create extension if not exists "pgcrypto";

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text not null default '',
  content text not null,
  category text not null default 'devlog',
  cover_url text,
  read_time integer not null default 4,
  featured boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

drop policy if exists "Published posts are public" on public.posts;
create policy "Published posts are public"
  on public.posts for select
  using (published = true or auth.role() = 'authenticated');

drop policy if exists "Authenticated admins can insert posts" on public.posts;
create policy "Authenticated admins can insert posts"
  on public.posts for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated admins can update posts" on public.posts;
create policy "Authenticated admins can update posts"
  on public.posts for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated admins can delete posts" on public.posts;
create policy "Authenticated admins can delete posts"
  on public.posts for delete
  to authenticated
  using (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();
