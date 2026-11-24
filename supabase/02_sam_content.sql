-- SAM step 2: course content, questions, guides, FAQ (copied from Airtable) + refresher check
begin;
update modules set title=$q$Why smoke alarms matter (and the law)$q$, summary=$q$What Queensland's smoke alarm laws require, who is responsible, and why your quick checks matter.$q$ where id=1;
update modules set title=$q$The right alarm: type, standard and power$q$, summary=$q$How to tell if an alarm meets Queensland's requirements just by looking at it.$q$ where id=2;
update modules set title=$q$Where alarms must go$q$, summary=$q$Required locations on every storey and in every bedroom, plus where not to put alarms.$q$ where id=3;
update modules set title=$q$How to test and clean an alarm$q$, summary=$q$A step-by-step routine you can do in a couple of minutes per property.$q$ where id=4;
update modules set title=$q$Batteries, expiry and reading the label$q$, summary=$q$How to work out an alarm's age and when it must be replaced.$q$ where id=5;
update modules set title=$q$Staying safe: ladders and electrical$q$, summary=$q$How to do checks without hurting yourself or anyone else.$q$ where id=6;
update modules set title=$q$Recording the check and what to do next$q$, summary=$q$How to log each check properly and act on what you find.$q$ where id=7;
update modules set title=$q$Final exam$q$, summary=$q$15 random questions from all 7 modules. Every answer must be right to pass. Must be passed every 12 months.$q$ where id=8;
insert into questions (module_id,question,option_a,option_b,option_c,option_d,correct,explanation) values
(7,$q$Which result should you choose if a bedroom alarm is missing?$q$,$q$All OK$q$,$q$Minor fix needed$q$,$q$Full inspection needed$q$,$q$Leave the result blank$q$,'C',$q$A missing alarm is serious: choose Full inspection needed and tell the owner the same day.$q$),
(1,$q$Do your routine-inspection checks replace the test required before a tenancy starts?$q$,$q$No, they catch problems early but don't replace it$q$,$q$Yes, if done within 6 months$q$,$q$Yes, always$q$,$q$Only for units$q$,'A',$q$Quick checks catch problems early and build a record, but the pre-tenancy test is still required.$q$),
(2,$q$When one smoke alarm sounds, what should the other alarms in the home do?$q$,$q$All sound together (interconnected)$q$,$q$Flash their light only$q$,$q$Sound only on the same storey$q$,$q$Nothing$q$,'A',$q$All required alarms must be interconnected so they all sound together.$q$),
(1,$q$From what date must every home in Queensland, including owner-occupied homes, meet the new smoke alarm rules?$q$,$q$1 January 2022$q$,$q$1 January 2025$q$,$q$1 January 2027$q$,$q$1 January 2030$q$,'C',$q$Rentals and homes being sold or leased have had to comply since 1 January 2022. Every other home in Queensland must comply from 1 January 2027.$q$),
(5,$q$An alarm keeps chirping every minute or so. What does that usually mean?$q$,$q$Smoke has been detected$q$,$q$It's being tested remotely$q$,$q$It's interconnected correctly$q$,$q$The battery is low or the alarm is at end of life$q$,'D',$q$A regular chirp usually means a low battery or an alarm at end of life.$q$),
(3,$q$How far should an alarm be from a light fitting?$q$,$q$At least 50 mm$q$,$q$At least 300 mm$q$,$q$At least 1 metre$q$,$q$Distance doesn't matter$q$,'B',$q$Keep alarms at least 300 mm from light fittings and from wall-ceiling corners.$q$),
(5,$q$A label shows only the year '2017', with no month. What date do you assume it was made?$q$,$q$December 2017$q$,$q$June 2017$q$,$q$January 2017$q$,$q$Today's date$q$,'C',$q$If only the year is shown, assume January of that year (the earliest, safest date).$q$),
(3,$q$How many alarms does a single-storey home with 3 bedrooms off one hallway need, at minimum?$q$,$q$1$q$,$q$3$q$,$q$4$q$,$q$6$q$,'C',$q$One in each bedroom (3) plus the connecting hallway (1) = 4. A 5th is often needed on the path to the exit if living areas are separate.$q$),
(2,$q$An alarm is labelled 'Ionisation, AS 3786-1993, 9V battery' and beeps when tested. What do you record?$q$,$q$Compliant, because it works$q$,$q$Compliant until the battery runs out$q$,$q$Non-compliant: wrong type, old standard and removable battery$q$,$q$Non-compliant only because of the battery$q$,'C',$q$It fails on type, standard and power source, even though it sounds.$q$),
(3,$q$The owner has turned the study into a 4th bedroom. What does that mean for alarms?$q$,$q$Nothing, the study was already counted$q$,$q$Only the hallway alarm needs checking$q$,$q$The tenant must supply the alarm$q$,$q$That room now needs its own interconnected alarm$q$,'D',$q$Every room used as a bedroom needs its own alarm, interconnected with the others.$q$),
(1,$q$A tenant notices a smoke alarm isn't working. What should they do?$q$,$q$Take it down until it can be fixed$q$,$q$Wait for the next routine inspection$q$,$q$Replace the hardwired alarm themselves$q$,$q$Tell the property manager or lessor$q$,'D',$q$Tenants should report any fault to the property manager or lessor. Nobody may remove an alarm except to replace it, and hardwired alarms must be replaced by a licensed electrician.$q$),
(7,$q$You find an expired alarm during an exit inspection. When should you tell the owner?$q$,$q$The same day$q$,$q$At the next routine inspection$q$,$q$Only if the next tenant complains$q$,$q$There's no need to$q$,'A',$q$Serious issues should be reported to the owner the same day so they're fixed before the next tenancy.$q$),
(4,$q$Should you test an alarm with smoke from a lighter?$q$,$q$Yes, it's the most accurate test$q$,$q$Yes, but only on hardwired alarms$q$,$q$Only in bedrooms$q$,$q$No, unless the manufacturer's instructions specifically say to$q$,'D',$q$Use the test button. Don't use smoke or flame unless the manufacturer says to.$q$),
(5,$q$It's November 2026 and an alarm expires in June 2027. What should you do?$q$,$q$Pass it and note it expires within 12 months$q$,$q$Fail it immediately$q$,$q$Remove it$q$,$q$Ignore it until it expires$q$,'A',$q$It passes today, but flag that it expires within 12 months so the owner can plan a replacement.$q$),
(1,$q$Can a tenant remove a smoke alarm battery because the alarm keeps going off when they cook?$q$,$q$Yes, if they tell the property manager$q$,$q$Yes, but only overnight$q$,$q$Yes, if they replace it within a week$q$,$q$No, alarms and batteries must only be removed to replace them$q$,'D',$q$Nobody may remove an alarm or its battery except to replace it.$q$),
(5,$q$An alarm label says 'MFD 03/2019'. When must it be replaced by?$q$,$q$March 2024$q$,$q$March 2029$q$,$q$March 2039$q$,$q$Only when it stops working$q$,'B',$q$Manufacture date plus 10 years: March 2019 means replace by March 2029.$q$),
(2,$q$Interconnection between alarms can be done by:$q$,$q$Wiring only$q$,$q$Wiring or wireless (radio)$q$,$q$Wireless only$q$,$q$Bluetooth to the tenant's phone$q$,'B',$q$Alarms can be interconnected by hardwiring or wirelessly.$q$),
(1,$q$What causes most deaths in house fires?$q$,$q$The flames$q$,$q$Breathing in smoke$q$,$q$Falling debris$q$,$q$Electric shock$q$,'B',$q$Smoke, not flames, is what kills. A working alarm wakes people early enough to get out before the smoke does.$q$),
(3,$q$How far should an alarm be from an air-conditioning vent?$q$,$q$At least 100 mm$q$,$q$At least 200 mm$q$,$q$At least 400 mm$q$,$q$It should be right next to it$q$,'C',$q$Keep alarms at least 400 mm from air-conditioning vents and ceiling fan blades.$q$),
(2,$q$Which Australian Standard must the alarm be marked with?$q$,$q$AS 3786-1993$q$,$q$AS 1670-2015$q$,$q$AS 3786-2014$q$,$q$AS 2293-2005$q$,'C',$q$Required alarms must comply with AS 3786-2014.$q$),
(1,$q$An alarm fails its test before a new tenancy. Who is responsible for replacing it?$q$,$q$The incoming tenant$q$,$q$The outgoing tenant$q$,$q$The lessor (owner), usually arranged through the property manager$q$,$q$The local council$q$,'C',$q$The lessor must replace any alarm that fails or is 10 or more years old. The property manager usually arranges it on the owner's behalf.$q$),
(1,$q$Before a new tenancy starts, when must the smoke alarms be tested and cleaned?$q$,$q$Within 30 days before the start$q$,$q$Within 90 days before the start$q$,$q$Within 7 days after the start$q$,$q$Only once a year, whatever the lease dates$q$,'A',$q$Alarms must be tested and cleaned within 30 days before a tenancy starts or is renewed.$q$),
(4,$q$How should you clean a smoke alarm?$q$,$q$Spray it with surface cleaner$q$,$q$Wipe it with a wet cloth$q$,$q$Gently vacuum or dust the vents$q$,$q$Paint over any marks$q$,'C',$q$Gently vacuum or dust the vents. Never paint or spray chemicals on an alarm.$q$),
(5,$q$How old can a smoke alarm be before it must be replaced?$q$,$q$10 years$q$,$q$5 years$q$,$q$7 years$q$,$q$15 years$q$,'A',$q$Alarms must be replaced within 10 years of the manufacture date, or sooner if they fail.$q$),
(3,$q$Where must smoke alarms be installed?$q$,$q$Kitchen only$q$,$q$Living areas only$q$,$q$One per dwelling, anywhere$q$,$q$Every bedroom, hallways connecting bedrooms, and every storey$q$,'D',$q$Required in each bedroom, connecting hallways (or between bedrooms and the rest of the storey), and on every storey.$q$),
(6,$q$An alarm has scorch marks and smells of burning. What do you do?$q$,$q$Pull it off the ceiling to check the wiring$q$,$q$Press the test button repeatedly$q$,$q$Ignore it if it still sounds$q$,$q$Don't touch it, record it and arrange an electrician urgently$q$,'D',$q$Damaged or scorched alarms may be an electrical hazard. Don't touch them; escalate urgently.$q$),
(7,$q$An alarm passes every check but is dusty. You clean it on the spot. What overall result is fair?$q$,$q$Full inspection needed$q$,$q$All OK$q$,$q$Minor fix needed, because it was dusty$q$,$q$Fail$q$,'B',$q$Cleaning is part of the check. If everything passes after cleaning, the result is All OK.$q$),
(4,$q$What should you do before pressing the test button?$q$,$q$Warn the occupants (and neighbours in attached homes)$q$,$q$Turn off the power at the switchboard$q$,$q$Remove the alarm from its base$q$,$q$Nothing, just press it$q$,'A',$q$Alarms are about 85 dB. Warn people first, especially anyone with hearing or medical conditions.$q$),
(4,$q$You press the test button in bedroom 1. Bedrooms 1 to 3 sound but the hallway alarm doesn't. What's the problem?$q$,$q$Nothing, the hallway alarm is fine$q$,$q$The interconnection has failed$q$,$q$The bedroom 1 alarm is faulty$q$,$q$The batteries need charging$q$,'B',$q$All alarms should sound together. One staying silent means the interconnection has failed.$q$),
(6,$q$Which is the safest way to reach a ceiling alarm?$q$,$q$Stand on the tenant's bed$q$,$q$Stand on the top step of a ladder$q$,$q$Use a test pole from the floor$q$,$q$Stand on a kitchen chair$q$,'C',$q$A test pole from the floor avoids working at height. If you use a ladder, never stand on the top step or on furniture.$q$),
(3,$q$On a storey with no bedrooms, where should the alarm go?$q$,$q$On the most likely path to the exit$q$,$q$In the kitchen$q$,$q$In the bathroom$q$,$q$No alarm is needed on that storey$q$,'A',$q$Every storey needs an alarm. With no bedrooms, it goes on the most likely exit path.$q$),
(6,$q$When using a step ladder, how many points of contact should you keep?$q$,$q$Three (two feet and one hand)$q$,$q$One$q$,$q$Two feet only$q$,$q$Doesn't matter if it's short$q$,'A',$q$Keep three points of contact and don't overreach.$q$),
(6,$q$Who can install, remove or replace a hardwired smoke alarm?$q$,$q$The property manager$q$,$q$A licensed electrician$q$,$q$The tenant$q$,$q$Anyone with a ladder$q$,'B',$q$Hardwired alarms are on 240V mains power. Only a licensed electrician can work on them.$q$),
(1,$q$When do most fatal house fires happen?$q$,$q$During the day, while people are at work$q$,$q$At dinner time, while people are cooking$q$,$q$At night, while people are asleep$q$,$q$On weekends, while people are out$q$,'C',$q$Most fatal house fires happen at night. People asleep can't smell smoke, so the alarm is what wakes them.$q$),
(7,$q$When should a check be recorded?$q$,$q$At the end of the month$q$,$q$Whenever you remember$q$,$q$Only if something fails$q$,$q$On the day, while you're at the property$q$,'D',$q$Log every check on the day. Records lock after the day they're made.$q$),
(2,$q$What type of smoke alarm is required in Queensland homes?$q$,$q$Ionisation$q$,$q$Photoelectric$q$,$q$Heat alarm$q$,$q$Any type that sounds$q$,'B',$q$Alarms must be photoelectric. Ionisation alarms must be replaced.$q$),
(2,$q$Which of these power sources does NOT meet the rules on its own?$q$,$q$Hardwired to mains power$q$,$q$Sealed 10-year non-removable battery$q$,$q$Hardwired with a battery backup$q$,$q$Replaceable 9V battery only$q$,'D',$q$Alarms must be hardwired, sealed 10-year battery, or a combination. A replaceable battery alone doesn't comply.$q$),
(1,$q$During a tenancy, who should test and clean the alarms at least every 12 months?$q$,$q$The local council$q$,$q$The tenant$q$,$q$Queensland Fire Department$q$,$q$No one until the lease ends$q$,'B',$q$Tenants should test and clean alarms at least once every 12 months and report faults.$q$),
(1,$q$Since when have Queensland rental properties had to meet the new smoke alarm rules?$q$,$q$1 January 2017$q$,$q$1 January 2020$q$,$q$1 January 2022$q$,$q$1 January 2027$q$,'C',$q$Rentals, and homes sold or leased, have had to comply since 1 January 2022. All homes must comply from 1 January 2027.$q$);
-- quiz length = 10, or fewer if a module has fewer questions so far
update modules m set questions = least(10,(select count(*) from questions q where q.module_id=m.id and q.published)) where not is_exam;

-- ---------- Guides (from SAM Register > Guides) ----------
insert into guides (title, category, sort_order, published, content) values
($q$How to test a smoke alarm$q$,'Testing & maintenance',1,true,$q$1. Let the household know you're testing, as the alarm is loud.
2. Press and hold the test button on the alarm for a few seconds until it sounds.
3. If the alarms are interconnected, check that every other alarm in the home sounds too.
4. If an alarm doesn't sound, try replacing the battery (if it has a replaceable one) and test again.
5. Still silent? Mark that alarm as Fail in your inspection and request an electrician.
6. Record each alarm's check in the inspection, then finalise it.

Never use a naked flame or smoke to test an alarm.$q$),
($q$How to clean a smoke alarm$q$,'Testing & maintenance',2,true,$q$Dust and insects in the sensing chamber are the most common cause of false alarms.

1. Gently vacuum around the vents of the alarm using a soft brush attachment.
2. Wipe the cover with a dry or slightly damp cloth. Don't use sprays, solvents or cleaning products.
3. Never paint over an alarm or cover it with stickers.
4. Test the alarm again once cleaned.
5. Tick Cleaned for that alarm in your inspection.$q$),
($q$Batteries and power sources explained$q$,'Testing & maintenance',3,true,$q$Smoke alarms use one of three power sources:

• Hardwired with battery backup: connected to mains power, with a backup battery. Any work on these must be done by a licensed electrician.
• 10-year lithium battery: a sealed battery that lasts the life of the alarm. When it runs down, the whole alarm is replaced.
• 9V battery: an older style with a replaceable battery. These generally aren't interconnected and don't meet the 2022 rules.

If an alarm chirps every minute or so, it usually means the battery is low. Replace flat or nearly flat batteries straight away.$q$),
($q$When to replace an alarm$q$,'Testing & maintenance',4,true,$q$Smoke alarms must be replaced before they are 10 years old. The date of manufacture is printed on the back of the alarm.

An alarm must also be replaced straight away if it fails when tested, or if it has been damaged, painted over or removed.

The portal works out each alarm's expiry from its manufacture date and highlights alarms that have expired or will expire within 12 months, so you can plan replacements ahead of time.$q$),
($q$Before a new tenancy or renewal: your checklist$q$,'Tenancies',5,true,$q$Within 30 days before a new tenancy starts, or an existing tenancy is renewed, the landlord or property manager must:

• Test every smoke alarm
• Clean every smoke alarm
• Replace any flat or nearly flat batteries
• Replace any alarm that has expired or doesn't work

These steps can't be handed over to the tenant. If the property is occupied, tenants must be given at least 48 hours' notice before entry.

Record the inspection in the portal on the day you do it, and finalise it to lock it into your permanent record.$q$),
($q$What tenants are responsible for$q$,'Tenancies',6,true,$q$During a tenancy, tenants must:

• Test and clean smoke alarms at least once every 12 months
• Replace flat or nearly flat batteries
• Tell the landlord or property manager if an alarm isn't working (other than a flat battery)

Neither landlords nor tenants may remove an alarm, or do anything that stops it working properly, such as painting it or covering it.

A smoke alarm that doesn't work can be treated as an emergency repair.$q$),
($q$Where smoke alarms must be installed$q$,'Upgrades & installation',7,true,$q$Queensland rental properties must have photoelectric smoke alarms that comply with AS 3786-2014, installed:

• In every bedroom
• In hallways that connect bedrooms to the rest of the home (or, if there's no hallway, between the bedrooms and the rest of that storey)
• On every storey, including storeys without bedrooms

All alarms must be interconnected, so when one sounds they all sound. There are also rules about placement, for example keeping alarms away from corners, light fittings, air-conditioning vents and ceiling fans. If you're unsure whether your alarms are in the right places, book a Compliance Review.$q$),
($q$Interconnected photoelectric alarms explained$q$,'Upgrades & installation',8,true,$q$Photoelectric alarms detect smoke by using a light beam inside the alarm. They respond well to the slow, smouldering fires that are common in homes, and are less prone to false alarms from cooking than older ionisation alarms.

Interconnected means every alarm in the home is linked, either by wiring or by radio frequency (wireless). When one alarm detects smoke, all of them sound, so everyone in the home is warned, wherever the fire starts.

If your property still has standalone or ionisation alarms, request an electrician for an upgrade quote.$q$),
($q$What to do if an alarm fails or keeps going off$q$,'Upgrades & installation',9,true,$q$If an alarm doesn't sound when tested, keeps going off without smoke, or is damaged:

1. Try cleaning it and, if it has a replaceable battery, fitting a new battery.
2. If the problem continues, record the alarm as Fail in the portal.
3. Contact us with the property and a description of the problem.
4. We'll arrange a licensed local electrician and send you a quote before any work goes ahead.

A non-working smoke alarm in a rental can count as an emergency repair, so don't leave it.$q$);

-- ---------- FAQ (from SAM Register > FAQ; Privacy Policy left out - it names the old Airtable/Zite setup and needs rewriting) ----------
insert into faq (question, category, sort_order, published, answer) values
($q$Do you send someone out to test my alarms?$q$,'Using the portal',0,true,$q$Not as standard. We're a maintenance and guidance service, not a testing company. Queensland law lets landlords, property managers and tenants carry out routine testing and cleaning themselves, so we give you step-by-step guides, check what you record, and keep an independent locked record. When an alarm needs installing, replacing or upgrading, we arrange a licensed local electrician for you.$q$),
($q$How do I record an inspection?$q$,'Using the portal',1,true,$q$Add your property and its alarms first. Then open the property and click Log a check. Answer each question, choose the result and submit. You need to have passed SAM Academy (all 7 modules and the final exam in the last 12 months) to log a check.$q$),
($q$How do I add a property or an alarm?$q$,'Using the portal',5,true,$q$Open Properties and click Add property. Then open the property and add each alarm: where it is, its type, power source and manufacture date. The expiry date is worked out for you as 10 years from manufacture.$q$),
($q$Who can see my records?$q$,'Using the portal',6,true,$q$Only you and the members of your team. Each landlord or agent sees only the properties, alarms and inspections linked to their own account or team.$q$),
($q$What are the smoke alarm rules for Queensland rentals?$q$,'Queensland requirements',7,true,$q$Since 1 January 2022, a Queensland dwelling that is leased, or sold, must have photoelectric smoke alarms that are interconnected and comply with Australian Standard AS 3786-2014. Alarms are required in every bedroom, in hallways that connect bedrooms to the rest of the home, and on every storey. From 1 January 2027 these rules apply to all Queensland homes. Check the Queensland Fire Department website for the current requirements.$q$),
($q$How often do alarms in a rental need to be checked?$q$,'Queensland requirements',8,true,$q$In Queensland, alarms in a rental must be tested and cleaned within 30 days before each new tenancy or tenancy renewal, and any flat or nearly flat batteries replaced. Alarms must be replaced before they are 10 years old, or sooner if they fail when tested. The portal shows each property's next check due date and flags alarms nearing expiry.$q$),
($q$How long is a compliance statement valid?$q$,'Records & certificates',9,true,$q$A compliance statement expires 12 months from the date of inspection, or at the next tenancy change or renewal, whichever comes first.$q$),
($q$How do I get an electrician?$q$,'Using the portal',10,true,$q$Contact us with the property, the work needed, any preferred dates and how to get access. We'll arrange a licensed local electrician and send you a quote before any work goes ahead.$q$),
($q$What does it cost?$q$,'Using the portal',11,true,$q$See the Pricing page on our website for current prices.$q$);

-- ---------- Refresher question check (used before each inspection) ----------
create function check_answer(p_question uuid, p_answer text)
returns table (correct boolean, right_answer text, explanation text)
language sql stable security definer set search_path = public as $$
  select q.correct = upper(p_answer), q.correct::text, q.explanation
  from questions q where q.id = p_question and q.published;
$$;

-- A random published question for the refresher (no answer included)
create function get_refresher()
returns table (id uuid, question text, option_a text, option_b text, option_c text, option_d text)
language sql volatile security definer set search_path = public as $$
  select id, question, option_a, option_b, option_c, option_d
  from questions where published order by random() limit 1;
$$;

commit;
