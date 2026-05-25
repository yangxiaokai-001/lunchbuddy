create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname varchar(50) not null,
  avatar_url text,
  work_start_time time not null default '09:00:00',
  work_end_time time not null default '18:00:00',
  timezone varchar(64) not null default 'Asia/Shanghai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  invite_code varchar(20) not null unique,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role varchar(20) not null default 'member',
  joined_at timestamptz not null default now(),
  unique (group_id, user_id),
  check (role in ('owner', 'member'))
);

create table if not exists public.food_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name varchar(120) not null,
  category varchar(50),
  created_by uuid not null references public.profiles(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.food_spins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  selected_food_option_id uuid not null references public.food_options(id) on delete restrict,
  started_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  status varchar(20) not null default 'working',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, work_date),
  check (status in ('working', 'finished', 'missed'))
);

create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  mood_code varchar(30) not null,
  created_at timestamptz not null default now(),
  unique (user_id, work_date),
  check (mood_code in (
    'energetic',
    'normal',
    'tired',
    'hungry',
    'waiting_for_off_work'
  ))
);

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(200) not null,
  is_done boolean not null default false,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_groups_updated_at on public.groups;
create trigger set_groups_updated_at
before update on public.groups
for each row
execute function public.set_updated_at();

drop trigger if exists set_attendance_records_updated_at on public.attendance_records;
create trigger set_attendance_records_updated_at
before update on public.attendance_records
for each row
execute function public.set_updated_at();

drop trigger if exists set_todos_updated_at on public.todos;
create trigger set_todos_updated_at
before update on public.todos
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.food_options enable row level security;
alter table public.food_spins enable row level security;
alter table public.attendance_records enable row level security;
alter table public.mood_logs enable row level security;
alter table public.todos enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "groups_select_member"
on public.groups
for select
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
  )
);

create policy "groups_insert_authenticated"
on public.groups
for insert
with check (auth.uid() = owner_id);

create policy "groups_update_owner"
on public.groups
for update
using (owner_id = auth.uid());

create policy "group_members_select_member"
on public.group_members
for select
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
  )
);

create policy "group_members_insert_self_or_owner"
on public.group_members
for insert
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.groups g
    where g.id = group_members.group_id
      and g.owner_id = auth.uid()
  )
);

create policy "food_options_select_member"
on public.food_options
for select
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = food_options.group_id
      and gm.user_id = auth.uid()
  )
);

create policy "food_options_insert_member"
on public.food_options
for insert
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.group_members gm
    where gm.group_id = food_options.group_id
      and gm.user_id = auth.uid()
  )
);

create policy "food_spins_select_member"
on public.food_spins
for select
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = food_spins.group_id
      and gm.user_id = auth.uid()
  )
);

create policy "food_spins_insert_member"
on public.food_spins
for insert
with check (
  started_by = auth.uid()
  and exists (
    select 1
    from public.group_members gm
    where gm.group_id = food_spins.group_id
      and gm.user_id = auth.uid()
  )
);

create policy "attendance_select_own"
on public.attendance_records
for select
using (user_id = auth.uid());

create policy "attendance_insert_own"
on public.attendance_records
for insert
with check (user_id = auth.uid());

create policy "attendance_update_own"
on public.attendance_records
for update
using (user_id = auth.uid());

create policy "mood_logs_select_own"
on public.mood_logs
for select
using (user_id = auth.uid());

create policy "mood_logs_insert_own"
on public.mood_logs
for insert
with check (user_id = auth.uid());

create policy "mood_logs_update_own"
on public.mood_logs
for update
using (user_id = auth.uid());

create policy "todos_select_own"
on public.todos
for select
using (user_id = auth.uid());

create policy "todos_insert_own"
on public.todos
for insert
with check (user_id = auth.uid());

create policy "todos_update_own"
on public.todos
for update
using (user_id = auth.uid());
