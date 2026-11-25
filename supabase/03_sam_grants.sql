-- SAM step 3: give signed-in users access to the tables (row level security still decides WHICH rows)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
-- profiles: users can only change their name, phone, company and licence (not their role)
revoke update on profiles from authenticated;
grant update (name, phone, company, licence_no) on profiles to authenticated;
-- question bank: never readable directly (answers are marked on the server)
revoke all on questions from authenticated, anon;
-- tables added later get the same access
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant execute on functions to authenticated;
