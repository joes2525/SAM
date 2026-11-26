-- SAM step 19: PDF check reports / certificates, saved privately against each check.
begin;
alter table inspections add column if not exists pdf_path text;

insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict (id) do nothing;
create policy "documents read" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and public.can_access_property(((storage.foldername(name))[1])::uuid));
create policy "documents add" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and public.can_access_property(((storage.foldername(name))[1])::uuid));
create policy "documents change" on storage.objects for update to authenticated
  using (bucket_id = 'documents' and public.can_access_property(((storage.foldername(name))[1])::uuid));

-- Who did the check, for the report (team members only)
create or replace function inspection_report(i uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', pf.name, 'public_name', coalesce(pf.public_name, t.public_name), 'company', pf.company,
    'licence_no', pf.licence_no, 'logo', coalesce(pf.logo_path, t.logo_path), 'trained', is_approved(pf.id))
  from inspections x join profiles pf on pf.id = x.inspected_by
  join properties pr on pr.id = x.property_id left join teams t on t.id = pr.team_id
  where x.id = i and can_access_property(x.property_id);
$$;

-- Remember where the PDF was saved (the check itself stays locked)
create or replace function set_report_pdf(i uuid, path text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from inspections where id = i and can_access_property(property_id)) then raise exception 'Not allowed'; end if;
  update inspections set pdf_path = path where id = i;
end $$;
grant execute on function inspection_report(uuid), set_report_pdf(uuid, text) to authenticated;
commit;
