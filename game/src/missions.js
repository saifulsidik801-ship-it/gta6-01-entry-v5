// MARISOL BAY — missions and story. One job: the three-job arc, objectives,
// timers, checkpoints and rewards. The game state (cash, rank, progress)
// lives here and is what the save file stores.
var MB = MB || {};
MB.Missions = (function () {
  var state = {
    cash: MB.CASH_START, rp: MB.RP_START, rank: MB.RANK_LEVEL, rankName: MB.RANK_NAME,
    mission: 0, stage: 1, timer: 0, kills: 0, checkpoints: 0, wanted: 2,
    carsStolen: 23, copsEscaped: 31, kmDriven: 48.2, knockouts: 9, racesWon: 1,
    hp: 100, armour: 55, condition: 84, speedKmh: 0, district: 0, ammo: 12,
  };
  var checkpoints = [];
  var onEvent = null;

  function mission() { return MB.MISSIONS[state.mission]; }
  function startMission(i) {
    state.mission = i; state.stage = 1; state.kills = 0; state.checkpoints = 0;
    var m = MB.MISSIONS[i];
    state.timer = m.timer;
    if (onEvent) onEvent('mission', m);
  }
  function completeMission() {
    var m = mission();
    m.done = true;
    state.cash += m.reward; state.rp += 650;
    if (state.rp >= MB.RP_NEXT) { state.rank += 1; state.rp -= MB.RP_NEXT; }
    if (onEvent) onEvent('complete', m);
    if (state.mission + 1 < MB.MISSIONS.length) startMission(state.mission + 1);
    else if (onEvent) onEvent('story-done', m);
  }
  function update(dt, ctx) {
    var m = mission();
    if (state.timer > 0) state.timer = Math.max(0, state.timer - dt);
    if (state.mission === 0) {
      // Downtown Heat: survive the timer with the patrol on you, then lose them
      if (state.timer <= 0 && ctx.wanted === 0) completeMission();
      else if (state.timer <= 0 && ctx.wanted > 0) state.stage = 2;
    } else if (state.mission === 1) {
      if (state.kills >= 5) completeMission();
    } else if (state.mission === 2) {
      if (state.checkpoints >= 3) completeMission();
    }
    return m;
  }
  function save() {
    try {
      localStorage.setItem(MB.SAVE_KEY, JSON.stringify({
        cash: state.cash, rp: state.rp, rank: state.rank, mission: state.mission,
        carsStolen: state.carsStolen, copsEscaped: state.copsEscaped,
        kmDriven: state.kmDriven, knockouts: state.knockouts, racesWon: state.racesWon,
        done: MB.MISSIONS.map(function (m) { return m.done; }),
      }));
      return true;
    } catch (e) { return false; }
  }
  function load() {
    try {
      var raw = localStorage.getItem(MB.SAVE_KEY);
      if (!raw) return false;
      var d = JSON.parse(raw);
      state.cash = d.cash; state.rp = d.rp; state.rank = d.rank; state.mission = d.mission;
      state.carsStolen = d.carsStolen; state.copsEscaped = d.copsEscaped;
      state.kmDriven = d.kmDriven; state.knockouts = d.knockouts; state.racesWon = d.racesWon;
      for (var i = 0; i < d.done.length; i++) MB.MISSIONS[i].done = d.done[i];
      startMission(state.mission);
      return true;
    } catch (e) { return false; }
  }
  function hasSave() {
    try { return !!localStorage.getItem(MB.SAVE_KEY); } catch (e) { return false; }
  }
  return {
    state: state, mission: mission, startMission: startMission,
    completeMission: completeMission, update: update,
    save: save, load: load, hasSave: hasSave,
    checkpoints: checkpoints,
    on: function (fn) { onEvent = fn; },
  };
})();
