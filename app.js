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

// ---------- photos ----------
async function photoUrls(paths) {
  paths = [...new Set(paths.filter(Boolean))]; if (!paths.length) return {};
  const {data} = await sb.storage.from('photos').createSignedUrls(paths, 3600);
  return Object.fromEntries((data || []).filter(x => x.signedUrl).map(x => [x.path, x.signedUrl]));
}
// Small copies for the gallery. Older photos without one get a small copy made the first time they're shown.
const thumbOf = p => p + '.thumb.jpg';
async function thumbUrls(paths) {
  paths = [...new Set(paths.filter(Boolean))]; if (!paths.length) return {};
  const {data} = await sb.storage.from('photos').createSignedUrls(paths.map(thumbOf), 3600), out = {};
  (data || []).forEach((x, i) => { if (x.signedUrl && !x.error) out[paths[i]] = x.signedUrl; });
  const missing = paths.filter(p => !out[p]);
  if (missing.length) {
    const full = await photoUrls(missing); Object.assign(out, full);
    (async () => { for (const p of missing) { try {
      if (!full[p]) continue; const blob = await (await fetch(full[p])).blob();
      await sb.storage.from('photos').upload(thumbOf(p), await shrink(blob, 400), {upsert: true, contentType: 'image/jpeg'});
    } catch (e) {} } })();
  }
  return out;
}
// Shrink to max 1600px JPEG before uploading (phone photos are huge)
async function shrink(file, max = 1600) {
  const img = await createImageBitmap(file); const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
}
async function uploadPhoto(file, path) {
  const {error} = await sb.storage.from('photos').upload(path, await shrink(file), {upsert: true, contentType: 'image/jpeg'}); fail(error);
  sb.storage.from('photos').upload(thumbOf(path), await shrink(file, 400), {upsert: true, contentType: 'image/jpeg'});
  return path;
}
const PHOTO_ICON = '<div class="nophoto">🏠</div>';

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
  if (a.distances === 'No') bad.push('too close to walls, lights, vents or fans'); else if (a.distances === 'Unsure') missing.push('distance check');
  if (!a.expiry_date) missing.push('manufacture date');
  else if (a.expiry_date <= today()) bad.push('expired ' + fmt(a.expiry_date));
  const soon = a.expiry_date && a.expiry_date > today() && a.expiry_date <= addMonths(today(), 12);
  return {bad, missing, soon, status: bad.length ? 'bad' : missing.length ? 'warn' : 'ok'};
}
const SAM_CHECK_NOTE = `<p class="small muted">*SAM Check: a basic automatic check of the details entered for each alarm (type, power source, interconnection, AS 3786-2014 marking and age) against the Queensland rules. It is only as accurate as the details entered and doesn't replace checking the alarm in person.</p>`;
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
  const n = [['home', 'Home'], ['properties', 'Properties'], ['myhome', 'My home'], ['lookup', 'Look up'], ['teams', 'Teams']];
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
// one page at a time: if the menu is clicked while a page is still loading, load the newest page once it finishes
let routing = false, routeAgain = false;
async function route() {
  if (routing) { routeAgain = true; $('#main').innerHTML = '<p class="muted">Loading…</p>'; return; }
  routing = true;
  try { do { routeAgain = false; await routeOnce(); } while (routeAgain); } finally { routing = false; }
}
async function routeOnce() {
  document.body.classList.remove('open');
  const [page, id] = location.hash.replace(/^#\/?/, '').split('/');
  const p = page || 'home';
  $('#nav').innerHTML = navItems().map(([k, v]) => `<a href="#/${k}" class="${k === p || (p === 'property' && k === 'properties') || ((p === 'lesson' || p === 'quiz') && k === 'course') ? 'on' : ''}">${v}</a>`).join('');
  const pages = {home, properties, property, check, course, quiz, teams, help, profile, lookup, myhome, lesson: n => lessonPage(n, '#main')};
  $('#main').innerHTML = '<p class="muted">Loading…</p>';
  try { await (pages[p] || home)(id); } catch (e) { console.error(e); $('#main').innerHTML = `<p>Something went wrong: ${esc(e.message)}</p>`; }
  window.scrollTo(0, 0);
}

// ---------- home ----------
async function loadProperties() {
  const {data, error} = await sb.from('properties')
    .select('*, alarms(*), tenants(lease_end,vacate_date), inspections(inspection_date), teams(name), assignee:profiles!properties_assigned_to_fkey(name,email)').eq('resident_added', false).order('street');
  fail(error); return data;
}
async function home() {
  const hr = new Date().getHours();
  let h = `<h1>Good ${hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening'}${me.name ? ', ' + esc(me.name.split(' ')[0]) : ''}</h1>`;
  if (me.role === 'tenant') {
    $('#main').innerHTML = h + await tenantHome(); return; // tenants land on their home
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
async function myTeams() { const {data} = await sb.from('team_members').select('role, teams(id,name,personal)').eq('user_id', me.id); return (data || []).filter(r => r.teams).map(r => ({...r.teams, role: r.role})); }
async function teamPeople(ids) { if (!ids.length) return []; const {data} = await sb.from('team_members').select('team_id, user_id, role, profiles(name,email)').in('team_id', ids); return data || []; }
const personName = x => x?.profiles?.name || x?.profiles?.email || '';
function scopePref(v) { try { if (v) localStorage.setItem('samScope', v); return localStorage.getItem('samScope') || 'mine'; } catch (e) { return v || 'mine'; } }
function viewPref(v) { try { if (v) localStorage.setItem('samView', v); return localStorage.getItem('samView') || 'gallery'; } catch (e) { return v || 'gallery'; } }
function propGallery(rows, urls) {
  return `<div class="gallery">${rows.map(({p, d}) => {
    const st = p.alarms.map(a => alarmIssues(a).status);
    return `<a class="gcard" href="#/property/${p.id}">${urls[p.photo_path] ? `<img src="${urls[p.photo_path]}" alt="" loading="lazy">` : PHOTO_ICON}
      <div class="gbody"><b>${esc(p.street)}</b><div class="small muted">${esc([p.suburb, p.postcode].filter(Boolean).join(' '))}${p.assignee ? ' · ' + esc(p.assignee.name || p.assignee.email) : ''}</div>
      <div class="row" style="margin-top:8px;gap:6px">${duePill(d)} ${st.includes('bad') ? '<span class="pill bad">alarm problem</span>' : st.includes('warn') ? '<span class="pill warn">info missing</span>' : p.alarms.length ? `<span class="pill ok">${p.alarms.length} alarms OK</span>` : '<span class="pill">no alarms</span>'}</div></div></a>`;
  }).join('')}</div>`;
}
async function properties() {
  const props = await loadProperties(); const urls = await thumbUrls(props.map(p => p.photo_path));
  const draw = () => { const q = ($('#search')?.value || '').toLowerCase(), v = viewPref();
    const mine = scopePref() === 'mine', rows = props.filter(p => (!mine || p.assigned_to === me.id) && addr(p).toLowerCase().includes(q)).map(p => ({p, d: nextDue(p)}));
    $('#plist').innerHTML = !props.length ? '<p class="muted">No properties yet. Add one, or join your team from the Teams page.</p>'
      : !rows.length ? `<p class="muted">${mine && !q ? 'No properties are assigned to you. Click Whole team to see the rest of your team\'s properties.' : 'No properties match.'}</p>`
      : v === 'gallery' ? propGallery(rows, urls) : propTable(rows);
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('g', b.dataset.view !== v));
    document.querySelectorAll('[data-scope]').forEach(b => b.classList.toggle('g', b.dataset.scope !== scopePref())); };
  $('#main').innerHTML = `<div class="spread"><h1>Properties</h1><button class="btn o" onclick="propertyForm()">Add property</button></div>
    <div class="spread" style="margin-bottom:12px"><input id="search" placeholder="Search by address…" style="max-width:360px">
    <div class="row"><button class="btn s" data-scope="mine">Mine</button><button class="btn s" data-scope="team">Whole team</button><span style="width:10px"></span><button class="btn s" data-view="gallery">▦ Gallery</button><button class="btn s" data-view="list">☰ List</button></div></div>
    <div id="plist"></div>`;
  $('#search').oninput = draw;
  document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => { viewPref(b.dataset.view); draw(); });
  document.querySelectorAll('[data-scope]').forEach(b => b.onclick = () => { scopePref(b.dataset.scope); draw(); });
  draw();
}
async function propertyForm(p = {}) {
  const teams = await myTeams();
  $('#main').innerHTML = `<h1>${p.id ? 'Edit property' : 'Add property'}</h1><div class="box"><form id="pf" class="f">
    <label class="wide">Street address (incl. unit number)<input name="street" required value="${esc(p.street)}" placeholder="Start typing and pick from the list"><input type="hidden" name="address_id" value="${esc(p.address_id || '')}"></label>
    <label>Suburb<input name="suburb" value="${esc(p.suburb)}"></label>
    <label>State<select name="state">${opts(['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT'], p.state || 'QLD')}</select></label>
    <label>Postcode<input name="postcode" value="${esc(p.postcode)}"></label>
    <label>Property type<select name="property_type"><option></option>${opts(['House', 'Unit / apartment', 'Townhouse', 'Duplex', 'Granny flat', 'Other'], p.property_type)}</select></label>
    <label>Bedrooms<input name="bedrooms" type="number" min="0" value="${esc(p.bedrooms)}"></label>
    <label>Storeys<input name="storeys" type="number" min="1" value="${esc(p.storeys)}"></label>
    <label>Owner name (for certificates)<input name="owner_name" value="${esc(p.owner_name)}"></label>
    <label>Team<select name="team_id" onchange="fillAssign(this.value)">${teams.length ? '' : '<option value="">My properties</option>'}${teams.map(t => `<option value="${t.id}" ${t.id === p.team_id || (!p.team_id && t.personal) ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label>
    <label>Assigned to<select name="assigned_to" id="assign"></select></label>
    <label class="wide">Access notes<textarea name="access_notes">${esc(p.access_notes)}</textarea></label>
    <div class="wide row"><button class="btn o">Save</button><a class="btn g" href="#/${p.id ? 'property/' + p.id : 'properties'}">Cancel</a></div></form></div>`;
  window._teams = teams; window._people = await teamPeople(teams.map(t => t.id)); window._assigned = p.assigned_to || me.id;
  fillAssign($('#pf').team_id.value);
  $('#pf').onsubmit = async e => {
    e.preventDefault(); const d = formData(e.target);
    if (!p.id) {
      const {data: c, error: ce} = await sb.rpc('claim_property', {street: d.street, suburb: d.suburb || '', postcode: d.postcode || '', team: d.team_id || null}); fail(ce);
      if (c?.status === 'yours') { toast('That address is already in your properties.'); location.hash = '#/property/' + c.id; return; }
      if (c?.status === 'claimed') { toast('A tenant had already added this address. It is now in your properties.'); location.hash = '#/property/' + c.id; return; }
      if (c?.status === 'taken') { unbusy(); $('#pf').insertAdjacentHTML('afterbegin', `<div class="wide box" style="border-color:#f5a35b"><b>This address is already in SAM</b>, managed by someone else. Ask them to add you to their team, or contact us through Help.${publicCard(c.info)}</div>`); window.scrollTo(0, 0); return; }
    }
    const q = p.id ? sb.from('properties').update(d).eq('id', p.id).select().single() : sb.from('properties').insert(d).select().single();
    const {data, error} = await q; fail(error); toast('Saved.'); location.hash = '#/property/' + data.id; if (p.id) route();
  };
}
async function property(id) {
  const {data: p, error} = await sb.from('properties').select('*, alarms(*), tenants(*), inspections(*, profiles(name)), teams(name), assignee:profiles!properties_assigned_to_fkey(name,email)').eq('id', id).single(); fail(error);
  p.alarms.sort((a, b) => a.location.localeCompare(b.location));
  p.inspections.sort((a, b) => b.inspection_date.localeCompare(a.inspection_date));
  const d = nextDue(p), est = p.bedrooms != null && p.storeys != null ? Math.max(1, +p.bedrooms + +p.storeys) : null, estR = est && `${est}–${est + 1}`;
  window._p = p;
  const urls = await photoUrls([p.photo_path, ...p.alarms.map(a => a.photo_path)]); window._urls = urls;
  $('#main').innerHTML = `<div class="phead">${urls[p.photo_path] ? `<img src="${urls[p.photo_path]}" alt="Property photo">` : PHOTO_ICON}
      <label class="btn s g photobtn">📷 ${p.photo_path ? 'Change photo' : 'Add photo'}<input type="file" accept="image/*" hidden onchange="propertyPhoto(this)"></label></div>
    <div class="spread"><h1>${esc(addr(p))}</h1>
      <div class="row">${me.role !== 'tenant' ? `<a class="btn o" href="#/check/${p.id}">Log a check</a>` : ''}<button class="btn g" onclick="propertyForm(window._p)">Edit</button></div></div>
    <div class="box"><div class="row" style="gap:28px">
      <div><div class="muted small">Next check</div>${duePill(d)}<div class="small muted">${esc(d.why)}</div></div>
      <div><div class="muted small">Last check</div>${d.last ? fmt(d.last) : '–'}</div>
      <div><div class="muted small">Details</div>${esc([p.property_type, p.bedrooms != null && p.bedrooms + ' bed', p.storeys && p.storeys + ' storey'].filter(Boolean).join(' · ') || '–')}</div>
      <div><div class="muted small">Owner</div>${esc(p.owner_name || '–')}</div>
      <div><div class="muted small">Team</div>${esc(p.teams?.name || 'My properties')}</div>
      <div><div class="muted small">Assigned to</div>${esc(p.assignee?.name || p.assignee?.email || 'Nobody')}</div></div>
      ${p.access_notes ? `<p class="pre small"><b>Access:</b> ${esc(p.access_notes)}</p>` : ''}</div>

    <div class="spread"><h2>Smoke alarms (${p.alarms.length})</h2></div>
    ${p.alarms.length ? `<table><tr><th>Location</th><th>Type / power</th><th>Expires</th><th>SAM Check*</th><th></th></tr>${p.alarms.map(a => `<tr data-alarm="${a.id}">
      <td><div class="row" style="flex-wrap:nowrap">${urls[a.photo_path] ? `<a href="${urls[a.photo_path]}" target="_blank"><img class="thumb" src="${urls[a.photo_path]}" alt=""></a>` : ''}<div><b>${esc(a.location)}</b><div class="small muted">${esc([a.brand, a.model].filter(Boolean).join(' '))}</div></div></div></td>
      <td>${esc(a.alarm_type || '?')}<div class="small muted">${esc(a.power_source || '')}</div></td>
      <td>${fmt(a.expiry_date)}</td><td>${alarmPill(a)}</td>
      <td><button class="btn s g" onclick="inlineEdit('${a.id}', stayPut, 'stayPut()')">Edit</button></td></tr>`).join('')}</table>${SAM_CHECK_NOTE}` : '<p class="muted">No alarms added yet.</p>'}
    ${est ? `<p class="small muted estnote">**Alarm estimate: this property may need ${estR} alarms (one in each bedroom, plus one on each storey for the hallway or the way out). <span class="pill ${p.alarms.length < est ? 'bad' : p.alarms.length === est ? 'warn' : 'ok'}">${p.alarms.length} recorded</span> This is only an estimate based on a typical layout. Some properties need more, for example a study used as a bedroom, or bedrooms off separate hallways.</p>`
      : `<p class="small muted estnote">**Alarm estimate: <span class="pill warn">bedrooms and storeys missing</span> Add them (Edit property) to see an estimate of how many alarms this property needs.</p>`}
    <div class="row" style="margin-top:12px"><button class="btn s" onclick="alarmForm()">Add alarm</button>${p.alarms.length ? '<button class="btn s g" onclick="copyAlarm()">Copy alarm</button>' : ''}</div>
    <div id="aform" style="margin-top:12px"></div>

    <div class="spread"><h2>Tenants</h2><button class="btn s" onclick="tenantForm()">Add tenant</button></div>
    <div id="tform"></div>
    ${p.tenants.length ? `<table><tr><th>Name</th><th>Lease</th><th>Contact</th><th></th></tr>${p.tenants.map(t => `<tr>
      <td><b>${esc(t.name)}</b></td><td>${fmt(t.lease_start)} – ${fmt(t.lease_end)}${t.vacate_date ? `<div class="small">Vacating ${fmt(t.vacate_date)}</div>` : ''}</td>
      <td>${[t.phone, ...(t.emails || [])].filter(Boolean).map(esc).join('<br>') || '<span class="muted">–</span>'}</td>
      <td><button class="btn s g" onclick="tenantForm('${t.id}')">Edit</button></td></tr>`).join('')}</table>` : '<p class="muted">No tenants added.</p>'}

    <h2>Check history</h2>
    ${p.inspections.length ? `<table><tr><th>Date</th><th>Result</th><th>By</th><th>Notes</th></tr>${p.inspections.map(i => `<tr>
      <td>${fmt(i.inspection_date)}</td><td><span class="pill ${i.assessment === 'Compliant' ? 'ok' : 'bad'}">${esc(i.assessment)}</span>${i.inspector_override ? ' <span class="small muted">(override)</span>' : ''}</td>
      <td>${esc(i.profiles?.name || '')}<div class="small muted">${i.check_type === 'licensed' ? 'Electrician' : 'Manager check'}</div></td><td class="small pre">${esc(i.notes || '')}</td></tr>`).join('')}</table>` : '<p class="muted">No checks recorded yet.</p>'}
    ${(await myTeams()).some(t => t.id === p.team_id && t.role === 'leader') || (!p.team_id && p.user_id === me.id) ? '<p style="margin-top:30px"><button class="btn s r" onclick="deleteProperty()">Delete property</button></p>' : ''}`;
}
async function propertyPhoto(input) {
  const f = input.files[0]; if (!f) return; toast('Uploading photo…');
  const path = await uploadPhoto(f, `${window._p.id}/property.jpg`);
  const {error} = await sb.from('properties').update({photo_path: path}).eq('id', window._p.id); fail(error); toast('Photo saved.'); route();
}
// Re-draw the property page without jumping back to the top
async function stayPut() { const y = window.scrollY; await property(window._p.id); window.scrollTo(0, y); }
async function deleteProperty() {
  if (!confirm('Delete this property, its alarms, tenants and check history? This can\'t be undone.')) return;
  const {error} = await sb.from('properties').delete().eq('id', window._p.id); fail(error); toast('Property deleted.'); location.hash = '#/properties';
}
// Copy the most recently added alarm's details (type, power, brand...) into a new alarm
function copyAlarm() {
  const last = [...window._p.alarms].sort((x, y) => (x.created_at || '').localeCompare(y.created_at || '')).pop();
  alarmForm(null, last);
}
function alarmForm(id, copyFrom, how = {}) {
  const a = copyFrom ? {...copyFrom, id: null, location: '', manufacture_year: null, manufacture_month: null, photo_path: null} : window._p.alarms.find(x => x.id === id) || {}, years = []; for (let y = new Date().getFullYear(); y >= 2005; y--) years.push(String(y));
  const box = how.target ? document.querySelector(how.target) : $('#aform');
  box.innerHTML = `<div class="box">${copyFrom ? `<p class="small muted">Copied from <b>${esc(copyFrom.location)}</b>. Enter where this alarm is and its manufacture date (printed on the alarm), then check the other details.</p>` : ''}<form id="alf" class="f">
    <label>Location<select name="loc_pick" required onchange="document.getElementById('locother').classList.toggle('hidden', this.value !== 'Other'); document.querySelector('[name=location_other]').required = this.value === 'Other'">
      <option value="">Choose…</option>${opts(LOCATIONS, LOCATIONS.includes(a.location) ? a.location : (a.location ? 'Other' : ''))}<option ${a.location && !LOCATIONS.includes(a.location) ? 'selected' : ''}>Other</option></select></label>
    <label id="locother" class="${a.location && !LOCATIONS.includes(a.location) ? '' : 'hidden'}">Other location<input name="location_other" placeholder="e.g. Granny flat bedroom" value="${esc(LOCATIONS.includes(a.location) ? '' : a.location)}" ${a.location && !LOCATIONS.includes(a.location) ? 'required' : ''}></label>
    <label>Type<select name="alarm_type"><option></option>${opts(TYPES, a.alarm_type)}</select></label>
    <label>Power source<select name="power_source"><option></option>${opts(POWER, a.power_source)}</select></label>
    <label>Interconnected?<select name="interconnected"><option></option>${opts(YNU, a.interconnected)}</select></label>
    <label>Marked AS 3786-2014?<select name="as3786"><option></option>${opts(YNU, a.as3786)}</select></label>
    <label>Meets distance requirements?<select name="distances"><option></option>${opts(YNU, a.distances)}</select>
      <span class="small muted" style="font-weight:400">At least 300 mm from walls, corners and lights; 400 mm from air-con vents and fan blades</span></label>
    <label>Manufacture year${copyFrom ? ' (required)' : ''}<select name="manufacture_year" ${copyFrom ? 'required' : ''}><option></option>${opts(years, String(a.manufacture_year ?? ''))}</select></label>
    <label>Manufacture month (blank if not shown)<select name="manufacture_month"><option></option>${[...Array(12)].map((_, i) => `<option value="${i + 1}" ${a.manufacture_month === i + 1 ? 'selected' : ''}>${new Date(2000, i).toLocaleString('en-AU', {month: 'long'})}</option>`).join('')}</select></label>
    <label>Brand<input name="brand" value="${esc(a.brand)}"></label><label>Model<input name="model" value="${esc(a.model)}"></label>
    <div><div class="small muted" style="margin-bottom:6px">Photo of the alarm${a.id && a.photo_path ? ' (a new one replaces it)' : ''}</div><div class="row">
      <label class="btn s" style="margin:0">📷 Take photo<input type="file" name="photo_cam" accept="image/*" capture="environment" hidden onchange="pickedPhoto(this)"></label>
      <label class="btn s g" style="margin:0">Choose from photos<input type="file" name="photo" accept="image/*" hidden onchange="pickedPhoto(this)"></label>
      <span class="small muted picked"></span></div></div>
    <div class="wide row"><button class="btn o">Save alarm</button><button type="button" class="btn g" onclick="${how.cancel || "this.closest('.box').remove()"}">Cancel</button>
    ${a.id && !how.done ? `<button type="button" class="btn r" onclick="delRow('alarms','${a.id}')">Delete</button>` : ''}</div></form></div>`;
  $('#alf').onsubmit = async e => {
    e.preventDefault(); const d = formData(e.target); d.property_id = window._p.id;
    d.location = d.loc_pick === 'Other' ? d.location_other : d.loc_pick; delete d.loc_pick; delete d.location_other;
    const file = e.target.photo_cam.files[0] || e.target.photo.files[0]; delete d.photo; delete d.photo_cam; if (copyFrom) delete d.photo_path;
    const {data: saved, error} = a.id ? await sb.from('alarms').update(d).eq('id', a.id).select().single() : await sb.from('alarms').insert(d).select().single(); fail(error);
    if (file) { const path = await uploadPhoto(file, `${window._p.id}/alarm-${saved.id}.jpg`); await sb.from('alarms').update({photo_path: path}).eq('id', saved.id); }
    toast('Alarm saved.'); (how.done || route)();
  };
  if (!how.target) $('#aform').scrollIntoView({behavior: 'smooth', block: 'nearest'});
}
function tenantForm(id) {
  const t = window._p.tenants.find(x => x.id === id) || {};
  $('#tform').innerHTML = `<div class="box"><form id="tf" class="f">
    <label>Name<input name="name" required value="${esc(t.name)}"></label><label>Phone<input name="phone" value="${esc(t.phone)}"></label>
    <div class="wide" id="temails"><label style="margin-bottom:6px">Email</label>
      ${((t.emails || []).length ? t.emails : ['']).map(e => `<input type="email" name="tenant_email" value="${esc(e)}" style="margin-bottom:6px">`).join('')}
      <button type="button" class="btn s g" onclick="this.insertAdjacentHTML('beforebegin', '<input type=&quot;email&quot; name=&quot;tenant_email&quot; style=&quot;margin-bottom:6px&quot;>'); this.previousElementSibling.focus()">+ Add another email</button></div>
    <label>Lease start<input type="date" name="lease_start" value="${esc(t.lease_start)}"></label>
    <label>Lease end<input type="date" name="lease_end" value="${esc(t.lease_end)}"></label>
    <label>Vacate date (if moving out)<input type="date" name="vacate_date" value="${esc(t.vacate_date)}"></label>
    <label class="wide">Notes<textarea name="notes">${esc(t.notes)}</textarea></label>
    <div class="wide row"><button class="btn o">Save tenant</button><button type="button" class="btn g" onclick="this.closest('.box').remove()">Cancel</button>
    ${t.id ? `<button type="button" class="btn r" onclick="delRow('tenants','${t.id}')">Delete</button>` : ''}</div></form></div>`;
  $('#tf').onsubmit = async e => {
    e.preventDefault(); const d = formData(e.target); d.property_id = window._p.id;
    d.emails = [...e.target.querySelectorAll('[name=tenant_email]')].map(i => i.value.trim()).filter(Boolean); delete d.tenant_email;
    const {error} = t.id ? await sb.from('tenants').update(d).eq('id', t.id) : await sb.from('tenants').insert(d); fail(error); toast('Tenant saved.'); route();
  };
  $('#tform').scrollIntoView({behavior: 'smooth'});
}
async function delRow(table, id) { if (!confirm('Delete this?')) return; const {error} = await sb.from(table).delete().eq('id', id); fail(error); route(); }

// ---------- log a check ----------
const CHECK_QS = [
  ['q3', "Have you read the manufacturer's recommendations for these smoke alarms?"],
  ['q4', 'Is any alarm damaged, painted over, covered or blocked?'],
  ['c1', 'Are smoke alarms installed in all required locations (each storey, each bedroom, hallways connecting bedrooms, or the exit path on storeys without bedrooms)?'],
  ['c5', 'Have all replaceable batteries (including 9V backups in hardwired alarms) more than 6 months old been replaced and dated?'],
  ['c7', 'When you pressed each alarm\'s test button, did it sound and did all the other alarms sound at the same time?']];
async function check(id) {
  const {data: p, error} = await sb.from('properties').select('*, alarms(*)').eq('id', id).single(); fail(error); window._p = p; window._ctc = new Set();
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
    $('#step').innerHTML = `<div id="asum">${alarmSummary(p)}</div><div id="aform"></div>
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
      const flags = p.alarms.map(a => ({a, r: alarmIssues(a)})).filter(x => x.r.status !== 'ok');
      const override = d.assessment === 'Compliant' && flags.length > 0;
      if (override && !d.notes) return toast('Please explain in the notes why the property is compliant despite the flags.');
      if (!p.alarms.length && !practice) return toast('Add the alarms to the property first.');
      const notDone = p.alarms.filter(a => !window._ctc.has(a.id));
      if (notDone.length) { $('#asum').scrollIntoView({behavior: 'smooth'}); return toast('Tick "Checked, tested & cleaned" for: ' + notDone.map(a => a.location).join(', ')); }
      if (practice) return practiceResult(p, d, flags);
      const answers = {}; CHECK_QS.forEach(([k, q]) => answers[k] = {question: q, answer: d[k]});
      const {error} = await sb.from('inspections').insert({
        property_id: p.id, inspection_date: d.inspection_date, assessment: d.assessment, notes: d.notes,
        inspector_override: override, answers, check_type: me.role === 'electrician' ? 'licensed' : 'manager',
        alarm_snapshot: p.alarms.map(a => ({...a, status: alarmIssues(a), checked_tested_cleaned: window._ctc.has(a.id)})),
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

// Alarm summary on the check form, with Edit buttons that update alarms without leaving the check
function alarmSummary(p) {
  return `<div class="box"><h2 style="margin-top:0">Alarms on record (${p.alarms.length})</h2>
      ${p.alarms.length ? `<p class="small muted">Check each alarm matches what's on the ceiling. If anything is different, click Edit to update it.</p>
      <table class="alarmsum"><tr><th>Location</th><th>Type</th><th>Power</th><th>Interconnected</th><th>AS 3786-2014</th><th>Distances OK</th><th>Made / expires</th><th>Brand / model</th><th>SAM Check*</th><th></th></tr>
      ${[...p.alarms].sort((x, y) => x.location.localeCompare(y.location)).map(a => `<tr data-alarm="${a.id}">
        <td><b>${esc(a.location)}</b> <button type="button" class="btn s g" onclick="checkEditAlarm('${a.id}')">Edit</button></td><td><span class="ml">Type: </span>${esc(a.alarm_type || '–')}</td><td><span class="ml">Power: </span>${esc(a.power_source || '–')}</td>
        <td><span class="ml">Interconnected: </span>${esc(a.interconnected || '–')}</td><td><span class="ml">AS 3786-2014: </span>${esc(a.as3786 || '–')}</td><td><span class="ml">Distances OK: </span>${esc(a.distances || '–')}</td>
        <td><span class="ml">Made: </span>${a.manufacture_year ? (a.manufacture_month ? String(a.manufacture_month).padStart(2, '0') + '/' : '') + a.manufacture_year : '–'}${a.expiry_date ? `<div class="small muted">Expires ${fmt(a.expiry_date)}</div>` : ''}</td>
        <td><span class="ml">Brand / model: </span>${esc([a.brand, a.model].filter(Boolean).join(' ') || '–')}</td><td>${alarmPill(a)}</td>
        <td><button type="button" class="btn s ctc ${window._ctc?.has(a.id) ? 'done' : 'g'}" onclick="toggleCTC('${a.id}', this)">${window._ctc?.has(a.id) ? '✓ Checked, tested & cleaned' : 'Checked, tested & cleaned'}</button></td></tr>`).join('')}</table>${SAM_CHECK_NOTE}`
      : '<p class="pill bad">No alarms recorded. Add the alarms on the property page before logging a check.</p>'}
      ${p.bedrooms != null && p.storeys != null && p.alarms.length < +p.bedrooms + +p.storeys + 1 ? `<p class="pill warn">${p.alarms.length} alarm(s) on record. A ${p.bedrooms}-bedroom, ${p.storeys}-storey property usually needs at least ${+p.bedrooms + +p.storeys + 1}.</p>` : ''}
      <p><button type="button" class="btn s g" onclick="alarmForm(null, null, {done: refreshAlarmSummary})">Add an alarm</button></p></div>`;
}
function toggleCTC(id, b) {
  window._ctc.has(id) ? window._ctc.delete(id) : window._ctc.add(id);
  const on = window._ctc.has(id); b.classList.toggle('done', on); b.classList.toggle('g', !on);
  b.textContent = (on ? '✓ ' : '') + 'Checked, tested & cleaned';
}
// Edit an alarm right where it is in the list (no jumping around the page)
function inlineEdit(id, done, cancel) {
  const row = document.querySelector(`tr[data-alarm="${id}"]`); if (!row) return;
  const cols = row.parentElement.querySelector('tr')?.children.length || 9;
  row.innerHTML = `<td colspan="${cols}" class="inlineform"><div id="inl-${id}"></div></td>`;
  alarmForm(id, null, {done, target: '#inl-' + id, cancel});
}
function checkEditAlarm(id) { inlineEdit(id, refreshAlarmSummary, 'redrawAlarmSummary()'); }
function redrawAlarmSummary() { $('#asum').innerHTML = alarmSummary(window._p); }
async function refreshAlarmSummary() {
  const {data} = await sb.from('alarms').select('*').eq('property_id', window._p.id); window._p.alarms = data || [];
  $('#asum').innerHTML = alarmSummary(window._p); $('#aform').innerHTML = '';
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
  const {data: mine} = await sb.from('team_members').select('team_id, role, teams(id,name,public_name,personal)').eq('user_id', me.id);
  const ids = mine.map(m => m.team_id);
  const members = await teamPeople(ids);
  const {data: sent} = ids.length ? await sb.from('team_invites').select('*').in('team_id', ids) : {data: []};
  const {data: inv} = await sb.from('team_invites').select('team_id, teams(name)').ilike('email', me.email);
  const invites = inv.filter(i => !ids.includes(i.team_id));
  $('#main').innerHTML = `<h1>Teams</h1><p class="muted">Everyone in a team can see and check its properties and invite people. Team leaders can also remove people, change roles, reassign and delete properties, and edit the team's public name.</p>
    ${invites.map(i => `<div class="box spread"><span>You've been invited to join <b>${esc(i.teams?.name)}</b></span><button class="btn o" onclick="acceptInvite('${i.team_id}')">Join team</button></div>`).join('')}
    ${mine.map(m => `<div class="box"><div class="spread"><h2 style="margin:0" data-team="${m.team_id}">${esc(m.teams.name)}</h2><button class="btn s g" onclick="leaveTeam('${m.team_id}')">Leave team</button></div>
      <table style="margin-top:10px">${members.filter(x => x.team_id === m.team_id).map(x => `<tr><td><b>${esc(personName(x))}</b>${x.user_id === me.id ? ' <span class="small muted">(you)</span>' : ''}</td>
        <td><span class="pill ${x.role === 'leader' ? 'ok' : ''}">${x.role === 'leader' ? 'Team leader' : 'Property manager'}</span></td>
        <td style="text-align:right">${m.role === 'leader' ? `<button class="btn s g" onclick="setRole('${m.team_id}','${x.user_id}','${x.role === 'leader' ? 'manager' : 'leader'}')">${x.role === 'leader' ? 'Make property manager' : 'Make team leader'}</button>${x.user_id !== me.id ? ` <button class="btn s g" onclick="removeMember('${m.team_id}','${x.user_id}')">Remove</button>` : ''}` : ''}</td></tr>`).join('')}</table>
      ${sent.filter(s => s.team_id === m.team_id).map(s => `<span class="pill warn">Invited: ${esc(s.email)} <a href="#" title="Email them the invite again" onclick="sendInvite('${s.team_id}','${esc(s.email)}');return false">✉</a> <a href="#" title="Cancel invite" onclick="cancelInvite('${s.team_id}','${esc(s.email)}');return false">✕</a></span>`).join(' ')}
      ${m.role !== 'leader' ? '' : `<form class="row" style="margin-top:10px" onsubmit="savePublicName(event,'${m.team_id}')"><input name="pname" value="${esc(m.teams.public_name || '')}" placeholder="Public name shown on checks, e.g. Ray White Ashgrove" style="max-width:320px"><button class="btn s g">Save public name</button></form>`}
      <form class="row" style="margin-top:10px" onsubmit="invite(event,'${m.team_id}')"><input type="email" name="email" placeholder="Colleague's email" required style="max-width:280px"><button class="btn s">Invite</button></form></div>`).join('')}
    <div class="box"><form class="row" onsubmit="newTeam(event)"><input name="name" placeholder="New team name, e.g. Smith Realty – Rentals" required style="max-width:320px"><button class="btn o">Create team</button></form></div>`;
}
async function savePublicName(e, team) { e.preventDefault(); const {error} = await sb.rpc('set_team_public_name', {team, pname: e.target.pname.value}); fail(error); toast('Public name saved.'); }
async function newTeam(e) { e.preventDefault(); const {error} = await sb.rpc('create_team', {p_name: e.target.name.value}); fail(error); toast('Team created.'); route(); }
async function invite(e, team) {
  e.preventDefault(); const email = e.target.email.value.trim().toLowerCase();
  const {error} = await sb.from('team_invites').insert({team_id: team, email, invited_by: me.id}); fail(error);
  await route(); sendInvite(team, email);
}
// Email the invite through SAM (Resend). If that isn't possible, fall back to the inviter's own email app.
async function sendInvite(team, email) {
  const {data, error} = await sb.functions.invoke('clever-action', {body: {team_id: team, email}});
  if (!error && data?.sent) return toast('Invite emailed to ' + email + '.');
  let msg = error?.message || data?.error || '';
  try { msg = (await error.context.json()).error || msg; } catch (e) {}
  console.warn('SAM invite email not sent:', msg);
  inviteEmail(team, email);
}
// Until SAM can send emails itself: open the inviter's own email app with a ready-made invite
function inviteEmail(team, email) {
  const name = document.querySelector(`[data-team="${team}"]`)?.textContent || 'our team';
  const link = location.origin + location.pathname + '#/signup';
  const subject = `Join ${name} on SAM`;
  const body = `Hi,\n\nI've invited you to join ${name} on SAM (Smoke Alarm Maintenance), where we keep our smoke alarm records.\n\n` +
    `1. Create your account here, using this email address (${email}): ${link}\n   Already have an account? Just log in.\n2. Open Teams and click Join team.\n\nThanks,\n${me.name || ''}`;
  location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  toast('Invite added. Your email app should open with a message ready to send.');
}
async function cancelInvite(team, email) { const {error} = await sb.from('team_invites').delete().eq('team_id', team).eq('email', email); fail(error); route(); }
async function acceptInvite(team) { const {error} = await sb.rpc('accept_invite', {p_team: team}); fail(error); toast('You joined the team.'); route(); }
async function leaveTeam(team) { if (!confirm('Leave this team? You will no longer see its properties.')) return; const {error} = await sb.rpc('remove_member', {team, member: me.id}); fail(error); toast('You have left the team.'); route(); }
async function removeMember(team, member) { if (!confirm('Remove this person from the team? Properties assigned to them will become unassigned.')) return; const {error} = await sb.rpc('remove_member', {team, member}); fail(error); toast('Removed.'); route(); }
async function setRole(team, member, new_role) { const {error} = await sb.rpc('set_member_role', {team, member, new_role}); fail(error); toast('Role changed.'); route(); }
function fillAssign(team) {
  const s = $('#assign'); if (!s) return;
  const t = (window._teams || []).find(x => x.id === team), people = (window._people || []).filter(x => x.team_id === team);
  s.innerHTML = people.map(x => `<option value="${x.user_id}" ${x.user_id === window._assigned ? 'selected' : ''}>${esc(personName(x))}</option>`).join('') || `<option value="${me.id}">${esc(me.name || me.email)}</option>`;
  if (!people.some(x => x.user_id === window._assigned)) s.value = me.id;
  s.disabled = !(t?.role === 'leader'); s.title = s.disabled ? 'Only a team leader can assign properties to someone else' : '';
}

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
    <label class="wide">Public name<input name="public_name" value="${esc(me.public_name)}" placeholder="Shown on property look-ups, e.g. Joe Steenson, Ray White Ashgrove"></label>
    <div class="wide"><div class="small muted" style="margin-bottom:6px">Company logo (shown on property look-ups)</div><div class="row">${me.logo_path ? `<img src="${logoUrl(me.logo_path)}" class="logoimg">` : ''}<label class="btn s g" style="margin:0">${me.logo_path ? 'Change logo' : 'Upload logo'}<input type="file" accept="image/*" hidden onchange="uploadLogo(this)"></label>${me.logo_path ? '<button type="button" class="btn s g" onclick="removeLogo()">Remove</button>' : ''}</div></div>
    ${me.role === 'electrician' ? `<label>Licence number<input name="licence_no" value="${esc(me.licence_no)}"></label>` : ''}
    <label>Email<input disabled value="${esc(me.email)}"></label><label>Account type<input disabled value="${esc(ROLES[me.role] || me.role)}"></label>
    <div class="wide row"><button class="btn o">Save</button><button type="button" class="btn g" onclick="newPassword()">Change password</button></div></form></div>
`;
  $('#prf').onsubmit = async e => {
    e.preventDefault(); const d = formData(e.target);
    const {data, error} = await sb.from('profiles').update(d).eq('id', me.id).select().single(); fail(error); me = data; toast('Saved.');
  };
}

start();

// ---------- look up a property / tenants ----------
const fmtD = d => d ? new Date(d + 'T00:00').toLocaleDateString('en-AU', {day: 'numeric', month: 'short', year: 'numeric'}) : 'None recorded';
function publicCard(i) {
  if (!i) return '';
  const lc = i.last_check, old = d => !d || d < addMonths(today(), -12);
  const res = lc?.result ? `<span class="pill ${lc.result === 'Compliant' ? 'ok' : 'bad'}">${lc.result === 'Compliant' ? 'Passed' : 'Issues found'}</span>` : '';
  return `<div class="box pubcard"><h3 style="margin-top:0">${esc(i.street)}, ${esc(i.suburb || '')} ${esc(i.postcode || '')}</h3>
    <p><b>Last check:</b> ${lc ? `${fmtD(lc.date)} ${res}${lc.by ? ` by ${lc.logo ? `<img src="${logoUrl(lc.logo)}" class="logoimg sm" alt="">` : ''}${esc(lc.by)}` : ''}${lc.trained ? ' <span class="pill ok">SAM Academy trained</span>' : ''}${lc.type === 'licensed' ? ' (electrician)' : ''}` : 'None recorded'} ${old(lc?.date) ? '<span class="pill bad">Overdue</span>' : '<span class="pill ok">Up to date</span>'}</p>
    <p><b>Last tenant test & clean:</b> ${fmtD(i.last_tenant_check)}</p>
    <p><b>Alarms recorded:</b> ${i.alarms}${i.earliest_expiry ? ` · <b>Earliest alarm expiry:</b> ${fmtD(i.earliest_expiry)}${i.earliest_expiry < today() ? ' <span class="pill bad">Expired</span>' : ''}` : ''}</p>
    ${i.managed ? '' : '<p class="muted">No property manager has added this property to SAM yet.</p>'}</div>`;
}
const addrFields = () => `<label>Street address<input name="street" required placeholder="Start typing, e.g. 3/12 Smith Street"></label><label>Suburb<input name="suburb" required></label><label>Postcode<input name="postcode" required inputmode="numeric" maxlength="4"></label>`;
async function lookup() {
  $('#main').innerHTML = `<h1>Look up a property</h1><p class="muted">See when a property's smoke alarms were last checked and by whom.</p>
    <div class="box"><form id="lk" class="grid">${addrFields()}<div class="wide"><button class="btn o">Look up</button></div></form></div><div id="lkr"></div>`;
  $('#lk').onsubmit = async e => {
    e.preventDefault(); const d = formData(e.target);
    const {data, error} = await sb.rpc('lookup_property', d); fail(error); unbusy();
    $('#lkr').innerHTML = data ? publicCard(data) : '<div class="box">That address isn\'t in SAM yet. Check the spelling, or try the street type in full (Street rather than St).</div>';
  };
}
async function tenantHome() {
  const {data: links} = await sb.from('property_tenant_users').select('property_id').eq('user_id', me.id);
  const cards = [];
  for (const l of links || []) { const {data} = await sb.rpc('property_public', {p: l.property_id}); cards.push(data); }
  setTimeout(() => {
    const f = $('#join'); if (f) f.onsubmit = async e => { e.preventDefault(); const {error} = await sb.rpc('tenant_join_property', formData(e.target)); fail(error); toast('Your home has been added.'); route(); };
  });
  return `<p class="muted">Test and clean your smoke alarms at least once a year, and log it here. We'll send you reminders.</p>
    ${cards.map(c => publicCard(c).replace('</h3>', ` <button class="btn s g" style="float:right" onclick="removeHome('${c.id}')">Remove</button></h3>`).replace(/<\/div>$/, '') + `<hr style="border:0;border-top:1px solid var(--line);margin:18px 0"><h3 style="margin-top:0">Your yearly test & clean</h3>${tenantDue(c.last_tenant_check)}
      <button class="btn o" onclick="this.style.display='none';this.nextElementSibling.style.display='grid'">Test & clean now</button>
      <form class="grid" style="display:none;margin-top:14px" onsubmit="tenantCheck(event,'${c.id}')">
      <label>Date<input type="date" name="check_date" value="${today()}" max="${today()}" required></label>
      <div class="q wide"><p>When you pressed each test button, did every alarm sound?</p>${['Yes', 'No'].map(v => `<label class="opt"><input type="radio" name="all_sounded" value="${v}" required>${v}</label>`).join('')}</div>
      <div class="q wide"><p>Did you clean each alarm (vacuum or soft brush on the vents)?</p>${['Yes', 'No'].map(v => `<label class="opt"><input type="radio" name="cleaned" value="${v}" required>${v}</label>`).join('')}</div>
      <label class="wide">Anything to report? (beeping, damage, an alarm missing)<textarea name="notes"></textarea></label>
      <div class="wide"><button class="btn o">Save</button></div></form></div>`).join('')}
    ${cards.length >= 2 ? '<p class="muted small">You can add up to 2 homes. Remove one to add another.</p>' : `<div class="box"><h3 style="margin-top:0">${cards.length ? 'Add another home' : 'Add the home you live in'}</h3><form id="join" class="grid">${addrFields()}<div class="wide"><button class="btn o">Add</button></div></form></div>`}
    <p class="muted">Have a look at <a href="#/help">Help</a> for how to test and clean your alarms.</p>`;
}
async function tenantCheck(e, pid) {
  e.preventDefault(); const d = formData(e.target);
  const {error} = await sb.from('tenant_checks').insert({property_id: pid, check_date: d.check_date, all_sounded: d.all_sounded === 'Yes', cleaned: d.cleaned === 'Yes', notes: d.notes || null}); fail(error);
  toast(d.all_sounded === 'No' ? 'Saved. As an alarm didn\'t sound, please tell your property manager straight away.' : 'Saved. Thank you!'); route();
}
async function myhome() { $('#main').innerHTML = '<h1>My home</h1>' + await tenantHome(); }
async function removeHome(pid) {
  if (!confirm('Remove this home from My home? Your past test records stay with the property.')) return;
  const {error} = await sb.from('property_tenant_users').delete().eq('property_id', pid).eq('user_id', me.id); fail(error); toast('Removed.'); route();
}

// ---------- address suggestions (Google Places) ----------
const GKEY = window.SAM_CONFIG.googleKey;
function attachAddress(input) {
  if (!GKEY || input._addr) return; input._addr = true; input.setAttribute('autocomplete', 'off');
  const f = input.form, box = document.createElement('div'); box.className = 'addrlist'; input.parentNode.style.position = 'relative'; input.after(box);
  let token = crypto.randomUUID(), timer;
  const close = () => { box.innerHTML = ''; box.style.display = 'none'; };
  input.addEventListener('input', () => {
    clearTimeout(timer); if (input.value.trim().length < 4) return close();
    timer = setTimeout(async () => {
      try {
        const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Goog-Api-Key': GKEY},
          body: JSON.stringify({input: input.value, includedRegionCodes: ['au'], includedPrimaryTypes: ['street_address', 'subpremise', 'premise'], sessionToken: token})});
        const j = await r.json(); const s = (j.suggestions || []).map(x => x.placePrediction).filter(Boolean);
        if (!s.length) return close();
        box.innerHTML = s.map(p => `<button type="button" data-id="${esc(p.placeId)}">${esc(p.text.text)}</button>`).join('') + '<small>Powered by Google</small>';
        box.style.display = 'block';
      } catch (e) { close(); }
    }, 250);
  });
  box.addEventListener('mousedown', e => e.preventDefault());
  box.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return; close();
    const r = await fetch(`https://places.googleapis.com/v1/places/${b.dataset.id}?sessionToken=${token}`, {headers: {'X-Goog-Api-Key': GKEY, 'X-Goog-FieldMask': 'id,addressComponents'}});
    token = crypto.randomUUID(); const p = await r.json(), c = {};
    (p.addressComponents || []).forEach(x => x.types.forEach(t => c[t] = x));
    const g = t => c[t]?.longText || '';
    input.value = (g('subpremise') ? g('subpremise') + '/' : '') + [g('street_number'), g('route')].filter(Boolean).join(' ');
    const set = (n, v) => { if (f?.elements[n] && v) f.elements[n].value = v; };
    set('suburb', g('locality') || g('sublocality')); set('postcode', g('postal_code')); set('state', c.administrative_area_level_1?.shortText); set('address_id', p.id);
  });
  input.addEventListener('blur', () => setTimeout(close, 150));
}
new MutationObserver(() => document.querySelectorAll('input[name="street"]').forEach(attachAddress)).observe(document.body, {childList: true, subtree: true});
function tenantDue(last) {
  if (!last) return '<p class="pill warn" style="white-space:normal">No test & clean recorded yet. Please do one now.</p>';
  const due = addMonths(last, 12), soon = addMonths(today(), 1);
  if (due < today()) return `<p class="pill bad" style="white-space:normal">Overdue. You last tested and cleaned your alarms on ${fmtD(last)}, so the next test was due ${fmtD(due)}.</p>`;
  if (due <= soon) return `<p class="pill warn" style="white-space:normal">Coming up. Your next test & clean is due ${fmtD(due)}.</p>`;
  return `<p class="pill ok" style="white-space:normal">All good. You last tested and cleaned your alarms on ${fmtD(last)}. The next test is due ${fmtD(due)}.</p>`;
}
const logoUrl = p => sb.storage.from('logos').getPublicUrl(p).data.publicUrl;
async function uploadLogo(input) {
  const f = input.files[0]; if (!f) return;
  const path = `${me.id}/logo-${Date.now()}.jpg`, blob = await shrink(f, 600);
  const {error} = await sb.storage.from('logos').upload(path, blob, {contentType: 'image/jpeg'}); fail(error);
  if (me.logo_path) await sb.storage.from('logos').remove([me.logo_path]);
  const {data, error: e2} = await sb.from('profiles').update({logo_path: path}).eq('id', me.id).select().single(); fail(e2); me = data; toast('Logo saved.'); route();
}
async function removeLogo() {
  await sb.storage.from('logos').remove([me.logo_path]);
  const {data, error} = await sb.from('profiles').update({logo_path: null}).eq('id', me.id).select().single(); fail(error); me = data; route();
}
function pickedPhoto(input) {
  const f = input.form, other = input.name === 'photo' ? f.photo_cam : f.photo; if (input.files[0]) other.value = '';
  input.closest('.row').querySelector('.picked').textContent = input.files[0] ? '✓ Photo added' : '';
}
