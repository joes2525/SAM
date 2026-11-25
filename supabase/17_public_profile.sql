-- SAM step 17: public name and logo on profiles and teams, shown on property look-ups.
begin;
alter table profiles add column if not exists public_name text;
alter table profiles add column if not exists logo_path text;
alter table teams add column if not exists logo_path text;
grant update (public_name, logo_path) on profiles to authenticated;

-- Logos are public pictures. Each person uploads into their own folder: <user id>/logo.jpg
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict (id) do nothing;
create policy "logos: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logos: replace own" on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logos: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function property_public(p uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', pr.id, 'street', pr.street, 'suburb', pr.suburb, 'postcode', pr.postcode,
    'alarms', (select count(*) from alarms a where a.property_id = pr.id),
    'earliest_expiry', (select min(expiry_date) from alarms a where a.property_id = pr.id),
    'last_check', (select jsonb_build_object('date', i.inspection_date, 'type', i.check_type, 'result', i.assessment,
                    'by', coalesce(pf.public_name, t.public_name, pf.company, pf.name),
                    'logo', coalesce(pf.logo_path, t.logo_path),
                    'trained', is_approved(pf.id))
                   from inspections i join profiles pf on pf.id = i.inspected_by
                   left join teams t on t.id = pr.team_id
                   where i.property_id = pr.id order by i.inspection_date desc, i.submitted_at desc limit 1),
    'last_tenant_check', (select max(check_date) from tenant_checks c where c.property_id = pr.id),
    'managed', not pr.resident_added,
    'linked', exists (select 1 from property_tenant_users l where l.property_id = pr.id and l.user_id = auth.uid())
  ) from properties pr where pr.id = p;
$$;
commit;
