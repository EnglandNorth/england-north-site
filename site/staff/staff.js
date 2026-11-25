/* England North staff availability page.
   Trips and events come from CONFIG in /config.js (programmes + staffOnly),
   so anything added to the website shows up here too.
   Answers are sent to the Google Apps Script set in CONFIG.staffSheet. */

const ROLES = ['Coach', 'Driver', 'First aider', 'Welfare lead'];
const STATUS = [['yes', 'Available'], ['maybe', 'Maybe'], ['no', "Can't"]];
const KIT = [
  ['tshirt', 'T-shirt'], ['polo', 'Polo'], ['trackTop', 'Tracksuit top'], ['techPants', 'Tech pants'],
  ['shorts', 'Shorts'], ['hoodie', 'Hoodie'], ['backpack', 'Backpack', true] // true = one size
];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const KEY = 'en-staff-v1';
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Every trip and event, soonest first; ones without a date go last
const events = [...CONFIG.programmes, ...(CONFIG.staffOnly || [])]
  .map(p => ({ ...p, staffOnly: (CONFIG.staffOnly || []).includes(p) }))
  .sort((a, b) => (a.sortDate || '9999').localeCompare(b.sortDate || '9999'));

// Individual days for multi-day events (dates only, no time zone shifts)
function days(p) {
  if (!p.sortDate || !p.endDate || p.endDate === p.sortDate) return [];
  const out = [];
  const d = new Date(p.sortDate + 'T12:00:00Z');
  const end = new Date(p.endDate + 'T12:00:00Z');
  while (d <= end && out.length < 31) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}
const fmt = (iso, opts) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });

