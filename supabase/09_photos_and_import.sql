-- SAM step 9: photo storage + columns that remember which Airtable record each row came from (so the import can be re-run safely)
alter table properties  add column if not exists airtable_id text unique;
alter table alarms      add column if not exists airtable_id text unique;
alter table tenants     add column if not exists airtable_id text unique;
alter table inspections add column if not exists airtable_id text unique;

-- Private photo storage. Files live under <property id>/..., so the same "who can see this property" rule applies.
insert into storage.buckets (id, name, public) values ('photos', 'photos', false) on conflict (id) do nothing;
create policy "photos read"   on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.can_access_property(((storage.foldername(name))[1])::uuid));
create policy "photos add"    on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.can_access_property(((storage.foldername(name))[1])::uuid));
create policy "photos change" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and public.can_access_property(((storage.foldername(name))[1])::uuid));
create policy "photos delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.can_access_property(((storage.foldername(name))[1])::uuid));
