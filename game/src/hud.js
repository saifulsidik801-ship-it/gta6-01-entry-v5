// MARISOL BAY — the HUD. One job: every DOM panel (mission, police,
// cash/wanted, weapons, crew, minimap, vitals, dialogue, speed, garage
// panels) and the canvas minimap. The 3D scene never touches the DOM.
var MB = MB || {};
MB.HUD = (function () {
  var el = {};
  var weaponSel = 1, toastTimer = null;
  function $(id) { return document.getElementById(id); }
  function fmtCash(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function fmtTime(s) {
    s = Math.max(0, Math.ceil(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function init() {
    el.mission = $('mission'); el.mName = $('mName'); el.mObj = $('mObj'); el.mStage = $('mStage');
    el.mNext = $('mNext'); el.mTimer = $('mTimer'); el.mDay = $('mDay'); el.mRank = $('mRank');
    el.pCount = $('pCount'); el.pList = $('pList'); el.pFoot = $('pFoot');
    el.cashAmt = $('cashAmt'); el.stars = $('stars'); el.dayChip = $('dayChip'); el.rankBar = $('rankBar');
    el.weapons = $('weapons'); el.crew = $('crew'); el.airunit = $('airunit');
    el.minimap = $('minimap'); el.dName = $('dName'); el.dStand = $('dStand'); el.dBar = $('dBar');
    el.hpBar = $('hpBar'); el.arBar = $('arBar'); el.ammoLbl = $('ammoLbl');
    el.dlgFace = $('dlgFace'); el.dlgWho = $('dlgWho'); el.dlgSay = $('dlgSay');
    el.spdVal = $('spdVal'); el.carName = $('carName'); el.condBar = $('condBar'); el.condVal = $('condVal');
    el.banner = $('banner'); el.prompt = $('prompt'); el.cross = $('cross'); el.toast = $('toast');
    el.speedo = $('speedo'); el.dialog = $('dialog'); el.police = $('police'); el.radio = $('radio');
    el.vitals = $('vitals'); el.district = $('district'); el.minimapBox = $('minimapBox');
    el.upgList = $('upgList'); el.gearList = $('gearList'); el.gearDesc = $('gearDesc');
    el.gCond = $('gCond'); el.gSpd = $('gSpd'); el.gArm = $('gArm');
    renderWeapons();
  }
  function renderWeapons() {
    el.weapons.innerHTML = '';
    for (var i = 0; i < MB.WEAPONS.length; i++) {
      var w = MB.WEAPONS[i];
      var d = document.createElement('div');
      d.className = 'slot' + (i === weaponSel ? ' sel' : '');
      var locked = (w.ammo === '—');
      d.innerHTML = '<div class="n">' + w.key + '</div><div class="w">' + (locked ? '🔒' : '▣') + '</div><div class="a">' + (locked ? 'LOCKED' : w.ammo) + '</div>';
      el.weapons.appendChild(d);
    }
  }
  function selectWeapon(i) { weaponSel = i; renderWeapons(); }
  function showToast(msg, ok) {
    el.toast.textContent = msg;
    el.toast.style.display = 'block';
    el.toast.style.borderColor = ok === false ? '#ff5a4e' : '#5df08a';
    el.toast.style.color = ok === false ? '#ff5a4e' : '#5df08a';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.style.display = 'none'; }, 2600);
  }
  function showBanner(msg) {
    if (!msg) { el.banner.style.display = 'none'; return; }
    el.banner.textContent = msg; el.banner.style.display = 'block';
  }
  function showPrompt(html) {
    if (!html) { el.prompt.style.display = 'none'; return; }
    el.prompt.innerHTML = html; el.prompt.style.display = 'block';
  }
  function say(crewIdx) {
    var c = MB.CREW[crewIdx % MB.CREW.length];
    el.dlgFace.textContent = c.face; el.dlgFace.style.background = c.color;
    el.dlgWho.textContent = c.name + ' · ' + c.role; el.dlgSay.textContent = c.say;
  }
  function drawMinimap(px, pz, heading, dots) {
    var c = el.minimap, x = c.getContext('2d');
    var S = 132, cx = S / 2, cy = S / 2, scale = 1.1;
    x.clearRect(0, 0, S, S);
    x.fillStyle = '#22303e'; x.beginPath(); x.arc(cx, cy, 64, 0, Math.PI * 2); x.fill();
    x.save(); x.beginPath(); x.arc(cx, cy, 64, 0, Math.PI * 2); x.clip();
    // sea (right), sand, blocks
    x.fillStyle = '#2a5f8a'; x.fillRect(96, 0, 36, S);
    x.fillStyle = '#c9a06a'; x.fillRect(84, 0, 12, S);
    x.fillStyle = '#3a4a5a';
    for (var bx = -60; bx < 80; bx += 16) for (var bz = -60; bz < 70; bz += 16) {
      if (Math.abs(bx) < 10 || Math.abs(bz - 0) < 8) continue;
      x.fillRect(cx + bx - px * scale, cy + bz + pz * scale, 11, 11);
    }
    // roads
    x.strokeStyle = '#8a94a6'; x.lineWidth = 7;
    x.beginPath(); x.moveTo(cx, 0); x.lineTo(cx, S); x.stroke();
    x.beginPath(); x.moveTo(0, cy + 20); x.lineTo(S, cy + 20); x.stroke();
    x.strokeStyle = '#ffd23e'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(cx, 0); x.lineTo(cx, S); x.stroke();
    // dots: police red, enemies orange, mission gold
    for (var i = 0; i < (dots || []).length; i++) {
      var d = dots[i];
      x.fillStyle = d.color;
      x.beginPath(); x.arc(cx + (d.x - px) * scale, cy + (d.z - pz) * scale, d.r || 3, 0, Math.PI * 2); x.fill();
    }
    // player arrow
    x.save();
    x.translate(cx, cy); x.rotate(heading);
    x.fillStyle = '#fff'; x.strokeStyle = '#222'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(0, -7); x.lineTo(5, 6); x.lineTo(0, 3); x.lineTo(-5, 6); x.closePath(); x.fill(); x.stroke();
    x.restore();
    x.restore();
    x.fillStyle = '#fff'; x.font = 'bold 11px Arial'; x.fillText('N', cx - 4, 14);
  }
  function update(s, ctx) {
    var m = MB.MISSIONS[s.mission];
    el.mName.textContent = m.title;
    el.mObj.textContent = m.obj;
    el.mNext.innerHTML = 'NEXT&nbsp; ' + m.next;
    el.mTimer.textContent = fmtTime(s.timer);
    el.mDay.textContent = 'DUSK 18:40';
    el.mRank.textContent = 'RANK ' + s.rank + ' · ' + s.rankName + ' · ' + s.rp.toLocaleString() + ' / ' + MB.RP_NEXT.toLocaleString() + ' RP';
    var stageHtml = '';
    for (var i = 0; i < m.stages; i++) stageHtml += '<i class="' + (i < s.stage ? 'on' : '') + '"></i>';
    el.mStage.innerHTML = stageHtml + '<span style="font-size:11px;color:#ffd23e;margin-left:6px">STAGE ' + s.stage + '/' + m.stages + '</span>';
    var units = MB.POLICE_UNITS.slice(0, ctx.wanted >= 3 ? 7 : (ctx.wanted >= 1 ? 5 : 2));
    el.pCount.textContent = units.length + ' UNITS';
    var html = '';
    for (var u = 0; u < units.length; u++) {
      var un = units[u];
      var dist = Math.max(4, Math.round(4 + ((u * 7 + ctx.t * 3) % 40)));
      html += '<div class="row"><span>● ' + un.name + '</span><span class="tag ' + un.cls + '">' + un.tactic + '</span><span>' + dist + ' m</span></div>';
    }
    el.pList.innerHTML = html;
    el.pFoot.textContent = ctx.wanted > 0 ? 'IN SIGHT · CLOSEST 4 M' : 'NO UNITS IN SIGHT';
    el.cashAmt.textContent = fmtCash(s.cash);
    var stars = '';
    for (var st = 0; st < 5; st++) stars += st < ctx.wanted ? '★' : '<span class="off">★</span>';
    el.stars.innerHTML = stars;
    el.rankBar.textContent = 'RANK ' + s.rank + ' · ' + s.rankName + ' · ' + s.rp.toLocaleString() + ' / ' + MB.RP_NEXT.toLocaleString() + ' RP';
    el.hpBar.style.width = s.hp + '%';
    el.arBar.style.width = s.armour + '%';
    el.ammoLbl.textContent = ctx.onFoot ? (MB.WEAPONS[weaponSel].name + ' · ' + s.ammo) : ('PISTOL · ' + s.ammo);
    el.spdVal.textContent = Math.round(s.speedKmh);
    el.carName.textContent = ctx.onFoot ? 'ON FOOT' : MB.HERO_CAR;
    el.condBar.style.width = s.condition + '%';
    el.condVal.textContent = s.condition + '%';
    var d = MB.DISTRICTS[s.district % MB.DISTRICTS.length];
    el.dName.textContent = d.name;
    el.dStand.textContent = d.stand + ' · ' + d.pct;
    el.dStand.style.color = d.color;
    el.dBar.style.width = d.pct + '%';
    el.airunit.style.display = (MB.HUD._mode === 'drive' || MB.HUD._mode === 'foot') && ctx.wanted >= 2 && !ctx.onFoot ? 'block' : 'none';
    if (MB.HUD._mode === 'drive' || MB.HUD._mode === 'foot') {
      el.crew.style.display = (ctx.wanted >= 2 && !ctx.onFoot) ? 'none' : 'block';
      el.cross.style.display = ctx.onFoot ? 'block' : 'none';
      el.speedo.style.display = ctx.onFoot ? 'none' : 'block';
    }
    drawMinimap(ctx.px, ctx.pz, ctx.heading, ctx.dots);
  }
  function setMode(mode) {
    MB.HUD._mode = mode;
    var inGame = mode === 'drive' || mode === 'foot';
    el.mission.style.display = inGame ? 'block' : 'none';
    el.police.style.display = inGame ? 'block' : 'none';
    el.weapons.style.display = inGame ? 'flex' : 'none';
    el.minimapBox.style.display = inGame ? 'block' : 'none';
    el.district.style.display = inGame ? 'block' : 'none';
    el.vitals.style.display = inGame ? 'block' : 'none';
    el.dialog.style.display = inGame ? 'flex' : 'none';
    el.speedo.style.display = inGame ? 'block' : 'none';
    el.radio.style.display = inGame ? 'block' : 'none';
    el.crew.style.display = inGame ? 'block' : 'none';
    el.airunit.style.display = 'none';
    el.cross.style.display = 'none';
    document.getElementById('cash').style.display = inGame ? 'block' : 'none';
    document.getElementById('garageUI').style.display = mode === 'garage' ? 'block' : 'none';
    document.getElementById('title').style.display = mode === 'title' ? 'flex' : 'none';
    document.getElementById('pause').style.display = mode === 'pause' ? 'flex' : 'none';
  }
  function renderGarage() {
    var s = MB.Missions.state;
    el.upgList.innerHTML = '';
    for (var i = 0; i < MB.UPGRADES.length; i++) {
      (function (idx) {
        var u = MB.UPGRADES[idx];
        var d = document.createElement('div');
        d.className = 'upg' + (idx === 3 ? ' sel' : '');
        var right = u.owned ? '<span class="owned">✓ OWNED</span>' : (u.lock ? '<span class="locked">LOCKED · ' + u.lock + '</span>' : '<span class="price">$' + u.price + '</span>');
        d.innerHTML = '<span><b>' + u.name + '</b> · ' + u.desc + '</span>' + right;
        d.addEventListener('click', function () {
          var r = MB.Garage.buyUpgrade(idx);
          if (r === 'bought') { MB.HUD.showToast(u.name + ' installed — $' + u.price); MB.Audio.coin(); }
          else if (r === 'poor') MB.HUD.showToast('Not enough cash', false);
          else MB.HUD.showToast('Locked — reach LV 6 first', false);
          MB.HUD.renderGarage();
        });
        el.upgList.appendChild(d);
      })(i);
    }
    el.gearList.innerHTML = '';
    for (var j = 0; j < MB.GEAR.length; j++) {
      (function (idx) {
        var g = MB.GEAR[idx];
        var d = document.createElement('div');
        d.className = 'upg';
        var right = g.owned ? '<span class="owned">✓ OWNED</span>' : '<span class="price">$' + g.price + '</span>';
        d.innerHTML = '<span><b>' + g.name + '</b></span>' + right;
        d.addEventListener('click', function () {
          var r = MB.Garage.buyGear(idx);
          if (r === 'bought') { MB.HUD.showToast(g.name + ' bought'); MB.Audio.coin(); }
          else if (r === 'poor') MB.HUD.showToast('Not enough cash', false);
          MB.HUD.renderGarage();
        });
        el.gearList.appendChild(d);
      })(j);
    }
    el.gCond.textContent = s.condition + '%';
    el.gSpd.style.width = '72%';
    el.gArm.style.width = s.armour + '%';
  }
  return {
    init: init, update: update, setMode: setMode, say: say, showToast: showToast,
    showBanner: showBanner, showPrompt: showPrompt, renderGarage: renderGarage,
    selectWeapon: selectWeapon, weapon: function () { return weaponSel; },
    fmtCash: fmtCash, fmtTime: fmtTime,
  };
})();
