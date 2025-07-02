create table public.users (
  id uuid references auth.users on delete cascade,
  email text,
  role text check (role in ('admin', 'user')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
