-- 1. Profiles: User credits နဲ့ အချက်အလက်သိမ်းရန်
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  credits int default 10, -- free credits ပေးထားမယ်
  updated_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles RLS policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. Projects: Pitch တစ်ခုချင်းစီရဲ့ context သိမ်းရန်
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  scenario_description text,
  target_audience text,
  created_at timestamp with time zone default now()
);

-- Enable RLS on projects
alter table public.projects enable row level security;

-- Projects RLS policies
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- 3. Slides: Anti-Gravity ကဖတ်မယ့် dynamic content များ
create table public.slides (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  order_index int,
  component_type text, -- ဥပမာ: 'GravityCard', 'HeroSection'
  content jsonb, -- AI ထုတ်ပေးတဲ့ text တွေကို ဒီမှာသိမ်းမယ်
  animation_settings jsonb,
  created_at timestamp with time zone default now()
);

-- Enable RLS on slides
alter table public.slides enable row level security;

-- Slides RLS policies (access through project ownership)
create policy "Users can view slides of own projects"
  on public.slides for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = slides.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create slides for own projects"
  on public.slides for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = slides.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update slides of own projects"
  on public.slides for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = slides.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete slides of own projects"
  on public.slides for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = slides.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, credits, updated_at)
  values (new.id, new.raw_user_meta_data->>'full_name', 10, now());
  return new;
end;
$$;

-- Trigger to auto-create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for profiles updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();