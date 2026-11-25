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
  kitFields();
}

// Shirt size is needed for any programme that includes kit; the printed name only for trials
function kitFields(){
  const p = CONFIG.programmes.find(x => x.title === $('#programme-select').value);
  const inc = (p && p.includes) || [];
  const needsSize = p && p.askSize !== false && inc.some(i => /shirt|top|kit|vest/i.test(i)); // askSize:false = sized in person at trials
  const needsName = inc.some(i => /personalised/i.test(i));
  $('#size-wrap').style.display = needsSize ? '' : 'none';
  $('#size-select').required = needsSize;
  $('#printname-wrap').style.display = needsName ? '' : 'none';
}
$('#programme-select').addEventListener('change', kitFields);

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
  // Shirt size and printed name get their own questions once the form has them; until then they ride in the message
  const extra = [];
  const size = $('#size-wrap').style.display === 'none' ? '' : v('size');
  const printName = $('#printname-wrap').style.display === 'none' ? '' : v('printname');
  if (size) { if (g.size) data.append(g.size, size); else extra.push('Shirt size: ' + size); }
  if (printName) { if (g.printName) data.append(g.printName, printName); else extra.push('Name on top: ' + printName); }
  // The form has no parent-name question, so the name goes in with the message
  data.append(g.message, [...extra, v('parent') ? 'Parent/guardian: ' + v('parent') : '', v('message')].filter(Boolean).join(' | ') || 'None');
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

// Direct links: add #trials or #girls-trials to the site address to open the form with that trials picked
function openFromHash(){
  const links = { '#trials': 'England North Trials', '#girls-trials': 'England North Girls Trials' };
  if (links[location.hash]){
    pick(links[location.hash]);
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
kitFields();
