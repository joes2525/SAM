// SAM public website (shown to visitors who aren't logged in). Wording copied from the Framer site.
const AUDIENCES = [
  ['property-managers', 'Property Managers', 'You are already at the property for ingoing, routine and vacate inspections, so there’s no need to send someone else out.',
    ['Checked at inspections that are already booked', 'No extra visit, no waiting on a contractor', 'Additional revenue source while saving owners money', 'Every check dated and recorded, with photos', 'Know when it’s a job for an electrician', 'Course materials and exam included in our fee', 'Reminders, entry notices and compliance certificates generated automatically'], 'Sign up your agency', 'property_manager'],
  ['self-managers', 'Self Managers', 'Checking smoke alarms is a quick job anyone can do.',
    ['Already there for maintenance and inspections', '90% cheaper than a smoke alarm compliance company', 'Course materials and exam included in the price'], 'Get started', 'landlord'],
  ['diy-landlords', 'DIY Landlords', 'Have a property manager but you do maintenance yourself? No need to pay someone else to check the alarms.',
    ['Already at the property for something else', '90% cheaper than having a compliance company attend', 'Every check dated, with photos'], 'Get started', 'landlord'],
  ['electricians', 'Electricians', 'Do what you do best and leave the paperwork to us.',
    ['Licensed electricians only', 'Compliance certificates generated after each job', 'Entry notices emailed automatically', 'Smoke alarm details kept on file for next time', 'Annual service reminders sent to your clients', 'Easy to use website/app', 'Get referrals for smoke alarm work from us'], 'Sign up', 'electrician'],
  ['owner-occupiers', 'Owner Occupiers', 'From 2027 owner occupiers need alarms just like rental properties. Make sure you know what you need and be able to prove it if needed.',
    ['Keep your smoke alarm servicing records online and backed up', 'No waiting all day on a contractor', 'Annual service reminders keeping your family safe', '95% cheaper than a smoke alarm compliance company', 'Know when to call an electrician'], 'Get started', 'landlord'],
  ['tenants', 'Tenants', 'Tenants need to test and clean their smoke alarms at least once every 12 months. Sign up and we’ll remind you when it’s due. It’s free.',
    ['Free reminders when your yearly check is due', 'Simple steps for testing and cleaning your alarms', 'Know when to replace a flat battery', 'Know when to tell your property manager about a fault'], 'Get free reminders', 'tenant']];

