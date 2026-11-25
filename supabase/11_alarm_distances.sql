-- SAM step 11: does each alarm meet the distance requirements?
alter table alarms add column if not exists distances text;  -- Yes / No / Unsure
