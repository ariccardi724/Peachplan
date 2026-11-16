import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Minus, Check, Download, Settings, X, ArrowLeftRight, Trash2, Trophy, Timer, Flame, SkipForward, GripVertical, Link2, TrendingUp, LayoutList, Layers, CalendarDays, FileDown, RotateCcw, ExternalLink } from 'lucide-react';

/* ================= THEME + DATA ================= */
const THEME = {
  bg: '#382d48', paper: '#f7f0f4', ink: '#3a3544',
  lower: '#e5627f', lowerTint: '#fde8ee', lowerMid: '#f3a6bd',
  upper: '#7a62c9', upperTint: '#ece6fb', upperMid: '#bba9ea',
  tan: '#f2c9a8', rest: '#fff0e6',
};
const GROUPS = {
  g: { label: 'Glutes', color: '#d9467a' },
  q: { label: 'Quads', color: '#f08a24' },
  h: { label: 'Hamstrings', color: '#7b4fc0' },
  c: { label: 'Calves + adductors', color: '#33a05f' },
  ch: { label: 'Chest', color: '#2f98e0' },
  b: { label: 'Back', color: '#2d3e7a' },
  s: { label: 'Shoulders + arms', color: '#d99a00' },
  k: { label: 'Core', color: '#6b7684' },
};
const GROUP_ORDER = ['g', 'q', 'h', 'c', 'ch', 'b', 's', 'k'];

const SEC = {
  warm: { n: 1, label: 'Warm-up' },
  plyo: { n: 2, label: 'Plyometrics' },
  heavy: { n: 3, label: 'Heavy compound' },
  iso: { n: 4, label: 'Isolation' },
  fin: { n: 5, label: 'Finisher · optional' },
  str: { n: 6, label: 'Stretch' },
  x: { n: null, label: 'Added by you' },
};
const SEC_ORDER = ['warm', 'plyo', 'heavy', 'iso', 'fin', 'str'];
const REST_SECONDS = { plyo: 75, heavy: 150, iso: 75, x: 90 };

const DAYS = [
  { abbr: 'Mon', full: 'Monday', title: 'Lower 1', focus: 'Glute-Led Hip Extension', type: 'lower' },
  { abbr: 'Tue', full: 'Tuesday', title: 'Upper 1', focus: 'Push Emphasis', type: 'upper' },
  { abbr: 'Wed', full: 'Wednesday', title: 'Lower 2', focus: 'Quad-Led Squat Pattern', type: 'lower' },
  { abbr: 'Thu', full: 'Thursday', title: 'Upper 2', focus: 'Pull Emphasis', type: 'upper' },
  { abbr: 'Fri', full: 'Friday', title: 'Lower 3', focus: 'Hinge + Posterior Chain', type: 'lower' },
  { abbr: 'Sat', full: 'Saturday', title: 'Rest', focus: 'Easy walk', type: 'rest' },
  { abbr: 'Sun', full: 'Sunday', title: 'Rest', focus: 'Easy walk', type: 'rest' },
];

const BLOCKS = [
  { n: 1, name: 'Foundation', weeks: [1, 2, 3, 4] },
  { n: 2, name: 'Intensify', weeks: [5, 6, 7, 8] },
  { n: 3, name: 'Peak', weeks: [9, 10, 11, 12] },
];
const FOCUS = ['Baselines', 'Add load', 'Peak volume (B1)', 'Deload', 'Heavier, 4 sets', 'Beat B1 loads', 'Heaviest of B2', 'Deload', 'Drive anchors', 'Max tension', 'Top-end week', 'Deload + reassess'];
const RIR = ['3', '2–3', '2', '4', '2', '1–2', '1', '4', '1–2', '1', '0–1', '4'];
const blockOf = (w) => BLOCKS[Math.floor((w - 1) / 4)];
const isDeload = (w) => w % 4 === 0;

/* Per-week prescription tables (index = week-1) */
const PLYO_SETS = [3, 3, 4, 2, 3, 4, 4, 2, 4, 4, 5, 2];
const JUMP = [5, 6, 5, 4, 5, 4, 5, 4, 4, 5, 3, 4];
const CONTACTS = [20, 24, 20, 16, 20, 16, 20, 16, 16, 20, 12, 16];
const THROWS = [10, 12, 10, 8, 10, 8, 10, 8, 8, 10, 6, 8];
const HEAVY_SETS = [3, 3, 4, 2, 4, 4, 4, 2, 4, 4, 4, 2];
const HEAVY_REPS = ['10', '10', '8–10', '8', '8–10', '8', '6–8', '8', '6–8', '6–8', '5–7', '8'];
const UNI_REPS = ['10', '10', '8–10', '8', '8–10', '8–10', '8', '8', '8', '8', '6–8', '8'];
const ISO_SETS = [3, 3, 3, 2, 3, 3, 3, 2, 3, 3, 3, 2];
const ISO_REPS = ['12–15', '12–15', '12–15', '12', '10–12', '10–12', '10–12', '12', '12–15', '12–15', '10–15', '12'];
const C1 = ['12–15', '12–15', '12–15', '10', '12–15', '12–15', '12–15', '10', '15–20', '15–20', '15–20', '10'];
const C2 = ['10–12', '10–12', '10–12', '8', '10–12', '10–12', '10–12', '8', '12–15', '12–15', '12–15', '8'];
const TM = ['30–40', '30–40', '30–40', '20–30', '40–50', '40–50', '40–50', '20–30', '45–60', '45–60', '45–60', '20–30'];

/* Exercise templates. [name, group, kind, flags]  s = per side, d = drop set (wk 7 / wk 11) */
const STRETCH = [
  ['Couch stretch · Pigeon · Figure-4', '60 s each side'],
  ['Doorway pec · Cross-body · T-spine', '40 s each'],
  ['Quad · Frog rock · Hip flexor', '45–60 s each'],
  ["Lat · Thread-the-needle · Child's pose", '40 s each'],
  ['Hamstring · Glute pull · Cat-cow', '45 s each'],
];
const T = [
  [ // ---- Set A (weeks 1, 4, 7, 10)
    { warm: 'Incline Treadmill Walk',
      plyo: [['Box Jump', 'g', 'j'], ['Tuck Jump', 'q', 'j'], ['Forward-Back Line Hops', 'c', 'c']],
      heavy: [['Barbell Hip Thrust', 'g', 'h'], ['Smith Machine Squat', 'q', 'h'], ['Rack Pull (Below Knee)', 'h', 'h']],
      iso: [['Cable Glute Kickback', 'g', 'i', 's'], ['Single-Leg Extension', 'q', 'i', 's'], ['Single-Leg Lying Curl', 'h', 'i', 's'], ['Cable Pull-Through', 'h', 'i', 'd'], ['Cable Hip Adduction', 'c', 'i', 's'], ['Donkey Calf Raise', 'c', 'i', 'd'], ['Cable Crunch', 'k', 'c1']],
      fin: ['Sled Push', '15 m / 45 s rest'] },
    { warm: 'Rower',
      plyo: [['Plyo Push-Up', 'ch', 'j'], ['Kettlebell High Pull (Light)', 'b', 't']],
      heavy: [['Incline Dumbbell Press', 'ch', 'h'], ['Chest-Supported Row', 'b', 'h'], ['Machine Shoulder Press', 's', 'h']],
      iso: [['Cable Lateral Raise', 's', 'i', 's'], ['Ab Wheel Rollout', 'k', 'c1'], ['Plank Row (DB)', 'k', 'c2']],
      fin: ['Rower Sprints', '250 m / 60 s rest'] },
    { warm: 'Incline Treadmill Walk',
      plyo: [['Alternating Bounds', 'g', 'j'], ['Split Squat Jump', 'q', 'j', 's'], ['Lateral Bound & Stick', 'c', 'j', 's']],
      heavy: [['Barbell Back Squat', 'q', 'h'], ['Bulgarian Split Squat (DB)', 'g', 'u'], ['Barbell Good Morning', 'h', 'h']],
      iso: [['Side-Lying Hip Abduction', 'g', 'i', 's'], ['Sissy Squat (Assisted)', 'q', 'i', 'd'], ['Stability-Ball Leg Curl', 'h', 'i', 'd'], ['Hamstring Walkout (Bridge)', 'h', 'i', 'd'], ['Side-Lying Hip Adduction', 'c', 'i', 's'], ['Smith Machine Calf Raise', 'c', 'i', 'd'], ['Pallof Press', 'k', 'c2']],
      fin: ['Rower Sprints', '20 s / 40 s'] },
    { warm: 'Ski Erg / Rower',
      plyo: [['Med Ball Chest Throw (Split)', 'ch', 't'], ['Battle Rope Slam', 's', 't']],
      heavy: [['Lat Pulldown (Wide Grip)', 'b', 'h'], ['T-Bar Row', 'b', 'h'], ['Machine Chest Press', 'ch', 'h']],
      iso: [['Cable Curl', 's', 'i', 'd'], ['Hanging Leg Raise', 'k', 'c1'], ['Cable Lift (Low-to-High)', 'k', 'c2']],
      fin: ['Battle Rope Waves', '20 s / 40 s'] },
    { warm: 'Elliptical',
      plyo: [['Kettlebell Swing (Explosive)', 'g', 't'], ['Hurdle Hop (Linear)', 'q', 'j'], ['Lateral Hurdle Hop', 'c', 'c']],
      heavy: [['Romanian Deadlift (Barbell)', 'h', 'h'], ['B-Stance RDL (DB)', 'g', 'u'], ['Lateral Step-Up (DB)', 'q', 'u']],
      iso: [['Machine Hip Thrust', 'g', 'i', 'd'], ['Reverse Nordic (Assisted)', 'q', 'i', 'd'], ['Standing Machine Leg Curl', 'h', 'i', 'd'], ['Cable Romanian Deadlift', 'h', 'i', 'd'], ['Ball Squeeze Glute Bridge', 'c', 'i', 'd'], ['Eccentric Single-Leg Calf Raise', 'c', 'i', 's'], ['45° Back Extension', 'k', 'c1']],
      fin: ['Sled Push', '15 m / 45 s rest'] },
  ],
  [ // ---- Set B (weeks 2, 5, 8, 11)
    { warm: 'Stationary Bike',
      plyo: [['Broad Jump & Stick', 'g', 'j'], ['Drop Jump (Low Box)', 'q', 'j'], ['Pogo Hops', 'c', 'c']],
      heavy: [['Barbell Hip Thrust', 'g', 'h'], ['Heels-Elevated Goblet Squat', 'q', 'h'], ['Sumo Deadlift', 'h', 'h']],
      iso: [['Seated Hip Abduction Machine', 'g', 'i', 'd'], ['Tempo Leg Extension', 'q', 'i', 'd'], ['Seated Leg Curl', 'h', 'i', 'd'], ['Glute-Ham Raise', 'h', 'i', 'd'], ['Copenhagen Plank (Short)', 'c', 'tm', 's'], ['Standing Calf Raise', 'c', 'i', 'd'], ['Hanging Knee Raise', 'k', 'c1']],
      fin: ['Stair-Climber Sprints', '20 s / 40 s'] },
    { warm: 'Treadmill Hill Sprints',
      plyo: [['Med Ball Chest Pass', 'ch', 't'], ['Slam Ball Overhead Slam', 'b', 't']],
      heavy: [['Incline Dumbbell Press', 'ch', 'h'], ['Seated Cable Row', 'b', 'h'], ['Landmine Press', 's', 'u']],
      iso: [['DB Lateral Raise', 's', 'i', 'd'], ['Plank Shoulder Taps', 'k', 'c1'], ['Stability-Ball Pike', 'k', 'c1']],
      fin: ['Assault Bike', '15 s / 45 s'] },
    { warm: 'Stair Climber (Easy)',
      plyo: [['Single-Leg Broad Jump', 'g', 'j', 's'], ['Alternating Lunge Jump', 'q', 'j', 's'], ['Lateral Line Hops', 'c', 'c']],
      heavy: [['Barbell Front Squat', 'q', 'h'], ['Bulgarian Split Squat (DB)', 'g', 'u'], ['Stiff-Leg Deadlift (DB)', 'h', 'h']],
      iso: [['Banded Lateral Walk', 'g', 'i', 's'], ['Spanish Squat Hold', 'q', 'tm'], ['Standing Cable Leg Curl', 'h', 'i', 's'], ['Prone Leg Curl', 'h', 'i', 'd'], ['Slider Adductor Slide', 'c', 'i', 's'], ['Leg Press Calf Raise', 'c', 'i', 'd'], ['Weighted Dead Bug', 'k', 'c2']],
      fin: ['Assault Bike Sprints', '10 s / 50 s'] },
    { warm: 'Stair Climber',
      plyo: [['Plyo Push-Up (Hands Elevated)', 'ch', 'j'], ['Landmine Push Press (Light)', 's', 'j', 's']],
      heavy: [['Lat Pulldown (Wide Grip)', 'b', 'h'], ['Plate-Loaded High Row', 'b', 'h'], ['Cable Chest Press', 'ch', 'h']],
      iso: [['Incline DB Curl', 's', 'i', 'd'], ['Reverse Crunch', 'k', 'c1'], ['Side Plank with Reach', 'k', 'c2']],
      fin: ['Sled Drag / Push', '20 m / 45 s rest'] },
    { warm: 'Incline Treadmill Walk',
      plyo: [['Med Ball Backward Throw', 'g', 't'], ['Trap-Bar Jump Shrug (Light)', 'q', 'j'], ['Jump Rope Intervals', 'c', 'c']],
      heavy: [['Romanian Deadlift (Barbell)', 'h', 'h'], ['Kickstand RDL (DB)', 'g', 'u'], ['Walking Lunge (DB)', 'q', 'u']],
      iso: [['Bent-Over Cable Hip Extension', 'g', 'i', 's'], ['Wall Sit (Weighted)', 'q', 'tm'], ['Assisted Nordic Curl', 'h', 'i', 'd'], ['Stability-Ball Hamstring Roll-In', 'h', 'i', 'd'], ['Wide-Stance Adductor Rock', 'c', 'i', 'd'], ['Seated Calf Raise (Slow)', 'c', 'i', 'd'], ['Single-Leg Back Extension', 'k', 'c2']],
      fin: ['Assault Bike Sprints', '10 s / 50 s'] },
  ],
  [ // ---- Set C (weeks 3, 6, 9, 12)
    { warm: 'Elliptical',
      plyo: [['Seated Box Jump', 'g', 'j'], ['Squat Jump', 'q', 'j'], ['Mini-Hurdle Hops', 'c', 'c']],
      heavy: [['Barbell Hip Thrust', 'g', 'h'], ['Leg Press (High & Wide)', 'q', 'h'], ['Trap-Bar Deadlift', 'h', 'h']],
      iso: [['Frog Pump (DB)', 'g', 'i'], ['Leg Extension', 'q', 'i'], ['Lying Leg Curl', 'h', 'i'], ['Band Pull-Through', 'h', 'i'], ['Hip Adduction Machine', 'c', 'i'], ['Seated Calf Raise', 'c', 'i'], ['Weighted Decline Sit-Up', 'k', 'c1']],
      fin: ['Bike Sprints', '10 s / 50 s'] },
    { warm: 'Assault Bike',
      plyo: [['Incline Clap Push-Up', 'ch', 'j'], ['Explosive Band Row', 'b', 't']],
      heavy: [['Incline Dumbbell Press', 'ch', 'h'], ['One-Arm DB Row', 'b', 'u'], ['Seated DB Shoulder Press', 's', 'h']],
      iso: [['Rope Triceps Pushdown', 's', 'i'], ['Hollow Body Hold', 'k', 'tm'], ['Half-Kneeling Pallof Press', 'k', 'c2']],
      fin: ['Battle Ropes', '20 s / 40 s'] },
    { warm: 'Rower (Easy)',
      plyo: [['Skater Bound with Reach', 'g', 'j', 's'], ['Single-Leg Box Jump (Stick)', 'q', 'j', 's'], ['Skater Hop', 'c', 'j', 's']],
      heavy: [['Hack Squat (Machine)', 'q', 'h'], ['Bulgarian Split Squat (DB)', 'g', 'u'], ['Smith Machine RDL', 'h', 'h']],
      iso: [['Machine Glute Kickback', 'g', 'i', 's'], ['Terminal Knee Extension (Band)', 'q', 'i', 's'], ['Sliding Leg Curl', 'h', 'i'], ['Single-Leg Bridge Curl', 'h', 'i', 's'], ['Ball Adductor Squeeze', 'c', 'tm'], ['Single-Leg Calf Raise (DB)', 'c', 'i', 's'], ['Suitcase Carry', 'k', 'tm', 's']],
      fin: ['Stair-Climber Sprints', '20 s / 40 s'] },
    { warm: 'Bike Intervals',
      plyo: [['Med Ball Side Throw', 'ch', 'j', 's'], ['Fast Band Pull-Apart', 's', 't']],
      heavy: [['Lat Pulldown (Wide Grip)', 'b', 'h'], ['Inverted Row', 'b', 'h'], ['Flat Dumbbell Press', 'ch', 'h']],
      iso: [['Reverse Pec Deck', 's', 'i'], ['V-Up', 'k', 'c1'], ['Russian Twist (Weighted)', 'k', 'c2']],
      fin: ['Ski Erg Sprints', '20 s / 40 s'] },
    { warm: 'Stationary Bike',
      plyo: [['Med Ball Scoop Toss', 'g', 't'], ['Depth Hop to Broad Jump', 'q', 'j'], ['Single-Leg Pogo Hop', 'c', 'c']],
      heavy: [['Romanian Deadlift (Barbell)', 'h', 'h'], ['Single-Leg RDL (DB)', 'g', 'u'], ['Reverse Deficit Lunge', 'q', 'u']],
      iso: [['Standing Cable Hip Abduction', 'g', 'i', 's'], ['Leg Extension (Toes Out)', 'q', 'i'], ['Lying Cable Leg Curl', 'h', 'i'], ['Feet-Elevated Hip Bridge', 'h', 'i'], ['Standing Cable Adduction', 'c', 'i', 's'], ['Standing Calf Raise (Toes Out)', 'c', 'i'], ['Weighted Bench Back Extension', 'k', 'c1']],
      fin: ['Incline Treadmill Sprints', '15 s / 45 s walk'] },
  ],
];

