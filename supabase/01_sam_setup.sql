-- =====================================================================
-- SAM – database setup (step 1)
-- Run once in the NEW "SAM" Supabase project: SQL Editor > New query >
-- paste all of this > Run. Safe to run on an empty project only.
-- =====================================================================

-- ---------- PEOPLE ----------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  name        text,
  role        text not null default 'property_manager'
              check (role in ('property_manager','landlord','electrician','tenant','admin')),
  phone       text,
  company     text,
  licence_no  text,                       -- electricians only
  created_at  timestamptz not null default now()
);

-- New sign-up -> profile row created automatically (name/role from the sign-up form)
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, name, role, company, licence_no)
  values (new.id, new.email,
          new.raw_user_meta_data->>'name',
          coalesce(nullif(new.raw_user_meta_data->>'role',''), 'property_manager'),
          new.raw_user_meta_data->>'company',
          new.raw_user_meta_data->>'licence_no');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- TEAMS (self-service) -------------------------------------
create table teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid references profiles,
  created_at timestamptz not null default now()
);
create table team_members (
  team_id uuid references teams on delete cascade,
  user_id uuid references profiles on delete cascade,
  primary key (team_id, user_id)
);
create table team_invites (
  team_id    uuid references teams on delete cascade,
  email      text not null,
  invited_by uuid references profiles,
  created_at timestamptz not null default now(),
  primary key (team_id, email)
);

-- ---------- PROPERTIES ------------------------------------------------
create table properties (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles default auth.uid(),
  team_id          uuid references teams on delete set null,
  street           text not null,
  suburb           text,
  state            text not null default 'QLD',
  postcode         text,
  property_type    text,
  bedrooms         int,
  storeys          int,
  access_notes     text,
  owner_name       text,            -- name on the compliance certificate
  photo_path       text,            -- file in Storage
  subscription_end date,
  created_at       timestamptz not null default now()
);

create table tenants (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties on delete cascade,
  name        text not null,
  phone       text,
  emails      text[] not null default '{}',   -- main + extra tenants
  lease_start date,
  lease_end   date,
  vacate_date date,
  notes       text,
  created_at  timestamptz not null default now()
);

create table alarms (
  id                uuid primary key default gen_random_uuid(),
  property_id       uuid not null references properties on delete cascade,
  location          text not null,
  alarm_type        text,     -- Photoelectric / Ionisation / ...
  power_source      text,     -- 240V / 10-year lithium / ...
  interconnected    text,
  manufacture_month int check (manufacture_month between 1 and 12),
  manufacture_year  int,
  expiry_date       date generated always as
                    ((make_date(manufacture_year, coalesce(manufacture_month,1), 1)
                      + interval '10 years')::date) stored,
  brand             text,
  model             text,
  as3786            text,     -- Yes / No / Unsure
  photo_path        text,
  created_at        timestamptz not null default now()
);

create table inspections (
  id                 uuid primary key default gen_random_uuid(),
  property_id        uuid not null references properties on delete cascade,
  inspected_by       uuid not null references profiles default auth.uid(),
  inspection_date    date not null default current_date,
  submitted_at       timestamptz not null default now(),
  check_type         text not null default 'manager'
                     check (check_type in ('manager','licensed')),
  assessment         text check (assessment in ('Compliant','Not compliant')),
  inspector_override boolean not null default false,
  notes              text,
  answers            jsonb not null default '{}',  -- Q1..Q4, C1..C7, declaration
  alarm_snapshot     jsonb,                        -- alarms as they were on the day
  refresher_question uuid,
  refresher_correct  boolean,
  certificate_path   text,
  issues_report_path text,
  credit_id          uuid
);

-- ---------- CREDITS / QR STICKERS ------------------------------------
create table credits (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null default upper(substr(md5(random()::text),1,4)||'-'||substr(md5(random()::text),1,4)),
  label             text,
  credit_type       text,
  purchased_by      uuid references profiles,
  stripe_payment_id text unique,
  redeemed_at       timestamptz,
  property_id       uuid references properties,
  notes             text,
  created_at        timestamptz not null default now()
);

create table qr_codes (
  code        text primary key,               -- e.g. SAM-7K3F9Q
  property_id uuid references properties on delete set null,
  assigned_by uuid references profiles,
  printed     boolean not null default false,
  linked_at   timestamptz
);

