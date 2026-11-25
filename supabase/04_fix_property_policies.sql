-- SAM step 4: property rules check the row itself (fixes "new row violates row-level security" when adding a property)
drop policy "property read" on properties;
drop policy "property edit" on properties;
create policy "property read" on properties for select
  using (user_id = auth.uid() or team_id in (select my_team_ids()));
create policy "property edit" on properties for update
  using (user_id = auth.uid() or team_id in (select my_team_ids()))
  with check (user_id = auth.uid() or team_id in (select my_team_ids()));