/* ---- prescription for one exercise in one week ---- */
function rxFor(kind, flags, w) {
  const i = w - 1;
  const side = (flags || '').includes('s');
  switch (kind) {
    case 'j': return { sets: PLYO_SETS[i], reps: String(JUMP[i]), side };
    case 'c': return { sets: PLYO_SETS[i], reps: String(CONTACTS[i]), unit: 'contacts' };
    case 't': return { sets: PLYO_SETS[i], reps: String(THROWS[i]) };
    case 'h': return { sets: HEAVY_SETS[i], reps: HEAVY_REPS[i] };
    case 'u': return { sets: HEAVY_SETS[i], reps: UNI_REPS[i], side: true };
    case 'i': return { sets: ISO_SETS[i], reps: ISO_REPS[i], side, drop: (flags || '').includes('d') && (w === 7 || w === 11) };
    case 'c1': return { sets: 3, reps: C1[i] };
    case 'c2': return { sets: 3, reps: C2[i], side: true };
    case 'tm': return { sets: 3, reps: TM[i], unit: 's', side };
    default: return { sets: 3, reps: '10' };
  }
}
function rxLabel(r) {
  return `${r.sets} × ${r.reps}${r.unit === 's' ? ' s' : r.unit === 'contacts' ? ' contacts' : ''}${r.side ? ' /side' : ''}${r.drop ? ' + drop set' : ''}`;
}
const topReps = (r) => { const m = String(r.reps).match(/\d+/g); return m ? Math.max(...m.map(Number)) : 0; };
const repsUnitLabel = (r) => (r.unit === 's' ? 'sec' : r.unit === 'contacts' ? 'contacts' : 'reps');

function weekHeadline(w) {
  const i = w - 1;
  return `Plyo ${PLYO_SETS[i]} × ${JUMP[i]} · Heavy ${HEAVY_SETS[i]} × ${HEAVY_REPS[i]} · Isolation ${ISO_SETS[i]} × ${ISO_REPS[i]} · RIR ${RIR[i]}`;
}

function minutesFor(week, d) {
  const type = DAYS[d].type;
  if (type === 'lower') return { warm: 15, plyo: 10, heavy: 28, iso: 25, fin: 5, str: 6 };
  if (type === 'upper') return isDeload(week) ? { warm: 15, plyo: 8, heavy: 25, iso: 20, fin: 7, str: 13 } : { warm: 20, plyo: 8, heavy: 25, iso: 20, fin: 7, str: 8 };
  return null;
}

/* ---- base list of items for a week/day ---- */
function buildBase(week, d) {
  if (d > 4) return [];
  const si = (week - 1) % 3;
  const set = 'ABC'[si];
  const tpl = T[si][d];
  const dl = isDeload(week);
  const upper = DAYS[d].type === 'upper';
  const items = [];
  const warmSpec = upper && !dl ? `10 steady + 10 HIIT (${week <= 3 ? '20/40' : '30/30'} s × 10)` : '15 min · RPE 4–5';
  items.push({ id: `${set}${d}.warm0`, sec: 'warm', name: tpl.warm, simple: true, spec: warmSpec });
  ['plyo', 'heavy', 'iso'].forEach((sec) => {
    tpl[sec].forEach((row, i) => {
      const [name, g, kind, flags] = row;
      items.push({ id: `${set}${d}.${sec}${i}`, sec, name, g, kind, flags: flags || '', rx: rxFor(kind, flags, week) });
    });
  });
  if (dl) items.push({ id: `${set}${d}.fin0`, sec: 'fin', name: 'Easy walk (optional)', simple: true, spec: 'Skip this week, or 5 min easy walk' });
  else {
    const rounds = week <= 3 ? 6 : week <= 7 ? 7 : 8;
    items.push({ id: `${set}${d}.fin0`, sec: 'fin', name: tpl.fin[0], simple: true, spec: `${tpl.fin[1]} × ${rounds}` });
  }
  items.push({ id: `${set}${d}.str0`, sec: 'str', name: STRETCH[d][0], simple: true, spec: STRETCH[d][1] });
  return items;
}

/* ---- apply user edits: swaps, extras, order ---- */
function resolvePlan(week, d, dd) {
  const base = buildBase(week, d);
  const swaps = (dd && dd.swaps) || {};
  const extras = ((dd && dd.extra) || []).map((x) => ({ id: x.id, sec: 'x', name: x.name, g: x.g, kind: 'x', custom: true, rx: { sets: x.sets || 3, reps: x.reps || '10' } }));
  const all = [...base, ...extras].map((it) => (swaps[it.id] ? { ...it, orig: it.name, name: swaps[it.id], swapped: true } : it));
  const map = new Map(all.map((i) => [i.id, i]));
  const out = [];
  ((dd && dd.order) || []).forEach((id) => { if (map.has(id)) { out.push(map.get(id)); map.delete(id); } });
  map.forEach((v) => out.push(v));
  return out;
}

/* consecutive isolation moves pair up as supersets (1a/1b, 2a/2b ...) */
function withSupersets(items) {
  const res = items.map((i) => ({ ...i, ss: null }));
  let n = 0, run = [];
  const flush = () => {
    for (let k = 0; k + 1 < run.length; k += 2) { n++; res[run[k]].ss = { n, pos: 'a' }; res[run[k + 1]].ss = { n, pos: 'b' }; }
    run = [];
  };
  res.forEach((it, idx) => { if (it.sec === 'iso') run.push(idx); else flush(); });
  flush();
  return res;
}

/* swap suggestions straight from the plan's SWAPS list */
function swapOptions(item) {
  const n = item.name;
  if (item.sec === 'plyo') return { note: 'Jumps bother a joint', opts: ['Med-ball throw', 'Bike sprints'] };
  if (/Hack Squat/.test(n)) return { note: 'No hack squat', opts: ['Leg Press (High & Wide)', 'Heels-Elevated Goblet Squat'] };
  if (/Sled/.test(n)) return { note: 'No sled', opts: ['Hill sprints', 'Bike sprints'] };
  if (/Barbell Hip Thrust/.test(n)) return { note: 'Hip thrust bar uncomfortable', opts: ['Machine Hip Thrust', 'Frog Pump (DB)'] };
  if (/Back Extension/.test(n)) return { note: 'No back-extension bench', opts: ['45° Back Extension'] };
  return { note: '', opts: [] };
}

