-- SAM step 8: replace replaceable batteries older than 6 months (Module 4 step, Module 5 detail)
-- Module 4: add the Battery step (works whether or not the earlier "over a year" version was run)
update modules set content = replace(content, 'the date on it is over a year old', 'the date on it is more than 6 months old') where id = 4;
update modules set content = replace(content,
  E'6. **Record it.** Log the result for each alarm before you leave.',
  E'6. **Battery.** If the alarm has a replaceable battery, including a 9V backup in a hardwired alarm, and it''s flat, chirping or the date on it is more than 6 months old, replace it and write today''s date on the new one. See Module 5 for how.\n7. **Record it.** Log the result for each alarm before you leave.')
where id = 4;
-- Module 5: explain the 6-month rule
update modules set content = replace(content,
  E'Then anyone checking the alarm can see straight away how old the battery is.',
  E'Then anyone checking the alarm can see straight away how old the battery is.\n\nAt each check, replace any replaceable battery that is more than 6 months old, even if it still works. The next check could be up to a year away, so a battery that is already 6 months old might not last until then.')
where id = 5;
update modules set key_points = replace(key_points, '- Write the date on every new battery', '- Replace replaceable batteries older than 6 months at each check
- Write the date on every new battery') where id = 5;
