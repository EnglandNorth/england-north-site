/* =========================================================
   ADMIN: everything you update lives in this block.
   Change a value, save, and the whole page updates.
   ========================================================= */
const CONFIG = {
  email: "camps@englandnorthvolleyball.co.uk",
  welfareOfficer: { name: "", contact: "" },   // fill in: name and email of the welfare officer

  // Sign-ups go to the England North Google Form, which saves them to its Google Sheet
  // and emails a copy. Entry IDs come from the live form; add more as questions are added.
  googleForm: {
    action: "https://docs.google.com/forms/d/e/1FAIpQLSdyKgN4VN1FrIT9wiyjYf-KcVfxvCoV6PZ8RjTj190fSLuxog/formResponse",
    email: "emailAddress",
    name: "entry.1985634976",
    mobile: "entry.1221599944",
    dob: "entry.1189691216",          // date question: sent as _year/_month/_day
    parentEmail: "entry.986908028",   // "Parent or Guardian email"
    club: "entry.1937283576",
    position: "entry.571082787",
    programme: "entry.341259679",
    message: "entry.467820305"
  },

  programmes: [
    {
      id: "denmark", featured: true, img: "img/denmark.jpg",
      title: "Denmark Easter Camp", flag: "DENMARK",
      when: "24 to 27 Mar 2027", sortDate: "2027-03-24",
      who: "U18 boys and girls", entry: "Open to applications",
      price: "£550",
      includes: ["Return flight from London", "Transfers in Denmark", "Accommodation", "Food at the camp", "Training", "Coaching", "England North training t-shirts"],
      placesLeft: 30, placesTotal: 0, // set placesTotal to show the progress bar
      status: "Applications open",
      blurb: "Train and compete in Denmark over Easter with our partners at Volleyball Danmark. Our biggest trip of the year."
    },
    {
      id: "lanzarote",
      title: "Lanzarote Beach Camp", flag: "LANZAROTE",
      when: "13 to 20 Feb 2027", sortDate: "2027-02-13",
      who: "Indoor and beach players", entry: "Open",
      price: "£1,200", status: "Limited places",
      includes: ["Flight", "Transfers", "Accommodation", "Food", "Coaching", "Beach vests", "England North towel"],
      blurb: "A week of beach volleyball training in the sun over February half-term. Sharper footwork, better reads, better indoor game."
    },
    {
      id: "belgium",
      title: "Belgium Summer Tour", flag: "BELGIUM",
      when: "20 to 23 Aug 2027", sortDate: "2027-08-20", where: "Waremme, Belgium",
      who: "U22 squad", entry: "Selected at trials",
      price: "Confirmed by January 2027", status: "Dates confirmed",
      blurb: "Our fourth year touring Waremme. Training, matches against Belgian club opposition and a pro league game.",
      cta: "Register for trials", pickTitle: "England North Trials"
    },
    {
      id: "trials", img: "img/trials.jpg",
      title: "England North Trials", flag: "TRIALS",
      when: "Date to be confirmed", sortDate: "", where: "Venue to be confirmed",
      who: "U22 players", entry: "Open to all",
      price: "£25 per player", status: "Register now",
      blurb: "Trials for the Waremme summer tour squad. Register now and we'll send you the date and venue as soon as they're confirmed.",
      cta: "Register for trials"
    },
    {
      id: "raf", img: "img/raf-camp.jpg",
      title: "Over-18s Summer Camp", flag: "RAF CAMP",
      when: "24 to 28 Jul 2027", sortDate: "2027-07-24", where: "RAF Cranwell, Lincolnshire",
      who: "Players aged 18 and over", entry: "Open",
      price: "£400", status: "Dates confirmed",
      includes: ["Training kit", "Meals", "Coaching", "Accommodation"],
      blurb: "A summer camp run with the RAF for players aged 18 and over. High standards, high-quality coaching, real progress."
    }
  ],

  // Extra dates that aren't programmes (trials, deadlines, info evenings)
  extraDates: [
    // { date:"2027-01-15", title:"Denmark balance due", note:"Final payment for Easter camp" }
  ]
};
/* ========================================================= */

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function render(){
  const P = CONFIG.programmes;
  const feat = P.find(p => p.featured);
  if (feat){
    const left = feat.placesLeft ? `around ${feat.placesLeft} places left` : feat.status;
    $('#alert').innerHTML = `<div class="wrap"><span class="pulse"></span><span>${esc(feat.title)} 2027: ${esc(left)}</span><a href="#register" data-pick="${esc(feat.title)}">Claim a place</a></div>`;
  }

  $('#cards').innerHTML = P.map(p => {
    const bar = p.placesTotal ? `<div class="bar"><span style="width:${Math.round((1 - p.placesLeft / p.placesTotal) * 100)}%"></span></div>` : '';
    const places = p.placesLeft ? `<div class="places">Around ${p.placesLeft} places left</div>${bar}` : '';
    return `<article class="card ${p.featured ? 'featured' : ''}">
      <div class="top"${p.img ? ` style="background-image:linear-gradient(180deg,rgba(11,11,11,.15) 0%,rgba(11,11,11,.85) 100%),url('${p.img}')"` : ''}><span class="flag">${esc(p.flag)}</span><h3>${esc(p.title)}</h3></div>
      <div class="body">
        <span class="chip ${p.featured ? 'hot' : ''}">${esc(p.status)}</span>
        ${places}
        <dl class="meta"><dt>When</dt><dd>${esc(p.when)}</dd>${p.where ? `<dt>Where</dt><dd>${esc(p.where)}</dd>` : ''}<dt>Who</dt><dd>${esc(p.who)}</dd><dt>Entry</dt><dd>${esc(p.entry)}</dd><dt>Cost</dt><dd>${esc(p.price || 'Details on request')}</dd></dl>
        <p>${esc(p.blurb)}</p>
        ${p.includes ? `<ul class="incl">${p.includes.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
        <a href="#register" class="btn" data-pick="${esc(p.pickTitle || p.title)}">${esc(p.cta || (p.featured ? 'Claim a place' : 'Register interest'))}</a>
      </div></article>`;
  }).join('');

  const rows = [
    ...P.filter(p => p.sortDate).map(p => ({ date: p.sortDate, label: p.when, title: p.title, note: p.who, prog: p.title })),
    ...CONFIG.extraDates.map(d => ({ date: d.date, title: d.title, note: d.note }))
  ].sort((a, b) => a.date.localeCompare(b.date));
  const mon = d => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { month: 'short' });
  const yr = d => d.slice(0, 4);
  $('#date-list').innerHTML = rows.map(r => `<div class="date-row">
      <div class="when"><b>${mon(r.date)}</b>${yr(r.date)}</div>
      <div><h4>${esc(r.title)}</h4><small>${esc(r.label || '')}${r.label ? ' · ' : ''}${esc(r.note || '')}</small></div>
      ${r.prog ? `<a href="#register" class="btn btn-ghost" data-pick="${esc(r.prog)}">Register</a>` : ''}
    </div>`).join('');

  $('#programme-select').innerHTML = '<option value="">Choose a programme</option>' +
    P.map(p => `<option>${esc(p.title)}</option>`).join('') +
    '<option>Not sure yet, tell me about everything</option><option>Partnership enquiry</option>';

  const w = CONFIG.welfareOfficer;
  $('#welfare-name').textContent = w.name ? `Welfare officer: ${w.name}` : 'Welfare officer';
  $('#welfare-contact').textContent = w.contact || `Contact via ${CONFIG.email}`;
  $('#footer-email').textContent = CONFIG.email;
}

function pick(title){
  const sel = $('#programme-select');
  [...sel.options].forEach(o => { if (o.text === title) sel.value = o.text; });
}

$('#reg-form').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, msg = $('#form-msg');
  if (!f.checkValidity()){
    const bad = f.querySelector(':invalid');
    msg.textContent = 'Please fill in the highlighted fields and tick the consent box.';
    msg.style.color = '#ff6b6b';
    if (bad) bad.focus();
    return;
  }
  const g = CONFIG.googleForm;
  const btn = f.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'Sending...';
  const v = k => (f[k] && f[k].value || '').trim();
  const data = new URLSearchParams();
  // Every question on the Google Form is required, so blanks are sent as a short note
  data.append(g.email, v('email'));
  data.append(g.name, (v('first') + ' ' + v('last')).trim());
  data.append(g.mobile, v('mobile'));
  const [yy, mm, dd] = v('dob').split('-');
  data.append(g.dob + '_year', yy); data.append(g.dob + '_month', String(+mm)); data.append(g.dob + '_day', String(+dd));
  data.append(g.parentEmail, v('email'));
  data.append(g.club, v('club') || 'Not given');
  data.append(g.position, v('position') || 'Not given');
  data.append(g.programme, v('programme'));
  // The form has no parent-name question, so the name goes in with the message
  data.append(g.message, [v('parent') ? 'Parent/guardian: ' + v('parent') : '', v('message')].filter(Boolean).join(' | ') || 'None');
  try {
    await fetch(g.action, { method: 'POST', mode: 'no-cors', body: data });
  } catch (err) {
    btn.disabled = false; btn.textContent = 'Send my interest';
    msg.textContent = 'Sorry, that didn\'t send. Please try again, or email ' + CONFIG.email + '.';
    msg.style.color = '#ff6b6b';
    return;
  }
  f.style.display = 'none';
  $('#thanks').style.display = 'block';
});

// Direct link: add #trials to the site address to open the form with trials picked
function openFromHash(){
  if (location.hash === '#trials'){
    pick('England North Trials');
    document.getElementById('register').scrollIntoView();
  }
}
window.addEventListener('hashchange', openFromHash);

document.addEventListener('click', e => {
  const m = e.target.closest('[data-action="menu"]');
  if (m) { $('#menu').classList.toggle('open'); return; }
  const p = e.target.closest('[data-pick]');
  if (p) pick(p.dataset.pick);
  if (e.target.closest('#menu a')) $('#menu').classList.remove('open');
});

render();
openFromHash();