/* ================= DATES ================= */
const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function mondayOf(iso) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
function locate(startISO, now) {
  const s = mondayOf(startISO);
  const n = now || new Date();
  const t = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  const diff = Math.round((t - s) / 86400000);
  if (diff < 0) return { week: 1, day: 0, status: 'before', diff };
  const week = Math.floor(diff / 7) + 1;
  const day = diff % 7;
  if (week > 12) return { week: 12, day, status: 'after', diff };
  return { week, day, status: 'active', diff };
}
function dateFor(startISO, week, d) {
  const s = mondayOf(startISO);
  s.setDate(s.getDate() + (week - 1) * 7 + d);
  return s;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtShort = (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;

/* ================= LOG HELPERS ================= */
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const isLogged = (s) => !!s && (s.d || (num(s.w) > 0 && num(s.r) > 0));
const e1 = (s) => (num(s.w) > 0 && num(s.r) > 0 ? num(s.w) * (1 + num(s.r) / 30) : 0);
const fmtNum = (v) => { const n = num(v); return Number.isInteger(n) ? String(n) : n.toFixed(1); };
const fmtSet = (s, unit) => (num(s.w) > 0 ? `${fmtNum(s.w)}×${s.r || '?'}` : `${s.r || '✓'}`) + (unit === 's' && s.r ? 's' : '');

function blankEntry(item) {
  return { sets: Array.from({ length: item.rx.sets }, () => ({ w: '', r: '', d: false })), n: item.rx.sets, top: topReps(item.rx) };
}

function buildHistory(days) {
  const h = {};
  Object.keys(days).forEach((k) => {
    const dd = days[k];
    if (!dd || !dd.log) return;
    const [w, d] = k.split('-').map(Number);
    resolvePlan(w, d, dd).forEach((it) => {
      if (it.simple || it.swapped) return;
      const e = dd.log[it.id];
      if (!e || !e.sets) return;
      const sets = e.sets.filter(isLogged);
      if (!sets.length) return;
      (h[it.name] = h[it.name] || []).push({ w, d, sets, n: e.n || it.rx.sets, top: e.top || topReps(it.rx), deload: isDeload(w), unit: it.rx.unit });
    });
  });
  Object.keys(h).forEach((k) => h[k].sort((a, b) => a.w * 10 + a.d - (b.w * 10 + b.d)));
  return h;
}

function itemStats(hist, item, w, d, entry) {
  const res = { last: null, pr: null, nudge: null };
  if (item.simple) return res;
  const prior = (hist[item.name] || []).filter((e) => e.w * 10 + e.d < w * 10 + d);
  if (prior.length) res.last = prior[prior.length - 1];
  const cur = entry ? entry.sets.filter(isLogged) : [];
  const curBest = Math.max(0, ...cur.map(e1));
  const priorBest = Math.max(0, ...prior.flatMap((p) => p.sets.map(e1)));
  if (priorBest > 0 && curBest > priorBest) res.pr = Math.round(curBest - priorBest);
  if (!isDeload(w)) {
    const ref = [...prior].reverse().find((p) => !p.deload);
    if (ref && ref.sets.length >= ref.n && ref.sets.every((s) => num(s.r) >= ref.top && num(s.w) > 0)) {
      const lastW = Math.max(...ref.sets.map((s) => num(s.w)));
      const inc = item.sec === 'heavy' && DAYS[d].type === 'lower' ? 10 : 5;
      const curW = Math.max(0, ...cur.map((s) => num(s.w)));
      if (curW <= lastW) res.nudge = { lastW, next: lastW + inc, top: ref.top, wk: ref.w };
    }
  }
  return res;
}

/* units of work for progress rings */
function dayUnits(plan, dd) {
  const log = (dd && dd.log) || {};
  const out = { total: 0, done: 0, bySec: {} };
  plan.forEach((it) => {
    const e = log[it.id];
    let t, dn;
    if (it.simple) { t = 1; dn = e && e.done ? 1 : 0; }
    else { const sets = e && e.sets ? e.sets : Array.from({ length: it.rx.sets }); t = sets.length; dn = e && e.sets ? e.sets.filter((s) => s.d).length : 0; }
    out.total += t; out.done += dn;
    const b = (out.bySec[it.sec] = out.bySec[it.sec] || { t: 0, d: 0 });
    b.t += t; b.d += dn;
  });
  return out;
}

/* ================= TRENDS ================= */
const LIFTS = [
  { id: 'hip', title: 'Barbell Hip Thrust', names: ['Barbell Hip Thrust'], g: 'g' },
  { id: 'squat', title: 'Wed lead squat (back / front / hack)', names: ['Barbell Back Squat', 'Barbell Front Squat', 'Hack Squat (Machine)'], g: 'q' },
  { id: 'rdl', title: 'Romanian Deadlift (Barbell)', names: ['Romanian Deadlift (Barbell)'], g: 'h' },
  { id: 'bss', title: 'Bulgarian Split Squat (DB)', names: ['Bulgarian Split Squat (DB)'], g: 'g' },
  { id: 'inc', title: 'Incline Dumbbell Press', names: ['Incline Dumbbell Press'], g: 'ch' },
  { id: 'lat', title: 'Lat Pulldown (Wide Grip)', names: ['Lat Pulldown (Wide Grip)'], g: 'b' },
];
function liftSeries(hist, lift) {
  const out = Array(12).fill(null);
  lift.names.forEach((n) => (hist[n] || []).forEach((e) => {
    const best = Math.max(0, ...e.sets.map((s) => num(s.w)));
    if (best > 0 && (out[e.w - 1] === null || best > out[e.w - 1])) out[e.w - 1] = best;
  }));
  return out;
}

/* ================= DRAWING PRIMITIVES -> PDF / SVG ================= */
const HW = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
const HB = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];
const WIDE = { '×': 584, '–': 556, '—': 1000, '·': 278, '°': 400, '’': 222, '•': 350, '…': 1000, '✓': 556 };
function tw(s, size, bold) {
  const tbl = bold ? HB : HW;
  let w = 0;
  for (const ch of String(s)) {
    const c = ch.charCodeAt(0);
    w += c >= 32 && c <= 126 ? tbl[c - 32] : WIDE[ch] || 556;
  }
  return (w * size) / 1000;
}
function fit(s, size, bold, maxW) {
  s = String(s);
  if (tw(s, size, bold) <= maxW) return s;
  while (s.length > 1 && tw(s + '…', size, bold) > maxW) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}
const CP1252 = { '×': 0xd7, '–': 0x96, '—': 0x97, '·': 0xb7, '°': 0xb0, '’': 0x92, '•': 0x95, '…': 0x85 };
function pdfText(s) {
  let o = '';
  for (const ch of String(s)) {
    const c = ch.charCodeAt(0);
    let code = c >= 32 && c <= 126 ? c : CP1252[ch];
    if (ch === '✓') { o += 'x'; continue; }
    if (ch === '→') { o += '->'; continue; }
    if (code === undefined) code = 63;
    if (code === 40 || code === 41 || code === 92) o += '\\' + String.fromCharCode(code);
    else o += String.fromCharCode(code);
  }
  return o;
}
function mkCanvas() {
  const ops = [];
  return {
    ops,
    rect: (x, y, w, h, fill, o) => ops.push({ t: 'rect', x, y, w, h, fill, ...(o || {}) }),
    circle: (cx, cy, r, fill, o) => ops.push({ t: 'rect', x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, r, fill, ...(o || {}) }),
    line: (x1, y1, x2, y2, color, w, dash) => ops.push({ t: 'line', x1, y1, x2, y2, color, w: w || 0.5, dash }),
    poly: (pts, color, w) => ops.push({ t: 'poly', pts, color, w: w || 1 }),
    text: (x, y, s, size, bold, color, anchor) => ops.push({ t: 'text', x, y, s: String(s), size, bold: !!bold, color: color || '#000000', anchor: anchor || 'start' }),
  };
}
const hexRGB = (hex) => { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((v) => v.toFixed(3)).join(' '); };

function opsToPdf(ops, W, H) {
  const f = (n) => (Math.round(n * 100) / 100).toString();
  const rr = (x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    const k = 0.5523 * r, X0 = x, X1 = x + w, Y0 = H - y, Y1 = H - y - h;
    return [`${f(X0 + r)} ${f(Y0)} m`, `${f(X1 - r)} ${f(Y0)} l`, `${f(X1 - r + k)} ${f(Y0)} ${f(X1)} ${f(Y0 - r + k)} ${f(X1)} ${f(Y0 - r)} c`, `${f(X1)} ${f(Y1 + r)} l`, `${f(X1)} ${f(Y1 + r - k)} ${f(X1 - r + k)} ${f(Y1)} ${f(X1 - r)} ${f(Y1)} c`, `${f(X0 + r)} ${f(Y1)} l`, `${f(X0 + r - k)} ${f(Y1)} ${f(X0)} ${f(Y1 + r - k)} ${f(X0)} ${f(Y1 + r)} c`, `${f(X0)} ${f(Y0 - r)} l`, `${f(X0)} ${f(Y0 - r + k)} ${f(X0 + r - k)} ${f(Y0)} ${f(X0 + r)} ${f(Y0)} c`, 'h'].join(' ');
  };
  let c = '';
  ops.forEach((o) => {
    if (o.t === 'rect') {
      const path = o.r ? rr(o.x, o.y, o.w, o.h, o.r) : `${f(o.x)} ${f(H - o.y - o.h)} ${f(o.w)} ${f(o.h)} re`;
      const fill = o.fill && o.fill !== 'none', stroke = o.stroke;
      if (fill) c += `${hexRGB(o.fill)} rg `;
      if (stroke) c += `${hexRGB(o.stroke)} RG ${f(o.sw || 0.6)} w `;
      c += `${path} ${fill && stroke ? 'B' : fill ? 'f' : 'S'}\n`;
    } else if (o.t === 'line') {
      c += `${hexRGB(o.color)} RG ${f(o.w)} w ${o.dash ? `[${o.dash[0]} ${o.dash[1]}] 0 d` : '[] 0 d'} ${f(o.x1)} ${f(H - o.y1)} m ${f(o.x2)} ${f(H - o.y2)} l S [] 0 d\n`;
    } else if (o.t === 'poly') {
      c += `${hexRGB(o.color)} RG ${f(o.w)} w 1 j 1 J ` + o.pts.map((p, i) => `${f(p[0])} ${f(H - p[1])} ${i ? 'l' : 'm'}`).join(' ') + ' S\n';
    } else if (o.t === 'text') {
      const wdt = tw(o.s, o.size, o.bold);
      const x = o.anchor === 'end' ? o.x - wdt : o.anchor === 'middle' ? o.x - wdt / 2 : o.x;
      c += `BT ${hexRGB(o.color)} rg /F${o.bold ? 2 : 1} ${f(o.size)} Tf ${f(x)} ${f(H - o.y)} Td (${pdfText(o.s)}) Tj ET\n`;
    }
  });
  const objs = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objs[3] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`;
  objs[4] = `<< /Length ${c.length} >>\nstream\n${c}endstream`;
  objs[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objs[6] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  let out = '%PDF-1.4\n';
  const off = [];
  for (let i = 1; i <= 6; i++) { off[i] = out.length; out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
  const xr = out.length;
  out += 'xref\n0 7\n0000000000 65535 f \n';
  for (let i = 1; i <= 6; i++) out += `${String(off[i]).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 255;
  return bytes;
}

function opsToSvg(ops, W, H) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;background:#fff">`;
  ops.forEach((o) => {
    if (o.t === 'rect') s += `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="${o.r || 0}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 0.6}"` : ''}/>`;
    else if (o.t === 'line') s += `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="${o.color}" stroke-width="${o.w}"${o.dash ? ` stroke-dasharray="${o.dash[0]} ${o.dash[1]}"` : ''}/>`;
    else if (o.t === 'poly') s += `<polyline points="${o.pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${o.color}" stroke-width="${o.w}" stroke-linejoin="round" stroke-linecap="round"/>`;
    else if (o.t === 'text') s += `<text x="${o.x}" y="${o.y}" font-size="${o.size}" font-weight="${o.bold ? 700 : 400}" fill="${o.color}" text-anchor="${o.anchor === 'end' ? 'end' : o.anchor === 'middle' ? 'middle' : 'start'}" font-family="Helvetica, Arial, sans-serif">${esc(o.s)}</text>`;
  });
  return s + '</svg>';
}

/* ================= ONE-PAGE REPORT ================= */
function buildReport(o) {
  const W = 792, H = 612, M = 26;
  const c = mkCanvas();
  const days = o.days || {};
  const hist = buildHistory(days);
  const today = new Date();
  const dateStr = `${MONTHS[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

  c.rect(0, 0, W * 0.55, 5, '#f3a6bd');
  c.rect(W * 0.55, 0, W * 0.45, 5, THEME.upper);
  c.rect(0, 5, W, 40, THEME.bg);
  c.text(M, 31, 'Glute & Lean Mass Hypertrophy Plan', 15, true, '#ffffff');
  const what = [o.showLog ? `Weekly log · Week ${o.week}` : null, o.showTrends ? 'Trends · Weeks 1–12' : null].filter(Boolean).join('   |   ');
  c.text(W - M, 25, what, 8.5, true, THEME.tan, 'end');
  c.text(W - M, 37, `Exported ${dateStr}`, 7, false, '#cfc8d6', 'end');

  const top = 54, bottom = H - 34;
  const both = o.showLog && o.showTrends;
  const logH = both ? 290 : bottom - top;
  const trendY = both ? top + logH + 8 : top;
  const trendH = both ? bottom - trendY : bottom - top;

  if (o.showLog) drawLog(c, M, top, W - 2 * M, logH, o.week, days);
  if (o.showTrends) drawTrends(c, M, trendY, W - 2 * M, trendH, hist, o.lifts);

  // legend
  let lx = M;
  GROUP_ORDER.forEach((g) => {
    c.circle(lx + 3, H - 17, 3, GROUPS[g].color);
    c.text(lx + 9, H - 14.5, GROUPS[g].label, 6.5, false, '#555060');
    lx += 14 + tw(GROUPS[g].label, 6.5, false) + 8;
  });
  c.text(W - M, H - 14.5, 'Weights in lb · sets shown as weight × reps', 6.5, false, '#8a8594', 'end');
  return c.ops;
}

function drawLog(c, x, y, w, h, week, days) {
  const bl = blockOf(week);
  c.text(x, y + 10, `Weekly exercise log · Week ${week}`, 11, true, THEME.ink);
  c.text(x + w, y + 10, `Block ${bl.n} · ${bl.name} · ${FOCUS[week - 1]} · ${weekHeadline(week)}`, 6.8, false, '#6a6574', 'end');

  const plans = [0, 1, 2, 3, 4].map((d) => resolvePlan(week, d, days[`${week}-${d}`]).filter((i) => !i.simple));
  let sessions = 0, setsLogged = 0, volume = 0;
  plans.forEach((p, d) => {
    const dd = days[`${week}-${d}`];
    if (dd && dd.done) sessions++;
    p.forEach((it) => { const e = dd && dd.log && dd.log[it.id]; if (e) e.sets.filter(isLogged).forEach((s) => { setsLogged++; volume += num(s.w) * num(s.r); }); });
  });
  const gap = 6, cw = (w - gap * 4) / 5, topY = y + 18, headH = 24;
  const bodyH = h - 30 - headH;
  const maxN = Math.max(...plans.map((p) => p.length), 1);
  const footH = 12;
  const itemH = Math.min(26, (bodyH - 8 - footH) / maxN);

  plans.forEach((plan, d) => {
    const dd = days[`${week}-${d}`] || {};
    const upper = DAYS[d].type === 'upper';
    const main = upper ? THEME.upper : THEME.lower, tint = upper ? '#dcecfb' : '#d6f5ee', mid = upper ? '#9cc8ee' : '#86dac8';
    const x0 = x + d * (cw + gap);
    c.rect(x0, topY + 8, cw, h - 30 - 8, tint, { r: 5, stroke: mid, sw: 0.8 });
    c.rect(x0, topY, cw, headH, main, { r: 5 });
    c.text(x0 + 7, topY + 11, DAYS[d].abbr, 6.5, false, '#f3d9d4');
    c.text(x0 + 7, topY + 20, DAYS[d].title, 9, true, '#ffffff');
    const full = resolvePlan(week, d, dd);
    const u = dayUnits(full, dd);
    const stat = dd.done ? 'Complete' : dd.skipped ? 'Skipped' : `${u.done}/${u.total} items`;
    c.text(x0 + cw - 7, topY + 16, stat, 6.8, true, '#ffffff', 'end');

    const two = itemH >= 15;
    const ns = two ? Math.min(7.6, itemH * 0.36) : Math.min(7, itemH * 0.6);
    plan.forEach((it, i) => {
      const y0 = topY + headH + 5 + i * itemH;
      const e = dd.log && dd.log[it.id];
      const logged = e ? e.sets.filter(isLogged) : [];
      const logStr = logged.length ? logged.map((s) => fmtSet(s, it.rx.unit)).join('   ') : `${rxLabel(it.rx)} · not logged`;
      c.circle(x0 + 8, y0 + ns * 0.62, 2.3, GROUPS[it.g] ? GROUPS[it.g].color : '#999999');
      if (two) {
        c.text(x0 + 14, y0 + ns, fit(it.name, ns, true, cw - 20), ns, true, THEME.ink);
        c.text(x0 + 14, y0 + ns + ns * 0.95 + 1, fit(logStr, ns * 0.92, false, cw - 20), ns * 0.92, false, logged.length ? '#2e2a37' : '#9a95a5');
      } else {
        const nm = fit(it.name, ns, true, cw * 0.5);
        c.text(x0 + 14, y0 + ns, nm, ns, true, THEME.ink);
        c.text(x0 + 14 + tw(nm, ns, true) + 4, y0 + ns, fit(logStr, ns * 0.9, false, cw - 20 - tw(nm, ns, true) - 4), ns * 0.9, false, logged.length ? '#2e2a37' : '#9a95a5');
      }
    });
  });
  c.text(x + w, y + h - 2, `Sessions complete ${sessions}/5  ·  Sets logged ${setsLogged}  ·  Volume ${Math.round(volume).toLocaleString('en-US')} lb`, 6.8, true, '#6a6574', 'end');
}

function drawTrends(c, x, y, w, h, hist, liftIds) {
  c.text(x, y + 10, 'Trends over time · top set weight by week (lb)', 11, true, THEME.ink);
  c.text(x + w, y + 10, 'Shaded weeks are deloads', 6.8, false, '#6a6574', 'end');
  const lifts = LIFTS.filter((l) => liftIds.includes(l.id));
  if (!lifts.length) return;
  const cols = Math.min(3, lifts.length), rows = Math.ceil(lifts.length / cols), gap = 8;
  const cw = (w - gap * (cols - 1)) / cols, ch = (h - 18 - gap * (rows - 1)) / rows;
  lifts.forEach((l, idx) => {
    const col = idx % cols, row = Math.floor(idx / cols);
    const bx = x + col * (cw + gap), by = y + 18 + row * (ch + gap);
    const series = liftSeries(hist, l);
    const color = GROUPS[l.g].color;
    c.rect(bx, by, cw, ch, '#ffffff', { r: 5, stroke: '#d9d4de', sw: 0.8 });
    c.circle(bx + 9, by + 10, 3, color);
    c.text(bx + 16, by + 12.5, fit(l.title, 8, true, cw - 24), 8, true, THEME.ink);
    const vals = series.filter((v) => v !== null);
    const sub = vals.length ? `Start ${fmtNum(vals[0])}  →  Latest ${fmtNum(vals[vals.length - 1])}  ·  Best ${fmtNum(Math.max(...vals))}  (${vals[vals.length - 1] - vals[0] >= 0 ? '+' : ''}${fmtNum(vals[vals.length - 1] - vals[0])})` : 'No weights logged yet';
    c.text(bx + 9, by + 23, fit(sub, 6.5, false, cw - 16), 6.5, false, '#6a6574');
    const px = bx + 28, py = by + 32, pw = cw - 28 - 10, ph = ch - 32 - 16;
    let lo = 0, hi = 45;
    if (vals.length) {
      lo = Math.floor((Math.min(...vals) * 0.9) / 5) * 5; hi = Math.ceil((Math.max(...vals) * 1.05) / 5) * 5;
      hi = lo + Math.max(15, Math.ceil((hi - lo) / 15) * 15);
    }
    const X = (wk) => px + ((wk - 1) / 11) * pw, Yv = (v) => py + ph - ((v - lo) / (hi - lo)) * ph;
    [4, 8, 12].forEach((wk) => c.rect(X(wk) - pw / 22, py, pw / 11, ph, '#f1eef4'));
    for (let t = 0; t <= 3; t++) {
      const v = lo + ((hi - lo) * t) / 3, yy = Yv(v);
      c.line(px, yy, px + pw, yy, '#e4e0e8', 0.5);
      c.text(px - 4, yy + 2, fmtNum(v), 5.8, false, '#8a8594', 'end');
    }
    for (let wk = 1; wk <= 12; wk++) c.text(X(wk), py + ph + 9, String(wk), 5.8, false, '#8a8594', 'middle');
    if (!vals.length) { c.text(px + pw / 2, py + ph / 2 + 2, 'Log a set to start the line', 7, false, '#a5a0ae', 'middle'); return; }
    const pts = series.map((v, i) => (v === null ? null : [X(i + 1), Yv(v)])).filter(Boolean);
    if (pts.length > 1) c.poly(pts, color, 1.4);
    pts.forEach((p, i) => c.circle(p[0], p[1], i === pts.length - 1 ? 2.8 : 1.9, color, i === pts.length - 1 ? { stroke: '#ffffff', sw: 0.8 } : {}));
    const lastP = pts[pts.length - 1];
    c.text(lastP[0], lastP[1] - 5, fmtNum(vals[vals.length - 1]), 6.5, true, color, lastP[0] > px + pw - 14 ? 'end' : 'middle');
  });
}
/* ================= STORAGE ================= */
const STORE_KEY = 'glute-plan-v1';
async function loadData() {
  try {
    if (!window.storage) return null;
    const r = await window.storage.get(STORE_KEY);
    return r && r.value ? JSON.parse(r.value) : null;
  } catch (e) { return null; }
}
async function saveData(d) {
  try { if (window.storage) await window.storage.set(STORE_KEY, JSON.stringify(d)); } catch (e) { /* storage unavailable */ }
}

const GROUP_TEXT = { g: '#c2336a', q: '#c2620a', h: '#6a3fb0', c: '#23824a', ch: '#1b84c9', b: '#2d3e7a', s: '#966a00', k: '#5a6472' };
const palette = (type) => (type === 'upper'
  ? { acc: THEME.upper, acc2: '#c46bd0', tint: THEME.upperTint, mid: THEME.upperMid, segs: ['#ece6fb', '#cfc2f2', '#7a62c9', '#a08ae0', '#cfc2f2', '#ece6fb'], segInk: ['#3a3544', '#3a3544', '#fff', '#fff', '#3a3544', '#3a3544'] }
  : type === 'lower'
    ? { acc: THEME.lower, acc2: '#f59a7c', tint: THEME.lowerTint, mid: THEME.lowerMid, segs: ['#fde8ee', '#f8c3d2', '#e5627f', '#ef8aa3', '#f8c3d2', '#fde8ee'], segInk: ['#3a3544', '#3a3544', '#fff', '#3a3544', '#3a3544', '#3a3544'] }
    : { acc: '#e0906f', acc2: '#f2c4a0', tint: THEME.rest, mid: '#f5c9b0', segs: [], segInk: [] });

/* each panel gets a pastel of its muscle group */
const GROUP_PASTEL = {
  g: { tint: '#fde4ee', mid: '#f4a9c6', acc: '#e0457b' },
  q: { tint: '#fff0dc', mid: '#f9c78a', acc: '#ef8420' },
  h: { tint: '#efe6fb', mid: '#c9b0ee', acc: '#7b4fc0' },
  c: { tint: '#e0f6e9', mid: '#9fdbb6', acc: '#2f9a5b' },
  ch: { tint: '#e1f1fc', mid: '#9fd0f2', acc: '#2f8fd6' },
  b: { tint: '#e5e9fb', mid: '#aab7ee', acc: '#4558b0' },
  s: { tint: '#fff5cf', mid: '#f2dc7c', acc: '#d09000' },
  k: { tint: '#efecf4', mid: '#c9c3d8', acc: '#6b7684' },
};
const pastelVars = (g) => (GROUP_PASTEL[g] ? { '--tint': 'var(--ptint)', '--mid': 'var(--pmid)', '--acc': GROUP_PASTEL[g].acc } : { '--tint': 'var(--ptint)', '--mid': 'var(--pmid)' });
const icy = (type) => (type === 'upper' ? { '--ptint': '#dcecfb', '--pmid': '#9cc8ee' } : { '--ptint': '#d6f5ee', '--pmid': '#86dac8' });

function beep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = 880; g.gain.value = 0.08;
    o.connect(g); g.connect(ctx.destination); o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 320);
  } catch (e) { /* audio blocked */ }
  try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch (e) { /* no vibrate */ }
}

/* ================= SMALL PIECES ================= */
function GIcon({ g, size = 26 }) {
  const c = GROUPS[g] ? GROUPS[g].color : '#999';
  const line = { fill: 'none', stroke: c, strokeWidth: 1.15, strokeLinecap: 'round' };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
      <circle cx="12" cy="12" r="12" fill={c} />
      {g === 'g' && (
        <g>
          <path fill="#fff" d="M11.5 6.6C8.2 4.9 4.6 7.6 5 11.8c.4 4.2 4.4 6 6.5 3.4Z" />
          <path fill="#fff" d="M12.5 6.6c3.3-1.7 6.9 1 6.5 5.2-.4 4.2-4.4 6-6.5 3.4Z" />
          <path {...line} d="M12 8.2v8.2" />
        </g>
      )}
      {g === 'q' && (
        <g>
          <path fill="#fff" d="M8 6.4C9.4 4.8 14.6 4.8 16 6.4c1 3.8-.2 9-2 12.9h-4C8.2 15.4 7 10.2 8 6.4Z" />
          <path {...line} d="M12 6.4c-.5 3.8-.5 7.6.2 11.6" />
          <path {...line} d="M9.2 9.6c.800 2.6 1.3 5 1.8 7.2" opacity=".6" />
        </g>
      )}
      {g === 'h' && (
        <g>
          <path fill="#fff" d="M8 6.4C9.4 4.8 14.6 4.8 16 6.4c.8 4.2-.4 8.8-1 12.9h-2.2L12 15.8l-.8 3.5H9c-.6-4.1-1.8-8.7-1-12.9Z" />
          <path {...line} d="M12 6.4v8.6" />
        </g>
      )}
      {g === 'c' && (
        <g>
          <path fill="#fff" d="M12 4.4c3.9.8 5.4 4.6 3.7 8.4-1 2.4-2.2 4.7-3 7.2h-1.4c-.8-2.5-2-4.8-3-7.2-1.7-3.8-.2-7.6 3.7-8.4Z" />
          <path {...line} d="M12 6.2v8.6" />
        </g>
      )}
      {g === 'ch' && (
        <g>
          <path fill="#fff" d="M11.2 7.2C8.6 6.3 6 7.2 5.2 9.6c-.7 2.6.9 5.4 3.6 5.8 1.4.2 2.4-.6 2.4-1.8Z" />
          <path fill="#fff" d="M12.8 7.2c2.6-.9 5.2 0 6 2.4.7 2.6-.9 5.4-3.6 5.8-1.4.2-2.4-.6-2.4-1.8Z" />
        </g>
      )}
      {g === 'b' && (
        <g>
          <path fill="#fff" d="M5.4 6c2.6 1 5.1.7 6.6-.4 1.5 1.1 4 1.4 6.6.4.3 5.2-2 10.2-4.6 13h-4C7.4 16.2 5.1 11.2 5.4 6Z" />
          <path {...line} d="M12 7.4v11" />
          <path {...line} d="M8.5 9c.8 3 1.6 5.2 2.3 6.8M15.5 9c-.8 3-1.6 5.2-2.3 6.8" opacity=".7" />
        </g>
      )}
      {g === 's' && (
        <g>
          <rect x="9.5" y="10" width="5" height="9.6" rx="2.5" fill="#fff" />
          <ellipse cx="15.6" cy="14.4" rx="2" ry="2.9" fill="#fff" />
          <circle cx="12" cy="8.2" r="4.1" fill="#fff" />
          <path {...line} d="M8.7 11.2q3.3 2.2 6.6 0" />
        </g>
      )}
      {g === 'k' && (
        <g fill="#fff">
          {[5.2, 9.4, 13.6].map((y) => (
            <g key={y}><rect x="7.9" y={y} width="3.5" height="3.6" rx="1.2" /><rect x="12.6" y={y} width="3.5" height="3.6" rx="1.2" /></g>
          ))}
          <rect x="9.4" y="17.8" width="5.2" height="1.8" rx=".9" opacity=".75" />
        </g>
      )}
    </svg>
  );
}

