-- SAM step 13: course content from the finalised Framer site (word for word, with today's battery additions),
-- in the Framer module order. Quiz questions and quiz passes move with their module.
begin;
-- old order: 4 test & clean, 5 batteries, 6 staying safe  ->  new: 4 staying safe, 5 test & clean, 6 batteries
insert into modules (id, title, published) values (104,'tmp',false),(105,'tmp',false),(106,'tmp',false) on conflict do nothing;
update questions set module_id = case module_id when 4 then 105 when 5 then 106 when 6 then 104 else module_id end where module_id in (4,5,6);
update quiz_attempts set module_id = case module_id when 4 then 105 when 5 then 106 when 6 then 104 else module_id end where module_id in (4,5,6);
update questions set module_id = module_id - 100 where module_id > 100;
update quiz_attempts set module_id = module_id - 100 where module_id > 100;
delete from modules where id > 100;
update modules set title=$q$Why smoke alarms matter (and the law)$q$, summary=$q$What Queensland's smoke alarm laws require, who is responsible, and why your quick checks matter.$q$, content=$q$Most fatal house fires happen at night while people are asleep. Smoke, not flames, is what kills, and a working alarm gives people the minutes they need to get out.
Queensland has the strictest smoke alarm laws in Australia. Since 1 January 2022, every rental property, and every home that is sold or leased, must have alarms that meet the new standard. From 1 January 2027 every home in Queensland must comply.

![Timeline: 1 Jan 2017 law starts for new homes and major renovations; 1 Jan 2022 rentals and sales; 1 Jan 2027 every Queensland home.](https://framerusercontent.com/images/s29kPRi98Zv6U2qK63Hg2uDKwTw.svg)

### Who does what
![Who is responsible: owner/lessor tests and cleans within 30 days before a tenancy, replaces flat batteries and failed or 10-year-old alarms; tenant tests and cleans every 12 months, replaces flat batteries in older alarms and reports faults; nobody removes an alarm or battery except to replace it.](https://framerusercontent.com/images/ImOskyXOi0C15BZICvU84JjfNo.svg)

- **The lessor (owner)**, usually through you as property manager, must test and clean every alarm within **30 days before** a tenancy starts or is renewed, replace flat or nearly flat removable batteries, and replace any alarm that fails or is 10 or more years old
- **The tenant** should test and clean the alarms at least once every 12 months, replace flat batteries in older alarms, and tell you about any fault.

![Timeline of a tenancy: pre-tenancy test within 30 days before move-in, quick checks at routine and exit inspections, then another pre-tenancy test for the next lease.](https://framerusercontent.com/images/6ez7AzLovaxI7lipsdguMKmY6I.svg)

### Official sources
- Queensland Fire Department: smoke alarms
- Queensland Fire Department: smoke alarm FAQs
- Residential Tenancies Authority: smoke alarms in rentals$q$, key_points=$q$- Smoke, not flames, causes most fire deaths
- Rentals have had to meet the new rules since 1 Jan 2022
- Test and clean within 30 days before a tenancy starts or renews
- Tenants test and clean at least every 12 months
- Your quick checks catch problems early and create a record$q$, example=$q$Sam, a property manager, does a routine inspection in March. The lease renews in July. During the walk-through she presses each test button and notices the bedroom 2 alarm is silent. She logs it, the owner arranges a replacement, and in July the pre-tenancy test passes first time with no scramble.$q$, diagram_caption=null where id=1;
update modules set title=$q$The right alarm: type, standard and power$q$, summary=$q$How to tell if an alarm meets Queensland's requirements just by looking at it.$q$, content=$q$Every required alarm must tick **all** of these boxes:
![Back of a smoke alarm label showing where to find the type (photoelectric), standard (AS 3786-2014), power (10-year sealed lithium battery) and manufacture date.](https://framerusercontent.com/images/FOcu9AWmNcdNJ736xyHLBohlkc.svg)

1. **Photoelectric.** Photoelectric alarms detect visible smoke from smouldering fires, the most common type of fatal house fire. Ionisation alarms are no longer accepted and must be replaced. The type is usually printed on the back or side of the alarm.
2. **AS 3786-2014.** The alarm must comply with Australian Standard AS 3786-2014. Look for this marking on the alarm body. Older standards such as AS 3786-1993 don’t meet the rules.
3. **Power.** Hardwired to mains power, or a 10-year battery that can’t be removed, or a combination of both. Alarms with only a replaceable 9V battery don’t meet the rules.
4. **Interconnected.** Every required alarm must be connected to every other one, so when one sounds, they all sound. This can be wired or wireless.
5. **Not expired.** Every alarm must be less than 10 years old from its manufacture date.

![Pass or fail table: photoelectric passes, ionisation fails; AS 3786-2014 passes, older standards fail; mains or 10-year sealed battery passes, replaceable 9V only fails; interconnected passes, standalone fails; under 10 years passes, 10 years or more fails.](https://framerusercontent.com/images/YNqeoUIpjUTNfvYNNf6AbbZdij0.svg)

### Official sources
- Queensland Fire Department: what makes an alarm compliant
- Queensland Fire Department: smoke alarm FAQs$q$, key_points=$q$- Must be photoelectric
- Must be marked AS 3786-2014
- Hardwired or 10-year non-removable battery
- All required alarms interconnected
- Under 10 years old$q$, example=$q$You find an alarm labelled "Ionisation Smoke Alarm, AS 3786-1993, 9V battery". It fails on three counts: wrong type, old standard and removable battery. Log it as non-compliant and recommend replacement, even if it beeps when tested.$q$, diagram_caption=null where id=2;
update modules set title=$q$Where alarms must go$q$, summary=$q$Required locations on every storey and in every bedroom, plus where not to put alarms.$q$, content=$q$### Required locations
- On **every storey** of the home.
- In **every bedroom**.
- In the **hallway** that connects bedrooms to the rest of the home. If there’s no hallway, between the bedrooms and the rest of the storey.
- On a storey with no bedrooms, on the **most likely path out**.

![Two-storey townhouse: upstairs an alarm in each of three bedrooms and one in the hallway; downstairs, with no bedrooms, one alarm in the entry on the path to the front door. Five alarms, all interconnected.](https://framerusercontent.com/images/05mOwK3UZpHOSy5oKXOKEjUYTkU.svg)

![Two-bedroom, two-bathroom flat: one alarm in each bedroom and one in the hallway between the bedrooms and the living area. Three alarms, all interconnected.](https://framerusercontent.com/images/Hydfz6fagUhoMTV6dHpZbRbtHCY.svg)

![Single-storey home with two bedrooms and a study with a sofa bed: alarms in both bedrooms, the study and the hallway. No alarm in the open-plan kitchen above the cooktop.](https://framerusercontent.com/images/cCUnksst25uCaQGVRuRmdDAVy68.svg)

### Best position
On the ceiling, as close to the centre of the room or hallway as practical.
### Keep clear of
- Corners: at least 300 mm from where a wall meets the ceiling.
- Light fittings: at least 300 mm away.
- Air-conditioning vents: at least 400 mm away.
- Ceiling fans: at least 400 mm from the blades.
- Sloping ceilings: within 500 mm of the highest point, but not within 300 mm of the apex.

![Clearances: keep alarms 300 mm from walls and light fittings, 400 mm from air-conditioning vents and ceiling fan blades. On a sloping ceiling, within 500 mm of the highest point but not within 300 mm of the apex.](https://framerusercontent.com/images/d4XxZOw2ATEsAOmQAEvEOdS9C9E.svg)

### What counts as a bedroom
The law says every bedroom needs an alarm, but it doesn’t say what a bedroom is. Across the smoke alarm industry, a room is generally treated as a bedroom if it’s **big enough for a single bed, has a door and has a window**. It doesn’t matter what the plan or listing calls it, and a room someone already sleeps in counts too.
Rooms to look out for:
- **A study or office**, even with no bed in it
- **A rumpus, media or games room** with a door and window
- **A converted garage or granny flat** room
- **A sleep-out or enclosed verandah** with a door
- **A nursery** or any room a child sleeps in

Not sure? Note it as a possible bedroom and recommend an alarm. The owner makes the final call, and an electrician can confirm.
### Kitchens and bathrooms
Kitchens and bathrooms shouldn’t have smoke alarms. Smoke alarms detect cooking fumes and shower steam as well as smoke, so an alarm in or right next to these rooms keeps going off. People then pull the battery out or take the alarm down, which leaves the home unprotected.

**On a check:** if a tenant reports an alarm that keeps going off when they cook, note it. The alarm may need relocating by an electrician, or the rangehood may need to vent outside.
### On a check
Count the bedrooms and storeys, then make sure there’s an alarm in each place on the plan. A common miss is a study or rumpus room now used as a bedroom: it needs its own alarm.
### If you’re unsure
Recommend that an electrician comes out and checks. This course covers the common situations, not every one. Electricians work in all kinds of homes and can give an opinion on unusual layouts, such as split-level homes, converted garages and granny flats, or rooms with raked ceilings.$q$, key_points=$q$- Every storey, every bedroom, connecting hallways
- No bedrooms on a storey? Put one on the exit path
- Ceiling, near the centre
- 300 mm from corners and lights, 400 mm from AC vents and fan blades
- Watch for rooms being used as bedrooms$q$, example=$q$A two-storey townhouse: 3 bedrooms upstairs off a hallway, and living areas downstairs with no bedrooms. Alarms needed: one in each bedroom (3), one in the upstairs hallway (1), and one downstairs on the path to the front door (1). Total: 5, all interconnected. If the owner has turned the downstairs study into a 4th bedroom, that's 6.$q$, diagram_caption=null where id=3;
update modules set title=$q$Staying safe: ladders and electrical$q$, summary=$q$How to do checks without hurting yourself or anyone else.$q$, content=$q$Falls from ladders are one of the most common causes of workplace injury. Most alarm checks can be done from the floor with a test pole, so use one where you can.
### If you use a ladder
- Use a stable step ladder, fully opened and locked, on firm, level ground.
- Keep three points of contact (two feet and one hand) at all times.
- Don’t stand on the top step or the top cap.
- Don’t overreach. Climb down and move the ladder instead.
- Never stand on chairs, tables or beds.
- Check your agency’s work health and safety policy for any extra rules.

![Step ladder safety: use a test pole where you can; ladder fully open and locked on firm, level ground; three points of contact; never stand on the top step or cap, don’t overreach, never stand on furniture.](https://framerusercontent.com/images/kT1rmfWz88qFhNksvpL7RIsG9o.svg)

### Electrical safety
- Hardwired alarms are connected to 240V mains power. Only a licensed electrician can install, remove or replace them.
- Never open an alarm, pull it off its base or touch exposed wiring.
- If an alarm is hanging off the ceiling, has scorch marks or smells of burning, don’t touch it. Note it and arrange an electrician urgently.

![If an alarm is hanging off the ceiling, has scorch marks or smells of burning, don’t touch it: keep people away, note it and arrange an electrician urgently.](https://framerusercontent.com/images/xSOTIgfcbEgTC52SVUeOsIOrBf4.svg)

### Occupants
Let everyone in the house know before you test. Protect your own hearing: wear ear plugs or ear muffs while testing.
### Official sources
- Queensland Government: buying and installing smoke alarms
- Queensland Fire Department: smoke alarm FAQs$q$, key_points=$q$- Use a test pole where possible
- Ladder fully open, on level ground, 3 points of contact
- Never stand on the top step or on furniture
- Only licensed electricians touch hardwired alarms
- Damaged or scorched alarm: don’t touch, escalate$q$, example=$q$In a stairwell the alarm is 4 metres up and your step ladder won't stand safely on the stairs. Don't improvise. Test it with an extendable test pole from the landing, or record that it couldn't be reached and arrange a contractor.$q$, diagram_caption=null where id=4;
update modules set title=$q$How to test and clean an alarm$q$, summary=$q$A step-by-step routine you can do in a couple of minutes per property.$q$, content=$q$### Before you start
Tell anyone home, and neighbours in attached units, that you’re about to test the alarms. They’re loud: about 85 decibels. Wear ear plugs or ear muffs while you test.
### Step by step
1. **Look.** Check the alarm is there, undamaged, not painted over, not covered and not blocked. Check the indicator light is on or flashing as normal.
2. **Read the label.** Note the type, standard (AS 3786-2014) and manufacture date.
3. **Press and hold** the test button until the alarm sounds, usually 3 to 5 seconds. Use a test pole if you can’t reach safely.
4. **Listen for the others.** While it sounds, every other alarm in the home should sound too. If one doesn’t, the interconnection is faulty.
5. **Clean.** Gently vacuum or dust the vents with a soft brush. Never paint or spray chemicals on an alarm.
6. **Battery.** If the alarm has a replaceable battery, including a 9V backup in a hardwired alarm, and it’s flat, chirping or the date on it is more than 6 months old, replace it and write today’s date on the new one. See Module 6 for how.
7. **Record it.** Log the result for each alarm before you leave.

![Six steps: look, read the label, press test for 3 to 5 seconds, listen for the other alarms, clean with a vacuum or soft brush, record each alarm.](https://framerusercontent.com/images/P2YH7xndoikAQ0GknEw0PQjRVCs.svg)

![Interconnection check: press one alarm and every alarm should sound. If one stays silent, record its interconnection as not passed.](https://framerusercontent.com/images/ZAajNFjGVrIakgCBPjM0X4lQ.svg)

### Don’t
- Don’t use smoke, flame or a lighter to test, unless the manufacturer’s instructions specifically say to.
- Don’t open or touch the wiring of a hardwired alarm. Only a licensed electrician can install or replace those.

### Official sources
- Queensland Fire Department: smoke alarm FAQs
- Residential Tenancies Authority: smoke alarms in rentals$q$, key_points=$q$- Warn occupants before testing
- Look, read the label, press, listen, clean, log
- All alarms must sound together
- No smoke or flame tests
- Never touch hardwired wiring$q$, example=$q$At a 3-bedroom house you press the test button in bedroom 1. Bedrooms 1, 2 and 3 sound, but the hallway alarm stays silent. Each alarm works on its own, but the interconnection has failed. Record the hallway alarm's interconnection check as not passed and flag "Minor fix needed" so an electrician can fix it.$q$, diagram_caption=null where id=5;
update modules set title=$q$Batteries, expiry and reading the label$q$, summary=$q$How to work out an alarm's age and when it must be replaced.$q$, content=$q$### The 10-year rule
Every smoke alarm must be replaced within 10 years of its manufacture date, even if it still works. Sensors degrade over time.
### Finding the date
The manufacture date is printed on the back or side of the alarm, often marked "MFD" or "Date of manufacture", or as a stamp like 03/2019. Some alarms also print a "Replace by" date. If only the year is shown, assume January of that year.
### Working it out
Replace-by date = manufacture date + 10 years. Made March 2019 means replace by March 2029.
![Timeline: an alarm made March 2019 must be replaced by March 2029. In November 2026 it passes; from March 2028 it’s in its last 12 months and should be flagged.](https://framerusercontent.com/images/zV0jnHTjQfqv3EAkS8lde52CRns.svg)

### Batteries
- Compliant alarms are hardwired or have a sealed 10-year battery, so the whole alarm is replaced at end of life.
- Many hardwired alarms have a backup battery in case the power goes off. If it’s a replaceable 9V battery, you can change it yourself. Follow the manufacturer’s instructions for that model: some have a battery drawer, others twist off their base. Only take an alarm off its base if it’s designed to come off that way.
- Never touch the wiring or the base of a hardwired alarm. If an alarm is hanging down, loose or damaged, don’t touch it. Arrange an electrician.
- Older alarms with a removable battery don’t meet the rules. Until they’re replaced, a flat or nearly flat battery must be replaced. A chirping alarm usually means a low battery.

![Power sources: hardwired with backup battery and sealed 10-year battery alarms are compliant and replaced whole after 10 years; removable 9V battery only alarms don’t meet the rules.](https://framerusercontent.com/images/aGPdEe6UGZjlhbHIrV6ms5WxBxI.svg)

### Date every battery
When you fit a new battery, write the date on it with a permanent marker. A small white sticker with the date written on it is easier to read next time. Then anyone checking the alarm can see straight away how old the battery is.

At each check, replace any replaceable battery that is more than 6 months old, even if it still works. The next check could be up to a year away, so a battery that is already 6 months old might not last until then.

### Flag early
If an alarm will expire within the next 12 months, note it on your check so the owner can plan a replacement.
### Official sources
- Queensland Fire Department: smoke alarms
- Queensland Fire Department: smoke alarm FAQs$q$, key_points=$q$- Replace within 10 years of manufacture
- Look for "MFD" or a date stamp on the back or side
- Year only? Assume January
- 9V backup in a hardwired alarm? You can change it, but never touch the wiring
- Replace replaceable batteries older than 6 months at each check
- Write the date on every new battery (a white sticker makes it easy to read)
- Chirping usually means a low battery
- Flag alarms expiring within 12 months$q$, example=$q$It's November 2026. Alarm A shows MFD 2015: replace by January 2025, so it's expired and must be replaced now. Alarm B shows MFD 06/2017: replace by June 2027, so it passes today but expires within 12 months. Note it so the owner can replace it before the next lease.$q$, diagram_caption=null where id=6;
update modules set title=$q$Recording the check and what to do next$q$, summary=$q$How to log each check properly and act on what you find.$q$, content=$q$A check that isn’t written down is hard to prove. Log every check on the day, while you’re still at the property.
### For each check, record
- The property, date and occasion (routine inspection, entry, exit and so on).
- For each alarm: its location, the visual and physical checks that passed, and a photo if anything looks wrong.
- An overall result.

### Choosing the result
- **All OK:** every alarm is present, compliant and passed every check.
- **Minor fix needed:** something needs attention but the home is still protected, such as an alarm expiring within 12 months, or a flat battery in an older alarm that you replaced on the spot.
- **Full inspection needed:** something serious, such as a missing or failed alarm, no interconnection, an ionisation or expired alarm, or a damaged hardwired alarm.

![Flowchart: if every alarm is present, compliant and passed, the result is All OK. If any alarm is missing or failed, not interconnected, ionisation or expired, or a damaged hardwired alarm, it’s Full inspection needed. Otherwise it’s Minor fix needed.](https://framerusercontent.com/images/L60k2Agj07RO6LzwDFqkLmZDVhM.svg)

### After the check
- Full inspection needed: tell the owner the same day and arrange a qualified technician or electrician.
- Minor fix: let the owner know and agree a date.
- Records can’t be edited after the day, so they’re a reliable history for owners, insurers and tribunals.

### Official sources
- Residential Tenancies Authority: smoke alarms in rentals
- Queensland Fire Department: smoke alarm FAQs$q$, key_points=$q$- Log on the day, at the property
- One result per alarm, plus an overall result
- All OK / Minor fix / Full inspection
- Serious issues: tell the owner the same day
- Records lock after the day they’re made$q$, example=$q$At an exit inspection you find the bedroom 3 alarm missing (the tenant removed it) and the hallway alarm expired in 2025. Result: Full inspection needed. You add photos, note "Bedroom 3 alarm missing, hallway alarm MFD 2015", and email the owner before the new tenant's pre-tenancy test.$q$, diagram_caption=null where id=7;
update modules m set questions = least(10,(select count(*) from questions q where q.module_id=m.id and q.published)) where not is_exam;
commit;
