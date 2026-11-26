-- SAM step 21: sharing is all or nothing. A property belongs to the person who added it.
-- Everyone in a team sees all properties of members who share with that team. No per-property team.
begin;

-- Does the owner of a property share with a team I'm in? (optionally: one I lead)
create or replace function shares_with_me(owner uuid, as_leader boolean default false) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from team_members o join team_members mine on mine.team_id = o.team_id
    where o.user_id = owner and o.share_properties and mine.user_id = auth.uid() and mine.user_id <> owner
      and (not as_leader or mine.role = 'leader'));
$$;
create or replace function same_shared_team(owner uuid, person uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select owner = person or exists (select 1 from team_members o join team_members x on x.team_id = o.team_id
    where o.user_id = owner and o.share_properties and x.user_id = person);
$$;

create or replace function can_access_property(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from properties pr where pr.id = p
    and (pr.user_id = auth.uid() or pr.assigned_to = auth.uid() or shares_with_me(pr.user_id)));
$$;

create or replace function property_defaults() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and not new.resident_added and new.assigned_to is null then new.assigned_to := coalesce(auth.uid(), new.user_id); end if;
  if new.assigned_to is not null and new.assigned_to is distinct from (case when tg_op = 'UPDATE' then old.assigned_to end) and auth.uid() is not null then
    if not same_shared_team(new.user_id, new.assigned_to) then raise exception 'That person is not in a team this property is shared with.'; end if;
    if new.assigned_to <> auth.uid() and new.user_id <> auth.uid() and not shares_with_me(new.user_id, true) then
      raise exception 'Only the owner or a team leader can assign a property to someone else.';
    end if;
  end if;
  return new;
end $$;

drop policy if exists "property delete" on properties;
create policy "property delete" on properties for delete using (user_id = auth.uid() or shares_with_me(user_id, true));

-- Leaving a team: properties assigned to the leaver from other members go back to their owner
create or replace function remove_member(team uuid, member uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if member <> auth.uid() and not is_team_leader(team) then raise exception 'Only a team leader can remove people.'; end if;
  if (select role from team_members where team_id = team and user_id = member) = 'leader'
     and (select count(*) from team_members where team_id = team and role = 'leader') = 1
     and (select count(*) from team_members where team_id = team) > 1 then
    raise exception 'Make someone else a team leader first.';
  end if;
  delete from team_members where team_id = team and user_id = member;
  update properties set assigned_to = user_id where assigned_to = member and user_id <> member and not same_shared_team(user_id, member);
end $$;
grant execute on function shares_with_me(uuid, boolean), same_shared_team(uuid, uuid) to authenticated;
commit;