function Ring({ pct, size = 54, stroke = 5, color = '#fff', track = 'rgba(255,255,255,.28)', children }) {
  const r = (size - stroke) / 2; const C = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, pct))} style={{ transition: 'stroke-dashoffset .35s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{children}</div>
    </div>
  );
}

function SegBar({ type, mins, units }) {
  const pal = palette(type);
  if (!mins) return null;
  return (
    <div className="gp-segbar" aria-label="Session sections by minutes">
      {SEC_ORDER.map((k, i) => {
        const b = units.bySec[k]; const pct = b && b.t ? b.d / b.t : 0;
        return (
          <div key={k} className="gp-seg" style={{ flex: mins[k], background: pal.segs[i], color: pal.segInk[i] }} title={`${SEC[k].label} · ${mins[k]} min`}>
            <span>{mins[k]}</span>
            <i style={{ width: `${pct * 100}%`, background: pal.segInk[i] }} />
          </div>
        );
      })}
    </div>
  );
}

function SecHead({ sec, min, type }) {
  const s = SEC[sec];
  return (
    <div className="gp-sec">
      <span className={`gp-secn ${sec === 'heavy' ? 'strong' : ''}`}>{s.n || '+'}</span>
      <span>{s.label}</span>
      {min ? <span className="gp-secm">{min} min</span> : null}
    </div>
  );
}

/* ================= LONG-PRESS REORDER ================= */
function useReorder(ids, onOrder, enabled, suppress) {
  const refs = useRef({});
  const st = useRef(null);
  const idsRef = useRef(ids); idsRef.current = ids;
  const onOrderRef = useRef(onOrder); onOrderRef.current = onOrder;
  const enabledRef = useRef(enabled); enabledRef.current = enabled;
  const [dragId, setDragId] = useState(null);

  const apply = useCallback(() => {
    const s = st.current; if (!s || !s.active) return;
    const el = refs.current[s.id]; if (!el) return;
    const rect = el.getBoundingClientRect();
    const natural = rect.top - s.dy;
    const desired = s.cy - s.grab;
    const dy = desired - natural;
    el.style.transform = `translateY(${dy}px) scale(1.015)`;
    s.dy = dy;
    const ord = idsRef.current; const idx = ord.indexOf(s.id);
    const center = desired + rect.height / 2;
    let to = idx;
    if (idx < ord.length - 1) { const nx = refs.current[ord[idx + 1]]; if (nx) { const r = nx.getBoundingClientRect(); if (center > r.top + r.height / 2) to = idx + 1; } }
    if (to === idx && idx > 0) { const pv = refs.current[ord[idx - 1]]; if (pv) { const r = pv.getBoundingClientRect(); if (center < r.top + r.height / 2) to = idx - 1; } }
    if (to !== idx) { const n = [...ord]; n.splice(idx, 1); n.splice(to, 0, s.id); idsRef.current = n; onOrderRef.current(n); }
  }, []);

  const cancel = () => { const s = st.current; if (s) { clearTimeout(s.timer); cancelAnimationFrame(s.raf); } st.current = null; };
  const finish = () => {
    const s = st.current; if (!s) return;
    if (s.active) {
      const el = refs.current[s.id]; if (el) { el.style.transform = ''; }
      document.body.classList.remove('gp-dragging');
      setDragId(null);
      suppress.current = Date.now();
    }
    cancel();
  };
  const activate = (s) => {
    const el = refs.current[s.id]; if (!el) { cancel(); return; }
    const r = el.getBoundingClientRect();
    s.active = true; s.grab = s.cy - r.top; s.dy = 0;
    document.body.classList.add('gp-dragging');
    setDragId(s.id);
    try { navigator.vibrate && navigator.vibrate(18); } catch (e) { /* ignore */ }
    const loop = () => {
      if (!st.current || !st.current.active) return;
      const vh = window.innerHeight;
      if (s.cy < 90) window.scrollBy(0, -14); else if (s.cy > vh - 90) window.scrollBy(0, 14);
      apply();
      s.raf = requestAnimationFrame(loop);
    };
    s.raf = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const move = (e) => {
      const s = st.current; if (!s || e.pointerId !== s.pid) return;
      s.cx = e.clientX; s.cy = e.clientY;
      if (!s.active) { if (Math.hypot(e.clientX - s.x0, e.clientY - s.y0) > 10) cancel(); return; }
      apply();
    };
    const up = (e) => { const s = st.current; if (!s || e.pointerId !== s.pid) return; finish(); };
    const tm = (e) => { if (st.current && st.current.active && e.cancelable) e.preventDefault(); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('touchmove', tm, { passive: false });
    return () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up); window.removeEventListener('touchmove', tm);
      document.body.classList.remove('gp-dragging');
    };
    // eslint-disable-next-line
  }, []);

  useLayoutEffect(() => { if (st.current && st.current.active) apply(); }, [ids.join('|')]);

  const bind = (id) => ({
    ref: (el) => { if (el) refs.current[id] = el; else delete refs.current[id]; },
    onContextMenu: (e) => { if (st.current) e.preventDefault(); },
    onPointerDown: (e) => {
      if (!enabledRef.current) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('input,button,select,textarea,a,[data-nodrag]')) return;
      cancel();
      const s = { id, pid: e.pointerId, x0: e.clientX, y0: e.clientY, cx: e.clientX, cy: e.clientY, active: false, dy: 0, grab: 0 };
      s.timer = setTimeout(() => activate(s), 420);
      st.current = s;
    },
  });
  return { bind, dragId };
}

