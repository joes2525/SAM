// SAM – Smoke Alarm Maintenance. One-page app on Supabase.
const C = window.SAM_CONFIG;
const sb = supabase.createClient(C.url, C.key);
let me = null;          // signed-in profile
let approved = false;   // passed SAM Academy (or electrician)

// ---------- small helpers ----------
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = () => new Date().toISOString().slice(0, 10);
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x.toISOString().slice(0, 10); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const fmt = d => d ? new Date(d).toLocaleDateString('en-AU', {day:'numeric', month:'short', year:'numeric'}) : '';
const addr = p => [p.street, p.suburb, p.state, p.postcode].filter(Boolean).join(', ');
const opts = (list, val) => list.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('');
const formData = f => Object.fromEntries([...new FormData(f)].map(([k, v]) => [k, v === '' ? null : v]));
function toast(msg) { setTimeout(unbusy, 0); const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), 3500); }
function unbusy() { document.querySelectorAll('.btn.busy').forEach(b => { b.classList.remove('busy'); b.disabled = false; }); }
function fail(error) { if (error) { unbusy(); toast(error.message); throw error; } }
// Show a spinner on the button while a form is saving
document.addEventListener('submit', e => {
  const b = e.submitter; if (!b || !b.classList.contains('btn')) return;
  setTimeout(() => { if (!e.defaultPrevented || !b.isConnected) return; b.classList.add('busy'); b.disabled = true; setTimeout(unbusy, 10000); });
});
const ROLES = {property_manager:'Property manager', landlord:'Landlord / self-managing owner', electrician:'Electrician', tenant:'Tenant'};

// ---------- alarm rules (Queensland) ----------
const TYPES = ['Photoelectric', 'Ionisation', 'Heat', 'Unknown'];
const POWER = ['240V hardwired with battery backup', '240V hardwired', '10-year sealed lithium battery', '9V replaceable battery', 'Unknown'];
const YNU = ['Yes', 'No', 'Unsure'];
const LOCATIONS = ['Bedroom 1', 'Bedroom 2', 'Bedroom 3', 'Bedroom 4', 'Bedroom 5', 'Bedroom 6', 'Main bedroom',
  'Hallway', 'Hallway outside bedrooms', 'Upstairs hallway', 'Downstairs hallway', 'Stairwell', 'Entry',
  'Living room', 'Family room', 'Dining room', 'Rumpus room', 'Study', 'Kitchen', 'Laundry', 'Garage', 'Granny flat'];
function alarmIssues(a) {
  const bad = [], missing = [];
  if (!a.alarm_type || a.alarm_type === 'Unknown') missing.push('type'); else if (a.alarm_type !== 'Photoelectric') bad.push('not photoelectric');
  if (!a.power_source || a.power_source === 'Unknown') missing.push('power source'); else if (a.power_source === '9V replaceable battery') bad.push('replaceable battery only');
  if (!a.interconnected || a.interconnected === 'Unsure') missing.push('interconnection'); else if (a.interconnected === 'No') bad.push('not interconnected');
  if (!a.as3786 || a.as3786 === 'Unsure') missing.push('AS 3786-2014 marking'); else if (a.as3786 === 'No') bad.push('not marked AS 3786-2014');
  if (!a.expiry_date) missing.push('manufacture date');
  else if (a.expiry_date <= today()) bad.push('expired ' + fmt(a.expiry_date));
  const soon = a.expiry_date && a.expiry_date > today() && a.expiry_date <= addMonths(today(), 12);
  return {bad, missing, soon, status: bad.length ? 'bad' : missing.length ? 'warn' : 'ok'};
}
function alarmPill(a) {
  const r = alarmIssues(a);
  if (r.status === 'bad') return `<span class="pill bad">❌ ${esc(r.bad.join(', '))}</span>`;
  if (r.status === 'warn') return `<span class="pill warn">⚠️ missing ${esc(r.missing.join(', '))}</span>`;
  return `<span class="pill ok">✅ OK${r.soon ? ' – expires ' + fmt(a.expiry_date) : ''}</span>`;
}
// Next check due: 12 months after the last check, or the next lease start if that's sooner
function nextDue(p) {
  const last = (p.inspections || []).map(i => i.inspection_date).sort().pop();
  const ends = (p.tenants || []).map(t => t.vacate_date || t.lease_end).filter(Boolean).sort();
  const tenancyEnd = ends.pop();
  let due = last ? addMonths(last, 12) : today(), why = last ? 'annual check' : 'no check recorded yet';
  if (tenancyEnd && (!last || tenancyEnd >= last)) {
    const newLease = addDays(tenancyEnd, 1);
    if (newLease < due) { due = newLease; why = 'before the next lease (within 30 days before ' + fmt(newLease) + ')'; }
  }
  return {due, why, last};
}
function duePill(d) {
  if (d.due < today()) return `<span class="pill bad">Overdue – ${fmt(d.due)}</span>`;
  if (d.due <= addDays(today(), 30)) return `<span class="pill warn">Due ${fmt(d.due)}</span>`;
  return `<span class="pill ok">Due ${fmt(d.due)}</span>`;
}

