-- SAM step 6: visitors can see the module list (title and summary) but not the lesson content
revoke select on modules from anon;
grant select (id, title, summary, is_exam, published) on modules to anon;