/* ================= PANELS ================= */
function Panel({ item, entry, stat, bind, lifted, onField, onCheck, onSimple, onSwap, onDelete, onCopy, onAddSet, onRemoveSet }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return undefined; const t = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(t); }, [armed]);
  const cls = `gp-panel ${lifted ? 'gp-lifted' : ''} ${item.ss ? `ss-${item.ss.pos}` : ''}`;

  if (item.simple) {
    const done = !!(entry && entry.done);
    return (
      <div className={`${cls} gp-simple ${done ? 'is-done' : ''}`} style={pastelVars()} {...bind}>
        <span className="gp-sdot" />
        <div className="gp-sbody"><div className="gp-name">{item.name}</div><div className="gp-spec">{item.spec}</div></div>
        <button className={`gp-check ${done ? 'on' : ''}`} onClick={onSimple} aria-label={done ? `Mark ${item.name} not done` : `Mark ${item.name} done`}><Check size={18} strokeWidth={3} /></button>
      </div>
    );
  }

  const e = entry || blankEntry(item);
  const lastSets = stat.last ? stat.last.sets : [];
  const phFor = (j) => {
    const ls = lastSets[j] || lastSets[lastSets.length - 1];
    const topR = topReps(item.rx);
    const prev = j > 0 ? e.sets[j - 1] : null;
    const w = ls && num(ls.w) > 0 ? String(ls.w) : prev && num(prev.w) > 0 ? String(prev.w) : '';
    return { w, r: ls && ls.r ? String(ls.r) : topR ? String(topR) : '' };
  };
  const done = e.sets.filter((s) => s.d).length;
  const gcolor = GROUP_TEXT[item.g] || '#5a6472';
  const sub = item.rx.unit === 's' ? 'sec' : item.rx.unit === 'contacts' ? 'contacts' : 'reps';

  return (
    <div className={`${cls} ${done === e.sets.length && done > 0 ? 'is-done' : ''}`} style={pastelVars(item.g)} {...bind}>
      {item.ss && <span className="gp-sslink" aria-hidden="true"><Link2 size={11} /></span>}
      <div className="gp-phead">
        <GripVertical size={16} className="gp-grip" aria-hidden="true" />
        {GROUPS[item.g] ? <GIcon g={item.g} size={30} /> : <span className="gp-sdot" />}
        <div className="gp-ptitle">
          <div className="gp-name">{item.name}</div>
          <div className="gp-rxline">
            <span className="gp-rx" style={{ color: gcolor }}>{rxLabel(item.rx)}</span>
            {item.ss && <span className="gp-chip ss">Superset {item.ss.n}{item.ss.pos}</span>}
            {stat.pr ? <span className="gp-chip pr"><Trophy size={11} /> PR +{stat.pr}</span> : null}
            {item.swapped && <span className="gp-chip">Swapped</span>}
          </div>
        </div>
        <div className="gp-pbtns">
          <button className="gp-icon sm" onClick={onSwap} aria-label={`Swap ${item.name}`}><ArrowLeftRight size={16} /></button>
          {item.custom && (
            <button className={`gp-icon sm ${armed ? 'danger' : ''}`} onClick={() => (armed ? onDelete() : setArmed(true))} aria-label={armed ? 'Confirm remove exercise' : 'Remove exercise'}>
              {armed ? <span className="gp-sure">Remove?</span> : <Trash2 size={16} />}
            </button>
          )}
        </div>
      </div>

      {stat.last && (
        <div className="gp-last">
          <span>Last time · Wk {stat.last.w}{stat.last.deload ? ' (deload)' : ''}:&nbsp;<b>{stat.last.sets.map((s) => fmtSet(s, item.rx.unit)).join('  ')}</b></span>
          <button className="gp-linkbtn" onClick={() => onCopy(stat.last)}>Copy</button>
        </div>
      )}
      {stat.nudge && (
        <div className="gp-nudge">
          <b>Time to add load.</b> You hit {stat.nudge.top} on every set in Wk {stat.nudge.wk}. Try about {stat.nudge.next} lb.
        </div>
      )}

      <div className="gp-sets">
        <div className="gp-sethead"><span>Set</span><span>lb</span><span>{sub}</span><span /></div>
        {e.sets.map((s, j) => {
          const ph = phFor(j);
          return (
            <div className={`gp-setrow ${s.d ? 'done' : ''}`} key={j}>
              <span className="gp-setn">{j + 1}</span>
              <input inputMode="decimal" aria-label={`Set ${j + 1} weight`} value={s.w} placeholder={ph.w || '—'} onChange={(ev) => onField(j, 'w', ev.target.value.replace(/[^0-9.]/g, ''))} />
              <input inputMode="numeric" aria-label={`Set ${j + 1} ${sub}`} value={s.r} placeholder={ph.r || '—'} onChange={(ev) => onField(j, 'r', ev.target.value.replace(/[^0-9.]/g, ''))} />
              <button className={`gp-check ${s.d ? 'on' : ''}`} onClick={() => onCheck(j, ph)} aria-label={s.d ? `Undo set ${j + 1}` : `Complete set ${j + 1}`}><Check size={18} strokeWidth={3} /></button>
            </div>
          );
        })}
      </div>
      <div className="gp-pfoot">
        <span className="gp-prog">{done}/{e.sets.length} sets</span>
        <span className="gp-fbtns">
          <button className="gp-linkbtn" onClick={onRemoveSet} disabled={e.sets.length <= 1}>− Set</button>
          <button className="gp-linkbtn" onClick={onAddSet}>+ Set</button>
        </span>
      </div>
    </div>
  );
}

function CRow({ item, entry, bind, lifted }) {
  let frac = '', ok = false;
  if (item.simple) { ok = !!(entry && entry.done); }
  else { const n = entry && entry.sets ? entry.sets.length : item.rx.sets; const d = entry && entry.sets ? entry.sets.filter((s) => s.d).length : 0; frac = `${d}/${n}`; ok = d === n && n > 0; }
  return (
    <div className={`gp-crow ${lifted ? 'gp-lifted' : ''} ${ok ? 'is-done' : ''} ${item.ss ? `ss-${item.ss.pos}` : ''}`} style={pastelVars(item.g)} {...bind}>
      {GROUPS[item.g] ? <GIcon g={item.g} size={24} /> : <span className="gp-sdot" />}
      <div className="gp-cname">
        <span className="gp-name">{item.name}</span>
        <span className="gp-cspec" style={{ color: item.simple ? undefined : GROUP_TEXT[item.g] }}>{item.simple ? item.spec : rxLabel(item.rx)}</span>
      </div>
      {item.ss && <span className="gp-chip ss">{item.ss.n}{item.ss.pos}</span>}
      {ok ? <span className="gp-cdone"><Check size={14} strokeWidth={3.5} /></span> : <span className="gp-frac">{frac}</span>}
    </div>
  );
}

/* ================= SHEETS ================= */
function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="gp-overlay" data-nodbl onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gp-sheet" role="dialog" aria-label={title}>
        <div className="gp-sheet-h"><h2>{title}</h2><button className="gp-icon" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
        <div className="gp-sheet-b">{children}</div>
      </div>
    </div>
  );
}

function AddSheet({ label, onAdd, onClose }) {
  const [name, setName] = useState('');
  const [g, setG] = useState('g');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('10');
  const ok = name.trim().length > 0;
  return (
    <Sheet title="Add an exercise" onClose={onClose}>
      <p className="gp-help">Goes to the end of {label}. You can drag it anywhere.</p>
      <label className="gp-lbl" htmlFor="gp-addname">Exercise name</label>
      <input id="gp-addname" className="gp-text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cable Kickback" autoFocus />
      <div className="gp-lbl">Main muscle group</div>
      <div className="gp-chips">
        {GROUP_ORDER.map((k) => (
          <button key={k} className={`gp-gchip ${g === k ? 'on' : ''}`} onClick={() => setG(k)} aria-pressed={g === k}><GIcon g={k} size={20} /><span>{GROUPS[k].label}</span></button>
        ))}
      </div>
      <div className="gp-row2">
        <div>
          <div className="gp-lbl">Sets</div>
          <div className="gp-stepper">
            <button className="gp-icon" onClick={() => setSets(Math.max(1, sets - 1))} aria-label="Fewer sets"><Minus size={16} /></button>
            <b>{sets}</b>
            <button className="gp-icon" onClick={() => setSets(Math.min(10, sets + 1))} aria-label="More sets"><Plus size={16} /></button>
          </div>
        </div>
        <div>
          <label className="gp-lbl" htmlFor="gp-addreps">Target reps</label>
          <input id="gp-addreps" className="gp-text" value={reps} onChange={(e) => setReps(e.target.value)} />
        </div>
      </div>
      <button className="gp-btn primary full" disabled={!ok} onClick={() => onAdd({ name: name.trim(), g, sets, reps: reps.trim() || '10' })}><Plus size={18} /> Add to {label}</button>
    </Sheet>
  );
}

function SwapSheet({ item, onPick, onRestore, onClose }) {
  const [custom, setCustom] = useState('');
  const so = swapOptions(item);
  return (
    <Sheet title="Swap exercise" onClose={onClose}>
      <p className="gp-help">Replacing <b>{item.orig || item.name}</b>. The sets and reps stay the same.</p>
      {so.opts.length > 0 && (
        <>
          <div className="gp-lbl">From your plan{so.note ? ` · ${so.note}` : ''}</div>
          <div className="gp-list">
            {so.opts.map((o) => <button key={o} className="gp-opt" onClick={() => onPick(o)}>{o}<ChevronRight size={16} /></button>)}
          </div>
        </>
      )}
      <label className="gp-lbl" htmlFor="gp-swapname">{so.opts.length ? 'Or something else' : 'Swap for'}</label>
      <div className="gp-inline">
        <input id="gp-swapname" className="gp-text" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Exercise name" />
        <button className="gp-btn primary" disabled={!custom.trim()} onClick={() => onPick(custom.trim())}>Swap</button>
      </div>
      {item.swapped && <button className="gp-btn ghost full" onClick={onRestore}><RotateCcw size={16} /> Restore {item.orig}</button>}
    </Sheet>
  );
}