-- ---------- SAM ACADEMY ----------------------------------------------
create table modules (
  id        int primary key,          -- 1-7 modules, 8 = final exam
  title     text not null,
  summary   text,
  web_link  text,                     -- lesson page on the Framer site
  is_exam   boolean not null default false,
  questions int not null default 10,  -- how many questions per attempt
  pass_mark int not null default 100, -- percent
  published boolean not null default true
);

create table questions (
  id          uuid primary key default gen_random_uuid(),
  module_id   int not null references modules,
  question    text not null,
  option_a    text, option_b text, option_c text, option_d text,
  correct     char(1) not null check (correct in ('A','B','C','D')),
  explanation text,
  published   boolean not null default true
);

create table quiz_attempts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles default auth.uid(),
  module_id  int not null references modules,
  score      int not null,
  total      int not null,
  passed     boolean not null,
  created_at timestamptz not null default now()
);

-- ---------- HELP CONTENT ---------------------------------------------
create table guides (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  summary    text,
  content    text,
  category   text,
  audience   text[],
  sort_order int,
  published  boolean not null default false
);
create table faq (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text,
  category   text,
  audience   text[],
  guide_id   uuid references guides,
  sort_order int,
  published  boolean not null default false
);

-- =====================================================================
-- HELPER FUNCTIONS
-- =====================================================================
-- Teams the signed-in user belongs to (avoids RLS loops)
create function my_team_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select team_id from team_members where user_id = auth.uid();
$$;

-- Can the signed-in user see this property? (owner or same team)
create function can_access_property(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from properties pr
    where pr.id = p
      and (pr.user_id = auth.uid()
           or pr.team_id in (select my_team_ids()))
  );
$$;