// Saved answers on this phone, so staff can come back and edit
let state = { person: {}, answers: {}, kit: { fit: '', items: {} } };
try { state = { ...state, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
const kitItem = id => (state.kit.items[id] = state.kit.items[id] || { size: '', status: '' });
let photo = ''; // resized JPEG (base64), only kept until sent

function renderKit() {
  document.querySelector('[data-fit]').value = state.kit.fit || '';
  $('#kit').innerHTML = KIT.map(([id, label, oneSize]) => {
    const k = kitItem(id);
    return `<div class="kit-row${k.status === 'need' ? ' need-it' : ''}" data-kit="${id}">
      <b>${label}</b>
      ${oneSize ? '<span class="na">One size</span>' : `<select data-size aria-label="${label} size"><option value="">Size</option>${SIZES.map(z => `<option${k.size === z ? ' selected' : ''}>${z}</option>`).join('')}</select>`}
      <div class="pair">${[['have', 'Got it'], ['need', 'Need one']].map(([v, l]) => `<button type="button" class="chip" data-v="${v}" aria-pressed="${k.status === v}">${l}</button>`).join('')}</div>
    </div>`;
  }).join('');
}

// Shrink the photo on the phone before sending: max 900px, JPEG
function loadPhoto(file) {
  if (!file || !/^image\//.test(file.type)) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const url = c.toDataURL('image/jpeg', 0.85);
      photo = url.split(',')[1];
      $('#ph').innerHTML = `<img src="${url}" alt="Your photo">`;
      document.querySelector('.pick').firstChild.textContent = 'Change photo';
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

const ans = id => (state.answers[id] = state.answers[id] || { status: '', days: null, roles: [], note: '' });

function render() {
  $('#events').innerHTML = events.map(p => {
    const a = ans(p.id);
    const ds = days(p);
    const confirmed = p.sortDate && p.endDate;
    const cal = confirmed
      ? `<div class="m">${fmt(p.sortDate, { month: 'short' })}</div><div class="d">${fmt(p.sortDate, { day: 'numeric' })}</div>`
      : `<div class="m">${p.sortDate ? fmt(p.sortDate, { month: 'short' }) : 'Date'}</div><div class="d tbc">TBC</div>`;
    const picked = a.days || ds;
    return `<article class="ev${a.status === 'yes' || a.status === 'maybe' ? ' open' : ''}" data-id="${esc(p.id)}">
      <div class="ev-head">
        <div class="cal">${cal}</div>
        <div><h3>${esc(p.title)}${p.staffOnly ? '<span class="stamp">Staff only</span>' : ''}</h3>
        <div class="sub">${esc(p.when)} · ${esc(p.where || 'Venue TBC')}</div></div>
      </div>
      <div class="ev-body">
        <div class="seg" role="group" aria-label="Can you do ${esc(p.title)}?">
          ${STATUS.map(([s, l]) => `<button type="button" data-s="${s}" aria-pressed="${a.status === s}">${l}</button>`).join('')}
        </div>
        <div class="more">
          ${ds.length ? `<h4>Which days?</h4><p class="hint">Tap to remove any days you can't do</p><div class="chips" data-group="days">
            ${ds.map(d => `<button type="button" class="chip" data-v="${d}" aria-pressed="${picked.includes(d)}">${fmt(d, { day: 'numeric' })}<small>${fmt(d, { weekday: 'short' })}</small></button>`).join('')}
          </div>` : ''}
          <h4>Your role</h4><div class="chips" data-group="roles">
            ${ROLES.map(r => `<button type="button" class="chip" data-v="${esc(r)}" aria-pressed="${a.roles.includes(r)}">${esc(r)}</button>`).join('')}
          </div>
          <label>Anything we should know? <small>(optional)</small><input data-note maxlength="200" value="${esc(a.note)}" placeholder="e.g. can drive the minibus, arriving a day late"></label>
        </div>
      </div>
    </article>`;
  }).join('');
  progress();
}

function progress() {
  const done = events.filter(p => ans(p.id).status).length;
  $('#prog-text').textContent = `${done} of ${events.length} answered`;
  $('#prog-fill').style.width = (events.length ? 100 * done / events.length : 0) + '%';
}

// Fill in saved personal details
const form = $('#staff-form');
for (const [k, v] of Object.entries(state.person)) {
  const f = form.elements[k];
  if (!f) continue;
  if (f.type === 'checkbox') f.checked = v === 'yes'; else f.value = v;
}
const bioCount = () => { $('#bio-count').textContent = `${form.elements.bio.value.length} / 600`; };
bioCount();
$('#photo').addEventListener('change', e => loadPhoto(e.target.files[0]));
form.addEventListener('change', e => {
  if (e.target.type === 'checkbox' && e.target.name) { state.person[e.target.name] = e.target.checked ? 'yes' : ''; save(); }
  if (e.target.matches('[data-fit]')) { state.kit.fit = e.target.value; save(); }
  if (e.target.matches('[data-size]')) {
    const row = e.target.closest('.kit-row');
    kitItem(row.dataset.kit).size = e.target.value; row.classList.remove('missing'); save();
  }
});
form.addEventListener('input', e => {
  if (e.target.name && e.target.type !== 'checkbox') { state.person[e.target.name] = e.target.value; save(); }
  if (e.target.name === 'bio') bioCount();
  if (e.target.matches('[data-note]')) { ans(e.target.closest('.ev').dataset.id).note = e.target.value; save(); }
});

// Clear the error once they start fixing things
const clearMsg = () => { $('#msg').className = 'msg'; };
form.addEventListener('change', clearMsg);
document.addEventListener('click', e => {
  if (e.target.closest('.seg button, .pair .chip')) clearMsg();
  if (e.target.closest('[data-action="edit"]')) { document.body.classList.remove('sent'); scrollTo(0, 0); return; }
  const kitRow = e.target.closest('.kit-row');
  const kitChip = e.target.closest('.pair .chip');
  if (kitRow && kitChip) {
    const k = kitItem(kitRow.dataset.kit);
    k.status = kitChip.dataset.v;
    kitRow.querySelectorAll('.pair .chip').forEach(c => c.setAttribute('aria-pressed', c === kitChip));
    kitRow.classList.toggle('need-it', k.status === 'need');
    if (k.size || !kitRow.querySelector('[data-size]')) kitRow.classList.remove('missing');
    save(); return;
  }
  const ev = e.target.closest('.ev');
  if (!ev) return;
  const a = ans(ev.dataset.id);
  const seg = e.target.closest('.seg button');
  if (seg) {
    a.status = seg.dataset.s;
    ev.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', b === seg));
    ev.classList.toggle('open', a.status !== 'no');
    ev.classList.remove('need');
    progress(); save(); return;
  }
  const chip = e.target.closest('.chip');
  if (chip) {
    const on = chip.getAttribute('aria-pressed') !== 'true';
    chip.setAttribute('aria-pressed', on);
    const group = chip.parentElement.dataset.group;
    a[group] = [...chip.parentElement.querySelectorAll('.chip[aria-pressed="true"]')].map(c => c.dataset.v);
    save();
  }
});

function fail(text, el) {
  const m = $('#msg');
  m.textContent = text; m.className = 'msg err';
  (el || m).scrollIntoView({ behavior: 'smooth', block: 'center' });
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  $('#msg').className = 'msg';
  const bad = [...form.querySelectorAll('[name][required]')].find(f => !f.value.trim() || !f.checkValidity());
  if (bad) { bad.focus(); return fail('Please fill in your details at the top first.', bad); }
  const missing = events.filter(p => !ans(p.id).status);
  document.querySelectorAll('.ev').forEach(el => el.classList.toggle('need', missing.some(p => p.id === el.dataset.id)));
  if (missing.length) return fail(`Please answer ${missing.length === 1 ? 'the event' : 'the ' + missing.length + ' events'} marked in red.`, document.querySelector('.ev.need'));
  const fit = document.querySelector('[data-fit]');
  if (!fit.value) { fit.focus(); return fail('Please choose your kit fit.', fit); }
  const kitGaps = KIT.filter(([id, , oneSize]) => !kitItem(id).status || (!oneSize && !kitItem(id).size));
  document.querySelectorAll('.kit-row').forEach(r => r.classList.toggle('missing', kitGaps.some(([id]) => id === r.dataset.kit)));
  if (kitGaps.length) return fail('Please give a size, and say whether you\'ve got it or need one, for each kit item marked in red.', document.querySelector('.kit-row.missing'));
  if (!CONFIG.staffSheet) return fail('This page isn\'t connected to the staff sheet yet. Please try again later.');

  const payload = {
    v: 1,
    code: state.code,
    person: state.person,
    photo,
    kit: { fit: state.kit.fit, items: KIT.map(([id, label, oneSize]) => ({ id, item: label, size: oneSize ? 'One size' : kitItem(id).size, status: kitItem(id).status })) },
    events: events.map(p => {
      const a = ans(p.id), ds = days(p);
      const picked = a.status === 'no' ? [] : (a.days || ds);
      return {
        id: p.id, title: p.title, when: p.when, start: p.sortDate || '',
        status: a.status,
        days: a.status === 'no' || !ds.length ? '' : picked.length === ds.length ? 'All days' : picked.map(d => fmt(d, { weekday: 'short', day: 'numeric', month: 'short' })).join(', '),
        roles: a.status === 'no' ? '' : a.roles.join(', '),
        note: a.note || ''
      };
    })
  };
  const btn = $('#send');
  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    await fetch(CONFIG.staffSheet, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
  } catch (err) {
    btn.disabled = false; btn.textContent = 'Send';
    return fail('That didn\'t send. Check your signal and try again.');
  }
  btn.disabled = false; btn.textContent = 'Send';
  if (photo) { photo = ''; state.person.photoSent = 'yes'; save(); }
  document.body.classList.add('sent');
  scrollTo(0, 0);
});

// Staff code: checked by the Google Sheet script, which also refuses any answers sent without it
async function checkCode(code) {
  if (!CONFIG.staffSheet) return 'offline';
  try {
    const r = await fetch(CONFIG.staffSheet + '?code=' + encodeURIComponent(code));
    return (await r.text()).trim() === 'ok' ? 'ok' : 'wrong';
  } catch (e) { return 'offline'; }
}
function unlock() {
  document.body.classList.remove('locked'); render(); renderKit();
  if (state.person.photoSent === 'yes') $('#ph').innerHTML = '<span>Sent ✓</span>';
}

$('#lock-form').addEventListener('submit', async e => {
  e.preventDefault();
  const input = e.target.elements.code, btn = e.target.querySelector('button'), m = $('#lock-msg');
  const code = input.value.trim();
  if (!code) return input.focus();
  btn.disabled = true; btn.textContent = 'Checking…'; m.className = 'msg';
  const result = await checkCode(code);
  btn.disabled = false; btn.textContent = 'Open';
  if (result === 'ok') { state.code = code; save(); unlock(); return; }
  m.textContent = result === 'wrong' ? "That code isn't right. Check the message you were sent." : "Couldn't check the code. Check your signal and try again.";
  m.className = 'msg err';
  input.select();
});

// Already unlocked on this phone? Check the saved code still works (it fails if the code is changed)
if (state.code) checkCode(state.code).then(r => {
  if (r === 'ok') unlock();
  else if (r === 'wrong') { delete state.code; save(); }
});
