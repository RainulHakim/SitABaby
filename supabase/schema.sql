-- Run once in the Supabase SQL editor. Public reads never include ownership secrets.
create table public.listings (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 parent_first_name text not null check (char_length(parent_first_name) between 1 and 40),
 child_name text not null default '' check (char_length(child_name) <= 40),
 child_age integer not null check (child_age between 1 and 144),
 photo_url text not null,
 description text not null check (char_length(description) between 20 and 500),
 hourly_rate numeric not null check (hourly_rate > 0 and hourly_rate <= 200),
 currency text not null default 'USD' check (currency in ('USD','CAD','GBP','EUR','AUD')),
 location text not null check (char_length(location) between 2 and 80 and location !~ '[0-9]' and location !~* '\m(street|avenue|road|lane|drive|boulevard|apt|apartment|suite)\M'),
 availability text[] not null default '{}',
 tags text[] not null default '{}',
 contact_method text not null check (contact_method in ('phone','email','WhatsApp')),
 contact_value text not null check (char_length(contact_value) between 3 and 120),
 owner_token uuid not null
);
create index listings_created_at_idx on public.listings (created_at desc);
create index listings_location_idx on public.listings (lower(location));
create index listings_hourly_rate_idx on public.listings (hourly_rate);
create index listings_availability_idx on public.listings using gin (availability);
alter table public.listings enable row level security;
revoke all on public.listings from anon, authenticated;
grant select (id,created_at,parent_first_name,child_name,child_age,photo_url,description,hourly_rate,currency,location,availability,tags,contact_method,contact_value) on public.listings to anon;
grant insert on public.listings to anon;
grant update (parent_first_name,child_name,child_age,photo_url,description,hourly_rate,currency,location,availability,tags,contact_method,contact_value) on public.listings to anon;
grant delete on public.listings to anon;
create policy "Read public listing fields" on public.listings for select to anon using (true);
create policy "Create with browser ownership token" on public.listings for insert to anon with check (owner_token::text = (current_setting('request.headers',true)::json->>'x-owner-token'));
create policy "Edit using secret ownership token" on public.listings for update to anon using (owner_token::text = (current_setting('request.headers',true)::json->>'x-owner-token')) with check (owner_token::text = (current_setting('request.headers',true)::json->>'x-owner-token'));
create policy "Delete using secret ownership token" on public.listings for delete to anon using (owner_token::text = (current_setting('request.headers',true)::json->>'x-owner-token'));
create table public.listing_reports (id uuid primary key default gen_random_uuid(),listing_id uuid not null references public.listings(id) on delete cascade,created_at timestamptz not null default now());
alter table public.listing_reports enable row level security;
revoke all on public.listing_reports from anon, authenticated;
grant insert (listing_id) on public.listing_reports to anon;
create policy "Visitors can flag a listing" on public.listing_reports for insert to anon with check (true);
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('listing-photos','listing-photos',true,5242880,array['image/webp']) on conflict (id) do nothing;
create policy "Public photo viewing" on storage.objects for select to anon using (bucket_id='listing-photos');
create policy "Anonymous photo upload" on storage.objects for insert to anon with check (bucket_id='listing-photos' and lower(storage.extension(name))='webp');