// ---------- sign in / sign up ----------
function showAuth(mode = 'login', role) {
  $('#shell').classList.add('hidden'); $('#public').classList.add('hidden'); $('#auth').classList.remove('hidden');
  const signup = mode === 'signup';
  $('#auth').innerHTML = `<div class="box">
    <h1>${signup ? 'Create your SAM account' : mode === 'reset' ? 'Reset your password' : 'Log in to SAM'}</h1>
    <form id="af" class="f" style="grid-template-columns:1fr">
      ${signup ? `<label>Your name<input name="name" required></label>
      <label>I am a<select name="role" onchange="document.getElementById('lic').classList.toggle('hidden',this.value!=='electrician')">
        ${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${k === role ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Company (optional)<input name="company"></label>
      <label id="lic" class="${role === 'electrician' ? '' : 'hidden'}">Electrical licence number<input name="licence_no"></label>` : ''}
      <label>Email<input name="email" type="email" required></label>
      ${mode !== 'reset' ? `<label>Password<input name="password" type="password" minlength="8" required></label>` : ''}
      <button class="btn o">${signup ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Log in'}</button>
    </form>
    <p class="small">${signup ? `Already have an account? <a href="#" data-m="login">Log in</a>`
      : `New to SAM? <a href="#" data-m="signup">Create an account</a> · <a href="#" data-m="reset">Forgot password?</a>`}</p>
    <p class="small"><a href="#/">← Back to the website</a></p></div>`;
  $('#auth').querySelectorAll('[data-m]').forEach(a => a.onclick = e => { e.preventDefault(); showAuth(a.dataset.m); });
  $('#af').onsubmit = async e => {
    e.preventDefault(); const d = formData(e.target); const back = location.origin + location.pathname;
    if (signup) {
      if (d.role === 'electrician' && !d.licence_no) return toast('Please enter your electrical licence number.');
      const {data, error} = await sb.auth.signUp({email: d.email, password: d.password,
        options: {emailRedirectTo: back, data: {name: d.name, role: d.role, company: d.company, licence_no: d.licence_no}}});
      fail(error);
      if (data.session) return; // email confirmation is switched off: already logged in
      $('#auth').innerHTML = `<div class="box"><h1>Check your email</h1><p>We've sent a link to <b>${esc(d.email)}</b>. Click it to confirm your account, then log in.</p>
        <p class="small muted">Can't see it? Check your spam or junk folder.</p><a class="btn o" href="#" onclick="showAuth();return false">Back to log in</a></div>`;
    } else if (mode === 'reset') {
      const {error} = await sb.auth.resetPasswordForEmail(d.email, {redirectTo: back});
      fail(error); toast('Reset link sent – check your email.');
    } else {
      const {error} = await sb.auth.signInWithPassword({email: d.email, password: d.password}); fail(error);
    }
  };
}
async function signOut() { await sb.auth.signOut(); me = null; location.hash = '#/'; showPublic(); }

async function start() {
  const err = new URLSearchParams(location.hash.slice(1)).get('error_description');
  if (err) { history.replaceState(null, '', location.pathname); setTimeout(() => toast(err.replace(/\+/g, ' ') + '. Please request a new link.'), 300); }
  const {data: {session}} = await sb.auth.getSession();
  if (!session) { me = null; return showPublic(); }
  const {data, error} = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  if (!data) { $('#auth').classList.remove('hidden'); $('#shell').classList.add('hidden');
    $('#auth').innerHTML = `<div class="box"><h1>Account not set up</h1><p>We couldn't load your SAM profile${error ? ' (' + esc(error.message) + ')' : ''}. Please contact SAM support.</p><a href="#" onclick="signOut();return false">Sign out</a></div>`; return; }
  me = data; approved = (await sb.rpc('is_approved')).data === true;
  $('#auth').classList.add('hidden'); $('#public').classList.add('hidden'); $('#shell').classList.remove('hidden');
  $('#who').textContent = (me.name || '') + ' · ' + me.email;
  route();
}
sb.auth.onAuthStateChange((ev) => {
  if (ev === 'PASSWORD_RECOVERY') { setTimeout(newPassword, 300); }
  if (ev === 'SIGNED_OUT' || (ev === 'SIGNED_IN' && !me)) start();
});
async function newPassword() {
  const pw = prompt('Choose a new password (at least 8 characters):');
  if (pw) { const {error} = await sb.auth.updateUser({password: pw}); fail(error); toast('Password changed.'); }
}

// ---------- navigation ----------
function navItems() {
  if (me.role === 'tenant') return [['home', 'Home'], ['help', 'Help'], ['profile', 'Profile']];
  const n = [['home', 'Home'], ['properties', 'Properties'], ['teams', 'Teams']];
  if (me.role !== 'electrician') n.push(['course', 'SAM Academy']);
  return n.concat([['help', 'Help'], ['profile', 'Profile']]);
}
let viewingSite = false; // logged-in user looking at the public website
window.onhashchange = () => (me && !viewingSite) ? route() : showPublic();
function openSite() { viewingSite = true; if (location.hash === '#/') showPublic(); else location.hash = '#/'; }
function openApp(h = '#/home') {
  viewingSite = false; $('#public').classList.add('hidden'); $('#shell').classList.remove('hidden');
  if (location.hash === h) route(); else location.hash = h;
}
async function route() {
  document.body.classList.remove('open');
  const [page, id] = location.hash.replace(/^#\/?/, '').split('/');
  const p = page || 'home';
  $('#nav').innerHTML = navItems().map(([k, v]) => `<a href="#/${k}" class="${k === p || (p === 'property' && k === 'properties') || ((p === 'lesson' || p === 'quiz') && k === 'course') ? 'on' : ''}">${v}</a>`).join('');
  const pages = {home, properties, property, check, course, quiz, teams, help, profile, lesson: n => lessonPage(n, '#main')};
  $('#main').innerHTML = '<p class="muted">Loading…</p>';
  try { await (pages[p] || home)(id); } catch (e) { console.error(e); $('#main').innerHTML = `<p>Something went wrong: ${esc(e.message)}</p>`; }
  window.scrollTo(0, 0);
}

// ---------- home ----------
async function loadProperties() {
  const {data, error} = await sb.from('properties')
    .select('*, alarms(*), tenants(lease_end,vacate_date), inspections(inspection_date), teams(name)').order('street');
  fail(error); return data;
}
async function home() {
  const hr = new Date().getHours();
  let h = `<h1>Good ${hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening'}${me.name ? ', ' + esc(me.name.split(' ')[0]) : ''}</h1>`;
  if (me.role === 'tenant') {
    $('#main').innerHTML = h + `<div class="box">Thanks for signing up. We'll send you reminders to test and clean your smoke alarms. Have a look at <a href="#/help">Help</a> for how to do it.</div>`; return;
  }
  const props = await loadProperties();
  const dues = props.map(p => ({p, d: nextDue(p)}));
  const overdue = dues.filter(x => x.d.due < today()), soon = dues.filter(x => x.d.due >= today() && x.d.due <= addDays(today(), 30));
  const alarms = props.flatMap(p => p.alarms), badAlarms = alarms.filter(a => alarmIssues(a).status === 'bad'), expiring = alarms.filter(a => alarmIssues(a).soon);
  h += `<div class="cards">
    <div class="card"><div class="n">${props.length}</div><div class="l">Properties</div></div>
    <div class="card"><div class="n">${soon.length}</div><div class="l">Due in the next 30 days</div>${overdue.length ? `<b style="color:var(--bad)">${overdue.length} overdue</b>` : ''}</div>
    <div class="card"><div class="n">${badAlarms.length}</div><div class="l">Alarms with problems</div></div>
    <div class="card"><div class="n">${expiring.length}</div><div class="l">Alarms expiring within 12 months</div></div>
    ${me.role === 'electrician' ? '' : `<div class="card"><div class="n">${approved ? '✅' : '🎓'}</div><div class="l">${approved ? 'Training up to date' : '<a href="#/course">Finish SAM Academy</a> to log checks'}</div></div>`}
  </div>`;
  const list = overdue.concat(soon).sort((a, b) => a.d.due.localeCompare(b.d.due));
  h += `<h2>Checks coming up</h2>` + (list.length ? propTable(list) : `<p class="muted">Nothing due in the next 30 days.${props.length ? '' : ' <a href="#/properties">Add your first property</a>.'}</p>`);
  $('#main').innerHTML = h;
}
function propTable(rows) {
  return `<table><tr><th>Property</th><th>Alarms</th><th>Next check</th><th>Team</th></tr>` + rows.map(({p, d}) => {
    const st = p.alarms.map(a => alarmIssues(a).status);
    return `<tr class="click" onclick="location.hash='#/property/${p.id}'"><td><b>${esc(addr(p))}</b></td>
      <td>${p.alarms.length} ${st.includes('bad') ? '<span class="pill bad">problem</span>' : st.includes('warn') ? '<span class="pill warn">info missing</span>' : p.alarms.length ? '<span class="pill ok">OK</span>' : ''}</td>
      <td>${duePill(d)}</td><td>${esc(p.teams?.name || '')}</td></tr>`;
  }).join('') + '</table>';
}

// ---------- properties ----------
async function myTeams() { const {data} = await sb.from('teams').select('id,name').in('id', (await sb.from('team_members').select('team_id').eq('user_id', me.id)).data.map(r => r.team_id)); return data || []; }
async function properties() {
  const props = await loadProperties();
  $('#main').innerHTML = `<div class="spread"><h1>Properties</h1><button class="btn o" onclick="propertyForm()">Add property</button></div>
    <input id="search" placeholder="Search by address…" style="max-width:360px;margin-bottom:12px">
    <div id="plist">${props.length ? propTable(props.map(p => ({p, d: nextDue(p)}))) : '<p class="muted">No properties yet. Add one, or join your team from the Teams page.</p>'}</div>`;
  $('#search').oninput = e => { const q = e.target.value.toLowerCase();
    $('#plist').innerHTML = propTable(props.filter(p => addr(p).toLowerCase().includes(q)).map(p => ({p, d: nextDue(p)}))); };
}
async function propertyForm(p = {}) {
  const teams = await myTeams();
  $('#main').innerHTML = `<h1>${p.id ? 'Edit property' : 'Add property'}</h1><div class="box"><form id="pf" class="f">
    <label class="wide">Street address (incl. unit number)<input name="street" required value="${esc(p.street)}"></label>
    <label>Suburb<input name="suburb" value="${esc(p.suburb)}"></label>
    <label>State<select name="state">${opts(['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT'], p.state || 'QLD')}</select></label>
    <label>Postcode<input name="postcode" value="${esc(p.postcode)}"></label>
    <label>Property type<select name="property_type"><option></option>${opts(['House', 'Unit / apartment', 'Townhouse', 'Duplex', 'Granny flat', 'Other'], p.property_type)}</select></label>
    <label>Bedrooms<input name="bedrooms" type="number" min="0" value="${esc(p.bedrooms)}"></label>
    <label>Storeys<input name="storeys" type="number" min="1" value="${esc(p.storeys)}"></label>
    <label>Owner name (for certificates)<input name="owner_name" value="${esc(p.owner_name)}"></label>
    <label>Team (who else can see it)<select name="team_id"><option value="">Just me</option>${teams.map(t => `<option value="${t.id}" ${t.id === p.team_id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label>
    <label class="wide">Access notes<textarea name="access_notes">${esc(p.access_notes)}</textarea></label>
    <div class="wide row"><button class="btn o">Save</button><a class="btn g" href="#/${p.id ? 'property/' + p.id : 'properties'}">Cancel</a></div></form></div>`;
  $('#pf').onsubmit = async e => {
    e.preventDefault(); const d = formData(e.target);
    const q = p.id ? sb.from('properties').update(d).eq('id', p.id).select().single() : sb.from('properties').insert(d).select().single();
    const {data, error} = await q; fail(error); toast('Saved.'); location.hash = '#/property/' + data.id; if (p.id) route();
  };
}
async function property(id) {
  const {data: p, error} = await sb.from('properties').select('*, alarms(*), tenants(*), inspections(*, profiles(name)), teams(name)').eq('id', id).single(); fail(error);
  p.alarms.sort((a, b) => a.location.localeCompare(b.location));
  p.inspections.sort((a, b) => b.inspection_date.localeCompare(a.inspection_date));
  const d = nextDue(p), est = p.bedrooms != null && p.storeys != null ? +p.bedrooms + +p.storeys + 1 : null;
  window._p = p;
  $('#main').innerHTML = `<div class="spread"><h1>${esc(addr(p))}</h1>
      <div class="row">${me.role !== 'tenant' ? `<a class="btn o" href="#/check/${p.id}">Log a check</a>` : ''}<button class="btn g" onclick="propertyForm(window._p)">Edit</button></div></div>
    <div class="box"><div class="row" style="gap:28px">
      <div><div class="muted small">Next check</div>${duePill(d)}<div class="small muted">${esc(d.why)}</div></div>
      <div><div class="muted small">Last check</div>${d.last ? fmt(d.last) : '–'}</div>
      <div><div class="muted small">Details</div>${esc([p.property_type, p.bedrooms != null && p.bedrooms + ' bed', p.storeys && p.storeys + ' storey'].filter(Boolean).join(' · ') || '–')}</div>
      <div><div class="muted small">Owner</div>${esc(p.owner_name || '–')}</div>
      <div><div class="muted small">Team</div>${esc(p.teams?.name || 'Just me')}</div></div>
      ${p.access_notes ? `<p class="pre small"><b>Access:</b> ${esc(p.access_notes)}</p>` : ''}</div>

    <div class="spread"><h2>Smoke alarms (${p.alarms.length}${est ? ' of about ' + est + ' needed' : ''})</h2></div>
    ${est && p.alarms.length < est ? `<p class="pill warn">This property may need at least ${est} alarms (bedrooms + storeys + 1). This is an estimate only.</p>` : ''}
    ${p.alarms.length ? `<table><tr><th>Location</th><th>Type / power</th><th>Expires</th><th>Status</th><th></th></tr>${p.alarms.map(a => `<tr>
      <td><b>${esc(a.location)}</b><div class="small muted">${esc([a.brand, a.model].filter(Boolean).join(' '))}</div></td>
      <td>${esc(a.alarm_type || '?')}<div class="small muted">${esc(a.power_source || '')}</div></td>
      <td>${fmt(a.expiry_date)}</td><td>${alarmPill(a)}</td>
      <td><button class="btn s g" onclick="alarmForm('${a.id}')">Edit</button></td></tr>`).join('')}</table>` : '<p class="muted">No alarms added yet.</p>'}
    <div class="row" style="margin-top:12px"><button class="btn s" onclick="alarmForm()">Add alarm</button>${p.alarms.length ? '<button class="btn s g" onclick="copyAlarm()">Copy alarm</button>' : ''}</div>
    <div id="aform" style="margin-top:12px"></div>

    <div class="spread"><h2>Tenants</h2><button class="btn s" onclick="tenantForm()">Add tenant</button></div>
    <div id="tform"></div>
    ${p.tenants.length ? `<table><tr><th>Name</th><th>Lease</th><th>Contact</th><th></th></tr>${p.tenants.map(t => `<tr>
      <td><b>${esc(t.name)}</b></td><td>${fmt(t.lease_start)} – ${fmt(t.lease_end)}${t.vacate_date ? `<div class="small">Vacating ${fmt(t.vacate_date)}</div>` : ''}</td>
      <td class="small">${esc(t.phone || '')}<br>${esc((t.emails || []).join(', '))}</td>
      <td><button class="btn s g" onclick="tenantForm('${t.id}')">Edit</button></td></tr>`).join('')}</table>` : '<p class="muted">No tenants added.</p>'}

    <h2>Check history</h2>
    ${p.inspections.length ? `<table><tr><th>Date</th><th>Result</th><th>By</th><th>Notes</th></tr>${p.inspections.map(i => `<tr>
      <td>${fmt(i.inspection_date)}</td><td><span class="pill ${i.assessment === 'Compliant' ? 'ok' : 'bad'}">${esc(i.assessment)}</span>${i.inspector_override ? ' <span class="small muted">(override)</span>' : ''}</td>
      <td>${esc(i.profiles?.name || '')}<div class="small muted">${i.check_type === 'licensed' ? 'Electrician' : 'Manager check'}</div></td><td class="small pre">${esc(i.notes || '')}</td></tr>`).join('')}</table>` : '<p class="muted">No checks recorded yet.</p>'}
    <p style="margin-top:30px"><button class="btn s r" onclick="deleteProperty()">Delete property</button></p>`;
}
async function deleteProperty() {
  if (!confirm('Delete this property, its alarms, tenants and check history? This can\'t be undone.')) return;
  const {error} = await sb.from('properties').delete().eq('id', window._p.id); fail(error); toast('Property deleted.'); location.hash = '#/properties';
}
// Copy the most recently added alarm's details (type, power, brand...) into a new alarm
function copyAlarm() {
  const last = [...window._p.alarms].sort((x, y) => (x.created_at || '').localeCompare(y.created_at || '')).pop();
  alarmForm(null, last);
}
function alarmForm(id, copyFrom) {
  const a = copyFrom ? {...copyFrom, id: null, location: '', manufacture_year: null, manufacture_month: null} : window._p.alarms.find(x => x.id === id) || {}, years = []; for (let y = new Date().getFullYear(); y >= 2005; y--) years.push(String(y));
  $('#aform').innerHTML = `<div class="box">${copyFrom ? `<p class="small muted">Copied from <b>${esc(copyFrom.location)}</b>. Enter where this alarm is and its manufacture date (printed on the alarm), then check the other details.</p>` : ''}<form id="alf" class="f">
    <label>Location<select name="loc_pick" required onchange="document.getElementById('locother').classList.toggle('hidden', this.value !== 'Other'); document.querySelector('[name=location_other]').required = this.value === 'Other'">
      <option value="">Choose…</option>${opts(LOCATIONS, LOCATIONS.includes(a.location) ? a.location : (a.location ? 'Other' : ''))}<option ${a.location && !LOCATIONS.includes(a.location) ? 'selected' : ''}>Other</option></select></label>
    <label id="locother" class="${a.location && !LOCATIONS.includes(a.location) ? '' : 'hidden'}">Other location<input name="location_other" placeholder="e.g. Granny flat bedroom" value="${esc(LOCATIONS.includes(a.location) ? '' : a.location)}" ${a.location && !LOCATIONS.includes(a.location) ? 'required' : ''}></label>
    <label>Type<select name="alarm_type"><option></option>${opts(TYPES, a.alarm_type)}</select></label>
    <label>Power source<select name="power_source"><option></option>${opts(POWER, a.power_source)}</select></label>
    <label>Interconnected?<select name="interconnected"><option></option>${opts(YNU, a.interconnected)}</select></label>
    <label>Marked AS 3786-2014?<select name="as3786"><option></option>${opts(YNU, a.as3786)}</select></label>
    <label>Manufacture year${copyFrom ? ' (required)' : ''}<select name="manufacture_year" ${copyFrom ? 'required' : ''}><option></option>${opts(years, String(a.manufacture_year ?? ''))}</select></label>
    <label>Manufacture month (blank if not shown)<select name="manufacture_month"><option></option>${[...Array(12)].map((_, i) => `<option value="${i + 1}" ${a.manufacture_month === i + 1 ? 'selected' : ''}>${new Date(2000, i).toLocaleString('en-AU', {month: 'long'})}</option>`).join('')}</select></label>
    <label>Brand<input name="brand" value="${esc(a.brand)}"></label><label>Model<input name="model" value="${esc(a.model)}"></label>
    <div class="wide row"><button class="btn o">Save alarm</button><button type="button" class="btn g" onclick="this.closest('.box').remove()">Cancel</button>
    ${a.id ? `<button type="button" class="btn r" onclick="delRow('alarms','${a.id}')">Delete</button>` : ''}</div></form></div>`;
  $('#alf').onsubmit = async e => {
    e.preventDefault(); const d = formData(e.target); d.property_id = window._p.id;
    d.location = d.loc_pick === 'Other' ? d.location_other : d.loc_pick; delete d.loc_pick; delete d.location_other;
    const {error} = a.id ? await sb.from('alarms').update(d).eq('id', a.id) : await sb.from('alarms').insert(d); fail(error); toast('Alarm saved.'); route();
  };
  $('#aform').scrollIntoView({behavior: 'smooth'});
}
function tenantForm(id) {
  const t = window._p.tenants.find(x => x.id === id) || {};
  $('#tform').innerHTML = `<div class="box"><form id="tf" class="f">
    <label>Name<input name="name" required value="${esc(t.name)}"></label><label>Phone<input name="phone" value="${esc(t.phone)}"></label>
    <label class="wide">Emails (separate with commas)<input name="emails" value="${esc((t.emails || []).join(', '))}"></label>
    <label>Lease start<input type="date" name="lease_start" value="${esc(t.lease_start)}"></label>
    <label>Lease end<input type="date" name="lease_end" value="${esc(t.lease_end)}"></label>
    <label>Vacate date (if moving out)<input type="date" name="vacate_date" value="${esc(t.vacate_date)}"></label>
    <label class="wide">Notes<textarea name="notes">${esc(t.notes)}</textarea></label>
    <div class="wide row"><button class="btn o">Save tenant</button><button type="button" class="btn g" onclick="this.closest('.box').remove()">Cancel</button>
    ${t.id ? `<button type="button" class="btn r" onclick="delRow('tenants','${t.id}')">Delete</button>` : ''}</div></form></div>`;
  $('#tf').onsubmit = async e => {
    e.preventDefault(); const d = formData(e.target); d.property_id = window._p.id;
    d.emails = (d.emails || '').split(',').map(s => s.trim()).filter(Boolean);
    const {error} = t.id ? await sb.from('tenants').update(d).eq('id', t.id) : await sb.from('tenants').insert(d); fail(error); toast('Tenant saved.'); route();
  };
  $('#tform').scrollIntoView({behavior: 'smooth'});
}
async function delRow(table, id) { if (!confirm('Delete this?')) return; const {error} = await sb.from(table).delete().eq('id', id); fail(error); route(); }

// ---------- log a check ----------
const CHECK_QS = [
  ['q1', 'Have you checked the alarm details above are still correct?'],
  ['q2', 'Have you read and followed the SAM guides on how to test a smoke alarm?'],
  ['q3', "Have you read the manufacturer's recommendations for these smoke alarms?"],
  ['q4', 'Is any alarm damaged, painted over, covered or blocked?'],
  ['c1', 'Are smoke alarms installed in all required locations (each storey, each bedroom, hallways connecting bedrooms, or the exit path on storeys without bedrooms)?'],
  ['c2', 'Is every alarm marked with AS 3786-2014?'],
  ['c3', 'Is every alarm at the required minimum distance from walls, lights, fans, vents and other fixtures?'],
  ['c4', 'Were all alarms cleaned?'],
  ['c5', 'Have any batteries more than 6 months old been replaced (replaceable-battery alarms only)?'],
  ['c6', 'Did each alarm sound when you pressed its test button?'],
  ['c7', 'When you tested each alarm, did all the other alarms sound at the same time?']];
async function check(id) {
  const {data: p, error} = await sb.from('properties').select('*, alarms(*)').eq('id', id).single(); fail(error);
  const practice = !approved && window._practice; window._practice = false;
  if (!approved && !practice) {
    $('#main').innerHTML = `<h1>Log a check</h1><div class="box">Before you can log checks you need to pass all 7 SAM Academy modules and the final exam (re-sat every 12 months).
      <p><a class="btn o" href="#/course">Go to SAM Academy</a></p></div>
      <div class="box"><b>Practice log</b><p>Try the check form on this property to see how it works. Nothing is saved and it doesn't count as a check.</p>
      <button class="btn" onclick="window._practice = true; check('${id}')">Start a practice check</button></div>`; return;
  }
  const ref = me.role === 'electrician' ? null : (await sb.rpc('get_refresher')).data?.[0];
  const page = $('#main');
  page.innerHTML = `<h1>${practice ? 'Practice check' : 'Log a check'}</h1><p class="muted">${esc(addr(p))}</p>
    ${practice ? PRACTICE_BANNER : ''}<div id="step"></div>`;
  const form = (refResult) => {
    const flags = p.alarms.map(a => ({a, r: alarmIssues(a)})).filter(x => x.r.status !== 'ok');
    $('#step').innerHTML = `<div class="box"><b>Alarms on record (${p.alarms.length})</b>
      ${p.alarms.length ? `<ul>${p.alarms.map(a => `<li>${esc(a.location)} – ${alarmPill(a)}</li>`).join('')}</ul>` : '<p class="pill bad">No alarms recorded. Add the alarms on the property page before logging a check.</p>'}
      <a class="small" href="#/property/${p.id}">Update alarm details first</a></div>
      <form id="cf"><div class="box"><label style="max-width:240px">Date of the check<input type="date" name="inspection_date" value="${today()}" min="${addDays(today(), -7)}" max="${today()}" required></label></div>
      ${CHECK_QS.map(([k, q]) => `<div class="q"><b>${esc(q)}</b><div class="row">${['Yes', 'No'].map(v => `<label class="opt"><input type="radio" name="${k}" value="${v}" required> ${v}</label>`).join('')}</div></div>`).join('')}
      <div class="q"><b>Your overall assessment</b>
        ${flags.length ? `<p class="pill warn">SAM flagged ${flags.length} alarm(s) above. If you mark the property Compliant, explain why in the notes.</p>` : ''}
        <div class="row">${['Compliant', 'Not compliant'].map(v => `<label class="opt"><input type="radio" name="assessment" value="${v}" required> ${v}</label>`).join('')}</div>
        <label>Notes<textarea name="notes" placeholder="What you found, anything fixed, anything the owner needs to arrange"></textarea></label></div>
      <div class="q"><label class="opt"><input type="checkbox" required> I declare I carried out this check in person on the date above and the answers are true.</label>
        <label class="opt"><input type="checkbox" required> I understand final compliance decisions rest with the agency/owner, and an electrician should be consulted if unsure.</label></div>
      ${practice ? PRACTICE_BANNER : ''}<button class="btn o">${practice ? 'Finish practice check' : 'Submit check'}</button></form>`;
    $('#cf').onsubmit = async e => {
      e.preventDefault(); const d = formData(e.target);
      const override = d.assessment === 'Compliant' && flags.length > 0;
      if (override && !d.notes) return toast('Please explain in the notes why the property is compliant despite the flags.');
      if (!p.alarms.length && !practice) return toast('Add the alarms to the property first.');
      if (practice) return practiceResult(p, d, flags);
      const answers = {}; CHECK_QS.forEach(([k, q]) => answers[k] = {question: q, answer: d[k]});
      const {error} = await sb.from('inspections').insert({
        property_id: p.id, inspection_date: d.inspection_date, assessment: d.assessment, notes: d.notes,
        inspector_override: override, answers, check_type: me.role === 'electrician' ? 'licensed' : 'manager',
        alarm_snapshot: p.alarms.map(a => ({...a, status: alarmIssues(a)})),
        refresher_question: ref?.id || null, refresher_correct: refResult ?? null});
      fail(error); toast('Check saved.'); location.hash = '#/property/' + p.id;
    };
  };
  if (!ref) return form();
  $('#step').innerHTML = `<div class="q"><p class="muted small">Quick refresher before you start</p><b>${esc(ref.question)}</b>
    <form id="rf">${['A', 'B', 'C', 'D'].filter(k => ref['option_' + k.toLowerCase()]).map(k => `<label class="opt"><input type="radio" name="a" value="${k}" required> ${esc(ref['option_' + k.toLowerCase()])}</label>`).join('')}
    <button class="btn">Check answer</button></form><div id="rres"></div></div>`;
  $('#rf').onsubmit = async e => {
    e.preventDefault(); const ans = new FormData(e.target).get('a');
    const {data} = await sb.rpc('check_answer', {p_question: ref.id, p_answer: ans}); const r = data[0];
    e.target.querySelector('button').remove();
    $('#rres').innerHTML = `<p class="pill ${r.correct ? 'ok' : 'bad'}">${r.correct ? 'Correct' : 'Not quite – the answer is ' + r.right_answer}</p><p>${esc(r.explanation)}</p><button class="btn o" id="go">Continue to the check</button>`;
    $('#go').onclick = () => form(r.correct);
  };
}

const PRACTICE_BANNER = `<div class="practice-banner"><b>🧪 PRACTICE ONLY</b> This is for practising and testing. Nothing you enter here is saved and it does not count as a smoke alarm check.</div>`;
// Practice check: give feedback instead of saving
function practiceResult(p, d, flags) {
  const notes = [];
  const wrongNo = CHECK_QS.filter(([k]) => k.startsWith('c') && d[k] === 'No').map(([, q]) => q);
  if (d.q4 === 'Yes') notes.push('You said an alarm is damaged, painted over, covered or blocked. That alarm needs fixing or replacing.');
  wrongNo.forEach(q => notes.push('You answered No to: <i>' + esc(q) + '</i> That needs following up before the property can be called compliant.'));
  flags.forEach(({a, r}) => notes.push(`SAM flagged <b>${esc(a.location)}</b>: ${esc(r.bad.concat(r.missing.map(m => 'missing ' + m)).join(', '))}.`));
  if (!p.alarms.length) notes.push('This property has no alarms recorded. In a real check, add every alarm on the property page first.');
  const problems = notes.length > 0;
  const verdict = d.assessment === 'Compliant' && problems
    ? '<p class="pill bad">You chose Compliant, but there are problems listed below. In a real check you would need a good reason in the notes, or choose Not compliant.</p>'
    : d.assessment === 'Not compliant' && !problems
      ? '<p class="pill warn">You chose Not compliant, but nothing was flagged. In a real check, explain why in the notes.</p>'
      : '<p class="pill ok">Your overall assessment matches your answers.</p>';
  $('#step').innerHTML = `${PRACTICE_BANNER}<div class="box"><h2 style="margin-top:0">Practice result</h2>${verdict}
    ${problems ? `<ul>${notes.map(n => `<li>${n}</li>`).join('')}</ul>` : '<p>No problems found. In a real check you would submit this as Compliant.</p>'}
    <p class="small muted">Nothing was saved. When you've passed SAM Academy, checks you submit are saved to the property's history.</p>
    <div class="row"><button class="btn" onclick="window._practice = true; check('${p.id}')">Practise again</button><a class="btn g" href="#/property/${p.id}">Back to the property</a></div></div>`;
  window.scrollTo(0, 0);
}

// ---------- SAM Academy ----------
async function course() {
  const {data: rows, error} = await sb.from('my_progress').select('*'); fail(error);
  approved = (await sb.rpc('is_approved')).data === true;
  const mods = rows.filter(r => !r.is_exam), exam = rows.find(r => r.is_exam), allPassed = mods.every(r => r.status === 'Passed');
  const examDue = exam?.passed_at ? addMonths(exam.passed_at, 12) : null;
  const link = r => r.web_link || (C.websiteUrl ? C.websiteUrl : '');
  $('#main').innerHTML = `<h1>SAM Academy</h1>
    <div class="box">${approved ? `✅ <b>You're approved to log checks.</b> Your final exam is due again by ${fmt(examDue)}.`
      : `Pass all 7 modules, then the final exam (15 questions, every answer right). Then you can log checks. The exam is re-sat every 12 months.`}</div>
    <table><tr><th>#</th><th>Module</th><th>Status</th><th>Best</th><th></th></tr>${rows.map(r => {
      const locked = r.is_exam && !allPassed;
      return `<tr><td>${r.is_exam ? '🎓' : r.module_id}</td><td><b>${esc(r.title)}</b></td>
      <td><span class="pill ${r.status === 'Passed' ? 'ok' : r.status === 'Attempted' ? 'warn' : ''}">${r.status}</span>${r.passed_at ? `<div class="small muted">${fmt(r.passed_at)}</div>` : ''}</td>
      <td>${r.attempts ? r.best_score + '%' : '–'}</td>
      <td class="row">${!r.is_exam ? `<a class="btn s g" href="#/lesson/${r.module_id}">Lesson</a>` : ''}
        ${locked ? '<span class="small muted">Pass all modules first</span>' : `<a class="btn s ${r.status === 'Passed' && !r.is_exam ? 'g' : 'o'}" href="#/quiz/${r.module_id}">${r.is_exam ? 'Sit exam' : r.status === 'Passed' ? 'Retake' : 'Take quiz'}</a>`}</td></tr>`;
    }).join('')}</table>`;
}
async function quiz(mid) {
  const {data: mod} = await sb.from('modules').select('*').eq('id', mid).single();
  const {data: qs, error} = await sb.rpc('get_quiz', {p_module: +mid}); fail(error);
  $('#main').innerHTML = `<h1>${esc(mod.title)}</h1><p class="muted">${qs.length} questions · ${mod.pass_mark}% needed to pass</p>
    <form id="qf">${qs.map((q, i) => `<div class="q"><b>${i + 1}. ${esc(q.question)}</b>
      ${['a', 'b', 'c', 'd'].filter(k => q['option_' + k]).map(k => `<label class="opt"><input type="radio" name="${q.id}" value="${k.toUpperCase()}" required> ${esc(q['option_' + k])}</label>`).join('')}</div>`).join('')}
    <button class="btn o">Submit answers</button> <a class="btn g" href="#/course">Back</a></form>`;
  $('#qf').onsubmit = async e => {
    e.preventDefault(); const answers = Object.fromEntries(new FormData(e.target));
    const {data, error} = await sb.rpc('submit_quiz', {p_module: +mid, p_answers: answers}); fail(error); const r = data[0];
    approved = (await sb.rpc('is_approved')).data === true;
    $('#main').innerHTML = `<h1>${esc(mod.title)}</h1><div class="box"><h2 style="margin-top:0">${r.passed ? '✅ Passed' : '❌ Not passed this time'}</h2>
      <p>You scored ${r.score} out of ${r.total}.</p>${r.passed ? '' : '<p>Read the lesson again and have another go. The questions are shuffled each time.</p>'}
      <div class="row">${r.passed ? '' : `<a class="btn o" href="#/quiz/${mid}" onclick="setTimeout(route,0)">Try again</a>`}<a class="btn g" href="#/course">Back to SAM Academy</a></div></div>`;
  };
}

// ---------- teams ----------
async function teams() {
  const {data: mine} = await sb.from('team_members').select('team_id, teams(id,name)').eq('user_id', me.id);
  const ids = mine.map(m => m.team_id);
  const {data: members} = ids.length ? await sb.from('team_members').select('team_id, user_id, profiles(name,email)').in('team_id', ids) : {data: []};
  const {data: sent} = ids.length ? await sb.from('team_invites').select('*').in('team_id', ids) : {data: []};
  const {data: inv} = await sb.from('team_invites').select('team_id, teams(name)').ilike('email', me.email);
  const invites = inv.filter(i => !ids.includes(i.team_id));
  $('#main').innerHTML = `<h1>Teams</h1><p class="muted">Put properties in a team and everyone in it can see and check them.</p>
    ${invites.map(i => `<div class="box spread"><span>You've been invited to join <b>${esc(i.teams?.name)}</b></span><button class="btn o" onclick="acceptInvite('${i.team_id}')">Join team</button></div>`).join('')}
    ${mine.map(m => `<div class="box"><div class="spread"><h2 style="margin:0">${esc(m.teams.name)}</h2><button class="btn s g" onclick="leaveTeam('${m.team_id}')">Leave team</button></div>
      <p>${members.filter(x => x.team_id === m.team_id).map(x => `<span class="pill">${esc(x.profiles?.name || x.profiles?.email)}</span>`).join(' ')}</p>
      ${sent.filter(s => s.team_id === m.team_id).map(s => `<span class="pill warn">Invited: ${esc(s.email)} <a href="#" onclick="cancelInvite('${s.team_id}','${esc(s.email)}');return false">✕</a></span>`).join(' ')}
      <form class="row" style="margin-top:10px" onsubmit="invite(event,'${m.team_id}')"><input type="email" name="email" placeholder="Colleague's email" required style="max-width:280px"><button class="btn s">Invite</button></form></div>`).join('')}
    <div class="box"><form class="row" onsubmit="newTeam(event)"><input name="name" placeholder="New team name, e.g. Smith Realty – Rentals" required style="max-width:320px"><button class="btn o">Create team</button></form></div>`;
}
async function newTeam(e) { e.preventDefault(); const {error} = await sb.rpc('create_team', {p_name: e.target.name.value}); fail(error); toast('Team created.'); route(); }
async function invite(e, team) {
  e.preventDefault(); const email = e.target.email.value.trim().toLowerCase();
  const {error} = await sb.from('team_invites').insert({team_id: team, email, invited_by: me.id}); fail(error);
  toast('Invite added. Ask them to sign up (or log in) with ' + email + ' and open Teams.'); route();
}
async function cancelInvite(team, email) { const {error} = await sb.from('team_invites').delete().eq('team_id', team).eq('email', email); fail(error); route(); }
async function acceptInvite(team) { const {error} = await sb.rpc('accept_invite', {p_team: team}); fail(error); toast('You joined the team.'); route(); }
async function leaveTeam(team) { if (!confirm('Leave this team? You will no longer see its properties.')) return; const {error} = await sb.from('team_members').delete().eq('team_id', team).eq('user_id', me.id); fail(error); route(); }

// ---------- help ----------
async function help() {
  const [{data: g}, {data: f}] = await Promise.all([sb.from('guides').select('*').order('sort_order'), sb.from('faq').select('*').order('sort_order')]);
  $('#main').innerHTML = `<h1>Help</h1><h2>Guides</h2>${g.map(x => `<details><summary>${esc(x.title)}</summary><p class="pre">${esc(x.content)}</p></details>`).join('')}
    <h2>Questions</h2>${f.map(x => `<details><summary>${esc(x.question)}</summary><p class="pre">${esc(x.answer)}</p></details>`).join('')}`;
}

// ---------- profile ----------
async function profile() {
  $('#main').innerHTML = `<h1>Profile</h1><div class="box"><form id="prf" class="f">
    <label>Name<input name="name" value="${esc(me.name)}"></label><label>Phone<input name="phone" value="${esc(me.phone)}"></label>
    <label>Company<input name="company" value="${esc(me.company)}"></label>
    ${me.role === 'electrician' ? `<label>Licence number<input name="licence_no" value="${esc(me.licence_no)}"></label>` : ''}
    <label>Email<input disabled value="${esc(me.email)}"></label><label>Account type<input disabled value="${esc(ROLES[me.role] || me.role)}"></label>
    <div class="wide row"><button class="btn o">Save</button><button type="button" class="btn g" onclick="newPassword()">Change password</button></div></form></div>`;
  $('#prf').onsubmit = async e => {
    e.preventDefault(); const d = formData(e.target);
    const {data, error} = await sb.from('profiles').update(d).eq('id', me.id).select().single(); fail(error); me = data; toast('Saved.');
  };
}

start();
