-- SAM step 5: lesson content for each module (from Airtable), public website access, contact messages
alter table modules add column if not exists content text, add column if not exists key_points text, add column if not exists example text, add column if not exists diagram_caption text;
update modules set content=$q$Most fatal house fires happen at night while people are asleep. Smoke, not flames, is what kills, and a working alarm gives people the minutes they need to get out.

Queensland has the strictest smoke alarm laws in Australia. Since 1 January 2022, every rental property, and every home that is sold or leased, must have alarms that meet the new standard. From 1 January 2027 every home in Queensland must comply.

### Who does what

- **The lessor (owner)**, usually through you as property manager, must test and clean every alarm within **30 days before** a tenancy starts or is renewed, replace flat or nearly flat removable batteries, and replace any alarm that fails or is 10 or more years old.
- **The tenant** should test and clean the alarms at least once every 12 months, replace flat batteries in older alarms, and tell you about any fault.
- **Nobody** may remove an alarm or its battery, except to replace it.

### Where you come in

This course trains you to do a quick, reliable check every time you're at a property: routine inspections, entry and exit. These checks don't replace the pre-tenancy test, but they catch problems early and build a written record that protects you, the owner and the tenant.$q$, key_points=$q$- Smoke, not flames, causes most fire deaths
- Rentals have had to meet the new rules since 1 Jan 2022
- Test and clean within 30 days before a tenancy starts or renews
- Tenants test and clean at least every 12 months
- Your quick checks catch problems early and create a record$q$, example=$q$Sam, a property manager, does a routine inspection in March. The lease renews in July. During the walk-through she presses each test button and notices the bedroom 2 alarm is silent. She logs it, the owner arranges a replacement, and in July the pre-tenancy test passes first time with no scramble.$q$, diagram_caption=null where id=1;
update modules set content=$q$Every required alarm must tick **all** of these boxes:

1. **Photoelectric.** Photoelectric alarms detect visible smoke from smouldering fires, the most common type of fatal house fire. Ionisation alarms are no longer accepted and must be replaced. The type is usually printed on the back or side of the alarm.
2. **AS 3786-2014.** The alarm must comply with Australian Standard AS 3786-2014. Look for this marking on the alarm body. Older standards such as AS 3786-1993 don't meet the rules.
3. **Power.** Hardwired to mains power, or a 10-year battery that can't be removed, or a combination of both. Alarms with only a replaceable 9V battery don't meet the rules.
4. **Interconnected.** Every required alarm must be connected to every other one, so when one sounds, they all sound. This can be wired or wireless.
5. **Not expired.** Every alarm must be less than 10 years old from its manufacture date.$q$, key_points=$q$- Must be photoelectric
- Must be marked AS 3786-2014
- Hardwired or 10-year non-removable battery
- All required alarms interconnected
- Under 10 years old$q$, example=$q$You find an alarm labelled "Ionisation Smoke Alarm, AS 3786-1993, 9V battery". It fails on three counts: wrong type, old standard and removable battery. Log it as non-compliant and recommend replacement, even if it beeps when tested.$q$, diagram_caption=$q$Check the label: type, standard and power source$q$ where id=2;
update modules set content=$q$### Required locations

- On **every storey** of the home.
- In **every bedroom**.
- In the **hallway** that connects bedrooms to the rest of the home. If there's no hallway, between the bedrooms and the rest of the storey.
- On a storey with no bedrooms, on the **most likely path out**.

### Best position

On the ceiling, as close to the centre of the room or hallway as practical.

### Keep clear of

- Corners: at least 300 mm from where a wall meets the ceiling.
- Light fittings: at least 300 mm away.
- Air-conditioning vents: at least 400 mm away.
- Ceiling fans: at least 400 mm from the blades.
- Sloping ceilings: within 500 mm of the highest point, but not within 300 mm of the apex.

### On a check

Count the bedrooms and storeys, then make sure there's an alarm in each place on the plan. A common miss is a study or rumpus room now used as a bedroom: it needs its own alarm.$q$, key_points=$q$- Every storey, every bedroom, connecting hallways
- No bedrooms on a storey? Put one on the exit path
- Ceiling, near the centre
- 300 mm from corners and lights, 400 mm from AC vents and fan blades
- Watch for rooms being used as bedrooms$q$, example=$q$A two-storey townhouse: 3 bedrooms upstairs off a hallway, and living areas downstairs with no bedrooms. Alarms needed: one in each bedroom (3), one in the upstairs hallway (1), and one downstairs on the path to the front door (1). Total: 5, all interconnected. If the owner has turned the downstairs study into a 4th bedroom, that's 6.$q$, diagram_caption=$q$A single-storey, 3-bedroom home with separate living areas needs 5 interconnected alarms$q$ where id=3;
update modules set content=$q$### Before you start

Tell anyone home, and neighbours in attached units, that you're about to test the alarms. They're loud: about 85 decibels.

### Step by step

1. **Look.** Check the alarm is there, undamaged, not painted over, not covered and not blocked. Check the indicator light is on or flashing as normal.
2. **Read the label.** Note the type, standard (AS 3786-2014) and manufacture date.
3. **Press and hold** the test button until the alarm sounds, usually 3 to 5 seconds. Use a test pole if you can't reach safely.
4. **Listen for the others.** While it sounds, every other alarm in the home should sound too. If one doesn't, the interconnection is faulty.
5. **Clean.** Gently vacuum or dust the vents with a soft brush. Never paint or spray chemicals on an alarm.
6. **Record it.** Log the result for each alarm before you leave.

### Don't

