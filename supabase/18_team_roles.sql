-- SAM step 18: every property belongs to a team and is assigned to a person.
-- Team roles: leader (manages the team) and manager (property manager). Leaders can also manage properties.
begin;

alter table team_members add column if not exists role text not null default 'manager' check (role in ('leader','manager'));
alter table teams add column if not exists personal boolean not null default false;
alter table properties add column if not exists assigned_to uuid references profiles on delete set null;

-- Existing teams: the creator is the leader; a team with no leader makes all its members leaders
update team_members m set role = 'leader' from teams t where t.id = m.team_id and t.created_by = m.user_id;
update team_members m set role = 'leader'
  where not exists (select 1 from team_members x where x.team_id = m.team_id and x.role = 'leader');

create or replace function is_team_leader(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from team_members where team_id = t and user_id = auth.uid() and role = 'leader');
$$;

-- Personal team for people on their own (made when first needed)
create or replace function personal_team(u uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  select tm.team_id into t from team_members tm join teams tt on tt.id = tm.team_id
    where tm.user_id = u and tt.personal limit 1;
  if t is null then
    insert into teams (name, created_by, personal)
      values (coalesce((select nullif(name,'') || '''s properties' from profiles where id = u), 'My properties'), u, true) returning id into t;
    insert into team_members (team_id, user_id, role) values (t, u, 'leader');
  end if;
  return t;
end $$;

-- Existing properties without a team go into their owner's personal team
update properties set team_id = personal_team(user_id) where team_id is null and not resident_added;
update properties set assigned_to = user_id where assigned_to is null and not resident_added;

-- New properties: default team = personal team, default assigned = whoever added it.
-- Only leaders can assign a property to someone else.
create or replace function property_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not new.resident_added then
    if new.team_id is null then new.team_id := personal_team(coalesce(auth.uid(), new.user_id)); end if;
    if tg_op = 'INSERT' and new.assigned_to is null then new.assigned_to := coalesce(auth.uid(), new.user_id); end if;
  end if;
  if auth.uid() is not null and new.assigned_to is distinct from (case when tg_op = 'UPDATE' then old.assigned_to end)
     and new.assigned_to is distinct from auth.uid() and not is_team_leader(new.team_id) then
    raise exception 'Only a team leader can assign a property to someone else.';
  end if;
  if new.assigned_to is not null and not new.resident_added and not exists
     (select 1 from team_members where team_id = new.team_id and user_id = new.assigned_to) then
    raise exception 'That person is not in this team.';
  end if;
  return new;
end $$;
drop trigger if exists property_defaults on properties;
create trigger property_defaults before insert or update on properties for each row execute function property_defaults();

-- Only leaders delete properties (or the owner of a property outside any team)
drop policy if exists "property delete" on properties;
create policy "property delete" on properties for delete
  using (is_team_leader(team_id) or (team_id is null and user_id = auth.uid()));

-- Team details: leaders only
drop policy if exists "team rename" on teams;
create policy "team rename" on teams for update using (is_team_leader(id));
create or replace function set_team_public_name(team uuid, pname text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_team_leader(team) then raise exception 'Only a team leader can change this.'; end if;
  update teams set public_name = nullif(trim(pname),'') where id = team;
end $$;

-- New teams: creator is leader. Joining by invite: property manager.
create or replace function create_team(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  insert into teams (name, created_by) values (p_name, auth.uid()) returning id into t;
  insert into team_members (team_id, user_id, role) values (t, auth.uid(), 'leader');
  return t;
end $$;

-- Removing people (leaders only) and leaving. A team always keeps a leader.
drop policy if exists "leave team" on team_members;
create or replace function remove_member(team uuid, member uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if member <> auth.uid() and not is_team_leader(team) then raise exception 'Only a team leader can remove people.'; end if;
  if (select role from team_members where team_id = team and user_id = member) = 'leader'
     and (select count(*) from team_members where team_id = team and role = 'leader') = 1
     and (select count(*) from team_members where team_id = team) > 1 then
    raise exception 'Make someone else a team leader first.';
  end if;
  update properties set assigned_to = null where team_id = team and assigned_to = member;
  delete from team_members where team_id = team and user_id = member;
end $$;

create or replace function set_member_role(team uuid, member uuid, new_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_team_leader(team) then raise exception 'Only a team leader can change roles.'; end if;
  if new_role = 'manager' and (select count(*) from team_members where team_id = team and role = 'leader') = 1
     and (select role from team_members where team_id = team and user_id = member) = 'leader' then
    raise exception 'A team needs at least one leader.';
  end if;
  update team_members set role = new_role where team_id = team and user_id = member;
end $$;

-- Taking on a home a resident added: it joins the manager's team, assigned to them
create or replace function claim_property(street text, suburb text, postcode text, team uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare k text := trim(addr_key2(addr_key(street, suburb, postcode))); pr properties;
begin
  if auth.uid() is null then raise exception 'Please log in'; end if;
  select * into pr from properties where address_key = k order by created_at limit 1;
  if pr.id is null then return null; end if;
  if pr.resident_added then
    update properties set user_id = auth.uid(), team_id = coalesce(team, personal_team(auth.uid())), assigned_to = auth.uid(), resident_added = false where id = pr.id;
    return jsonb_build_object('status','claimed','id',pr.id);
  end if;
  if can_access_property(pr.id) then return jsonb_build_object('status','yours','id',pr.id); end if;
  return jsonb_build_object('status','taken','info',property_public(pr.id));
end $$;

grant execute on function is_team_leader(uuid), remove_member(uuid,uuid), set_member_role(uuid,uuid,text) to authenticated;
revoke execute on function personal_team(uuid) from anon, public, authenticated;
commit;
