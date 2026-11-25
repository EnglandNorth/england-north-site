/**
 * England North staff availability: receives answers from
 * englandnorthvolleyball.co.uk/staff/ and keeps three tabs up to date.
 *
 *   Overview      one row per person, one column per trip (rebuilt on every send)
 *   Availability  one row per person per trip
 *   Staff         one row per person: booking details
 *
 * When someone sends again, their rows are updated, not duplicated.
 *
 * Setup (once):
 *  1. Create a Google Sheet called "England North staff availability".
 *  2. Extensions > Apps Script. Delete what's there, paste this file, save.
 *  3. Deploy > New deployment > type Web app.
 *     Execute as: Me.  Who has access: Anyone.  Deploy, then authorise.
 *     Before deploying, change STAFF_CODE below to the code you'll give staff.
 *     To lock someone out later, change it, then Deploy > Manage deployments >
 *     edit > Version: New version > Deploy (the link stays the same).
 *  4. Copy the Web app URL (ends in /exec) and send it to Claude, which puts it
 *     in CONFIG.staffSheet on the website.
 */

// The code staff type to open the page. Change it here, never in the website files.
const STAFF_CODE = 'CHANGE-ME';

const STAFF_HEAD = ['Email', 'Name', 'Mobile', 'Name on passport', 'Date of birth', 'Nearest airport', 'Dietary needs', 'Last updated'];
const AVAIL_HEAD = ['Email', 'Name', 'Event ID', 'Event', 'Dates', 'Starts', 'Answer', 'Days', 'Role', 'Note', 'Last updated'];
const LABEL = { yes: 'Available', maybe: 'Maybe', no: "Can't" };
const COLOUR = { yes: '#d9ead3', maybe: '#fbe9b7', no: '#eeeeee' };

function doGet(e) {
  const code = e && e.parameter && e.parameter.code;
  if (code !== undefined) return text(codeOk(code) ? 'ok' : 'no');
  return text('England North staff availability is running.');
}

function codeOk(code) {
  return STAFF_CODE !== 'CHANGE-ME' && String(code || '').trim() === STAFF_CODE;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (!codeOk(d.code)) return text('wrong code');
    const p = d.person || {};
    const email = clean(p.email).toLowerCase();
    if (!email || email.indexOf('@') < 1) return text('missing email');
    const name = clean(p.name);
    const now = new Date();
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    upsert(sheet(ss, 'Staff', STAFF_HEAD), r => r[0] === email,
      [email, name, clean(p.mobile), clean(p.passportName), clean(p.dob), clean(p.airport), clean(p.dietary), now]);

    const avail = sheet(ss, 'Availability', AVAIL_HEAD);
    (d.events || []).slice(0, 40).forEach(ev => {
      const id = clean(ev.id);
      if (!id) return;
      upsert(avail, r => r[0] === email && r[2] === id,
        [email, name, id, clean(ev.title), clean(ev.when), ev.start ? "'" + clean(ev.start) : '', LABEL[ev.status] || '',
         clean(ev.days), clean(ev.roles), clean(ev.note), now]);
    });

    buildOverview(ss);
    return text('ok');
  } finally {
    lock.releaseLock();
  }
}

function buildOverview(ss) {
  const rows = sheet(ss, 'Availability', AVAIL_HEAD).getDataRange().getValues().slice(1);
  const events = {};
  const people = {};
  rows.forEach(r => {
    events[r[2]] = { title: r[3], when: r[4], start: String(r[5] || '9999') };
    people[r[0]] = r[1];
  });
  const ids = Object.keys(events).sort((a, b) => events[a].start.localeCompare(events[b].start));
  const emails = Object.keys(people).sort((a, b) => String(people[a]).localeCompare(String(people[b])));
  const cell = {};
  rows.forEach(r => { cell[r[0] + '|' + r[2]] = r; });

  const out = [['Staff'].concat(ids.map(id => events[id].title + '\n' + events[id].when))];
  const colours = [['#0b0b0b'].concat(ids.map(() => '#0b0b0b'))];
  emails.forEach(em => {
    const line = [people[em] || em];
    const col = ['#ffffff'];
    ids.forEach(id => {
      const r = cell[em + '|' + id];
      const key = r ? Object.keys(LABEL).find(k => LABEL[k] === r[6]) : '';
      let t = r ? r[6] : '';
      if (r && key !== 'no') {
        if (r[7] && r[7] !== 'All days') t += '\n' + r[7];
        if (r[8]) t += '\n' + r[8];
      }
      line.push(t);
      col.push(COLOUR[key] || '#ffffff');
    });
    out.push(line);
    colours.push(col);
  });
  const total = ['Available'].concat(ids.map(id => emails.filter(em => (cell[em + '|' + id] || [])[6] === LABEL.yes).length));
  out.push(total);
  colours.push(['#f6ecd3'].concat(ids.map(() => '#f6ecd3')));

  let sh = ss.getSheetByName('Overview') || ss.insertSheet('Overview', 0);
  sh.clear();
  const range = sh.getRange(1, 1, out.length, out[0].length);
  range.setValues(out).setBackgrounds(colours).setWrap(true).setVerticalAlignment('top');
  sh.getRange(1, 1, 1, out[0].length).setFontColor('#d4a537').setFontWeight('bold');
  sh.getRange(out.length, 1, 1, out[0].length).setFontWeight('bold');
  sh.getRange(1, 1, out.length, 1).setFontWeight('bold');
  sh.setFrozenRows(1);
  sh.setFrozenColumns(1);
  sh.setColumnWidth(1, 170);
  if (ids.length) sh.setColumnWidths(2, ids.length, 150);
}

function sheet(ss, name, head) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function upsert(sh, match, row) {
  const data = sh.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (match(data[i])) { sh.getRange(i + 1, 1, 1, row.length).setValues([row]); return; }
  }
  sh.appendRow(row);
}

// Trim, cap length, and stop anything being read as a spreadsheet formula
function clean(v) {
  const s = String(v == null ? '' : v).trim().slice(0, 300);
  // a leading apostrophe also keeps phone numbers like 07700... as text
  return /^([=+\-@]|0\d)/.test(s) ? "'" + s : s;
}

function text(s) {
  return ContentService.createTextOutput(s);
}