function WeekPicker({ week, data, loc, onPick, onClose }) {
  return (
    <Sheet title="Choose a week" onClose={onClose}>
      <div className="gp-list">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
          const done = [0, 1, 2, 3, 4].filter((d) => data.days[`${w}-${d}`] && data.days[`${w}-${d}`].done).length;
          const b = blockOf(w);
          return (
            <button key={w} className={`gp-opt wk ${w === week ? 'on' : ''}`} onClick={() => onPick(w)}>
              <span className="gp-wkn">{w}</span>
              <span className="gp-wkt"><b>Week {w}{loc && loc.status === 'active' && loc.week === w ? ' · This week' : ''}</b><small>Block {b.n} {b.name} · {FOCUS[w - 1]}</small></span>
              <span className="gp-wkd">{done}/5</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

function SettingsSheet({ settings, onStart, onToday, onClear, onClose }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return undefined; const t = setTimeout(() => setArmed(false), 3500); return () => clearTimeout(t); }, [armed]);
  const mon = mondayOf(settings.start);
  return (
    <Sheet title="Settings" onClose={onClose}>
      <label className="gp-lbl" htmlFor="gp-start">Program start date</label>
      <input id="gp-start" className="gp-text" type="date" value={settings.start} onChange={(e) => e.target.value && onStart(e.target.value)} />
      <p className="gp-help">Week 1 begins Monday, {fmtShort(mon)}, {mon.getFullYear()}. The app opens on today's workout from this date.</p>
      <button className="gp-btn ghost full" onClick={onToday}><CalendarDays size={16} /> Start this week as Week 1</button>
      <div className="gp-lbl" style={{ marginTop: 22 }}>Your data</div>
      <p className="gp-help">Logs, custom exercises, swaps, and order are saved on this device.</p>
      <button className={`gp-btn full ${armed ? 'danger' : 'ghost'}`} onClick={() => (armed ? onClear() : setArmed(true))}>{armed ? 'Tap again to erase every log' : 'Erase all logged data'}</button>
    </Sheet>
  );
}

function ExportSheet({ data, week, onClose }) {
  const [showLog, setShowLog] = useState(true);
  const [showTrends, setShowTrends] = useState(true);
  const [wk, setWk] = useState(week);
  const [lifts, setLifts] = useState(LIFTS.map((l) => l.id));
  const [note, setNote] = useState('');
  const ops = useMemo(() => buildReport({ days: data.days, week: wk, showLog, showTrends, lifts }), [data.days, wk, showLog, showTrends, lifts]);
  const svg = useMemo(() => opsToSvg(ops, 792, 612), [ops]);
  const none = !showLog && !showTrends;
  const blob = () => new Blob([opsToPdf(ops, 792, 612)], { type: 'application/pdf' });
  const name = `glute-plan-${showLog ? `week-${wk}` : 'trends'}${showLog && showTrends ? '-trends' : ''}.pdf`;
  const download = () => {
    try {
      const url = URL.createObjectURL(blob());
      const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setNote('PDF created. If nothing downloaded, your browser may be blocking it here. Try "Open in new tab".');
    } catch (e) { setNote('Could not create the file. Try "Open in new tab".'); }
  };
  const open = () => { try { const url = URL.createObjectURL(blob()); window.open(url, '_blank'); } catch (e) { setNote('This browser blocked the new tab.'); } };
  const toggleLift = (id) => setLifts(lifts.includes(id) ? lifts.filter((x) => x !== id) : [...lifts, id]);
  return (
    <Sheet title="Export one-page PDF" onClose={onClose}>
      <div className="gp-lbl">Include</div>
      <div className="gp-chips">
        <button className={`gp-tog ${showLog ? 'on' : ''}`} onClick={() => setShowLog(!showLog)} aria-pressed={showLog}><LayoutList size={16} /> Weekly exercise log</button>
        <button className={`gp-tog ${showTrends ? 'on' : ''}`} onClick={() => setShowTrends(!showTrends)} aria-pressed={showTrends}><TrendingUp size={16} /> Trends over time</button>
      </div>
      {showLog && (
        <>
          <label className="gp-lbl" htmlFor="gp-expwk">Week for the log</label>
          <select id="gp-expwk" className="gp-text" value={wk} onChange={(e) => setWk(+e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => <option key={w} value={w}>Week {w} · {blockOf(w).name}{isDeload(w) ? ' (deload)' : ''}</option>)}
          </select>
        </>
      )}
      {showTrends && (
        <>
          <div className="gp-lbl">Lifts to chart</div>
          <div className="gp-chips">
            {LIFTS.map((l) => (
              <button key={l.id} className={`gp-gchip ${lifts.includes(l.id) ? 'on' : ''}`} onClick={() => toggleLift(l.id)} aria-pressed={lifts.includes(l.id)}><GIcon g={l.g} size={18} /><span>{l.title.replace(' (back / front / hack)', '')}</span></button>
            ))}
          </div>
        </>
      )}
      <div className="gp-lbl">Preview</div>
      <div className="gp-preview" dangerouslySetInnerHTML={{ __html: none ? '' : svg }} />
      {none && <p className="gp-help">Pick at least one section to export.</p>}
      <div className="gp-inline" style={{ marginTop: 12 }}>
        <button className="gp-btn primary grow" disabled={none} onClick={download}><FileDown size={18} /> Download PDF</button>
        <button className="gp-btn ghost" disabled={none} onClick={open}><ExternalLink size={16} /> Open in new tab</button>
      </div>
      {note && <p className="gp-help" role="status">{note}</p>}
    </Sheet>
  );
}

function RestTimer({ timer, setTimer }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, []);
  const left = Math.max(0, Math.ceil((timer.end - now) / 1000));
  useEffect(() => {
    if (left === 0) {
      beep();
      const id = setTimeout(() => setTimer(null), 3500);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [left === 0, timer.end]);
  const adj = (s) => setTimer((t) => (t ? { ...t, end: t.end + s * 1000, total: Math.max(5, t.total + Math.max(0, s)) } : t));
  const pct = Math.max(0, Math.min(1, left / timer.total));
  const mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, '0');
  return (
    <div className="gp-timer" data-nodbl role="timer" aria-live="off">
      <div className="gp-tmain">
        <Timer size={18} />
        <div className="gp-tclock">{left === 0 ? 'Go' : `${mm}:${ss}`}</div>
        <div className="gp-tname">{left === 0 ? 'Rest is over' : `Rest · ${timer.name}`}</div>
        <button className="gp-tbtn" onClick={() => adj(-15)} aria-label="15 seconds less">−15</button>
        <button className="gp-tbtn" onClick={() => adj(15)} aria-label="15 seconds more">+15</button>
        <button className="gp-tbtn" onClick={() => setTimer(null)} aria-label="Skip rest"><SkipForward size={14} /></button>
      </div>
      <div className="gp-tbar"><i style={{ width: `${pct * 100}%` }} /></div>
    </div>
  );
}

/* ================= WEEK VIEW ================= */
function WeekView({ week, data, loc, setWeek, onOpen }) {
  const b = blockOf(week);
  const wkDone = [0, 1, 2, 3, 4].filter((d) => data.days[`${week}-${d}`] && data.days[`${week}-${d}`].done).length;
  const dotColor = (w) => (w <= 4 ? THEME.tan : w <= 8 ? '#b7bfc9' : '#b9aedb');
  return (
    <div className="gp-weekview">
      <div className="gp-whead">
        <div>
          <div className="gp-wtitle">Week {week}</div>
          <div className="gp-wsub">{weekHeadline(week)}</div>
        </div>
        <span className="gp-blocks"><span className="gp-block">Block {b.n} · {b.name}{isDeload(week) ? ' · Deload' : ''}</span><span className="gp-block alt">{wkDone}/5 days done</span></span>
      </div>
      <div className="gp-dots" role="tablist" aria-label="Weeks">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
          <button key={w} role="tab" aria-selected={w === week} aria-label={`Week ${w}`} className={`gp-dot ${w === week ? 'on' : ''}`} onClick={() => setWeek(w)}>
            <i style={{ background: dotColor(w) }} />
            <span>{w}</span>
          </button>
        ))}
      </div>
      <div className="gp-cols">
        {[0, 1, 2, 3, 4].map((d) => {
          const dd = data.days[`${week}-${d}`] || {};
          const plan = withSupersets(resolvePlan(week, d, dd));
          const pal = palette(DAYS[d].type);
          const mins = minutesFor(week, d);
          const units = dayUnits(plan, dd);
          const moves = plan.filter((i) => !i.simple).length;
          const isToday = loc && loc.status === 'active' && loc.week === week && loc.day === d;
          let prev = null;
          return (
            <section key={d} className={`gp-col ${isToday ? 'today' : ''}`} style={{ '--acc': pal.acc, '--acc2': pal.acc2, '--tint': pal.tint, '--mid': pal.mid, ...icy(DAYS[d].type) }}>
              <button className="gp-colhead" onClick={() => onOpen(d)} aria-label={`Open ${DAYS[d].full}, ${DAYS[d].title}`}>
                <span className="gp-colday">{DAYS[d].abbr}{isToday ? ' · Today' : ''}</span>
                <span className="gp-coltitle"><b>{DAYS[d].title}</b><em>{moves} moves</em></span>
                <span className="gp-colfocus">{DAYS[d].focus}</span>
                {dd.done && <span className="gp-colbadge"><Check size={12} strokeWidth={3.5} /> Done</span>}
                {dd.skipped && <span className="gp-colbadge">Skipped</span>}
              </button>
              <SegBar type={DAYS[d].type} mins={mins} units={units} />
              <div className="gp-colbody">
                {plan.map((it) => {
                  const head = it.sec !== prev ? <div className="gp-wsec" key={`h-${it.id}`}><span className={`gp-secn ${it.sec === 'heavy' ? 'strong' : ''}`}>{SEC[it.sec].n || '+'}</span>{SEC[it.sec].label}{mins && mins[it.sec] ? <em>{mins[it.sec]}'</em> : null}</div> : null;
                  prev = it.sec;
                  const e = dd.log && dd.log[it.id];
                  const ok = it.simple ? !!(e && e.done) : !!(e && e.sets && e.sets.length && e.sets.every((s) => s.d));
                  return (
                    <React.Fragment key={it.id}>
                      {head}
                      <div className={`gp-witem ${it.ss ? `ss-${it.ss.pos}` : ''} ${ok ? 'is-done' : ''}`}>
                        {GROUPS[it.g] ? <GIcon g={it.g} size={18} /> : <span className="gp-sdot sm" />}
                        <div>
                          <div className="gp-wname">{it.name}</div>
                          <div className="gp-wrx" style={{ color: it.simple ? undefined : GROUP_TEXT[it.g] }}>{it.simple ? it.spec : rxLabel(it.rx)}</div>
                        </div>
                        {ok && <Check size={14} strokeWidth={3.5} className="gp-wok" />}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <p className="gp-restnote">Sat and Sun are rest days with an easy walk.</p>
      <div className="gp-legend">
        <span><i style={{ background: THEME.lower }} />Lower</span>
        <span><i style={{ background: THEME.upper }} />Upper</span>
        {GROUP_ORDER.map((g) => <span key={g}><GIcon g={g} size={14} />{GROUPS[g].label}</span>)}
      </div>
    </div>
  );
}

/* ================= ROOT ================= */
const EMPTY = {};
export default function GlutePlan() {
  const [data, setData] = useState(null);
  const dataRef = useRef(null); dataRef.current = data;
  const [week, setWeek] = useState(1);
  const [day, setDay] = useState(0);
  const [view, setView] = useState('day');
  const [sheet, setSheet] = useState(null);
  const [timer, setTimer] = useState(null);
  const [toast, setToast] = useState(null);
  const suppress = useRef(0);
  const lastTap = useRef({ t: 0, x: 0, y: 0 });
  const downPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let alive = true;
    (async () => {
      let d = await loadData();
      if (!d || !d.settings) d = { v: 1, settings: { start: toISO(mondayOf(toISO(new Date()))), condensed: false }, days: {} };
      if (!alive) return;
      setData(d);
      const loc = locate(d.settings.start);
      setWeek(loc.week); setDay(loc.day);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!data) return undefined;
    const t = setTimeout(() => saveData(data), 350);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t); }, [toast]);

  const settings = data ? data.settings : { start: toISO(new Date()), condensed: false };
  const loc = useMemo(() => (data ? locate(data.settings.start) : null), [data && data.settings.start]);
  const dd = (data && data.days[`${week}-${day}`]) || EMPTY;
  const plan = useMemo(() => withSupersets(resolvePlan(week, day, dd)), [week, day, dd]);
  const hist = useMemo(() => (data ? buildHistory(data.days) : {}), [data && data.days]);
  const condensed = !!settings.condensed;

  const upd = useCallback((w, d, fn) => setData((p) => { const k = `${w}-${d}`; const cur = p.days[k] || {}; return { ...p, days: { ...p.days, [k]: fn(cur) } }; }), []);
  const setOrder = useCallback((n) => upd(week, day, (cur) => ({ ...cur, order: n })), [week, day, upd]);
  const rb = useReorder(plan.map((i) => i.id), setOrder, view === 'day' && !sheet, suppress);

  const updEntry = (item, fn) => upd(week, day, (cur) => {
    const log = { ...(cur.log || {}) };
    const e = log[item.id] ? { ...log[item.id], sets: log[item.id].sets.map((s) => ({ ...s })) } : blankEntry(item);
    log[item.id] = fn(e) || e;
    return { ...cur, log };
  });
  const curEntry = (item) => { const k = `${week}-${day}`; const dday = dataRef.current && dataRef.current.days[k]; return dday && dday.log ? dday.log[item.id] : undefined; };

  const onField = (item, j, f, v) => updEntry(item, (e) => { e.sets[j][f] = v; e.top = topReps(item.rx); e.n = item.rx.sets; return e; });
  const onCheck = (item, j, ph) => {
    const was = curEntry(item) && curEntry(item).sets[j] && curEntry(item).sets[j].d;
    updEntry(item, (e) => {
      const s = e.sets[j];
      if (s.d) s.d = false; else { if (s.w === '') s.w = ph.w; if (s.r === '') s.r = ph.r; s.d = true; }
      e.top = topReps(item.rx); e.n = item.rx.sets;
      return e;
    });
    if (!was) {
      if (item.ss && item.ss.pos === 'a') {
        const partner = plan.find((p) => p.ss && p.ss.n === item.ss.n && p.ss.pos === 'b');
        if (partner) setToast(`Superset: no rest, go to ${partner.name}`);
      } else {
        const sec = REST_SECONDS[item.sec] || 75;
        setTimer({ end: Date.now() + sec * 1000, total: sec, name: item.name });
      }
    }
  };
  const onSimple = (item) => updEntry(item, (e) => ({ ...e, done: !e.done }));
  const onAddSet = (item) => updEntry(item, (e) => { e.sets.push({ w: '', r: '', d: false }); return e; });
  const onRemoveSet = (item) => updEntry(item, (e) => { if (e.sets.length > 1) e.sets.pop(); return e; });
  const onCopy = (item, last) => updEntry(item, (e) => { e.sets = e.sets.map((s, j) => { const ls = last.sets[j] || last.sets[last.sets.length - 1]; return { w: ls.w || '', r: ls.r || '', d: false }; }); return e; });
  const onSwapPick = (item, name) => { upd(week, day, (cur) => ({ ...cur, swaps: { ...(cur.swaps || {}), [item.id]: name } })); setSheet(null); };
  const onSwapRestore = (item) => { upd(week, day, (cur) => { const sw = { ...(cur.swaps || {}) }; delete sw[item.id]; return { ...cur, swaps: sw }; }); setSheet(null); };
  const onDelete = (item) => upd(week, day, (cur) => { const log = { ...(cur.log || {}) }; delete log[item.id]; return { ...cur, extra: (cur.extra || []).filter((x) => x.id !== item.id), order: (cur.order || []).filter((x) => x !== item.id), log }; });
  const onAdd = (x) => {
    const id = 'x' + Date.now().toString(36);
    upd(week, day, (cur) => ({ ...cur, extra: [...(cur.extra || []), { id, ...x }], order: [...(cur.order && cur.order.length ? cur.order : plan.map((p) => p.id)), id] }));
    setSheet(null);
  };
  const setDone = (v) => upd(week, day, (cur) => ({ ...cur, done: v === 'done', skipped: v === 'skip', doneAt: v ? Date.now() : null }));
  const setSetting = (patch) => setData((p) => ({ ...p, settings: { ...p.settings, ...patch } }));
  const toggleCondensed = () => setData((p) => ({ ...p, settings: { ...p.settings, condensed: !p.settings.condensed } }));

  /* double-tap anywhere (day view) toggles condensed */
  const onRootDown = (e) => { downPos.current = { x: e.clientX, y: e.clientY }; };
  const onRootUp = (e) => {
    if (view !== 'day' || sheet) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest && e.target.closest('input,button,select,textarea,a,[data-nodbl]')) return;
    if (Date.now() - suppress.current < 450) return;
    if (Math.hypot(e.clientX - downPos.current.x, e.clientY - downPos.current.y) > 12) return;
    const now = Date.now(); const L = lastTap.current;
    if (now - L.t < 320 && Math.hypot(e.clientX - L.x, e.clientY - L.y) < 40) { toggleCondensed(); lastTap.current = { t: 0, x: 0, y: 0 }; }
    else lastTap.current = { t: now, x: e.clientX, y: e.clientY };
  };

  if (!data) return <div className="gp"><style>{CSS}</style><div className="gp-loading">Loading your plan…</div></div>;

  const type = DAYS[day].type;
  const pal = palette(type);
  const mins = minutesFor(week, day);
  const units = dayUnits(plan, dd);
  const pct = units.total ? units.done / units.total : 0;
  const bl = blockOf(week);
  const dayLabel = `${DAYS[day].abbr}, ${DAYS[day].title}`;
  const weekDone = [0, 1, 2, 3, 4].filter((d) => data.days[`${week}-${d}`] && data.days[`${week}-${d}`].done).length;
  const isToday = loc && loc.status === 'active' && loc.week === week && loc.day === day;
  const atToday = loc && loc.week === week && loc.day === day;

  let streak = 0;
  { const seq = []; for (let w = 1; w <= 12; w++) for (let d = 0; d < 5; d++) seq.push(data.days[`${w}-${d}`] || {});
    let last = -1; seq.forEach((s, i) => { if (s.done) last = i; });
    for (let i = last; i >= 0 && seq[i].done; i--) streak++; }

  const goToday = () => { if (loc) { setWeek(loc.week); setDay(loc.day); } };

  const list = [];
  let prevSec = null;
  plan.forEach((it) => {
    if (it.sec !== prevSec) { list.push(<SecHead key={`h-${it.id}`} sec={it.sec} min={mins && it.sec !== 'x' ? mins[it.sec] : null} type={type} />); prevSec = it.sec; }
    const entry = dd.log ? dd.log[it.id] : undefined;
    const bind = rb.bind(it.id);
    const lifted = rb.dragId === it.id;
    if (condensed) list.push(<CRow key={it.id} item={it} entry={entry} bind={bind} lifted={lifted} />);
    else {
      const stat = itemStats(hist, it, week, day, entry);
      list.push(
        <Panel key={it.id} item={it} entry={entry} stat={stat} bind={bind} lifted={lifted}
          onField={(j, f, v) => onField(it, j, f, v)} onCheck={(j, ph) => onCheck(it, j, ph)} onSimple={() => onSimple(it)}
          onSwap={() => setSheet({ type: 'swap', item: it })} onDelete={() => onDelete(it)} onCopy={(last) => onCopy(it, last)}
          onAddSet={() => onAddSet(it)} onRemoveSet={() => onRemoveSet(it)} />
      );
    }
  });

  return (
    <div className="gp" onPointerDown={onRootDown} onPointerUp={onRootUp}>
      <style>{CSS}</style>

      <header className="gp-bar" data-nodbl>
        <div className="gp-seg2" role="tablist" aria-label="View">
          <button role="tab" aria-selected={view === 'day'} className={view === 'day' ? 'on' : ''} onClick={() => setView('day')}>Day</button>
          <button role="tab" aria-selected={view === 'week'} className={view === 'week' ? 'on' : ''} onClick={() => setView('week')}>Week</button>
        </div>
        <div className="gp-barr">
          {streak > 0 && <span className="gp-streak" title="Completed sessions in a row"><Flame size={15} />{streak}</span>}
          {view === 'day' && <button className="gp-icon" onClick={toggleCondensed} aria-label={condensed ? 'Show full panels' : 'Show names only'} title="Double-tap anywhere also does this">{condensed ? <Layers size={19} /> : <LayoutList size={19} />}</button>}
          <button className="gp-icon" onClick={() => setSheet({ type: 'export' })} aria-label="Export PDF"><Download size={19} /></button>
          <button className="gp-icon" onClick={() => setSheet({ type: 'settings' })} aria-label="Settings"><Settings size={19} /></button>
        </div>
      </header>

      {view === 'day' && <div className="gp-stepper-row" data-nodbl>
        <button className="gp-icon" onClick={() => setWeek(Math.max(1, week - 1))} disabled={week <= 1} aria-label="Previous week"><ChevronLeft size={20} /></button>
        <button className="gp-weekbtn" onClick={() => setSheet({ type: 'weeks' })}>
          <b>Week {week}</b><span>Block {bl.n} · {bl.name}{isDeload(week) ? ' · Deload' : ''}</span>
        </button>
        <Ring pct={weekDone / 5} size={34} stroke={4} color={THEME.tan} track="rgba(255,255,255,.16)"><span className="gp-ringtxt">{weekDone}/5</span></Ring>
        <button className="gp-icon" onClick={() => setWeek(Math.min(12, week + 1))} disabled={week >= 12} aria-label="Next week"><ChevronRight size={20} /></button>
      </div>}

      {view === 'week' ? (
        <WeekView week={week} data={data} loc={loc} setWeek={setWeek} onOpen={(d) => { setDay(d); setView('day'); window.scrollTo && window.scrollTo(0, 0); }} />
      ) : (
        <main className="gp-day" style={{ '--acc': pal.acc, '--acc2': pal.acc2, '--rail': pal.acc, '--tint': pal.tint, '--mid': pal.mid, ...icy(type) }}>
          <nav className="gp-strip" aria-label="Days" data-nodbl>
            {DAYS.map((D, d) => {
              const s = data.days[`${week}-${d}`] || {};
              const td = loc && loc.status === 'active' && loc.week === week && loc.day === d;
              return (
                <button key={d} className={`gp-pill ${d === day ? 'on' : ''} ${D.type}`} onClick={() => setDay(d)} aria-current={d === day ? 'true' : undefined} aria-label={`${D.full}${s.done ? ', complete' : s.skipped ? ', skipped' : ''}${td ? ', today' : ''}`}>
                  <span>{D.abbr}</span>
                  <i className={s.done ? 'done' : s.skipped ? 'skip' : td ? 'today' : ''}>{s.done ? <Check size={10} strokeWidth={4} /> : null}</i>
                </button>
              );
            })}
          </nav>

          <section className="gp-hero">
            <div className="gp-hero-top">
              <div>
                <h1>{type === 'rest' ? `${DAYS[day].abbr}, Rest day` : dayLabel}</h1>
                <p>{DAYS[day].focus} · {fmtShort(dateFor(settings.start, week, day))}{isToday ? ' · Today' : ''}</p>
              </div>
              {type !== 'rest' && (
                <Ring pct={dd.done ? 1 : pct} size={58} stroke={5}>
                  {dd.done ? <Check size={24} strokeWidth={3.5} color="#fff" /> : <span className="gp-ringpct">{Math.round(pct * 100)}%</span>}
                </Ring>
              )}
            </div>
            {type !== 'rest' && <div className="gp-hero-chips"><span>{weekHeadline(week).split(' · ').slice(0, 3).join(' · ')}</span><span className="rir">RIR {RIR[week - 1]}</span></div>}
          </section>

          {type !== 'rest' && <SegBar type={type} mins={mins} units={units} />}
          {!atToday && loc && <button className="gp-todaybtn" onClick={goToday} data-nodbl><CalendarDays size={14} /> Jump to today</button>}

          <div className="gp-list-wrap">
            {type === 'rest' && plan.length === 0 && (
              <div className="gp-restcard"><b>Rest day</b><span>Easy walk, a stretch, and good sleep. Add anything extra below.</span></div>
            )}
            {list}
            <button className="gp-add" data-nodbl onClick={() => setSheet({ type: 'add' })} aria-label={`Add an exercise to ${dayLabel}`}><Plus size={24} strokeWidth={2.5} /></button>
            {condensed && <p className="gp-tip">Double-tap anywhere to open the logging panels. Press and hold a row to move it.</p>}
            {!condensed && plan.length > 0 && <p className="gp-tip">Press and hold a panel to move it. Double-tap anywhere to see names only.</p>}
          </div>

          <div className="gp-actions" data-nodbl>
            {dd.done ? (
              <button className="gp-btn ghost full" onClick={() => setDone(null)}><Check size={16} /> Day complete · Undo</button>
            ) : dd.skipped ? (
              <button className="gp-btn ghost full" onClick={() => setDone(null)}>Day skipped · Undo</button>
            ) : (
              <>
                <button className="gp-btn primary grow" onClick={() => setDone('done')}><Check size={18} strokeWidth={3} /> Mark day complete</button>
                <button className="gp-btn ghost" onClick={() => setDone('skip')}><SkipForward size={16} /> Skip day</button>
              </>
            )}
          </div>
        </main>
      )}

      {toast && <div className="gp-toast" role="status" data-nodbl>{toast}</div>}
      {timer && <RestTimer timer={timer} setTimer={setTimer} />}

      {sheet && sheet.type === 'add' && <AddSheet label={dayLabel} onAdd={onAdd} onClose={() => setSheet(null)} />}
      {sheet && sheet.type === 'swap' && <SwapSheet item={sheet.item} onPick={(n) => onSwapPick(sheet.item, n)} onRestore={() => onSwapRestore(sheet.item)} onClose={() => setSheet(null)} />}
      {sheet && sheet.type === 'weeks' && <WeekPicker week={week} data={data} loc={loc} onPick={(w) => { setWeek(w); setSheet(null); }} onClose={() => setSheet(null)} />}
      {sheet && sheet.type === 'export' && <ExportSheet data={data} week={week} onClose={() => setSheet(null)} />}
      {sheet && sheet.type === 'settings' && (
        <SettingsSheet settings={settings}
          onStart={(v) => { setSetting({ start: v }); const l = locate(v); setWeek(l.week); setDay(l.day); }}
          onToday={() => { const m = toISO(mondayOf(toISO(new Date()))); setSetting({ start: m }); setWeek(1); setDay(locate(m).day); }}
          onClear={() => { setData((p) => ({ ...p, days: {} })); setSheet(null); setTimer(null); }}
          onClose={() => setSheet(null)} />
      )}
    </div>
  );
}

/* ================= STYLES ================= */
const CSS = `
.gp{--bg:#382d48;--ink:#3a3544;--paper:#f7f0f4;--tan:#f2c9a8;--acc:#e5627f;--acc2:#f59a7c;--rail:#e5627f;--tint:#fde8ee;--mid:#f3a6bd;--ptint:#d6f5ee;--pmid:#86dac8;
  font-family:"Poppins","Avenir Next","Segoe UI",system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--paper);
  min-height:100vh;padding-bottom:150px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%}
.gp *{box-sizing:border-box}
.gp button{font-family:inherit;cursor:pointer;color:inherit}
.gp button:disabled{opacity:.4;cursor:default}
.gp :focus-visible{outline:3px solid var(--tan);outline-offset:2px}
.gp-loading{padding:80px 20px;text-align:center;opacity:.7}
body.gp-dragging{user-select:none;-webkit-user-select:none;cursor:grabbing}

.gp-bar{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;background:rgba(56,45,72,.94);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,.08)}
.gp-seg2{display:flex;background:rgba(255,255,255,.1);border-radius:999px;padding:3px}
.gp-seg2 button{border:0;background:transparent;padding:7px 18px;border-radius:999px;font-weight:600;font-size:14px;color:var(--paper);opacity:.75}
.gp-seg2 button.on{background:var(--tan);color:var(--ink);opacity:1}
.gp-barr{display:flex;align-items:center;gap:2px}
.gp-streak{display:inline-flex;align-items:center;gap:3px;font-weight:700;font-size:13px;color:var(--tan);margin-right:6px}
.gp-icon{border:0;background:transparent;width:40px;height:40px;border-radius:50%;display:inline-grid;place-items:center;color:var(--paper)}
.gp-icon:hover:not(:disabled){background:rgba(255,255,255,.1)}
.gp-icon.sm{width:32px;height:32px;color:var(--ink);opacity:.7}
.gp-icon.sm:hover{background:rgba(58,53,68,.1);opacity:1}
.gp-icon.danger{width:auto;padding:0 10px;border-radius:999px;background:#b3261e;color:#fff;opacity:1}
.gp-sure{font-size:12px;font-weight:600}

.gp-stepper-row{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 12px 4px;max-width:640px;margin:0 auto}
.gp-weekbtn{flex:1;border:0;background:rgba(255,255,255,.08);border-radius:14px;padding:7px 14px;text-align:left;display:flex;flex-direction:column;line-height:1.2}
.gp-weekbtn b{font-size:15px}
.gp-weekbtn span{font-size:12px;opacity:.7}
.gp-ringtxt{font-size:9px;font-weight:700;color:var(--tan)}

.gp-day{max-width:640px;margin:0 auto;padding:6px 12px 0}
.gp-strip{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:6px 0 12px}
.gp-pill{border:1.5px solid rgba(255,255,255,.16);background:transparent;border-radius:12px;padding:7px 0 6px;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;font-weight:600;color:var(--paper)}
.gp-pill.on.lower{background:linear-gradient(135deg,${THEME.lower},#f59a7c);border-color:transparent}
.gp-pill.on.upper{background:linear-gradient(135deg,${THEME.upper},#c46bd0);border-color:transparent}
.gp-pill.on.rest{background:#e0906f;border-color:#e0906f}
.gp-pill i{width:14px;height:14px;border-radius:50%;border:1.5px solid rgba(255,255,255,.3);display:grid;place-items:center;color:var(--bg)}
.gp-pill i.done{background:var(--tan);border-color:var(--tan)}
.gp-pill i.skip{border-style:dashed}
.gp-pill i.today{background:#fff;border-color:#fff}

.gp-hero{background:linear-gradient(125deg,var(--acc),var(--acc2));color:#fff;border-radius:22px;padding:18px 18px 16px}
.gp-hero-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.gp-hero h1{margin:0;font-size:32px;line-height:1.05;font-weight:700;letter-spacing:-.02em}
.gp-hero p{margin:6px 0 0;font-size:13.5px;opacity:.92}
.gp-ringpct{font-size:13px;font-weight:700}
.gp-hero-chips{display:flex;flex-wrap:wrap;gap:6px 8px;margin-top:14px;font-size:12px;font-weight:500}
.gp-hero-chips span{background:rgba(255,255,255,.18);border-radius:999px;padding:4px 10px}
.gp-hero-chips .rir{background:var(--tan);color:var(--ink);font-weight:700}

.gp-segbar{display:flex;gap:3px;margin:10px 0 0;height:26px}
.gp-seg{position:relative;overflow:hidden;border-radius:8px;display:grid;place-items:center;font-size:11px;font-weight:700;min-width:0}
.gp-seg:first-child{border-radius:13px 8px 8px 13px}.gp-seg:last-child{border-radius:8px 13px 13px 8px}
.gp-seg i{position:absolute;left:0;bottom:0;height:4px;opacity:.7;transition:width .3s}
.gp-todaybtn{margin:12px 0 0;border:1.5px solid rgba(255,255,255,.25);background:transparent;border-radius:999px;padding:6px 12px;font-size:12.5px;font-weight:600;display:inline-flex;align-items:center;gap:6px}

.gp-list-wrap{padding:0 0 0 12px;margin-top:4px}
.gp-sec{display:flex;align-items:center;gap:8px;margin:20px 2px 10px -4px;font-weight:600;font-size:14px}
.gp-secn{width:22px;height:22px;border-radius:50%;background:var(--mid);color:var(--ink);display:inline-grid;place-items:center;font-size:11.5px;font-weight:700;flex:none}
.gp-secn.strong{background:var(--acc);color:#fff}
.gp-secm{margin-left:auto;font-size:12px;font-weight:500;opacity:.65}

.gp-panel{position:relative;background:linear-gradient(135deg,var(--tint) 0%,#f4fcfd 140%);color:var(--ink);border:1.5px solid var(--mid);border-radius:18px;padding:12px 12px 10px;margin-bottom:10px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;transition:box-shadow .15s,background .2s}
.gp-panel input{user-select:text;-webkit-user-select:text}
.gp-panel.is-done{border-color:var(--acc)}
.gp-lifted{z-index:40;box-shadow:0 18px 36px rgba(0,0,0,.5);transition:none}
.gp-phead{display:flex;align-items:flex-start;gap:9px}
.gp-grip{margin:7px -3px 0 -5px;opacity:.3;flex:none}
.gp-ptitle{flex:1;min-width:0}
.gp-name{font-weight:600;font-size:15.5px;line-height:1.25}
.gp-rxline{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin-top:3px}
.gp-rx{font-weight:700;font-size:13px}
.gp-chip{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:rgba(58,53,68,.1);color:var(--ink)}
.gp-chip.ss{background:var(--acc);color:#fff}
.gp-chip.pr{background:#f5c542;color:#4a3500}
.gp-pbtns{display:flex;gap:2px;flex:none}
.gp-last{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:9px;font-size:12.5px;background:rgba(255,255,255,.65);border-radius:10px;padding:6px 10px}
.gp-last b{font-weight:600}
.gp-nudge{margin-top:8px;font-size:12.5px;background:#fff3cf;color:#4a3500;border-radius:10px;padding:7px 10px;border-left:4px solid #f5c542}
.gp-linkbtn{border:0;background:transparent;color:var(--acc);font-weight:700;font-size:13px;padding:6px 4px}
.gp-linkbtn:disabled{opacity:.35}
.gp-sets{margin-top:10px}
.gp-sethead,.gp-setrow{display:grid;grid-template-columns:26px 1fr 1fr 44px;gap:8px;align-items:center}
.gp-sethead{font-size:11.5px;font-weight:600;opacity:.6;text-align:center;margin-bottom:3px}
.gp-setrow{margin-bottom:7px}
.gp-setn{font-weight:700;font-size:13px;text-align:center;opacity:.7}
.gp-setrow input{width:100%;height:42px;border-radius:12px;border:1.5px solid var(--mid);background:#fff;text-align:center;font:600 17px "Poppins","Avenir Next",system-ui,sans-serif;color:var(--ink);min-width:0}
.gp-setrow input::placeholder{color:rgba(58,53,68,.34);font-weight:500}
.gp-setrow.done input{background:transparent;border-color:transparent}
.gp-check{width:42px;height:42px;border-radius:50%;border:2px solid var(--mid);background:transparent;display:grid;place-items:center;color:transparent;padding:0;justify-self:center;transition:background .15s}
.gp-check.on{background:var(--acc);border-color:var(--acc);color:#fff}
.gp-pfoot{display:flex;justify-content:space-between;align-items:center;margin-top:2px}
.gp-prog{font-size:12px;font-weight:600;opacity:.6}
.gp-fbtns{display:flex;gap:6px}

.gp-simple{display:flex;align-items:center;gap:12px;padding:10px 12px}
.gp-simple.is-done{opacity:.72}
.gp-sdot{width:10px;height:10px;border-radius:50%;background:var(--mid);flex:none;margin:0 10px 0 6px}
.gp-sdot.sm{margin:0 4px}
.gp-sbody{flex:1;min-width:0}
.gp-spec{font-size:12.5px;opacity:.7;margin-top:1px}

.gp-crow{position:relative;display:flex;align-items:center;gap:10px;background:linear-gradient(135deg,var(--tint) 0%,#f4fcfd 140%);color:var(--ink);border:1.5px solid var(--mid);border-radius:14px;padding:9px 12px;margin-bottom:7px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.gp-crow.is-done{border-color:var(--acc)}
.gp-crow .gp-name{font-size:14.5px;display:block}
.gp-cname{flex:1;min-width:0}
.gp-cspec{display:block;font-size:12px;font-weight:600;opacity:.85}
.gp-frac{font-size:12.5px;font-weight:700;opacity:.6}
.gp-cdone{width:22px;height:22px;border-radius:50%;background:var(--acc);color:#fff;display:grid;place-items:center}

/* superset rails */
.gp-panel.ss-a::before,.gp-panel.ss-b::before,.gp-crow.ss-a::before,.gp-crow.ss-b::before{content:"";position:absolute;left:-10px;width:4px;background:var(--rail);border-radius:3px}
.gp-panel.ss-a::before,.gp-crow.ss-a::before{top:18px;bottom:-12px}
.gp-panel.ss-b::before,.gp-crow.ss-b::before{top:-12px;bottom:18px}
.gp-panel.ss-a{margin-bottom:10px}
.gp-sslink{position:absolute;left:-17px;bottom:-17px;width:18px;height:18px;border-radius:50%;background:var(--bg);color:var(--rail);display:grid;place-items:center;z-index:2}

.gp-add{width:100%;height:64px;border:2.5px dashed rgba(255,255,255,.35);background:transparent;border-radius:18px;display:grid;place-items:center;color:var(--paper);margin-top:14px;margin-left:-0px}
.gp-add:hover{border-color:var(--tan);color:var(--tan)}
.gp-tip{font-size:12px;opacity:.55;text-align:center;margin:14px 0 0;padding-right:12px}
.gp-restcard{display:flex;flex-direction:column;gap:4px;background:${THEME.rest};color:var(--ink);border-radius:18px;padding:16px;margin-top:16px}
.gp-restcard span{font-size:13.5px;opacity:.8}
.gp-actions{display:flex;gap:10px;margin-top:20px}
.gp-btn{border:0;border-radius:999px;padding:13px 20px;font-weight:700;font-size:15px;display:inline-flex;align-items:center;justify-content:center;gap:8px}
.gp-btn.primary{background:var(--tan);color:var(--ink)}
.gp-btn.ghost{background:transparent;border:1.5px solid rgba(255,255,255,.3);color:var(--paper)}
.gp-btn.danger{background:#b3261e;color:#fff}
.gp-btn.full{width:100%}.gp-btn.grow{flex:1}

.gp-timer{position:fixed;left:50%;transform:translateX(-50%);bottom:14px;width:min(94vw,520px);background:#231f2b;border:1.5px solid var(--tan);border-radius:20px;padding:10px 12px 8px;z-index:50;box-shadow:0 10px 30px rgba(0,0,0,.5);color:var(--paper)}
.gp-tmain{display:flex;align-items:center;gap:10px}
.gp-tclock{font-weight:700;font-size:24px;min-width:62px;font-variant-numeric:tabular-nums;color:var(--tan)}
.gp-tname{flex:1;font-size:12.5px;opacity:.75;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gp-tbtn{border:1.5px solid rgba(255,255,255,.25);background:transparent;border-radius:999px;min-width:42px;height:34px;font-weight:700;font-size:13px;padding:0 10px;display:grid;place-items:center}
.gp-tbar{height:4px;background:rgba(255,255,255,.14);border-radius:3px;margin-top:8px;overflow:hidden}
.gp-tbar i{display:block;height:100%;background:var(--tan);transition:width .25s linear}
.gp-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:96px;background:var(--tan);color:var(--ink);font-weight:600;font-size:13.5px;padding:10px 16px;border-radius:14px;z-index:55;max-width:90vw;box-shadow:0 8px 24px rgba(0,0,0,.4)}

.gp-overlay{position:fixed;inset:0;background:rgba(20,17,26,.66);z-index:80;display:flex;align-items:flex-end;justify-content:center}
.gp-sheet{width:min(100%,640px);max-height:90vh;background:var(--paper);color:var(--ink);border-radius:26px 26px 0 0;display:flex;flex-direction:column;box-shadow:0 -10px 40px rgba(0,0,0,.4)}
.gp-sheet-h{display:flex;align-items:center;justify-content:space-between;padding:14px 12px 4px 20px}
.gp-sheet-h h2{margin:0;font-size:19px}
.gp-sheet .gp-icon{color:var(--ink)}
.gp-sheet-b{padding:4px 20px 28px;overflow:auto}
.gp-help{font-size:13px;opacity:.75;margin:6px 0 12px;line-height:1.5}
.gp-lbl{display:block;font-weight:600;font-size:13px;margin:16px 0 7px}
.gp-text{width:100%;height:46px;border:1.5px solid ${THEME.lowerMid};background:#fff;border-radius:12px;padding:0 14px;font:500 16px "Poppins","Avenir Next",system-ui,sans-serif;color:var(--ink)}
.gp-chips{display:flex;flex-wrap:wrap;gap:8px}
.gp-gchip,.gp-tog{display:inline-flex;align-items:center;gap:7px;border:1.5px solid ${THEME.lowerMid};background:#fff;color:var(--ink);border-radius:999px;padding:7px 12px;font-weight:600;font-size:13px}
.gp-gchip.on,.gp-tog.on{background:var(--ink);border-color:var(--ink);color:#fff}
.gp-row2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
.gp-stepper{display:flex;align-items:center;justify-content:space-between;border:1.5px solid ${THEME.lowerMid};background:#fff;border-radius:12px;height:46px;padding:0 4px}
.gp-stepper b{font-size:18px}
.gp-inline{display:flex;gap:10px;align-items:center}
.gp-list{display:flex;flex-direction:column;gap:8px}
.gp-opt{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1.5px solid ${THEME.lowerMid};background:#fff;border-radius:14px;padding:13px 14px;font-weight:600;font-size:15px;color:var(--ink);text-align:left}
.gp-opt.on{border-color:var(--ink);background:#f1ebf4}
.gp-opt.wk{padding:10px 14px}
.gp-wkn{width:30px;height:30px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font-size:13px;flex:none}
.gp-wkt{flex:1;display:flex;flex-direction:column}
.gp-wkt small{font-weight:500;opacity:.65;font-size:12px}
.gp-wkd{font-size:12.5px;opacity:.7}
.gp-preview{border:1.5px solid #d9d4de;border-radius:10px;overflow:hidden;background:#fff}

/* ---- week view ---- */
.gp-weekview{padding:6px 12px 0;max-width:1540px;margin:0 auto}
.gp-whead{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:6px 4px 4px}
.gp-wtitle{font-size:38px;font-weight:700;letter-spacing:-.02em;line-height:1.05}
.gp-wsub{font-size:12.5px;opacity:.7;margin-top:6px}
.gp-blocks{display:flex;gap:8px;flex-wrap:wrap}
.gp-block.alt{background:transparent;color:var(--tan);border:1.5px solid var(--tan)}
.gp-block{background:var(--tan);color:var(--ink);font-weight:700;font-size:12.5px;padding:6px 14px;border-radius:999px}
.gp-dots{display:flex;gap:6px;margin:12px 4px 14px;overflow-x:auto;padding-bottom:2px}
.gp-dot{border:0;background:transparent;display:flex;flex-direction:column;align-items:center;gap:4px;padding:2px 0;min-width:30px;font-size:11px;opacity:.65}
.gp-dot i{display:block;width:30px;height:11px;border-radius:6px}
.gp-dot.on{opacity:1;font-weight:700}
.gp-dot.on i{box-shadow:0 0 0 2px var(--bg),0 0 0 4px #fff}
.gp-cols{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 12px;align-items:flex-start}
.gp-col{flex:1 0 262px;min-width:262px;scroll-snap-align:start}
.gp-colhead{width:100%;border:0;text-align:left;background:linear-gradient(125deg,var(--acc),var(--acc2));color:#fff;border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;gap:2px;position:relative}
.gp-col.today .gp-colhead{box-shadow:0 0 0 3px var(--bg),0 0 0 5px var(--tan)}
.gp-colday{font-size:12px;letter-spacing:.06em;opacity:.9}
.gp-coltitle{display:flex;justify-content:space-between;align-items:baseline}
.gp-coltitle b{font-size:21px}.gp-coltitle em{font-style:normal;font-size:12px;font-weight:600}
.gp-colfocus{font-size:12.5px;opacity:.95}
.gp-colbadge{position:absolute;right:12px;top:10px;font-size:11px;font-weight:700;background:rgba(255,255,255,.22);border-radius:999px;padding:2px 8px;display:inline-flex;align-items:center;gap:3px}
.gp-colbody{background:linear-gradient(160deg,var(--ptint) 0%,#f4fcfd 140%);color:var(--ink);border:1.5px solid var(--pmid);border-radius:16px;padding:10px 12px 12px;margin-top:8px}
.gp-wsec{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;margin:12px 0 7px}
.gp-wsec:first-child{margin-top:2px}
.gp-wsec em{font-style:normal;margin-left:auto;opacity:.6;font-weight:500}
.gp-witem{display:flex;align-items:center;gap:8px;padding:4px 0;position:relative}
.gp-witem>div{flex:1;min-width:0}
.gp-wname{font-size:13px;font-weight:600;line-height:1.25}
.gp-wrx{font-size:11.5px;font-weight:700;opacity:.95}
.gp-wok{color:var(--acc);flex:none}
.gp-witem.is-done .gp-wname{opacity:.55}
.gp-witem.ss-a::before,.gp-witem.ss-b::before{content:"";position:absolute;left:8px;width:2px;background:var(--mid)}
.gp-witem.ss-a::before{top:70%;bottom:-30%}.gp-witem.ss-b::before{top:-30%;bottom:70%}
.gp-restnote{font-size:12.5px;opacity:.6;margin:6px 6px 0}
.gp-legend{display:flex;flex-wrap:wrap;gap:8px 16px;margin:16px 6px 0;font-size:12px;opacity:.85}
.gp-legend span{display:inline-flex;align-items:center;gap:6px}
.gp-legend i{width:14px;height:14px;border-radius:4px;display:inline-block}

@media (min-width:1100px){.gp-col{flex:1 1 0;min-width:230px}.gp-cols{overflow-x:visible}}
@media (prefers-reduced-motion:reduce){.gp *{transition:none!important}}
`;
