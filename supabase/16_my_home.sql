-- SAM step 16: anyone can add up to 2 homes they live in ("My home").
begin;
-- Homes added through My home that no property manager has taken on yet
alter table properties add column if not exists resident_added boolean not null default false;
update properties pr set resident_added = true
  where team_id is null and (select role from profiles where id = pr.user_id) = 'tenant';

create or replace function tenant_join_property(street text, suburb text, postcode text) returns uuid
language plpgsql security definer set search_path = public as $$
declare k text := trim(addr_key2(addr_key(street, suburb, postcode))); pid uuid;
begin
  if auth.uid() is null then raise exception 'Please log in'; end if;
  select id into pid from properties where address_key = k order by created_at limit 1;
  if exists (select 1 from property_tenant_users where user_id = auth.uid() and property_id = pid) then return pid; end if;
  if (select count(*) from property_tenant_users where user_id = auth.uid()) >= 2 then
    raise exception 'You can add up to 2 homes. Remove one first.';
  end if;
  if pid is null then
    insert into properties (user_id, street, suburb, postcode, resident_added)
      values (auth.uid(), street, suburb, postcode, true) returning id into pid;
  end if;
  insert into property_tenant_users (property_id, user_id) values (pid, auth.uid()) on conflict do nothing;
  return pid;
end $$;

create or replace function claim_property(street text, suburb text, postcode text, team uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k text := trim(addr_key2(addr_key(street, suburb, postcode))); pr properties;
begin
  if auth.uid() is null then raise exception 'Please log in'; end if;
  select * into pr from properties where address_key = k order by created_at limit 1;
  if pr.id is null then return null; end if;
  if pr.resident_added then
    update properties set user_id = auth.uid(), team_id = team, resident_added = false where id = pr.id;
    return jsonb_build_object('status','claimed','id',pr.id);
  end if;
  if can_access_property(pr.id) then return jsonb_build_object('status','yours','id',pr.id); end if;
  return jsonb_build_object('status','taken','info',property_public(pr.id));
end $$;

create or replace function property_public(p uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', pr.id, 'street', pr.street, 'suburb', pr.suburb, 'postcode', pr.postcode,
    'alarms', (select count(*) from alarms a where a.property_id = pr.id),
    'earliest_expiry', (select min(expiry_date) from alarms a where a.property_id = pr.id),
    'last_check', (select jsonb_build_object('date', i.inspection_date, 'type', i.check_type, 'result', i.assessment,
                    'by', coalesce(t.public_name, pf.public_name, pf.company, t.name, pf.name))
                   from inspections i join profiles pf on pf.id = i.inspected_by
                   left join teams t on t.id = pr.team_id
                   where i.property_id = pr.id order by i.inspection_date desc, i.submitted_at desc limit 1),
    'last_tenant_check', (select max(check_date) from tenant_checks c where c.property_id = pr.id),
    'managed', not pr.resident_added,
    'linked', exists (select 1 from property_tenant_users l where l.property_id = pr.id and l.user_id = auth.uid())
  ) from properties pr where pr.id = p;
$$;
commit;
