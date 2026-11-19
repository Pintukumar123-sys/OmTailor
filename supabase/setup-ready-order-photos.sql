-- Run once in Supabase Dashboard > SQL Editor.
-- The bucket is public so customers can view a ready-order image from the
-- unauthenticated tracking page. Do not upload sensitive personal documents.

alter table public.orders
    add column if not exists ready_photo text;

insert into storage.buckets (id, name, public)
values ('order-photos', 'order-photos', true)
on conflict (id) do update set public = true;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
          and policyname = 'Public can view OM Tailor order photos'
    ) then
        execute 'create policy "Public can view OM Tailor order photos" on storage.objects for select to public using (bucket_id = ''order-photos'')';
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
          and policyname = 'Authenticated admins upload OM Tailor order photos'
    ) then
        execute 'create policy "Authenticated admins upload OM Tailor order photos" on storage.objects for insert to authenticated with check (bucket_id = ''order-photos'')';
    end if;
end
$$;
