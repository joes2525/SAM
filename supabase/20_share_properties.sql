-- SAM step 20: "Share my properties with this team" (on by default).
-- Everyone in a team can see all properties owned by, or assigned to, a member who shares with that team:
-- past, present and future, without moving anything.
begin;
alter table team_members add column if not exists share_properties boolean not null default true;

create or replace function can_access_property(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from properties pr
    where pr.id = p
      and (pr.user_id = auth.uid()
           or pr.assigned_to = auth.uid()
           or pr.team_id in (select my_team_ids())
           or exists (select 1 from team_members m
                      where m.share_properties and m.team_id in (select my_team_ids())
                        and m.user_id in (pr.user_id, pr.assigned_to)))
  );
$$;

create or replace function set_share_properties(team uuid, share boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update team_members set share_properties = share where team_id = team and user_id = auth.uid();
end $$;
grant execute on function set_share_properties(uuid, boolean) to authenticated;
commit;