-- Passed all published modules AND the final exam in the last 12 months?
create function is_approved(u uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$
  select
    (select role from profiles where id = u) = 'electrician'
    or (
      not exists (
        select 1 from modules m
        where m.published and not m.is_exam
          and not exists (select 1 from quiz_attempts a
                          where a.user_id = u and a.module_id = m.id and a.passed))
      and exists (
        select 1 from quiz_attempts a join modules m on m.id = a.module_id
        where a.user_id = u and m.is_exam and a.passed
          and a.created_at > now() - interval '12 months')
    );
$$;

-- Progress table for the portal: one row per module/exam for the signed-in user
create view my_progress with (security_invoker = true) as
select m.id as module_id, m.title, m.is_exam, m.web_link,
       count(a.id)                       as attempts,
       coalesce(max(a.score*100/nullif(a.total,0)),0) as best_score,
       max(a.created_at) filter (where a.passed) as passed_at,
       case when bool_or(a.passed) then 'Passed'
            when count(a.id) > 0 then 'Attempted'
            else 'Not started' end       as status
from modules m
left join quiz_attempts a on a.module_id = m.id and a.user_id = auth.uid()
where m.published
group by m.id order by m.id;

-- Get a quiz WITHOUT the answers (exam draws from all modules)
create function get_quiz(p_module int)
returns table (id uuid, question text, option_a text, option_b text, option_c text, option_d text)
language sql volatile security definer set search_path = public as $$
  select q.id, q.question, q.option_a, q.option_b, q.option_c, q.option_d
  from questions q, modules m
  where m.id = p_module and q.published
    and (q.module_id = p_module or m.is_exam)
  order by random()
  limit (select questions from modules where id = p_module);
$$;

-- Mark a quiz on the server. p_answers = {"<question id>":"A", ...}
create function submit_quiz(p_module int, p_answers jsonb)
returns table (score int, total int, passed boolean)
language plpgsql security definer set search_path = public as $$
declare v_total int; v_score int; v_needed int; v_mark int; v_pass boolean;
begin
  select questions, pass_mark into v_needed, v_mark from modules where id = p_module;
  select count(*), count(*) filter (where q.correct = upper(p_answers->>q.id::text))
    into v_total, v_score
  from questions q
  where p_answers ? q.id::text;
  if v_total < v_needed then raise exception 'Please answer every question.'; end if;
  v_pass := v_score * 100 >= v_mark * v_total;
  insert into quiz_attempts (user_id, module_id, score, total, passed)
  values (auth.uid(), p_module, v_score, v_total, v_pass);
  return query select v_score, v_total, v_pass;
end $$;

-- Team self-service
create function create_team(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  insert into teams (name, created_by) values (p_name, auth.uid()) returning id into t;
  insert into team_members values (t, auth.uid());
  return t;
end $$;

create function accept_invite(p_team uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from team_invites i join profiles p on lower(p.email) = lower(i.email)
                 where i.team_id = p_team and p.id = auth.uid()) then
    raise exception 'No invite found for this team.';
  end if;
  insert into team_members values (p_team, auth.uid()) on conflict do nothing;
  delete from team_invites i using profiles p
   where i.team_id = p_team and p.id = auth.uid() and lower(i.email) = lower(p.email);
end $$;

-- =====================================================================
-- ROW LEVEL SECURITY – everyone sees only their own / their team's data
-- =====================================================================
alter table profiles      enable row level security;
alter table teams         enable row level security;
alter table team_members  enable row level security;
alter table team_invites  enable row level security;
alter table properties    enable row level security;
alter table tenants       enable row level security;
alter table alarms        enable row level security;
alter table inspections   enable row level security;
alter table credits       enable row level security;
alter table qr_codes      enable row level security;
alter table modules       enable row level security;
alter table questions     enable row level security;  -- no policy = answers hidden
alter table quiz_attempts enable row level security;
alter table guides        enable row level security;
alter table faq           enable row level security;

-- Profiles: see yourself + your team mates; edit your own (not your role)
create policy "profile read" on profiles for select using (
  id = auth.uid() or id in (select tm.user_id from team_members tm
    where tm.team_id in (select my_team_ids())));
create policy "profile edit" on profiles for update using (id = auth.uid());
revoke update on profiles from authenticated;
grant update (name, phone, company, licence_no) on profiles to authenticated;

-- Teams
create policy "team read" on teams for select using (
  id in (select my_team_ids())
  or id in (select team_id from team_invites
            where lower(email) = lower((select email from profiles where id = auth.uid()))));
create policy "team rename" on teams for update using (
  id in (select my_team_ids()));
create policy "members read" on team_members for select using (
  team_id in (select my_team_ids()));
create policy "leave team" on team_members for delete using (user_id = auth.uid());
create policy "invites read" on team_invites for select using (
  team_id in (select my_team_ids())
  or lower(email) = lower((select email from profiles where id = auth.uid())));
create policy "invite someone" on team_invites for insert with check (
  team_id in (select my_team_ids()));
create policy "cancel invite" on team_invites for delete using (
  team_id in (select my_team_ids()));

-- Properties and everything hanging off them
create policy "property read"   on properties for select using (can_access_property(id));
create policy "property add"    on properties for insert with check (user_id = auth.uid());
create policy "property edit"   on properties for update using (can_access_property(id));
create policy "property delete" on properties for delete using (user_id = auth.uid());

create policy "tenant all" on tenants for all
  using (can_access_property(property_id)) with check (can_access_property(property_id));
create policy "alarm all" on alarms for all
  using (can_access_property(property_id)) with check (can_access_property(property_id));

-- Inspections: read if you can see the property; only APPROVED users can submit
create policy "inspection read" on inspections for select using (can_access_property(property_id));
create policy "inspection add"  on inspections for insert with check (
  inspected_by = auth.uid() and can_access_property(property_id) and is_approved());

-- Credits / QR: see your own
create policy "credit read" on credits  for select using (purchased_by = auth.uid());
create policy "qr read"     on qr_codes for select using (
  assigned_by = auth.uid() or (property_id is not null and can_access_property(property_id)));

-- Academy
create policy "modules read"  on modules       for select using (published);
create policy "attempts read" on quiz_attempts for select using (user_id = auth.uid());

-- Help content is public
create policy "guides read" on guides for select using (published);
create policy "faq read"    on faq    for select using (published);

-- =====================================================================
-- STARTER DATA – module list (titles can be edited later in Table Editor)
-- =====================================================================
insert into modules (id, title, is_exam, questions) values
  (1,'Module 1',false,10),(2,'Module 2',false,10),(3,'Module 3',false,10),
  (4,'Module 4',false,10),(5,'Module 5',false,10),(6,'Module 6',false,10),
  (7,'Module 7',false,10),(8,'Final exam',true,15);
