// MARISOL BAY — shared constants: city, story, balance. One job: the numbers
// every other file reads, so a tune is one edit here.
var MB = MB || {};
MB.CITY = 'MARISOL BAY';
MB.HERO_NAME = 'Milo Kade';
MB.HERO_CAR = 'KITE COUPE';
MB.CASH_START = 18450;
MB.RP_START = 3900;
MB.RP_NEXT = 5200;
MB.RANK_NAME = 'FIXER';
MB.RANK_LEVEL = 5;
MB.SAVE_KEY = 'marisolbay-save-v5';
MB.HELI_ORBIT_R = 26;      // gameplay: heli orbit radius (m) — do not change
MB.HELI_ORBIT_H = 20;      // gameplay: heli orbit height (m) — do not change
MB.HELI_ORBIT_W = 0.45;    // gameplay: heli orbit speed (rad/s) — do not change
MB.DISTRICTS = [
  { name: 'DOWNTOWN', stand: 'NEUTRAL', pct: 58, color: '#7dd8ff' },
  { name: 'MARINA ROW', stand: 'FRIENDLY', pct: 74, color: '#5df08a' },
  { name: 'KUMALA STRAND', stand: 'NEUTRAL', pct: 58, color: '#7dd8ff' },
  { name: 'OLD PASARU', stand: 'FRIENDLY', pct: 70, color: '#5df08a' },
  { name: 'LANTAWA CENTRE', stand: 'WARY', pct: 34, color: '#ff9f1c' },
  { name: 'BANYAN GREEN', stand: 'FRIENDLY', pct: 70, color: '#5df08a' },
];
MB.MISSIONS = [
  { id: 0, title: 'DOWNTOWN HEAT', obj: 'Lose the patrol on the downtown streets', next: 'Lose the heat', stages: 2, timer: 149, reward: 1200, done: false },
  { id: 1, title: 'STREET SWEEP', obj: 'Clear the block — take out the crew 1/5', next: 'Melt away', stages: 3, timer: 287, reward: 2400, done: false },
  { id: 2, title: 'NIGHT RUNNER', obj: 'Hit the checkpoints — 2 down, 3 to go', next: 'Lose the heat', stages: 4, timer: 107, reward: 3600, done: false },
];
MB.POLICE_UNITS = [
  { name: 'HELI 1', tactic: 'SPOTLIGHT', cls: 'spot' },
  { name: 'CORAL-48', tactic: 'RAMMING', cls: 'ram' },
  { name: 'CORAL-85', tactic: 'CLOSING IN', cls: 'pur' },
  { name: 'MARLIN-3', tactic: 'PURSUIT', cls: 'pur' },
  { name: 'VIPER-2', tactic: 'SPOTLIGHT', cls: 'spot' },
  { name: 'KITE-1', tactic: 'FLANKING', cls: 'flank' },
  { name: 'HERON-2', tactic: 'ROADBLOCK', cls: 'road' },
];
MB.WEAPONS = [
  { key: '1', name: 'FISTS', ammo: '∞' },
  { key: '2', name: 'P9', ammo: '12' },
  { key: '3', name: 'SMG', ammo: '30/60' },
  { key: '4', name: '12G', ammo: '18' },
  { key: '5', name: 'AR-9', ammo: '—' },
  { key: '6', name: 'RPG', ammo: '—' },
];
MB.CREW = [
  { name: 'MIRA KESANG', role: 'CREW · DRIVER', say: 'Four units on your tail, Milo — lose them through the towers, don\'t stop for anything.', face: 'M', color: '#ff9f1c' },
  { name: 'LIO', role: 'CREW · MECHANIC', say: 'She\'s holding together — barely. Don\'t clip the cruisers, the suspension won\'t take it.', face: 'L', color: '#3ec6ff' },
  { name: 'KIKI', role: 'CREW · LOOKOUT', say: 'Contact ahead, Milo — four hostiles on the block. Drop them and melt away.', face: 'K', color: '#b388ff' },
];
MB.UPGRADES = [
  { name: 'REPAIR', desc: 'Condition 84% → 100%', price: 250, owned: false },
  { name: 'RESPRAY', desc: 'Change the paint (pick a colour)', price: 400, owned: false },
  { name: 'ENGINE TUNE', desc: 'Top speed +12%', price: 1200, owned: true, lock: 'LV 6' },
  { name: 'ARMOUR PLATING', desc: 'Armour +25', price: 950, owned: false },
  { name: 'NITRO', desc: 'Boost 3 seconds', price: 800, owned: true },
  { name: 'SUSPENSION', desc: 'Handling +15%', price: 700, owned: false, lock: 'LV 6' },
  { name: 'BRAKES', desc: 'Stopping distance −20%', price: 500, owned: false },
  { name: 'NEON KIT', desc: 'Underglow lights', price: 350, owned: false },
];
MB.GEAR = [
  { name: 'RATTLER SMG', price: 0, owned: true },
  { name: 'TIDEBREAKER', price: 0, owned: true },
  { name: 'HARRIER LR', price: 6800, owned: false },
  { name: 'FLARE CHARGES ×3', price: 600, owned: false },
  { name: 'AMMO, ALL GUNS', price: 200, owned: false },
  { name: 'BODY ARMOUR', price: 350, owned: false },
];