- Don't use smoke, flame or a lighter to test, unless the manufacturer's instructions specifically say to.
- Don't open or touch the wiring of a hardwired alarm. Only a licensed electrician can install or replace those.$q$, key_points=$q$- Warn occupants before testing
- Look, read the label, press, listen, clean, log
- All alarms must sound together
- No smoke or flame tests
- Never touch hardwired wiring$q$, example=$q$At a 3-bedroom house you press the test button in bedroom 1. Bedrooms 1, 2 and 3 sound, but the hallway alarm stays silent. Each alarm works on its own, but the interconnection has failed. Record the hallway alarm's interconnection check as not passed and flag "Minor fix needed" so an electrician can fix it.$q$, diagram_caption=$q$The check for every alarm$q$ where id=4;
update modules set content=$q$### The 10-year rule

Every smoke alarm must be replaced within 10 years of its manufacture date, even if it still works. Sensors degrade over time.

### Finding the date

The manufacture date is printed on the back or side of the alarm, often marked "MFD" or "Date of manufacture", or as a stamp like 03/2019. Some alarms also print a "Replace by" date. If only the year is shown, assume January of that year.

### Working it out

Replace-by date = manufacture date + 10 years. Made March 2019 means replace by March 2029.

### Batteries

- Compliant alarms are hardwired or have a sealed 10-year battery, so the whole alarm is replaced at end of life.
- Older alarms with a removable battery don't meet the rules. Until they're replaced, a flat or nearly flat battery must be replaced. A chirping alarm usually means a low battery.

### Flag early

If an alarm will expire within the next 12 months, note it on your check so the owner can plan a replacement.$q$, key_points=$q$- Replace within 10 years of manufacture
- Look for "MFD" or a date stamp on the back or side
- Year only? Assume January
- Chirping usually means a low battery
- Flag alarms expiring within 12 months$q$, example=$q$It's November 2026. Alarm A shows MFD 2015: replace by January 2025, so it's expired and must be replaced now. Alarm B shows MFD 06/2017: replace by June 2027, so it passes today but expires within 12 months. Note it so the owner can replace it before the next lease.$q$, diagram_caption=$q$Find the manufacture date and add 10 years$q$ where id=5;
update modules set content=$q$Falls from ladders are one of the most common causes of workplace injury. Most alarm checks can be done from the floor with a test pole, so use one where you can.

### If you use a ladder

- Use a stable step ladder, fully opened and locked, on firm, level ground.
- Keep three points of contact (two feet and one hand) at all times.
- Don't stand on the top step or the top cap.
- Don't overreach. Climb down and move the ladder instead.
- Never stand on chairs, tables or beds.
- Check your agency's work health and safety policy for any extra rules.

### Electrical safety

- Hardwired alarms are connected to 240V mains power. Only a licensed electrician can install, remove or replace them.
- Never open an alarm, pull it off its base or touch exposed wiring.
- If an alarm is hanging off the ceiling, has scorch marks or smells of burning, don't touch it. Note it and arrange an electrician urgently.

### Occupants

Ask about anyone with hearing loss or a medical condition before testing. Alarms are very loud.$q$, key_points=$q$- Use a test pole where possible
- Ladder fully open, on level ground, 3 points of contact
- Never stand on the top step or on furniture
- Only licensed electricians touch hardwired alarms
- Damaged or scorched alarm: don't touch, escalate$q$, example=$q$In a stairwell the alarm is 4 metres up and your step ladder won't stand safely on the stairs. Don't improvise. Test it with an extendable test pole from the landing, or record that it couldn't be reached and arrange a contractor.$q$, diagram_caption=$q$Use a test pole where you can; if you use a ladder, use it properly$q$ where id=6;
update modules set content=$q$A check that isn't written down is hard to prove. Log every check on the day, while you're still at the property.

### For each check, record

- The property, date and occasion (routine inspection, entry, exit and so on).
- For each alarm: its location, the visual and physical checks that passed, and a photo if anything looks wrong.
- An overall result.

### Choosing the result

- **All OK:** every alarm is present, compliant and passed every check.
- **Minor fix needed:** something needs attention but the home is still protected, such as an alarm expiring within 12 months, or a flat battery in an older alarm that you replaced on the spot.
- **Full inspection needed:** something serious, such as a missing or failed alarm, no interconnection, an ionisation or expired alarm, or a damaged hardwired alarm.

### After the check

- Full inspection needed: tell the owner the same day and arrange a qualified technician or electrician.
- Minor fix: let the owner know and agree a date.
- Records can't be edited after the day, so they're a reliable history for owners, insurers and tribunals.$q$, key_points=$q$- Log on the day, at the property
- One result per alarm, plus an overall result
- All OK / Minor fix / Full inspection
- Serious issues: tell the owner the same day
- Records lock after the day they're made$q$, example=$q$At an exit inspection you find the bedroom 3 alarm missing (the tenant removed it) and the hallway alarm expired in 2025. Result: Full inspection needed. You add photos, note "Bedroom 3 alarm missing, hallway alarm MFD 2015", and email the owner before the new tenant's pre-tenancy test.$q$, diagram_caption=null where id=7;

-- Visitors who aren't logged in can read the course, guides and FAQ (not the question bank)
grant usage on schema public to anon;
grant select on modules, guides, faq to anon;

-- Help page contact form
create table contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamptz not null default now()
);
alter table contact_messages enable row level security;
create policy "anyone can send" on contact_messages for insert to anon, authenticated with check (true);
grant insert on contact_messages to anon, authenticated;
revoke select, update, delete on contact_messages from authenticated;
