-- SAM step 15: duplicate-proof addresses, public property lookup, tenant links and tenant checks.
begin;

-- Public name shown on lookups (e.g. "Ray White Ashgrove")
alter table teams add column if not exists public_name text;
alter table profiles add column if not exists public_name text;

-- Standard form of an address, so "Unit 3/12 Smith Street" = "3/12 smith st"
create or replace function addr_key(street text, suburb text, postcode text) returns text
language sql immutable as $$
  select trim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    lower(coalesce(street,'') || ' ' || coalesce(suburb,'') || ' ' || coalesce(postcode,'')),
    '\m(unit|apartment|apt|flat|townhouse|villa)\M\s*', '', 'g'),
    '\s*/\s*', '/', 'g'),
    '[.,#]', ' ', 'g'),
    '\s+', ' ', 'g'));
$$;
create or replace function addr_key2(k text) returns text language sql immutable as $$
  select replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(' '||k||' ',
    ' street ',' st '),' road ',' rd '),' avenue ',' ave '),' drive ',' dr '),' court ',' ct '),' place ',' pl '),' parade ',' pde '),
    ' terrace ',' tce '),' crescent ',' cres '),' close ',' cl '),' lane ',' ln '),' highway ',' hwy '),' boulevard ',' bvd '),
    ' circuit ',' cct '),' esplanade ',' esp ');
$$;
alter table properties add column if not exists address_key text
  generated always as (trim(addr_key2(addr_key(street, suburb, postcode)))) stored;
alter table properties add column if not exists address_id text;   -- Addressfinder ID, once the address lookup is added
create index if not exists properties_address_key on properties (address_key);

-- Tenants who signed up and linked themselves to a property
create table if not exists property_tenant_users (
  property_id uuid references properties on delete cascade,
  user_id     uuid references profiles on delete cascade default auth.uid(),
  created_at  timestamptz not null default now(),
  primary key (property_id, user_id)
);
alter table property_tenant_users enable row level security;
create policy "tenant links: own or team" on property_tenant_users for select
  using (user_id = auth.uid() or can_access_property(property_id));
create policy "tenant links: remove own" on property_tenant_users for delete using (user_id = auth.uid());

-- The tenant's yearly test and clean
create table if not exists tenant_checks (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties on delete cascade,
  user_id     uuid not null references profiles default auth.uid(),
  check_date  date not null default current_date,
  all_sounded boolean not null,
  cleaned     boolean not null,
  notes       text,
  created_at  timestamptz not null default now()
);
alter table tenant_checks enable row level security;
create policy "tenant checks: own or team read" on tenant_checks for select
  using (user_id = auth.uid() or can_access_property(property_id));
create policy "tenant checks: linked tenant adds" on tenant_checks for insert
  with check (user_id = auth.uid() and exists (select 1 from property_tenant_users t where t.property_id = tenant_checks.property_id and t.user_id = auth.uid()));
grant select, insert, delete on property_tenant_users, tenant_checks to authenticated;
grant all on property_tenant_users, tenant_checks to service_role;

-- What anyone signed in can see about a property (nothing private)
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
    'managed', pr.team_id is not null or (select role from profiles where id = pr.user_id) <> 'tenant',
    'linked', exists (select 1 from property_tenant_users l where l.property_id = pr.id and l.user_id = auth.uid())
  ) from properties pr where pr.id = p;
$$;

-- Look up an address (signed-in users only)
create or replace function lookup_property(street text, suburb text, postcode text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare k text := trim(addr_key2(addr_key(street, suburb, postcode))); pid uuid;
begin
  if auth.uid() is null then raise exception 'Please log in'; end if;
  select id into pid from properties where address_key = k order by created_at limit 1;
  return case when pid is null then null else property_public(pid) end;
end $$;

-- Tenant: link to the property at this address, adding it if nobody has yet
create or replace function tenant_join_property(street text, suburb text, postcode text) returns uuid
language plpgsql security definer set search_path = public as $$
declare k text := trim(addr_key2(addr_key(street, suburb, postcode))); pid uuid;
begin
  if auth.uid() is null then raise exception 'Please log in'; end if;
  select id into pid from properties where address_key = k order by created_at limit 1;
  if pid is null then
    insert into properties (user_id, street, suburb, postcode) values (auth.uid(), street, suburb, postcode) returning id into pid;
  end if;
  insert into property_tenant_users (property_id, user_id) values (pid, auth.uid()) on conflict do nothing;
  return pid;
end $$;

-- Property manager adding an address: is it already in SAM?
-- Returns null (new), or who has it. A property only a tenant has added is handed over to the manager.
create or replace function claim_property(street text, suburb text, postcode text, team uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k text := trim(addr_key2(addr_key(street, suburb, postcode))); pr properties;
begin
  if auth.uid() is null then raise exception 'Please log in'; end if;
  select * into pr from properties where address_key = k order by created_at limit 1;
  if pr.id is null then return null; end if;
  if can_access_property(pr.id) then return jsonb_build_object('status','yours','id',pr.id); end if;
  if pr.team_id is null and (select role from profiles where id = pr.user_id) = 'tenant' then
    update properties set user_id = auth.uid(), team_id = team where id = pr.id;
    return jsonb_build_object('status','claimed','id',pr.id);
  end if;
  return jsonb_build_object('status','taken','info',property_public(pr.id));
end $$;

create or replace function set_team_public_name(team uuid, pname text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if team not in (select my_team_ids()) then raise exception 'Not your team'; end if;
  update teams set public_name = nullif(trim(pname),'') where id = team;
end $$;
grant execute on function set_team_public_name(uuid,text) to authenticated;

grant execute on function property_public(uuid), lookup_property(text,text,text),
  tenant_join_property(text,text,text), claim_property(text,text,text,uuid) to authenticated;
revoke execute on function property_public(uuid), lookup_property(text,text,text),
  tenant_join_property(text,text,text), claim_property(text,text,text,uuid) from anon, public;
commit;
