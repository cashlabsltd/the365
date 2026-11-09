/* The 365 · app logic. Data lives in localStorage on this device. */
(function () {
  "use strict";
  const KEY = "the365.v1";
  const TOTAL = 365;

  // ---------- defaults (from David's Nov 8, 2026 interview) ----------
  const DEFAULT_TEMPLATES = {
    lift: [
      ["08:15", "Wake, phone-free 30", "Stretch, water, coffee, teeth, today's 3 priorities", "locked"],
      ["08:45", "Get ready", "Skincare, dressed, journal if there's time", "floating"],
      ["09:00", "Write", "60-minute box", "locked"],
      ["10:00", "Calls", "Morning window, ends 11:30 on lift days", "locked"],
      ["11:30", "Sweep and go", "Messages, then leave by 11:45", "floating"],
      ["12:00", "First meal", "Window opens. Carbs before the lift", "locked"],
      ["12:15", "Lift + HIIT finisher", "Back home around 14:15", "locked"],
      ["14:15", "Post-lift meal", "Protein first", "locked"],
      ["14:30", "Calls", "Afternoon window to 16:30", "locked"],
      ["16:30", "Build block", "Proposals, decks, deliverables", "floating"],
      ["17:30", "Dinner", "Last meal of the day", "locked"],
      ["17:55", "Shutdown", "Tomorrow's 3 priorities, laptop closed", "locked"],
      ["@kitchen", "Kitchen closed", "Nothing until 12:00 tomorrow. Water, tea, sparkling water", "locked"],
      ["18:00", "Evening", "Tyler, friends, a side project, or nothing at all", "floating"],
      ["@screens", "Devices off", "Phone on the charger outside the bedroom. Book in hand", "locked"],
      ["@lights", "Lights out", "This week's target", "locked"]
    ],
    class: [
      ["08:15", "Wake, phone-free 30", "Stretch, water, coffee, teeth, today's 3 priorities", "locked"],
      ["08:45", "Get ready", "Skincare, dressed, journal if there's time", "floating"],
      ["09:00", "Write", "60-minute box", "locked"],
      ["10:00", "Calls", "Morning window to 12:00", "locked"],
      ["12:00", "First meal", "Window opens", "locked"],
      ["12:15", "Yoga or spin", "Back by 13:45", "locked"],
      ["14:00", "Calls", "Afternoon window to 16:00", "locked"],
      ["16:00", "Build block", "Proposals, decks, deliverables", "floating"],
      ["17:30", "Dinner", "Last meal of the day", "locked"],
      ["17:55", "Shutdown", "Tomorrow's 3 priorities, laptop closed", "locked"],
      ["@kitchen", "Kitchen closed", "Nothing until 12:00 tomorrow. Water, tea, sparkling water", "locked"],
      ["18:00", "Evening", "Tyler, friends, a side project, or nothing at all", "floating"],
      ["@screens", "Devices off", "Phone on the charger outside the bedroom. Book in hand", "locked"],
      ["@lights", "Lights out", "This week's target", "locked"]
    ],
    weekend: [
      ["08:30", "Slow wake, phone-free 30", "Stretch, water, coffee, teeth", "locked"],
      ["09:00", "Creative writing", "Long box to 11:00. No client work today", "locked"],
      ["12:00", "First meal", "Carbs before the lift", "locked"],
      ["12:15", "Lift", "Weekend session", "locked"],
      ["14:15", "Post-lift meal", "Protein first", "locked"],
      ["15:00", "Creative afternoon", "YouTube, Gumroad, essays, or rest", "optional"],
      ["17:30", "Dinner", "Last meal of the day", "locked"],
      ["@kitchen", "Kitchen closed", "Nothing until 12:00 tomorrow. Water, tea, sparkling water", "locked"],
      ["18:00", "Sunday reset", "45 minutes: review the week, set next week's 3 outcomes", "locked", [0]],
      ["@screens", "Devices off", "Phone on the charger outside the bedroom. Book in hand", "locked"],
      ["@lights", "Lights out", "This week's target", "locked"]
    ]
  };
  const DEFAULT_HABITS = [
    { k: "wake", name: "Phone-free first 30", why: "Stretch, water, coffee, and teeth before anything pings you.", floor: "Stretch, water, teeth, and today's 3 priorities before the phone", full: "All of that, plus journaling, skincare, and dressed by 10:00" },
    { k: "write", name: "Write", why: "Hypermodern, Before the Crash, essays, bylines.", floor: "30 minutes, any project", full: "60-minute morning box (2 hours on weekends)" },
    { k: "move", name: "Move", why: "Body recomposition: muscle up, fat down.", floor: "Any 30 minutes of movement, even a walk", full: "Today's planned session: lift + HIIT, or yoga or spin", types: ["Lift", "HIIT", "Yoga", "Spin", "Walk"] },
    { k: "eat", name: "Eat clean", why: "Carbs before training, protein after.", floor: "No alcohol, nothing fried, no junk", full: "Protein every meal, added sugar under the cap" },
    { k: "kitchen", name: "Kitchen closed by {kitchen}", why: "The eating window ends here. Water, tea, or sparkling water only after this.", binary: true, floor: "", full: "Last bite before {kitchen}, nothing until 12:00 tomorrow", hard: true },
    { k: "caff", name: "Caffeine done by 1pm", why: "Protects tonight's sleep.", binary: true, floor: "", full: "Last coffee or tea before 13:00" },
    { k: "read", name: "Read", why: "Screens off, a book in hand.", floor: "10 pages", full: "30 minutes in the wind-down hour" },
    { k: "shut", name: "Shutdown by 18:00", why: "Close the day so the evening is yours.", floor: "Tomorrow's 3 priorities written down", full: "Laptop closed by 18:00 with tomorrow planned" },
    { k: "devices", name: "Devices off by {screens}", why: "At least an hour before bed. Phone charges outside the bedroom.", floor: "Phone, laptop, and TV off by {screens}", full: "Off by {screens} and the phone sleeps outside the bedroom", hard: true },
    { k: "sleep", name: "Lights out", why: "Stepping down weekly toward 23:30.", floor: "Within 30 minutes of {lights}", full: "Lights out by {lights}" }
  ];
  const BONUS = [
    { k: "tyler", name: "Evening with Tyler" }, { k: "friends", name: "Friends or social" },
    { k: "side", name: "Side project" }, { k: "build", name: "Build block done", weekday: true },
    { k: "reset", name: "Sunday reset", sun: true }
  ];
  const TARGETS = [
    { name: "Lift sessions", n: 5, f: e => e.t && e.t.Lift },
    { name: "Yoga or spin", n: 2, f: e => e.t && (e.t.Yoga || e.t.Spin) },
    { name: "HIIT finishers", n: 3, f: e => e.t && e.t.HIIT },
    { name: "Full writing boxes", n: 5, f: e => e.c && e.c.write === 2 },
    { name: "Lights out on time", n: 5, f: e => e.c && e.c.sleep === 2 },
    { name: "Phone outside the bedroom", n: 5, f: e => e.c && e.c.devices === 2 },
    { name: "Evenings with Tyler", n: 3, f: e => e.b && e.b.tyler },
    { name: "Friends or social", n: 1, f: e => e.b && e.b.friends },
    { name: "Side project", n: 2, f: e => e.b && e.b.side },
    { name: "Sunday reset", n: 1, f: e => e.b && e.b.reset }
  ];
  const tplToMods = arr => arr.map((m, i) => ({ id: "m" + i + Math.random().toString(36).slice(2, 6), time: m[0], title: m[1], note: m[2], kind: m[3], only: m[4] || null }));
  function defaultSettings() {
    return {
      name: "David", start: "2026-11-09", need: 9, testEnd: "2026-12-06", kitchen: "18:00", devicesBefore: 60,
      weekMap: { 0: "weekend", 1: "lift", 2: "class", 3: "lift", 4: "class", 5: "lift", 6: "weekend" },
      templates: { lift: tplToMods(DEFAULT_TEMPLATES.lift), class: tplToMods(DEFAULT_TEMPLATES.class), weekend: tplToMods(DEFAULT_TEMPLATES.weekend) },
      habits: JSON.parse(JSON.stringify(DEFAULT_HABITS)),
      bedtime: [{ from: "2026-11-09", time: "00:30" }, { from: "2026-11-16", time: "00:00" }, { from: "2026-11-23", time: "23:30" }]
    };
  }

  // ---------- storage ----------
  let S, days;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const d = JSON.parse(raw); S = Object.assign(defaultSettings(), d.settings || {}); days = d.days || {}; migrate(); return; }
    } catch (_) { }
    S = defaultSettings(); days = {};
  }
  function migrate() {
    const def = defaultSettings();
    if (!S.habits.some(h => h.k === "kitchen")) { S.habits = def.habits; S.need = def.need; S.templates = def.templates; }
    if (!S.kitchen) S.kitchen = def.kitchen;
    if (!S.devicesBefore) S.devicesBefore = def.devicesBefore;
  }
  let saveT;
  function persist() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify({ v: 1, settings: S, days })); }
      catch (_) { toast("Couldn't save on this device. Export a backup from Setup."); }
    }, 250);
  }
  load();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });

  // ---------- dates ----------
  const pad = n => String(n).padStart(2, "0");
  const iso = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const add = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const diff = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const START = () => S.start, END = () => add(S.start, TOTAL - 1);
  let todayISO = iso(new Date());
  const clamp = s => s < START() ? START() : (s > END() ? END() : s);
  const fmt = s => parse(s).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
  const dow = s => parse(s).getDay();
  const dayType = s => S.weekMap[dow(s)] || "lift";
  const esc = t => String(t == null ? "" : t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const fromMin = m => { m = ((m % 1440) + 1440) % 1440; return pad(Math.floor(m / 60)) + ":" + pad(m % 60); };

  function lightsOut(s) {
    const steps = S.bedtime.slice().sort((a, b) => a.from < b.from ? -1 : 1);
    let t = steps.length ? steps[0].time : "23:30";
    steps.forEach(st => { if (s >= st.from) t = st.time; });
    return t;
  }
  const screensOff = s => fromMin(toMin(lightsOut(s)) - (Number(S.devicesBefore) || 60));
  const fill = (txt, s) => String(txt || "").replace(/\{lights\}/g, lightsOut(s)).replace(/\{screens\}/g, screensOff(s)).replace(/\{kitchen\}/g, S.kitchen);
  function testWeek(s) { const n = Math.floor(diff(START(), s) / 7) + 1; return n <= 4 ? n + " of 4" : "done"; }

  function modsFor(s) {
    const w = dow(s);
    return (S.templates[dayType(s)] || [])
      .filter(m => !m.only || m.only.indexOf(w) >= 0)
      .map(m => Object.assign({}, m, { at: m.time === "@lights" ? lightsOut(s) : m.time === "@screens" ? screensOff(s) : m.time === "@kitchen" ? S.kitchen : m.time }))
      .sort((a, b) => sortKey(a.at) - sortKey(b.at));
  }
  const sortKey = t => { const m = toMin(t); return m < 300 ? m + 1440 : m; }; // after-midnight items sort last

  // ---------- day evaluation ----------
  const entry = id => days[id] || (days[id] = { c: {}, t: {}, b: {} });
  function evalDay(id) {
    const e = days[id]; let atLeast = 0, full = 0, pts = 0;
    S.habits.forEach(h => { const v = (e && e.c && e.c[h.k]) || 0; if (v > 0) atLeast++; if (h.binary ? v > 0 : v === 2) full++; pts += h.binary ? (v > 0 ? 2 : 0) : v; });
    const n = S.habits.length, score = pts / (n * 2), life = !!(e && e.life), counted = life || atLeast >= S.need, perfect = !life && full === n;
    let status; if (id > todayISO) status = "future"; else if (life) status = "life"; else if (perfect) status = "perfect"; else if (counted) status = "ok"; else if (id < todayISO) status = "miss"; else status = "pending";
    return { score, counted, perfect, life, status, atLeast, full, n };
  }
  function streakAt(endId) { let id = endId, n = 0; if (id >= todayISO && !evalDay(id).counted) id = add(id, -1); while (id >= START()) { if (evalDay(id).counted) { n++; id = add(id, -1); } else break; } return n; }
  function lifeUsedInMonth(id) { const ym = id.slice(0, 7); let n = 0; for (const k in days) if (k.slice(0, 7) === ym && days[k].life) n++; return n; }

  // ---------- state ----------
  let sel = clamp(todayISO), weekAnchor = sel, view = "today", tpl = "lift", lastAtLeast = -1;
  const $ = id => document.getElementById(id);

  function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 2200); }

  // ---------- render: header ----------
  function renderHello() {
    const h = new Date().getHours();
    $("greet").textContent = (h < 5 ? "Still up, " : h < 12 ? "Good morning, " : h < 17 ? "Good afternoon, " : "Good evening, ") + S.name + ".";
    const ev = evalDay(sel), n = Math.max(1, diff(START(), sel) + 1), left = S.need - ev.atLeast;
    let line = "Day " + n + " of 365. ";
    if (sel < todayISO) line = fmt(sel) + ", day " + n + ". ";
    if (ev.life) line += "A life day. Rest counts too.";
    else if (ev.perfect) line += "Full marks. Enjoy that one.";
    else if (ev.counted) line += "Today counts. Anything more is a bonus.";
    else if (ev.atLeast === 0) line += h < 5 ? "Bed is the best move right now." : "Start with the first thirty minutes.";
    else line += left + (left === 1 ? " more" : " more") + " and today counts.";
    $("greetSub").textContent = line;
    $("ringN").textContent = ev.atLeast + "/" + ev.n;
    const arc = $("ringArc"); arc.style.strokeDashoffset = 264 - 264 * Math.min(1, ev.atLeast / ev.n);
    arc.style.stroke = ev.perfect ? "var(--peach)" : "var(--sage)";
    if (lastAtLeast >= 0 && ev.counted && lastAtLeast < S.need && ev.atLeast >= S.need) { const r = $("ring"); r.classList.remove("pop"); void r.offsetWidth; r.classList.add("pop"); toast("That's the day counted."); }
    lastAtLeast = ev.atLeast;
  }

  // ---------- render: today ----------
  function renderToday() {
    const e = days[sel] || { c: {}, t: {}, b: {} }, ev = evalDay(sel), t = dayType(sel);
    $("dateLabel").textContent = sel === todayISO ? "Today, " + fmt(sel).split(", ")[1] : fmt(sel);
    $("goToday").classList.toggle("hidden", sel === clamp(todayISO));
    $("typeTag").textContent = { lift: "Lift day", class: "Class day", weekend: "Creative weekend" }[t];
    const map = { future: ["Upcoming", "grey"], life: ["Life day", "grey"], perfect: ["Full marks", "peach"], ok: ["Counts", ""], miss: ["Missed", "warn"], pending: [ev.atLeast + " of " + ev.n + " so far", "grey"] };
    $("dayPill").textContent = map[ev.status][0]; $("dayPill").className = "tag " + map[ev.status][1];
    $("prev").disabled = sel <= START(); $("next").disabled = sel >= END();
    $("needLine").textContent = S.need + " of " + S.habits.length;

    const al = [], y = add(sel, -1);
    if (todayISO < START() && sel === START()) al.push(["", "Day 1 starts " + fmt(START()) + "."]);
    if (sel > START() && y < todayISO && !evalDay(y).counted && !ev.counted) al.push(["warn", "Yesterday slipped. Never miss twice: floors are plenty today."]);
    if (e.sleep !== undefined && e.sleep !== "" && Number(e.sleep) < 6) al.push(["peach", "Under 6 hours of sleep. Lift 20 to 30% lighter, skip PRs, favour machines and dumbbells."]);
    if (sel <= S.testEnd) al.push(["", "Morning writing test, week " + testWeek(sel) + ". Rate how the words felt at the bottom."]);
    if (sel === S.testEnd) al.push(["peach", "The writing test ends today. At the reset, compare your ratings and decide: mornings, or late nights with a hard stop."]);
    S.bedtime.forEach(b => { if (b.from === sel && b.from !== START()) al.push(["", "New bedtime from today: lights out by " + b.time + "."]); });
    $("alerts").innerHTML = al.map(a => '<div class="note ' + a[0] + '">' + esc(a[1]) + "</div>").join("");

    // cutoffs
    if (sel === todayISO) {
      const now = new Date(); let nm = now.getHours() * 60 + now.getMinutes(); if (nm < 300) nm += 1440;
      const k = sortKey(S.kitchen), d = sortKey(screensOff(sel)), lo = sortKey(lightsOut(sel));
      const span = m => m < 60 ? m + " min" : Math.floor(m / 60) + "h " + pad(m % 60) + "m";
      const kOpen = nm >= 720 && nm < k;
      const kTxt = nm < 720 ? "Opens 12:00" : kOpen ? "Closes in " + span(k - nm) : "Closed since " + S.kitchen;
      const dTxt = nm < d ? "Off in " + span(d - nm) : nm < lo ? "Should be off now" : "Off. Sleep well";
      $("cutK").textContent = kTxt; $("cutD").textContent = dTxt;
      $("cutKbox").className = "cut" + (kOpen && k - nm <= 60 ? " soon" : "") + (!kOpen && nm >= k ? " shut" : "");
      $("cutDbox").className = "cut" + (nm < d && d - nm <= 60 ? " soon" : "") + (nm >= d && nm < lo ? " now" : "") + (nm >= lo ? " shut" : "");
      $("cutKt").textContent = "Kitchen · " + S.kitchen; $("cutDt").textContent = "Devices · " + screensOff(sel);
      $("cuts").classList.remove("hidden");
    } else $("cuts").classList.add("hidden");

    // now / next
    const mods = modsFor(sel);
    if (sel === todayISO && mods.length) {
      const now = new Date(); let nm = now.getHours() * 60 + now.getMinutes(); if (nm < 300) nm += 1440;
      let cur = -1; mods.forEach((m, i) => { if (sortKey(m.at) <= nm) cur = i; });
      const nx = cur + 1 < mods.length ? mods[cur + 1] : null;
      $("nowCard").classList.remove("hidden");
      if (cur >= 0) { $("nowWhen").textContent = "Now"; $("nowTitle").textContent = mods[cur].title; $("nowSub").textContent = mods[cur].note; }
      else { $("nowWhen").textContent = "Soon"; $("nowTitle").textContent = "Day hasn't started"; $("nowSub").textContent = "First up at " + mods[0].at; }
      if (nx) { const mins = sortKey(nx.at) - nm; $("nextWhen").textContent = nx.at; $("nextTitle").textContent = nx.title; $("nextSub").textContent = (mins < 60 ? "in " + mins + " min" : "in " + Math.floor(mins / 60) + "h " + pad(mins % 60) + "m") + " · " + nx.note; $("nextWhen").parentElement.classList.remove("hidden"); }
      else $("nextWhen").parentElement.classList.add("hidden");
      window._nowIdx = cur;
    } else { $("nowCard").classList.add("hidden"); window._nowIdx = -2; }

    // habits
    $("habits").innerHTML = S.habits.map(h => {
      const v = (e.c && e.c[h.k]) || 0, vv = h.binary ? (v > 0 ? 2 : 0) : v;
      const opts = h.binary ? [[0, "Not yet"], [2, "Done"]] : [[0, "Not yet"], [1, "Floor"], [2, "Full"]];
      const lv = h.binary ? '<div class="levels"><div><span>Done means</span>' + esc(fill(h.full, sel)) + "</div></div>"
        : '<div class="levels"><div><span>Floor</span>' + esc(fill(h.floor, sel)) + '</div><div><span>Full mark</span>' + esc(fill(h.full, sel)) + "</div></div>";
      const ty = h.types ? '<div class="chips">' + h.types.map(x => '<button class="chip" data-type="' + x + '" aria-pressed="' + !!(e.t && e.t[x]) + '">' + x + "</button>").join("") + "</div>" : "";
      return '<div class="habit on' + vv + (h.hard ? " hard" : "") + '"><div class="top"><div><h3>' + esc(fill(h.name, sel)) + '</h3><div class="why">' + esc(h.why) + '</div></div>' +
        '<div class="seg" role="group" aria-label="' + esc(h.name) + '">' + opts.map(o => '<button class="l' + o[0] + '" data-h="' + h.k + '" data-v="' + o[0] + '" aria-pressed="' + (vv === o[0]) + '">' + o[1] + "</button>").join("") + "</div></div>" +
        '<details><summary>What counts</summary>' + lv + "</details>" + ty + "</div>";
    }).join("");

    // timeline
    $("timeline").innerHTML = mods.map((m, i) => {
      const isNow = i === window._nowIdx, done = window._nowIdx >= 0 && i < window._nowIdx;
      return '<li class="' + (isNow ? "isnow" : "") + (done ? " done" : "") + '"><div class="t num">' + esc(m.at) + '</div><div class="dot ' + m.kind + '"></div><div><b>' + esc(m.title) + '</b><span class="kind">' + (isNow ? "Now" : m.kind) + '</span><div class="sub">' + esc(m.note) + "</div></div></li>";
    }).join("");

    // bonus
    const sun = dow(sel) === 0;
    $("bonus").innerHTML = BONUS.filter(b => (!b.sun || sun) && (!b.weekday || t !== "weekend"))
      .map(b => '<button class="chip" data-bonus="' + b.k + '" aria-pressed="' + !!(e.b && e.b[b.k]) + '">' + b.name + "</button>").join("");

    // check-in
    const setVal = (id, val) => { const el = $(id); if (document.activeElement !== el) el.value = val == null ? "" : val; };
    setVal("mSleep", e.sleep); setVal("mRec", e.rec); setVal("mLights", e.lights); setVal("mWake", e.wake); setVal("mNote", e.note);
    const scale = (id, key) => { $(id).innerHTML = [1, 2, 3, 4, 5].map(n => '<button data-scale="' + key + '" data-n="' + n + '" aria-pressed="' + (e[key] === n) + '">' + n + "</button>").join(""); };
    scale("energy", "energy"); scale("feel", "feel");
    $("feelWrap").classList.toggle("hidden", sel > S.testEnd);
    const left = Math.max(0, 2 - lifeUsedInMonth(sel)), lb = $("lifeBtn");
    lb.setAttribute("aria-pressed", !!e.life); lb.textContent = e.life ? "Life day (tap to undo)" : "Mark as a life day"; lb.disabled = !e.life && left === 0;
    $("lifeInfo").textContent = left + " left this month, for sick days or real emergencies. Event nights are normal days.";
  }

  // ---------- render: week ----------
  const weekStart = id => { const d = parse(id); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
  function weekIds() { const ws = weekStart(weekAnchor); return Array.from({ length: 7 }, (_, i) => add(ws, i)); }
  function renderWeek() {
    const ids = weekIds(), ws = ids[0], wn = Math.floor(diff(weekStart(START()), ws) / 7) + 1;
    $("weekLabel").textContent = "Week " + wn + " · " + fmt(ids[0]).split(", ")[1] + " to " + fmt(ids[6]).split(", ")[1];
    let html = "<thead><tr><th></th>" + ids.map(id => "<th>" + parse(id).toLocaleDateString("en-CA", { weekday: "narrow" }) + "<br>" + parse(id).getDate() + "</th>").join("") + "</tr></thead><tbody>";
    S.habits.forEach(h => { html += "<tr><td>" + esc(fill(h.name, sel)) + "</td>" + ids.map(id => { const v = (days[id] && days[id].c && days[id].c[h.k]) || 0, vv = h.binary ? (v > 0 ? 2 : 0) : v; return '<td><span class="cell v' + vv + '"></span></td>'; }).join("") + "</tr>"; });
    html += "<tr><td><b>The day</b></td>" + ids.map(id => { if (id < START() || id > END()) return "<td></td>"; const s = evalDay(id).status; const txt = { future: "", life: "Life", perfect: "★", ok: "✓", miss: "✕", pending: "·" }[s]; const col = { perfect: "var(--peach)", ok: "var(--sage)", miss: "var(--warn)" }[s] || "var(--mute)"; return '<td style="font-weight:700;color:' + col + '">' + txt + "</td>"; }).join("") + "</tr></tbody>";
    $("weekTable").innerHTML = html;
    $("targets").innerHTML = TARGETS.map(tg => { const got = ids.filter(id => days[id] && tg.f(days[id])).length, pct = Math.min(1, got / tg.n) * 100; return '<div class="tgt"><div>' + tg.name + '</div><div class="bar' + (got >= tg.n ? " done" : "") + '"><i style="width:' + pct + '%"></i></div><div class="num">' + got + " / " + tg.n + "</div></div>"; }).join("");
    $("wprev").disabled = ws <= weekStart(START()); $("wnext").disabled = add(ws, 7) > END();
    const ref = todayISO < START() ? START() : (todayISO > END() ? END() : todayISO);
    $("stStreak").textContent = streakAt(ref);
    let c = 0, p = 0; for (let i = 0; i < TOTAL; i++) { const id = add(START(), i); if (id > todayISO) break; const ev = evalDay(id); if (ev.counted) c++; if (ev.perfect) p++; }
    $("stCounted").textContent = c; $("stPerfect").textContent = p;
    let s = 0, n = 0; for (let i = 0; i < 7; i++) { const id = add(ref, -i); if (id < START()) break; s += evalDay(id).score; n++; }
    $("stScore").textContent = Math.round((n ? s / n : 0) * 100) + "%";
  }

  function weekText() {
    const ids = weekIds(), wn = Math.floor(diff(weekStart(START()), ids[0]) / 7) + 1;
    const lines = ["The 365 · Week " + wn + " (" + fmt(ids[0]) + " to " + fmt(ids[6]) + ")", ""];
    ids.forEach(id => {
      if (id < START() || id > END()) return;
      const e = days[id] || {}, ev = evalDay(id);
      lines.push(fmt(id) + " · " + dayType(id) + " day · " + { future: "upcoming", life: "life day", perfect: "full marks", ok: "counted", miss: "missed", pending: "in progress" }[ev.status] + " (" + ev.atLeast + "/" + ev.n + ")");
      lines.push("  " + S.habits.map(h => { const v = (e.c && e.c[h.k]) || 0; return fill(h.name, id) + ": " + (h.binary ? (v ? "done" : "no") : ["no", "floor", "full"][v]); }).join("; "));
      const tr = e.t ? Object.keys(e.t).filter(k => e.t[k]) : [], bo = e.b ? Object.keys(e.b).filter(k => e.b[k]) : [];
      const extra = [];
      if (tr.length) extra.push("training: " + tr.join(", "));
      if (bo.length) extra.push("ticks: " + bo.join(", "));
      if (e.sleep !== undefined && e.sleep !== "") extra.push("sleep " + e.sleep + "h");
      if (e.rec !== undefined && e.rec !== "") extra.push("recovery " + e.rec + "%");
      if (e.lights) extra.push("lights out " + e.lights);
      if (e.wake) extra.push("woke " + e.wake);
      if (e.energy) extra.push("energy " + e.energy + "/5");
      if (e.feel) extra.push("writing feel " + e.feel + "/5");
      if (extra.length) lines.push("  " + extra.join(" · "));
      if (e.note) lines.push("  Note: " + e.note);
    });
    lines.push("", "Weekly targets:");
    TARGETS.forEach(tg => lines.push("  " + tg.name + ": " + ids.filter(id => days[id] && tg.f(days[id])).length + " / " + tg.n));
    lines.push("", "Please review: what slipped most, one floor to adjust, and next week's 3 outcomes.");
    return lines.join("\n");
  }

  // ---------- render: year ----------
  function renderYear() {
    const y = $("year"); y.innerHTML = "";
    for (let i = 0; i < (parse(START()).getDay() + 6) % 7; i++) y.appendChild(document.createElement("span"));
    let longest = 0, run = 0, ss = 0, sn = 0, train = 0, fs = 0, fn = 0;
    for (let i = 0; i < TOTAL; i++) {
      const id = add(START(), i), ev = evalDay(id), e = days[id], b = document.createElement("button"); b.className = "sq";
      if (ev.status === "perfect") b.classList.add("perfect"); else if (ev.status === "life") b.classList.add("life"); else if (ev.status === "miss") b.classList.add("miss"); else if (ev.status === "ok") b.classList.add("s3"); else if (ev.atLeast > 0) b.classList.add("s1");
      if (id === todayISO) b.classList.add("today");
      b.setAttribute("aria-label", "Day " + (i + 1) + ", " + fmt(id) + ": " + ev.atLeast + " of " + ev.n);
      b.dataset.day = id; y.appendChild(b);
      if (ev.counted) { run++; longest = Math.max(longest, run); } else if (id <= todayISO) run = 0;
      if (e && e.sleep !== undefined && e.sleep !== "") { ss += Number(e.sleep); sn++; }
      if (e && e.t && (e.t.Lift || e.t.Spin || e.t.Yoga || e.t.HIIT)) train++;
      if (e && e.feel) { fs += e.feel; fn++; }
    }
    $("yLong").textContent = longest; $("ySleep").textContent = sn ? (ss / sn).toFixed(1) + "h" : "n/a";
    $("yTrain").textContent = train; $("yFeel").textContent = fn ? (fs / fn).toFixed(1) + " / 5" : "n/a";
    $("yearLede").textContent = "Every square is a day, from " + fmt(START()) + " to " + fmt(END()) + ". Tap one to open it.";
  }

  // ---------- render: setup ----------
  const autoAt = t => t === "@lights" ? lightsOut(todayISO) : t === "@screens" ? screensOff(todayISO) : t === "@kitchen" ? S.kitchen : t;
  function renderSetup() {
    document.querySelectorAll("#tplTabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.tpl === tpl));
    const mods = (S.templates[tpl] || []).slice().sort((a, b) => sortKey(autoAt(a.time)) - sortKey(autoAt(b.time)));
    $("mods").innerHTML = mods.map(m => {
      const auto = m.time.startsWith("@");
      return '<div class="mod" data-id="' + m.id + '">' +
        (auto ? '<input value="' + ({ "@lights": "Bedtime", "@screens": "Devices off", "@kitchen": "Kitchen" }[m.time] || "Auto") + '" disabled aria-label="Time follows bedtime steps">' : '<input type="time" data-f="time" value="' + esc(m.time) + '" aria-label="Start time">') +
        '<input data-f="title" value="' + esc(m.title) + '" aria-label="Module name">' +
        '<input class="full" data-f="note" value="' + esc(m.note) + '" aria-label="Detail">' +
        '<div class="acts"><select data-f="kind" aria-label="Type" style="max-width:150px">' + ["locked", "floating", "optional"].map(k => '<option value="' + k + '"' + (m.kind === k ? " selected" : "") + ">" + k[0].toUpperCase() + k.slice(1) + "</option>").join("") + "</select>" +
        (m.only ? '<span class="small">Sundays only</span>' : "") + '<button class="x" data-del="' + m.id + '">Remove</button></div></div>';
    }).join("");

    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], order = [1, 2, 3, 4, 5, 6, 0];
    $("weekdays").innerHTML = order.map(d => '<label>' + names[d] + '<select data-wd="' + d + '">' + ["lift", "class", "weekend"].map(t => '<option value="' + t + '"' + (S.weekMap[d] === t ? " selected" : "") + ">" + { lift: "Lift", class: "Class", weekend: "Wknd" }[t] + "</option>").join("") + "</select></label>").join("");

    $("habEdit").innerHTML = S.habits.map((h, i) => '<div class="hab" data-i="' + i + '"><input data-hf="name" value="' + esc(h.name) + '" aria-label="Name" style="font-weight:700">' +
      (h.binary ? "" : '<label>Floor<input data-hf="floor" value="' + esc(h.floor) + '"></label>') +
      '<label>' + (h.binary ? "Done means" : "Full mark") + '<input data-hf="full" value="' + esc(h.full) + '"></label></div>').join("");
    $("needSel").innerHTML = [S.habits.length - 2, S.habits.length - 1, S.habits.length].map(n => '<option value="' + n + '">' + n + " of " + S.habits.length + "</option>").join("");
    $("needSel").value = String(S.need);
    $("kitchenTime").value = S.kitchen; $("devBefore").value = String(S.devicesBefore);

    $("steps").innerHTML = S.bedtime.map((b, i) => '<div class="stp" data-i="' + i + '"><input type="date" data-sf="from" value="' + b.from + '" aria-label="From"><input type="time" data-sf="time" value="' + b.time + '" aria-label="Lights out"><button class="btn" data-sdel="' + i + '" aria-label="Remove step">✕</button></div>').join("");

    const n = Object.keys(days).length;
    $("storageNote").textContent = n + " day" + (n === 1 ? "" : "s") + " saved on this device.";
  }

  function renderAll() {
    todayISO = iso(new Date());
    renderHello();
    if (view === "today") renderToday();
    if (view === "week") renderWeek();
    if (view === "year") renderYear();
    if (view === "setup") renderSetup();
  }

  // ---------- events ----------
  const vib = () => { try { navigator.vibrate && navigator.vibrate(8); } catch (_) { } };
  $("habits").addEventListener("click", ev => {
    const b = ev.target.closest("button"); if (!b) return; const e = entry(sel);
    if (b.dataset.h) e.c[b.dataset.h] = Number(b.dataset.v);
    else if (b.dataset.type) { e.t = e.t || {}; e.t[b.dataset.type] = !e.t[b.dataset.type]; }
    else return;
    vib(); persist(); renderAll();
  });
  $("bonus").addEventListener("click", ev => { const b = ev.target.closest("button[data-bonus]"); if (!b) return; const e = entry(sel); e.b = e.b || {}; e.b[b.dataset.bonus] = !e.b[b.dataset.bonus]; vib(); persist(); renderAll(); });
  $("view-today").addEventListener("click", ev => { const b = ev.target.closest("button[data-scale]"); if (!b) return; const e = entry(sel), k = b.dataset.scale, n = Number(b.dataset.n); e[k] = e[k] === n ? undefined : n; persist(); renderAll(); });
  [["mSleep", "sleep", true], ["mRec", "rec", true], ["mLights", "lights"], ["mWake", "wake"], ["mNote", "note"]].forEach(([id, key, numeric]) => {
    $(id).addEventListener("input", ev => { const e = entry(sel), v = ev.target.value; e[key] = numeric ? (v === "" ? "" : Number(v)) : v; persist(); if (key === "sleep") renderToday(); });
  });
  $("lifeBtn").addEventListener("click", () => { const e = entry(sel); e.life = !e.life; persist(); renderAll(); });
  $("prev").addEventListener("click", () => { sel = clamp(add(sel, -1)); renderAll(); });
  $("next").addEventListener("click", () => { sel = clamp(add(sel, 1)); renderAll(); });
  $("goToday").addEventListener("click", () => { sel = clamp(todayISO); renderAll(); });
  $("wprev").addEventListener("click", () => { weekAnchor = add(weekAnchor, -7); renderWeek(); });
  $("wnext").addEventListener("click", () => { weekAnchor = add(weekAnchor, 7); renderWeek(); });
  $("year").addEventListener("click", ev => { const b = ev.target.closest("button[data-day]"); if (!b) return; sel = b.dataset.day; show("today"); });
  $("copyWeek").addEventListener("click", () => {
    const txt = weekText();
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast("Copied. Paste it to Claude."))
      .catch(() => { if (navigator.share) navigator.share({ text: txt }).catch(() => { }); else toast("Couldn't copy on this device."); });
  });

  // setup events
  $("tplTabs").addEventListener("click", ev => { const b = ev.target.closest("button[data-tpl]"); if (!b) return; tpl = b.dataset.tpl; renderSetup(); });
  $("mods").addEventListener("change", ev => {
    const row = ev.target.closest(".mod"), f = ev.target.dataset.f; if (!row || !f) return;
    const m = S.templates[tpl].find(x => x.id === row.dataset.id); if (!m) return;
    m[f] = ev.target.value; persist(); if (f === "time") renderSetup(); toast("Saved");
  });
  $("mods").addEventListener("click", ev => {
    const b = ev.target.closest("button[data-del]"); if (!b) return;
    S.templates[tpl] = S.templates[tpl].filter(x => x.id !== b.dataset.del); persist(); renderSetup(); toast("Module removed");
  });
  $("addMod").addEventListener("click", () => { S.templates[tpl].push({ id: "m" + Date.now(), time: "19:00", title: "New module", note: "What it's for", kind: "floating", only: null }); persist(); renderSetup(); });
  $("resetTpl").addEventListener("click", () => { S.templates[tpl] = tplToMods(DEFAULT_TEMPLATES[tpl]); persist(); renderSetup(); toast("Template restored"); });
  $("weekdays").addEventListener("change", ev => { const s = ev.target.dataset.wd; if (s == null) return; S.weekMap[s] = ev.target.value; persist(); toast("Saved"); });
  $("habEdit").addEventListener("change", ev => { const box = ev.target.closest(".hab"), f = ev.target.dataset.hf; if (!box || !f) return; S.habits[Number(box.dataset.i)][f] = ev.target.value; persist(); toast("Saved"); });
  $("kitchenTime").addEventListener("change", ev => { if (ev.target.value) { S.kitchen = ev.target.value; persist(); toast("Kitchen closes at " + S.kitchen); } });
  $("devBefore").addEventListener("change", ev => { S.devicesBefore = Number(ev.target.value); persist(); toast("Devices off " + S.devicesBefore + " min before bed"); });
  $("needSel").addEventListener("change", ev => { S.need = Number(ev.target.value); persist(); toast("Saved"); });
  $("steps").addEventListener("change", ev => { const r = ev.target.closest(".stp"), f = ev.target.dataset.sf; if (!r || !f) return; S.bedtime[Number(r.dataset.i)][f] = ev.target.value; persist(); toast("Saved"); });
  $("steps").addEventListener("click", ev => { const b = ev.target.closest("button[data-sdel]"); if (!b) return; if (S.bedtime.length < 2) { toast("Keep at least one bedtime"); return; } S.bedtime.splice(Number(b.dataset.sdel), 1); persist(); renderSetup(); });
  $("addStep").addEventListener("click", () => { const last = S.bedtime[S.bedtime.length - 1]; S.bedtime.push({ from: add(last ? last.from : todayISO, 7), time: last ? last.time : "23:30" }); persist(); renderSetup(); });

  $("exportBtn").addEventListener("click", () => {
    const data = JSON.stringify({ v: 1, exported: new Date().toISOString(), settings: S, days }, null, 2);
    const name = "the365-backup-" + todayISO + ".json";
    const file = new File([data], name, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: "The 365 backup" }).catch(() => { }); return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    toast("Backup saved");
  });
  $("importFile").addEventListener("change", ev => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    f.text().then(t => {
      const d = JSON.parse(t); if (!d || !d.days) throw new Error();
      days = Object.assign(days, d.days); if (d.settings) S = Object.assign(defaultSettings(), d.settings);
      persist(); renderAll(); toast("Backup imported");
    }).catch(() => toast("That file isn't a 365 backup."));
    ev.target.value = "";
  });
  $("wipeBtn").addEventListener("click", () => $("wipeConfirm").classList.remove("hidden"));
  $("wipeNo").addEventListener("click", () => $("wipeConfirm").classList.add("hidden"));
  $("wipeYes").addEventListener("click", () => { days = {}; S = defaultSettings(); persist(); $("wipeConfirm").classList.add("hidden"); renderAll(); toast("Cleared"); });

  // navigation
  function show(v) {
    view = v;
    document.querySelectorAll("nav.tabbar button").forEach(b => b.setAttribute("aria-selected", b.dataset.view === v));
    ["today", "week", "year", "setup"].forEach(x => $("view-" + x).classList.toggle("hidden", x !== v));
    if (v === "week") weekAnchor = sel;
    if ("#" + v !== location.hash) history.replaceState(null, "", v === "today" ? location.pathname : "#" + v);
    window.scrollTo(0, 0); renderAll();
  }
  document.querySelectorAll("nav.tabbar button").forEach(b => b.addEventListener("click", () => show(b.dataset.view)));
  const initial = (location.hash || "").slice(1);
  show(["week", "year", "setup"].indexOf(initial) >= 0 ? initial : "today");

  // keep "now" fresh, and roll over at midnight
  setInterval(() => { const t = iso(new Date()); if (t !== todayISO && sel === todayISO) sel = clamp(t); if (view === "today") renderAll(); }, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { const t = iso(new Date()); if (t !== todayISO) sel = clamp(t); renderAll(); } });

  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => { });
})();
