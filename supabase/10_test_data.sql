-- SAM step 10: SAM Register test data copied from Airtable (no photos). Safe to run more than once.
begin;
insert into properties (airtable_id,user_id,street,suburb,state,postcode,property_type,bedrooms,storeys,access_notes,owner_name,subscription_end) values
('rec0cWXMZEjwH2oWA',(select id from profiles where email = 'joes25@gmail.com'),'23 Anzac Avenue','Redcliffe','QLD','4020','House',3,1,'TEST DATA','Test Owner 26',null),
('rec2m9XmiyA67sKTO',(select id from profiles where email = 'joes25@gmail.com'),'20 Tarragindi Road','Tarragindi','QLD','4121','House',4,1,'TEST DATA','Test Owner 15',null),
('rec3UarfGy4xNOjit',(select id from profiles where email = 'joes25@gmail.com'),'46 Gympie Road','Kedron','QLD','4031','House',3,1,'TEST DATA','Test Owner 29',null),
('rec4OhK5ulH9jnhip',(select id from profiles where email = 'joes25@gmail.com'),'88 Moreton Parade','Redcliffe','QLD','4020','House',4,1,'Granny flat at rear is included in the lease — alarms in both.','Grace O''Brien',null),
('recFyAMuPzi80KHdL',(select id from profiles where email = 'joes25@gmail.com'),'31 Banksia Street','Wynnum','QLD','4178','House',4,1,'Vacant between tenancies. Keys at Riverstone office.','Priya Sharma','2025-06-10'),
('recGSuFwDPZSuJREY',(select id from profiles where email = 'joes25@gmail.com'),'52 Esplanade','Manly','QLD','4179','House',5,2,'TEST DATA','Test Owner 21',null),
('recHBQORuXPGc5YHy',(select id from profiles where email = 'joes25@gmail.com'),'88 Days Road','Grange','QLD','4051','House',4,2,'TEST DATA','Test Owner 18',null),
('recHHzih5As88JKzr',(select id from profiles where email = 'joes25@gmail.com'),'12 Jacaranda Street','Ashgrove','QLD','4060','House',3,1,'TEST DATA','Test Owner 01',null),
('recI4cSB0qMsspDVU',(select id from profiles where email = 'joes25@gmail.com'),'58 Kent Street','New Farm','QLD','4005','House',4,2,'TEST DATA','Test Owner 03',null),
('recJE0wIGz702hGfb',(select id from profiles where email = 'joes25@gmail.com'),'37 Sherwood Road','Sherwood','QLD','4075','House',3,1,'TEST DATA','Test Owner 20',null),
('recKLfkJLSaHZGDeu',(select id from profiles where email = 'joes25@gmail.com'),'15 Cobden Terrace','Dalry','QLD','EH112BJ','Unit / Apartment',3,2,null,'Matti Wilks',null),
('recKimEf6rpd08ibW',(select id from profiles where email = 'joes25@gmail.com'),'64 Beams Road','Carseldine','QLD','4034','House',4,1,'TEST DATA','Test Owner 24',null),
('recKt8wEF1wdzFTJr',(select id from profiles where email = 'joes25@gmail.com'),'19 Hawthorne Road','Hawthorne','QLD','4171','House',3,2,'TEST DATA','Test Owner 23',null),
('recKwLS6xX6SmnujM',(select id from profiles where email = 'joes25@gmail.com'),'7/22 Riverview Terrace','Indooroopilly','QLD','4068','Unit / Apartment',2,1,'Unit on level 3. Visitor parking at front, buzz unit 7.','Linda & Mark Chen','2027-11-06'),
('recP8fAlacA72csAO',(select id from profiles where email = 'joes25@gmail.com'),'3/10 Hawthorne Road','Bulimba','QLD','4171','Unit / Apartment',2,1,'Self-managed by owner.','Emma Clarke',null),
('recPCcvTwPGNYiTdh',(select id from profiles where email = 'joes25@gmail.com'),'5 Wattle Place','Kenmore','QLD','4069','House',4,2,'TEST DATA','Test Owner 12',null),
('recPENFnzwwclTPP5',(select id from profiles where email = 'joes25@gmail.com'),'81 Wynnum Road','Norman Park','QLD','4170','House',4,2,'TEST DATA','Test Owner 30',null),
('recQMG5VKPx7sIAD7',(select id from profiles where email = 'joes25@gmail.com'),'3/9 Ascog Terrace','Toowong','QLD','4066','Unit / Apartment',2,1,'TEST DATA','Test Owner 13',null),
('recV8tVrDdMiAJ0kd',(select id from profiles where email = 'joes25@gmail.com'),'12/7 Ella Street','Newstead','QLD','4006','Unit / Apartment',2,1,'TEST DATA','Test Owner 28',null),
('recWGUT6ybzpHhVOS',(select id from profiles where email = 'joes25@gmail.com'),'1/5 Clarence Road','Indooroopilly','QLD','4068','Unit / Apartment',2,1,'TEST DATA','Test Owner 19',null),
('recWbsV6Yw7SrGjgx',(select id from profiles where email = 'joes25@gmail.com'),'33 Ridge Street','Greenslopes','QLD','4120','House',3,1,'TEST DATA','Test Owner 05',null),
('recYxKi9SoKpD7z99',(select id from profiles where email = 'joes25@gmail.com'),'11/62 Cordelia Street','South Brisbane','QLD','4101','Unit / Apartment',2,1,'TEST DATA','Test Owner 10',null),
('recaBn6LGb33mmhjo',(select id from profiles where email = 'joes25@gmail.com'),'6/33 Lytton Road','East Brisbane','QLD','4169','Unit / Apartment',1,1,'TEST DATA','Test Owner 16',null),
('recbLXLmAuIWP1lsM',(select id from profiles where email = 'joes25@gmail.com'),'8/120 Wickham Terrace','Spring Hill','QLD','4000','Unit / Apartment',1,1,'TEST DATA','Test Owner 22',null),
('recbmZXkwo4pnnoqC',(select id from profiles where email = 'joes25@gmail.com'),'1 Example Street','Sampleville','QLD','4000','House',3,1,'Sample property — delete once real data is in.',null,'2026-10-23'),
('recc2A0esAnNC3cFp',(select id from profiles where email = 'joes25@gmail.com'),'testing',null,'QLD',null,null,null,null,null,null,null),
('recc7MOIVy5GpR7oQ',(select id from profiles where email = 'joes25@gmail.com'),'45 Waterworks Road','Red Hill','QLD','4059','House',3,2,'TEST DATA','Test Owner 08',null),
('reccZhwaAMULJzzea',(select id from profiles where email = 'joes25@gmail.com'),'16 Banya Street','Bulimba','QLD','4171','House',4,1,'TEST DATA','Test Owner 09',null),
('recdOMJkd0AQ2SxmE',(select id from profiles where email = 'joes25@gmail.com'),'29 Oxley Avenue','Woody Point','QLD','4019','House',3,1,'TEST DATA','Test Owner 11',null),
('receQgN5y06gPp3tY',(select id from profiles where email = 'joes25@gmail.com'),'5/41 Stanley Terrace','Taringa','QLD','4068','Unit / Apartment',2,1,'TEST DATA','Test Owner 25',null),
('recemBSjmeQWBP7Wy',(select id from profiles where email = 'joes25@gmail.com'),'2/18 Dornoch Terrace','Highgate Hill','QLD','4101','Unit / Apartment',2,1,'TEST DATA','Test Owner 07',null),
('recgum7CeUyl5KnJh',(select id from profiles where email = 'joes25@gmail.com'),'14 Jacaranda Avenue','Paddington','QLD','4064','House',3,2,'Key in lockbox by side gate, code with agent. Dog in yard — tenants will secure.','David Nguyen','2027-11-06'),
('recgwmoL7gxADAaiK',(select id from profiles where email = 'joes25@gmail.com'),'9/140 Merthyr Road','New Farm','QLD','4005','Unit / Apartment',1,1,'TEST DATA','Test Owner 04',null),
('recl9MQmaNwh3121C',(select id from profiles where email = 'joes25@gmail.com'),'5/40 Wattle Court','Carindale','QLD','4152','Townhouse',3,2,'Townhouse 5 in complex. Tenant works from home, call ahead.','Andrew Walsh',null),
('recnRuqufOz8fat9m',(select id from profiles where email = 'joes25@gmail.com'),'7 Little Jane Street','West End','QLD','4101','House',3,1,null,null,'2027-11-06'),
('recou0KuILuY2e70a',(select id from profiles where email = 'joes25@gmail.com'),'14 Kedron Park Road','Wooloowin','QLD','4030','House',3,1,'TEST DATA','Test Owner 17',null),
('recpDjncNvIXDn84I',(select id from profiles where email = 'joes25@gmail.com'),'10 Mirrabooka Road','Ferny Grove','QLD','4055','House',4,2,'TEST DATA','Test Owner 27',null),
('rectGZFawNOVE22zn',(select id from profiles where email = 'joes25@gmail.com'),'4/27 Sylvan Road','Toowong','QLD','4066','Unit / Apartment',2,1,'TEST DATA','Test Owner 02',null),
('recvupECt5jiITX0s',(select id from profiles where email = 'joes25@gmail.com'),'71 Gladstone Road','Dutton Park','QLD','4102','House',3,1,'TEST DATA','Test Owner 14',null),
('recwFYRbP9vfjByJo',(select id from profiles where email = 'joes25@gmail.com'),'7 Lilac Court','Carindale','QLD','4152','House',5,2,'TEST DATA','Test Owner 06',null)
on conflict (airtable_id) do nothing;
insert into alarms (airtable_id,property_id,location,alarm_type,power_source,interconnected,manufacture_month,manufacture_year,brand,model,as3786)
select v.aid,p.id,v.loc,v.t,v.pw,v.ic,v.m,v.y,v.br,v.mo,v.as3 from (values
('rec14su3AV09A0Tch','rec4OhK5ulH9jnhip','Bedroom 2','Photoelectric','10-year sealed lithium battery','Yes',8,2020,'Red','R10RF',null),
('rec2QLMgmrYtpk9mK','recgum7CeUyl5KnJh','Downstairs living','Photoelectric',null,'Yes',3,2022,'Clipsal','755PSMA',null),
('rec4ofIX2dVIVjKwK','recFyAMuPzi80KHdL','Bedroom 2','Photoelectric','9V replaceable battery','Yes',4,2017,'Quell','Q9V',null),
('rec56gnhxoyA3MvlS','recKwLS6xX6SmnujM','Bedroom 1','Photoelectric','10-year sealed lithium battery','Yes',6,2021,'Brooks','EIB650iRF',null),
('rec5PmPHNbzyzbKY5','recnRuqufOz8fat9m','Bedroom 2','Photoelectric','240V hardwired','Yes',4,2020,'Clipsal',null,'Yes'),
('rec5jbZmMSbhxVdJp','recgum7CeUyl5KnJh','Bedroom 3','Photoelectric',null,'No',3,2022,'Clipsal','755PSMA',null),
('rec6tZV1mvk34gdt3','rec4OhK5ulH9jnhip','Bedroom 1','Photoelectric','10-year sealed lithium battery','Yes',8,2020,'Red','R10RF',null),
('recC6afkTrPOeENQE','recFyAMuPzi80KHdL','Bedroom 3','Photoelectric','9V replaceable battery','Yes',4,2017,'Quell','Q9V',null),
('recDt6tUMj148RW71','recKwLS6xX6SmnujM','Hallway','Photoelectric','10-year sealed lithium battery','Yes',6,2021,'Brooks','EIB650iRF',null),
('recGIEzhcTKAbfAww','recbmZXkwo4pnnoqC','Main bedroom','Photoelectric','9V replaceable battery','Yes',11,2016,null,null,null),
('recIzMsteW5G8lRpW','recl9MQmaNwh3121C','Bedroom 1','Photoelectric',null,'Yes',2,2023,'Clipsal','755RFB',null),
('recK6qT8Xy2OJMQMO','rec4OhK5ulH9jnhip','Bedroom 4','Photoelectric','10-year sealed lithium battery','Yes',8,2020,'Red','R10RF',null),
('recQGjp2YeHgXB3GH','recP8fAlacA72csAO','Bedroom 2','Photoelectric','10-year sealed lithium battery','Yes',1,2019,'Brooks','EIB650i',null),
('recQTgZM8tjBds3JP','recgum7CeUyl5KnJh','Upstairs hallway','Photoelectric',null,'Yes',3,2022,'Clipsal','755PSMA',null),
('recQiaH6wx1vNot43','rec4OhK5ulH9jnhip','Bedroom 3','Photoelectric','10-year sealed lithium battery','Yes',8,2020,'Red','R10RF',null),
('recSNQceOPj3tQIi6','recFyAMuPzi80KHdL','Bedroom 4','Photoelectric','9V replaceable battery','Yes',8,2016,'Quell','Q9V',null),
('recT8mk0tk9lCrcPk','rec4OhK5ulH9jnhip','Granny flat bedroom','Photoelectric','10-year sealed lithium battery','Yes',8,2020,'Red','R10RF',null),
('recXD4BbQ2OVQN7XP','recl9MQmaNwh3121C','Bedroom 3','Photoelectric',null,'Yes',2,2023,'Clipsal','755RFB',null),
('recXQnD56obdKYi8m','recl9MQmaNwh3121C','Downstairs hallway','Photoelectric',null,'Yes',2,2023,'Clipsal','755RFB',null),
('recY7Lst2IeGhp7zf','recnRuqufOz8fat9m','Bedroom 1','Photoelectric','10-year sealed lithium battery','Yes',9,2026,'Clipsal',null,'Yes'),
('recfunJJfObqL2Pt8','rec4OhK5ulH9jnhip','Hallway','Photoelectric','10-year sealed lithium battery','Yes',8,2020,'Red','R10RF',null),
('recgGJKlPrl4YHVMQ','recP8fAlacA72csAO','Bedroom 1','Photoelectric','10-year sealed lithium battery','Yes',1,2019,'Brooks','EIB650i',null),
('recijZs5iT8oESSBG','recKLfkJLSaHZGDeu','Hallway','Photoelectric','10-year sealed lithium battery','Yes',6,2025,null,null,'Yes'),
('reclTGC0rX1zayMi6','recbmZXkwo4pnnoqC','Hallway outside bedrooms','Photoelectric',null,'Yes',3,2020,null,null,null),
('reclg5YO7P016ahXV','recc2A0esAnNC3cFp','Hallway','Photoelectric','240V hardwired','Yes',4,2020,'Minut',null,'Yes'),
('recmgOnxVmXhg3WWu','recgum7CeUyl5KnJh','Bedroom 2','Photoelectric',null,'Yes',3,2022,'Clipsal','755PSMA',null),
('recmv6GnPjJFEiu7s','recgum7CeUyl5KnJh','Bedroom 1','Photoelectric',null,'Yes',3,2022,'Clipsal','755PSMA',null),
('recn1HXTj0kgYT8TQ','recFyAMuPzi80KHdL','Bedroom 1','Photoelectric','9V replaceable battery','Yes',4,2017,'Quell','Q9V',null),
('recnGLpjVXxAhcpjj','recnRuqufOz8fat9m','Bedroom 3','Photoelectric','10-year sealed lithium battery','Yes',6,2018,null,null,'Yes'),
('recnZrJPZlr4xW3MY','recnRuqufOz8fat9m','Hallway','Photoelectric','10-year sealed lithium battery','Yes',3,2019,null,null,'Yes'),
('recnx7ve4imhKj4cB','recP8fAlacA72csAO','Hallway','Photoelectric','10-year sealed lithium battery','Yes',1,2019,'Brooks','EIB650i',null),
('rect3Yvsj0RaNwjIW','recl9MQmaNwh3121C','Upstairs hallway','Photoelectric',null,'Yes',2,2023,'Clipsal','755RFB',null),
('recwXl2aain2iXF4U','recl9MQmaNwh3121C','Bedroom 2','Photoelectric',null,'Yes',2,2023,'Clipsal','755RFB',null),
('recwoMuglDXdgPEy6','recKwLS6xX6SmnujM','Bedroom 2','Photoelectric','10-year sealed lithium battery','Yes',6,2021,'Brooks','EIB650iRF',null),
('recz40WeEGPMTHoA0','recFyAMuPzi80KHdL','Hallway','Photoelectric','9V replaceable battery','Yes',4,2017,'Quell','Q9V',null)
) v(aid,prop,loc,t,pw,ic,m,y,br,mo,as3) join properties p on p.airtable_id = v.prop
on conflict (airtable_id) do nothing;
insert into tenants (airtable_id,property_id,name,phone,emails,lease_start,lease_end,vacate_date)
select v.aid,p.id,v.n,v.ph,v.em,v.ls,v.le,v.vd from (values
('rec0NyqZhGfidy1UC','recbmZXkwo4pnnoqC','Sample Tenant',null,array[]::text[],null::date,null::date,null::date),
('recLY12JMkkjq3cZc','recKwLS6xX6SmnujM','Hannah Lee','0400 555 222',array[]::text[],null::date,null::date,null::date),
('recSNYabX3RB93Uz2','recP8fAlacA72csAO','Chris Adams','0400 555 666',array[]::text[],null::date,null::date,null::date),
('recVRweIGzLiBoKzu','recgum7CeUyl5KnJh','James & Olivia Park','0400 555 111',array[]::text[],null::date,null::date,null::date),
('recVeA25zg4jGrXNR','recl9MQmaNwh3121C','Sam Patel','0400 555 444',array[]::text[],null::date,null::date,null::date),
('reclVx9WMqgL6SBHw','recKLfkJLSaHZGDeu','Joe Tenant','07475246094',array['joes2525@Gmail.com'],null::date,null::date,null::date),
('recnv81ElxANQY9Gi','rec4OhK5ulH9jnhip','The Morgan family','0400 555 555',array[]::text[],null::date,null::date,null::date),
('recqNMLF23JqiyrNV','recnRuqufOz8fat9m','Matti Wilks','07475246094',array['m.wilks@gmail.com'],'2026-04-25'::date,'2027-04-25'::date,'2027-04-20'::date)
) v(aid,prop,n,ph,em,ls,le,vd) join properties p on p.airtable_id = v.prop
on conflict (airtable_id) do nothing;
insert into inspections (airtable_id,property_id,inspected_by,submitted_at,inspection_date,assessment,inspector_override,notes,check_type)
select v.aid,p.id,(select id from profiles where email = 'joes25@gmail.com'),v.sub,v.dt,v.ass,v.ov,v.notes,'manager' from (values
('recClIdtE7CYG7WQJ','recnRuqufOz8fat9m','2026-10-23T15:09:56Z'::timestamptz,'2026-10-23'::date,null,false,'Checked by: Joe (imported from Airtable)'),
('recFmowskof8Bar7m','recnRuqufOz8fat9m','2026-11-04T11:06:53Z'::timestamptz,'2026-11-04'::date,'Compliant',false,'Checked by: joe (imported from Airtable)'),
('recHf7yDvtUahfaiq','recbmZXkwo4pnnoqC','2026-11-06T09:51:09Z'::timestamptz,'2026-11-06'::date,'Compliant',true,'just for testing and testing again
Checked by: Joe testing (imported from Airtable)'),
('recQz3FqWJrDNxyMo','recnRuqufOz8fat9m','2026-10-20T14:41:15Z'::timestamptz,'2026-10-20'::date,null,false,'Checked by: joe test (imported from Airtable)'),
('recRIpD2CQyu7Y4Jh','recnRuqufOz8fat9m','2026-11-09T10:31:31Z'::timestamptz,'2026-11-09'::date,'Not compliant',false,'Smoke alarm in bedroom 1 faulty. $165 for us to replace.
Checked by: Joe Faulty (imported from Airtable)'),
('recUB0cVmcsdzLRrV','recKLfkJLSaHZGDeu','2026-11-16T13:14:05Z'::timestamptz,'2026-11-16'::date,'Compliant',true,'Only one alarm needed at this property
Checked by: Joe (imported from Airtable)'),
('recUJNGi3o7lb5jjI','recKLfkJLSaHZGDeu','2026-11-16T18:41:33Z'::timestamptz,'2026-11-17'::date,'Compliant',true,'all good. only needs 1 alarm in this case
Checked by: Joe (imported from Airtable)'),
('recWu0B69YhTUhf94','recnRuqufOz8fat9m','2026-11-01T16:10:48Z'::timestamptz,'2026-11-01'::date,'Compliant',false,'Checked by: Joe (imported from Airtable)'),
('recXxQ81P2kWfP3Ln','recnRuqufOz8fat9m','2026-11-04T15:23:49Z'::timestamptz,'2026-10-29'::date,'Compliant',false,'Checked by: Joe (imported from Airtable)'),
('recZ2f9akUAc9ojmz','recnRuqufOz8fat9m','2026-11-04T11:01:58Z'::timestamptz,'2026-11-04'::date,'Compliant',false,'Checked by: Joe (imported from Airtable)'),
('receSMXIUz5KHaKeR','recnRuqufOz8fat9m','2026-11-20T23:55:54Z'::timestamptz,'2026-11-21'::date,'Compliant',true,'It only needs one alarm as it is a room
Checked by: Joe (imported from Airtable)'),
('reclZxsxzkvnzshTp','recc2A0esAnNC3cFp','2026-11-19T18:53:10Z'::timestamptz,'2026-11-20'::date,'Compliant',false,'Checked by: Joe (imported from Airtable)'),
('reclrQFxxZCymquiN','recnRuqufOz8fat9m','2026-10-25T16:33:15Z'::timestamptz,'2026-10-25'::date,'Compliant',false,'Checked by: Matti Wilks (imported from Airtable)'),
('recnbJ6mgqfuQDHz3','recnRuqufOz8fat9m','2026-11-05T10:06:39Z'::timestamptz,'2026-11-05'::date,'Compliant',false,'Checked by: Joe Test (imported from Airtable)'),
('recoiHZOV69cEukPh','recc2A0esAnNC3cFp','2026-11-19T11:02:16Z'::timestamptz,'2026-11-19'::date,'Compliant',false,'Checked by: Joe (imported from Airtable)'),
('recpC10AOlRh0yu9s','recnRuqufOz8fat9m','2026-10-20T14:31:49Z'::timestamptz,'2026-10-20'::date,null,false,'Checked by: Joseph Steenson (imported from Airtable)'),
('recpLuDF73uOjfMhu','recnRuqufOz8fat9m','2026-11-04T11:34:49Z'::timestamptz,'2026-11-04'::date,'Compliant',false,'Checked by: joe (imported from Airtable)'),
('recsIIhNcCWswbyVc','recnRuqufOz8fat9m','2026-11-05T10:20:48Z'::timestamptz,'2026-11-05'::date,'Compliant',true,'The living room alarm is not required.
Checked by: Joe non compliant check (imported from Airtable)'),
('recuIa5HAo3RfGt5r','recnRuqufOz8fat9m','2026-11-09T11:03:23Z'::timestamptz,'2026-11-09'::date,'Compliant',true,'only 4 alarms ae needed. no more alarms needed.
Checked by: Joe (imported from Airtable)')
) v(aid,prop,sub,dt,ass,ov,notes) join properties p on p.airtable_id = v.prop
on conflict (airtable_id) do nothing;
commit;
select (select count(*) from properties) as properties, (select count(*) from alarms) as alarms, (select count(*) from tenants) as tenants, (select count(*) from inspections) as checks;