// Tiny markdown: ### headings, - and 1. lists, **bold**, paragraphs
function md(text) {
  const out = []; let list = null;
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const line of (text || '').split('\n')) {
    const t = line.trim(); let m;
    if (!t) { close(); continue; }
    if ((m = t.match(/^!\[(.*?)\]\(((?:https:\/\/|img\/)[^)\s]+)\)$/))) { close(); out.push(`<figure class="diagram"><img src="${esc(m[2])}" alt="${esc(m[1])}" loading="lazy"></figure>`); }
    else if ((m = t.match(/^#{2,4}\s+(.*)/))) { close(); out.push(`<h3>${inline(m[1])}</h3>`); }
    else if ((m = t.match(/^[-•]\s+(.*)/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = t.match(/^\d+\.\s+(.*)/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(m[1])}</li>`); }
    else { close(); out.push(`<p>${inline(t)}</p>`); }
  }
  close(); return out.join('');
}

function showPublic() {
  $('#shell').classList.add('hidden'); $('#auth').classList.add('hidden'); $('#public').classList.remove('hidden');
  const [page, arg] = location.hash.replace(/^#\/?/, '').split('/');
  if (page === 'login' || page === 'signup') return me ? openApp() : showAuth(page, arg);
  const pages = {course: pubCourse, lesson: n => me ? openApp('#/lesson/' + n) : pubLocked(n), pricing: pubPricing, help: pubHelp};
  const p = pages[page] ? page : 'home';
  $('#public').innerHTML = `
    <a class="announce" href="#/signup">SAM Academy is part of SAM. Keep your smoke alarm records and certificates in SAM Register →</a>
    <header class="pnav"><a class="brand" href="#/"><img src="img/SAM-Academy-white.svg" alt="SAM Academy – Smoke alarm knowledge hub" class="toplogo"></a>
      <nav>${[['', 'Home'], ['course', 'Course'], ['pricing', 'Pricing'], ['help', 'Help']].map(([k, v]) => `<a href="#/${k}" class="${(p === k || (p === 'home' && !k) || (p === 'lesson' && k === 'course')) ? 'on' : ''}">${v}</a>`).join('')}
      ${me ? '<a class="btn o s" href="#" onclick="openApp();return false">My account</a>' : '<a class="btn o s" href="#/login">Log in / Sign up</a>'}</nav></header>
    <main id="pmain" class="pmain"></main>
    <footer class="pfoot"><p>SAM Academy, part of Smoke Alarm Maintenance (SAM). We provide training and record keeping only. Compliance decisions rest with your property manager and the owner. If you’re unsure about an alarm or whether a property complies, check with a licensed electrician.</p></footer>`;
  (p === 'home' ? pubHome : pages[p])(arg);
  window.scrollTo(0, 0);
}

function pubHome() {
  $('#pmain').innerHTML = `
  <section class="hero"><div class="wrap">
    <p class="eyebrow">QUEENSLAND PROPERTY MANAGERS</p>
    <h1>Welcome to SAM Academy</h1>
    <p class="lead">An online training course for Queensland property managers and landlords. Take the course, pass the exam, then check the smoke alarms yourself.</p>
    <p class="lead">The SAM Academy is provided by the Smoke Alarm Maintenance (SAM) Register. Use the SAM Register to keep your smoke alarm records safe, generate compliance certificates, receive reminders.</p>
    <div class="row"><a class="btn o" href="#/signup">Get started</a><a class="btn ghost" href="#/course">Have a look at the course</a></div>
    <div class="chips">${AUDIENCES.map(a => `<a href="#" onclick="document.getElementById('${a[0]}').scrollIntoView({behavior:'smooth'});return false">${a[1]}</a>`).join('')}</div>
  </div></section>
  <section class="wrap duo">
    <div class="card brandcard reg"><img src="img/SAM-Register.svg" alt="SAM Register"><p>Smoke alarm maintenance and compliance records</p><a class="btn s" href="#/signup">Start your register →</a></div>
    <div class="card brandcard acad"><img src="img/SAM-Academy.svg" alt="SAM Academy"><p>Courses and tools to help you check smoke alarms</p><a class="btn s" href="#/course">Have a look at the course →</a></div>
  </section>
  <section class="wrap steps">${[['Study', '7 modules, 1-2 hours'], ['Online Exam', 'Test your knowledge'], ['Practice', 'Do your first check'], ['Check', 'Check, test, service'], ['Log', 'Photos, dates and notes']]
    .map(([t, s], i) => `<div class="step"><span>${i + 1}</span><b>${t}</b><small>${s}</small></div>`).join('')}</section>
  <section class="wrap band">
    <h2>You don’t need to be an electrician to test an alarm</h2>
    <p class="lead">You don’t need to be qualified or licensed to test or clean a smoke alarm. Pressing the test button, giving it a clean and changing a battery is something most property managers and DIY landlords can do when they are at the property for something else.</p>
    <div class="duo">
      <div class="card"><h3>Anyone can</h3><ul class="ticks">${['Press the test button on every alarm', 'Check they all go off together', 'Clean them with a vacuum or soft brush', 'Check the date and the label', 'Spot anything missing, damaged or covered'].map(x => `<li>${x}</li>`).join('')}</ul></div>
      <div class="card"><h3>Call a licensed electrician when</h3><ul class="warns">${['A hardwired alarm needs replacing', 'An alarm doesn’t sound or won’t stop', 'Alarms aren’t going off together', 'An alarm is missing or out of date', 'Anything involving wiring'].map(x => `<li>${x}</li>`).join('')}</ul></div>
    </div>
    <p class="muted">Saves calling someone out for a test button. Book the electrician only when there’s actually a problem.</p>
  </section>
  <section class="navyband"><div class="wrap"><h2>Who it’s for</h2><div class="audgrid">
    ${AUDIENCES.map(([id, title, intro, points, cta, role]) => `<div class="aud card" id="${id}"><h3>${title}</h3><p class="intro">${intro}</p>
      <ul class="ticks">${points.map(x => `<li>${x}</li>`).join('')}</ul>
      <div class="row"><a class="btn o" href="#/signup/${role}">${cta}</a>${role === 'tenant' || role === 'electrician' ? '' : '<a class="btn g" href="#/course">Have a look at the course</a>'}</div></div>`).join('')}
  </div></div></section>`;
}

async function pubCourse() {
  const {data: mods} = await sb.from('modules').select('id,title,summary,is_exam').eq('published', true).order('id');
  $('#pmain').innerHTML = `<section class="wrap"><h1>Course</h1>
    <h2>How it works</h2><p class="lead">Complete the 7 modules, then the exam. Once you pass you can start logging checks.</p>
    <div class="steps">${[['Do the modules', 'Whenever it suits you, 1-2 hours'], ['Pass the exam', 'Get a perfect score, 15 out of 15'], ['Check Smoke alarms', 'At your routine/vacate/entry inspections']]
      .map(([t, s], i) => `<div class="step"><span>Step ${i + 1}</span><b>${t}</b><small>${s}</small></div>`).join('')}</div>
    <div class="mods">${(mods || []).filter(m => !m.is_exam).map(m => `<a class="card mod" href="#/lesson/${m.id}"><span class="num">${m.id}</span><div><b>${esc(m.title)}</b><p>${esc(m.summary || '')}</p></div><span class="btn s g">${me ? 'Open' : '🔒 Sign up to open'}</span></a>`).join('')}</div>
    <div class="card band2"><h2>Done all 7?</h2><p><b>Time for the exam.</b> 15 multiple-choice questions. You need every one right. Didn’t pass? Have another go.</p>
      <a class="btn o" href="${me ? '#' : '#/signup'}" ${me ? 'onclick="openApp(\'#/quiz/8\');return false"' : ''}>Start the exam</a><p class="small muted">You’ll need a free SAM account so your progress is saved.</p></div></section>`;
}

// Lessons need an account: visitors are asked to sign up or log in
function pubLocked(n) {
  $('#pmain').innerHTML = `<section class="wrap"><div class="card band2" style="max-width:640px">
    <h2>Create a free account to start the course</h2>
    <p>The modules, quizzes and exam are inside your SAM account, so your progress is saved as you go.</p>
    <div class="row"><a class="btn o" href="#/signup">Create an account</a><a class="btn ghost" style="color:#fff;border-color:#fff" href="#/login">Log in</a></div>
    <p class="small muted" style="margin-top:14px"><a href="#/course" style="color:#aab6cc">← Back to Course</a></p></div></section>`;
}

// Lesson page (inside the app, for logged-in users)
async function lessonPage(n, target) {
  const {data: m} = await sb.from('modules').select('*').eq('id', +n).single();
  if (!m) { $(target).innerHTML = '<p>Module not found.</p>'; return; }
  const prev = +n > 1 ? +n - 1 : null, next = +n < 7 ? +n + 1 : null;
  $(target).innerHTML = `<section class="wrap lesson">
    <a href="#/course">← Back to Course</a>
    <p class="eyebrow">Module ${m.id} of 7</p><h1>${esc(m.title)}</h1><p class="lead">${esc(m.summary || '')}</p>
    <div class="content">${md(m.content)}</div>
    ${m.key_points ? `<div class="card kp"><h3>Key points</h3>${md(m.key_points)}</div>` : ''}
    ${m.example ? `<div class="card ex"><h3>Example</h3><p>${esc(m.example)}</p></div>` : ''}
    <div class="card quizcta"><b>Ready? Take the Module ${m.id} quiz.</b>
      <a class="btn o" href="${me ? '#/quiz/' + m.id : '#/signup'}">${me ? 'Take the quiz' : 'Sign up to take the quiz'}</a></div>
    <div class="spread">${prev ? `<a href="#/lesson/${prev}">‹ Previous module</a>` : '<span></span>'}${next ? `<a href="#/lesson/${next}">Next module ›</a>` : ''}</div>
  </section>`;
  window.scrollTo(0, 0);
}

function pubPricing() {
  $('#pmain').innerHTML = `<section class="wrap"><h1>Pricing</h1>
  <div class="prices">
    <div class="card price"><h3>Property managers and electricians</h3><div class="big">$10</div><p class="muted">per check, down to $5 in bulk</p>
      <p>Covers training, the platform and record keeping. Buy checks in bulk and the price drops.</p>
      <table><tr><td>1 to 99 checks</td><td><b>$10 each</b></td></tr><tr><td>100+ checks</td><td><b>$5 each (50% off)</b></td></tr></table>
      <p class="small muted">Bulk checks are bought up front and used across any of your properties.</p></div>
    <div class="card price"><h3>One-off checks</h3><div class="big">$10</div><p class="muted">per check</p>
      <p>For self-managing landlords, DIY landlords and owner occupiers. No bulk purchase needed: pay as you go. Covers training, the platform and record keeping.</p>
      <ul class="ticks"><li>Course and exam included</li><li>Dated record of every alarm, with photos</li><li>Compliance certificate for each check</li><li>Reminder when the next check is due</li></ul>
      <p class="small muted">Only pay for a check when you do one. No subscription or lock-in contract.</p></div>
    <div class="card price"><h3>Tenants</h3><div class="big">Free</div><p class="muted">yearly reminders</p>
      <p>Get a reminder when your yearly test and clean is due, plus simple steps for doing it.</p>
      <ul class="ticks"><li>Yearly reminder by email</li><li>Step-by-step guide to testing and cleaning</li><li>Know when to replace a flat battery</li><li>Know what to report to your property manager</li></ul>
      <p class="small muted">Your landlord or property manager is still responsible for fixing faulty alarms.</p></div>
  </div>
  <div class="card band2"><p class="eyebrow">Recommended price</p><div class="big">$50</div>
    <p>We recommend property managers invoice $50 for checking and servicing the alarms. They are already at the property, so there’s no extra visit, but there is still work to do (normally 20-30 minutes per property). Importantly this is less than half of what a traditional smoke alarm company charges. Includes a compliance certificate from your property manager.</p>
    <ul class="ticks"><li>Skip the callout fees</li><li>Most properties only need one check a year</li><li>Done at the inspection you’re already doing</li><li>Records kept for every property</li></ul>
    <a class="btn o" href="#/signup/property_manager">Sign up your agency</a>
    <p class="small muted">SAM Register charges a fee per check to cover training, the platform and record keeping. Self-managing landlords and electricians who do their own checks just pay the $10 platform fee.</p></div>
  </section>`;
}

function pubHelp() {
  const qa = [
    ['Do I have to do it all in one go?', 'No. Your progress saves to your SAM account.'],
    ['Failed the exam?', 'Go back over the modules and try again. As many goes as you need.'],
    ['Does this replace the yearly compliance check?', 'No. It’s an extra check between licensed inspections. Only a licensed electrician can install or replace hardwired alarms.'],
    ['Do we need an electrician to test smoke alarms?', 'No. Anyone can test and clean a smoke alarm. You only need a licensed electrician to install, replace or fix hardwired alarms.'],
    ['What are the smoke alarm rules for Queensland rentals?', 'Since 1 January 2022, a Queensland dwelling that is leased, or sold, must have photoelectric smoke alarms that are interconnected and comply with Australian Standard AS 3786-2014. Alarms are required in every bedroom, in hallways that connect bedrooms to the rest of the home, and on every storey. From 1 January 2027 these rules apply to all Queensland homes. Check the Queensland Fire Department website for the current requirements.'],
    ['How often do alarms in a rental need to be checked?', 'In Queensland, alarms in a rental must be tested and cleaned within 30 days before each new tenancy or tenancy renewal, and any flat or nearly flat batteries replaced. Alarms must be replaced before they are 10 years old, or sooner if they fail when tested.'],
    ['How do I get an electrician?', 'Contact us with the property, the work needed, any preferred dates and how to get access. We’ll arrange a licensed local electrician and send you a quote before any work goes ahead.']];
  $('#pmain').innerHTML = `<section class="wrap"><h1>Help</h1>
    ${qa.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}
    <div class="card" style="margin-top:24px"><h2 style="margin-top:0">Still need help? Contact us</h2><p>Send us a message and we’ll get back to you within one business day.</p>
      <form id="contact" class="f"><label>Name<input name="name" required></label><label>Email<input name="email" type="email" required></label>
      <label class="wide">Message<textarea name="message" required></textarea></label><div class="wide"><button class="btn o">Send message</button></div></form></div></section>`;
  $('#contact').onsubmit = async e => {
    e.preventDefault(); const {error} = await sb.from('contact_messages').insert(formData(e.target)); fail(error);
    e.target.outerHTML = '<p class="pill ok">Thanks, your message has been sent. We’ll get back to you within one business day.</p>';
  };
}
