// MARISOL BAY — the game itself. One job: state, setup, driving, on-foot
// combat, camera, missions flow, save/load and the main loop. It wires the
// other files together and owns nothing visual on its own.
var MB = MB || {};
(function () {
  var params = new URLSearchParams(location.search);
  var shotMode = parseInt(params.get('shot') || '0', 10);
  var seed = parseInt(params.get('seed') || '1', 10);
  MB.reseed(seed);

  var canvas = document.getElementById('game');
  var G = MB.World.init(canvas);
  var scene = G.scene, camera = G.camera, renderer = G.renderer;
  MB.Input.attach(canvas);

  var s = MB.Missions.state;
  var mode = 'title';           // title | drive | foot | garage | pause
  var prevMode = 'drive';
  var heading = Math.PI;        // hero forward: (sin h, 0, cos h)
  var speed = 0;                // m/s
  var heroPos = new THREE.Vector3(1.5, 0, 6);
  var camYaw = Math.PI, camPitch = 0.32;
  var playerPos = new THREE.Vector3(0, 0, 8);
  var playerHeading = Math.PI;
  var ammo = 12, fireCooldown = 0, muzzleTimer = 0;
  var keys = MB.Input;
  var t = 0, frames = 0, last = performance.now();
  var checkpointRings = [];

  // ---------- actors ----------
  var hero = MB.Vehicles.wedgeCar(0xd92b1e, { simple: true, pinstripe: true });
  hero.position.copy(heroPos); hero.rotation.y = Math.PI + 0.35; hero.scale.setScalar(0.85);
  scene.add(hero);
  G.hero = hero;

  var playerOnFoot = MB.Characters.buildPerson(0xd95f2b, 0x1c2733, 0xc98a5e, { aim: true });
  playerOnFoot.position.copy(playerPos); playerOnFoot.visible = false;
  scene.add(playerOnFoot);
  G.playerOnFoot = playerOnFoot;

  var traffic = [];
  var trafficDefs = [
    { kind: 'wedge', paint: 0xf2f2ee, x: -3.4, z: -4, v: 8, lightBar: true },
    { kind: 'wedge', paint: 0xf2f2ee, x: 3.0, z: -12, v: 9, lightBar: true },
    { kind: 'wedge', paint: 0xf2b705, x: -3.2, z: -26, v: 7 },
    { kind: 'wedge', paint: 0x3a7bd5, x: 4.6, z: -34, v: 8 },
    { kind: 'sedan', paint: 0x2a2a30, x: -3.6, z: -20, v: 6 },
    { kind: 'sedan', paint: 0x7a2b2b, x: 2.8, z: -48, v: 7 },
    { kind: 'wedge', paint: 0xe8e8e2, x: -1.6, z: -60, v: 9 },
    { kind: 'wedge', paint: 0x2b6a4a, x: 3.4, z: -72, v: 6 },
  ];
  for (var ti = 0; ti < trafficDefs.length; ti++) {
    (function (d) {
      var grp = d.kind === 'sedan' ? MB.Vehicles.sedanCar(d.paint) : MB.Vehicles.wedgeCar(d.paint, { lightBar: !!d.lightBar, headlights: true });
      grp.position.set(d.x, 0, d.z); grp.rotation.y = Math.PI + (d.x > 0 ? -0.1 : 0.12);
      scene.add(grp);
      traffic.push({ group: grp, speed: d.v, lane: d.x, kind: d.kind });
    })(trafficDefs[ti]);
  }
  G.traffic = traffic;

  var peds = [];
  var pedDefs = [
    { shirt: 0x3ec6ff, pants: 0x222228, x: -9.8, z: -2, dir: -1 },
    { shirt: 0xff5a5a, pants: 0x3a3a40, x: 9.8, z: -14, dir: 1 },
    { shirt: 0xffd23e, pants: 0x1c2733, x: -9.8, z: -30, dir: 1 },
    { shirt: 0x5df08a, pants: 0x222228, x: 9.8, z: -38, dir: -1 },
    { shirt: 0xb388ff, pants: 0x3a3a40, x: -9.8, z: -52, dir: -1 },
    { shirt: 0xff9f1c, pants: 0x1c2733, x: 9.8, z: -58, dir: 1 },
    { shirt: 0xeeeeee, pants: 0x222228, x: -9.8, z: -70, dir: 1 },
    { shirt: 0x3a7bd5, pants: 0x3a3a40, x: 9.8, z: -80, dir: -1 },
  ];
  for (var pi = 0; pi < pedDefs.length; pi++) {
    (function (d) {
      var p = MB.Characters.buildPerson(d.shirt, d.pants, 0xc98a5e);
      p.position.set(d.x, 0, d.z); p.rotation.y = d.dir > 0 ? 0 : Math.PI;
      scene.add(p);
      peds.push({ group: p, dir: d.dir, speed: 1.1 + MB.rng() * 0.5, phase: MB.rng() * 6 });
    })(pedDefs[pi]);
  }

  // gunfight cast: four marked hostiles + one downed + a burning taxi
  var enemies = [];
  var enemyDefs = [
    { shirt: 0x1c2733, pants: 0x14141a, x: -0.6, z: -6 },
    { shirt: 0x2b2b33, pants: 0x14141a, x: 2.4, z: -9 },
    { shirt: 0x3a3a40, pants: 0x14141a, x: -3.2, z: -11 },
    { shirt: 0x1c2733, pants: 0x2b2b33, x: 4.8, z: -14 },
  ];
  for (var ei = 0; ei < enemyDefs.length; ei++) {
    (function (d) {
      var p = MB.Characters.buildPerson(d.shirt, d.pants, 0x8a6b48, { aim: true, cap: true });
      p.position.set(d.x, 0, d.z); p.rotation.y = 0;
      var mk = MB.Characters.markerSprite(); mk.position.set(0, 2.5, 0); p.add(mk);
      p.visible = false; scene.add(p);
      enemies.push({ group: p, marker: mk, hp: 1, alive: true });
    })(enemyDefs[ei]);
  }
  G.enemies = enemies;
  var downed = MB.Characters.buildDowned(0xd95f2b, 0x1c2733, 0xc98a5e);
  downed.position.set(1.8, 0.22, -3.5); downed.visible = false; scene.add(downed);
  G.downed = downed;
  var burningTaxi = MB.Vehicles.wedgeCar(0xf2b705, { headlights: false });
  burningTaxi.position.set(-4.5, 0, -18); burningTaxi.rotation.y = Math.PI - 0.5; burningTaxi.visible = false;
  scene.add(burningTaxi);
  G.burningTaxi = burningTaxi;
  var fireGroup = MB.World.addFire(-4.5, -18, true);
  fireGroup.visible = false; G.fire = fireGroup;
  MB.World.addFire(6.5, -44, false).visible = true;

  // mission-3 checkpoints: glowing rings on the road
  for (var ci = 0; ci < 3; ci++) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.18, 10, 32), new THREE.MeshStandardMaterial({ color: 0xffd23e, emissive: 0xffd23e, emissiveIntensity: 1.4 }));
    ring.position.set(0, 1.4, -30 - ci * 28); ring.rotation.y = Math.PI / 2;
    ring.visible = false; scene.add(ring);
    checkpointRings.push(ring);
  }

  MB.Police.spawnCruisers(scene, 3);
  MB.Police.spawnHeli(scene);
  // garage lives far off the street (over the sea) so its interior never
  // overlaps the road; the garage camera looks only at the room.
  var garageGroup = MB.Garage.build(scene);
  garageGroup.position.set(120, 0.05, -20);
  MB.Garage._group = garageGroup;

  G.streetGroup = scene;
  G.minimapDots = function () {
    var dots = [];
    MB.Police.cruisers().forEach(function (c) { dots.push({ x: c.position.x, z: c.position.z, color: '#ff4040', r: 3 }); });
    enemies.forEach(function (e) { if (e.alive) dots.push({ x: e.group.position.x, z: e.group.position.z, color: '#ff9f1c', r: 3 }); });
    checkpointRings.forEach(function (r, i) { if (r.visible) dots.push({ x: r.position.x, z: r.position.z, color: '#ffd23e', r: 4 }); });
    return dots;
  };

  // ---------- HUD wiring ----------
  MB.HUD.init();
  document.getElementById('btnStart').addEventListener('click', function () { MB.Audio.unlock(); MB.Audio.click(); startGame(false); });
  document.getElementById('btnContinue').addEventListener('click', function () { MB.Audio.unlock(); MB.Audio.click(); startGame(true); });
  document.getElementById('btnGarage').addEventListener('click', function () { MB.Audio.unlock(); MB.Audio.click(); enterGarage(); });
  document.getElementById('btnResume').addEventListener('click', function () { resumeGame(); });
  document.getElementById('btnSave').addEventListener('click', function () {
    if (MB.Missions.save()) MB.HUD.showToast('Game saved — ' + MB.HUD.fmtCash(s.cash));
    else MB.HUD.showToast('Save failed', false);
  });
  document.getElementById('btnQuit').addEventListener('click', function () { mode = 'title'; MB.HUD.setMode('title'); });
  document.getElementById('btnGarageBack').addEventListener('click', function () { exitGarage(); });

  MB.Missions.on(function (kind, m) {
    if (kind === 'complete') {
      MB.HUD.showToast('MISSION COMPLETE — ' + m.title + ' · +' + MB.HUD.fmtCash(m.reward));
      MB.Audio.coin(); MB.Missions.save();
      s.copsEscaped += 1;
    } else if (kind === 'mission') {
      MB.HUD.showToast('NEW MISSION — ' + m.title);
      MB.HUD.say((m.id + 1) % 3);
    } else if (kind === 'story-done') {
      MB.HUD.showToast('STORY COMPLETE — Marisol Bay is yours, Milo.');
    }
  });

  function startGame(fromSave) {
    if (fromSave && MB.Missions.load()) MB.HUD.showToast('Save loaded — ' + MB.HUD.fmtCash(s.cash));
    else MB.Missions.startMission(0);
    s.ammo = 12;
    mode = 'drive';
    hero.visible = true; playerOnFoot.visible = false;
    MB.HUD.setMode('drive');
    MB.HUD.say(0);
  }
  function resumeGame() { mode = prevMode; MB.HUD.setMode(mode === 'garage' ? 'garage' : (mode === 'foot' ? 'foot' : 'drive')); }
  function enterGarage() {
    prevMode = mode === 'title' ? 'drive' : mode;
    mode = 'garage';
    MB.Garage.show(true);
    MB.HUD.setMode('garage'); MB.HUD.renderGarage();
  }
  function exitGarage() {
    MB.Garage.show(false);
    mode = 'drive'; hero.visible = true;
    MB.HUD.setMode('drive');
  }

  MB.onKey = function (k) {
    if (mode === 'title') { if (k === 'enter') startGame(false); return; }
    if (k === 'escape') {
      if (mode === 'pause') resumeGame();
      else if (mode === 'garage') exitGarage();
      else { prevMode = mode; mode = 'pause'; MB.HUD.setMode('pause'); renderPause(); }
      return;
    }
    if (mode === 'pause') return;
    if (k === 'm') { prevMode = mode; mode = 'pause'; MB.HUD.setMode('pause'); renderPause(); return; }
    if (k === 'g') { if (mode === 'garage') exitGarage(); else enterGarage(); return; }
    if (mode === 'garage') return;
    if (k === 'e') { toggleEnterExit(); return; }
    if (k === 'f') { stealCar(); return; }
    if (k === 'r') { MB.Missions.startMission(s.mission); MB.HUD.showToast('Mission restarted — ' + MB.MISSIONS[s.mission].title); return; }
    if (k === 'h') { MB.Audio.horn(); return; }
    if (k === 'z') { if (MB.Police.wanted() > 0) { MB.Police.setWanted(MB.Police.wanted() - 1); MB.HUD.showToast('SWAP PLATES — heat down, one star gone'); } return; }
    if (k === 'x') { s.condition = Math.min(100, s.condition + 20); MB.HUD.showToast('QUICK FIX — condition ' + s.condition + '%'); MB.Audio.coin(); return; }
    if (k === 'c') { MB.HUD.showToast('EYES OUT — Kiki: ' + MB.Police.cruisers().length + ' units on the board'); return; }
    if (k >= '1' && k <= '6') { MB.HUD.selectWeapon(parseInt(k, 10) - 1); return; }
  };
  MB.onMouseDown = function () {
    if (mode === 'foot') shoot();
  };

  function renderPause() {
    var pm = document.getElementById('pauseMissions');
    pm.innerHTML = MB.MISSIONS.map(function (m, i) {
      return '<div>' + (m.done ? '✓' : (i === s.mission ? '▶' : '○')) + ' ' + m.title + ' — ' + m.obj + '</div>';
    }).join('');
    document.getElementById('pauseCareer').innerHTML =
      'CASH ' + MB.HUD.fmtCash(s.cash) + '<br>CARS STOLEN ' + s.carsStolen + '<br>COPS ESCAPED ' + s.copsEscaped +
      '<br>DISTANCE DRIVEN ' + s.kmDriven.toFixed(1) + ' KM<br>KNOCKOUTS ' + s.knockouts + '<br>RACES WON ' + s.racesWon;
    document.getElementById('pauseSaves').innerHTML =
      '1 · ' + (MB.Missions.hasSave() ? 'Marisol Bay — ' + MB.HUD.fmtCash(s.cash) : 'EMPTY') + '<br>2 · EMPTY<br>3 · EMPTY';
  }

  function toggleEnterExit() {
    if (mode === 'drive') {
      mode = 'foot';
      playerPos.set(heroPos.x + 2.2, 0, heroPos.z + 1.5);
      playerHeading = heading;
      playerOnFoot.position.copy(playerPos);
      playerOnFoot.visible = true;
      hero.visible = true;
      camYaw = heading;
      MB.HUD.setMode('foot');
      MB.HUD.showPrompt('<b>F</b> STEAL NEAREST CAR');
    } else if (mode === 'foot') {
      var d = Math.hypot(playerPos.x - heroPos.x, playerPos.z - heroPos.z);
      if (d < 5) {
        mode = 'drive'; playerOnFoot.visible = false;
        MB.HUD.setMode('drive'); MB.HUD.showPrompt(null);
      } else {
        MB.HUD.showToast('Too far from the car', false);
      }
    }
  }
  function stealCar() {
    if (mode !== 'foot') return;
    var best = null, bd = 1e9;
    traffic.forEach(function (tc) {
      var d = Math.hypot(playerPos.x - tc.group.position.x, playerPos.z - tc.group.position.z);
      if (d < bd) { bd = d; best = tc; }
    });
    if (best && bd < 6) {
      heroPos.set(best.group.position.x, 0, best.group.position.z);
      heading = Math.PI;
      hero.position.copy(heroPos);
      best.group.position.set(best.group.position.x + 30, 0, best.group.position.z - 120);
      s.carsStolen += 1; MB.Police.addHeat(1);
      mode = 'drive'; playerOnFoot.visible = false;
      MB.HUD.setMode('drive'); MB.HUD.showPrompt(null);
      MB.HUD.showToast('VEHICLE STOLEN — the witness called it in');
    }
  }
  function shoot() {
    if (fireCooldown > 0 || s.ammo <= 0) return;
    fireCooldown = 0.28; s.ammo -= 1; muzzleTimer = 0.09;
    MB.Audio.shot();
    var fx = playerPos.x + Math.sin(playerHeading) * 0.9, fz = playerPos.z + Math.cos(playerHeading) * 0.9;
    var muzzle = new THREE.Vector3(fx, 1.35, fz);
    var best = null, bd = 1e9, bp = null;
    enemies.forEach(function (e) {
      if (!e.alive) return;
      var dx = e.group.position.x - playerPos.x, dz = e.group.position.z - playerPos.z;
      var dist = Math.hypot(dx, dz);
      var ang = Math.atan2(dx, dz) - playerHeading;
      while (ang > Math.PI) ang -= Math.PI * 2;
      while (ang < -Math.PI) ang += Math.PI * 2;
      if (Math.abs(ang) < 0.5 && dist < bd) { bd = dist; best = e; bp = new THREE.Vector3(e.group.position.x, 1.2, e.group.position.z); }
    });
    var end = bp || new THREE.Vector3(playerPos.x + Math.sin(playerHeading) * 30, 1.1, playerPos.z + Math.cos(playerHeading) * 30);
    var geo = new THREE.BufferGeometry().setFromPoints([muzzle, end]);
    var tr = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.95 }));
    scene.add(tr);
    setTimeout(function () { scene.remove(tr); geo.dispose(); }, 90);
    var fl = MB.World.glowSprite(MB.World.textures().white, 1.6, 0.95);
    fl.position.copy(muzzle); scene.add(fl);
    setTimeout(function () { scene.remove(fl); }, 90);
    if (best) {
      best.hp -= 1;
      if (best.hp <= 0) {
        best.alive = false;
        best.group.visible = false;
        s.kills += 1; s.knockouts += 1;
        MB.Police.addHeat(0.5);
        MB.HUD.showToast('HOSTILE DOWN — ' + s.kills + ' / 5');
        var d = MB.Characters.buildDowned(0x1c2733, 0x14141a, 0x8a6b48);
        d.position.set(best.group.position.x, 0.22, best.group.position.z);
        scene.add(d);
      }
    }
  }

  // ---------- per-frame ----------
  function updateDrive(dt) {
    var accel = keys.down('w') || keys.down('arrowup');
    var brake = keys.down('s') || keys.down('arrowdown');
    var left = keys.down('a') || keys.down('arrowleft');
    var right = keys.down('d') || keys.down('arrowright');
    var hand = keys.down(' ');
    if (accel) speed += dt * 14;
    if (brake) speed -= dt * (speed > 0.5 ? 22 : 8);
    if (!accel && !brake) speed -= Math.sign(speed) * dt * 4;
    if (hand) speed -= Math.sign(speed) * dt * 26;
    speed = MB.clamp(speed, -8, 26);
    if (Math.abs(speed) > 0.5) {
      var steer = (left ? 1 : 0) - (right ? 1 : 0);
      heading += steer * dt * 1.5 * MB.clamp(Math.abs(speed) / 10, 0.3, 1) * (speed >= 0 ? 1 : -1);
    }
    heroPos.x += Math.sin(heading) * speed * dt;
    heroPos.z += Math.cos(heading) * speed * dt;
    heroPos.x = MB.clamp(heroPos.x, -6.5, 6.5);
    if (heroPos.z < -130) heroPos.z = 25;
    if (heroPos.z > 28) heroPos.z = -125;
    hero.position.copy(heroPos);
    hero.rotation.y = heading - Math.PI / 2; // nose (local +x) along forward
    s.speedKmh = Math.abs(speed) * 3.6;
    s.kmDriven += Math.abs(speed) * dt / 1000;
    s.district = MB.clamp(Math.floor((-heroPos.z + 20) / 22), 0, 5);
    // traffic + police collisions (simple circles)
    traffic.forEach(function (tc) {
      var d = Math.hypot(tc.group.position.x - heroPos.x, tc.group.position.z - heroPos.z);
      if (d < 3.4 && Math.abs(speed) > 3) { speed *= 0.55; s.condition = Math.max(20, s.condition - 1); MB.Audio.crash(); }
    });
    MB.Police.cruisers().forEach(function (c) {
      var d = Math.hypot(c.position.x - heroPos.x, c.position.z - heroPos.z);
      if (d < 3.6) { speed *= 0.7; s.condition = Math.max(20, s.condition - 2); MB.Audio.crash(); MB.Police.addHeat(0.2); }
    });
    // checkpoints (mission 3)
    if (s.mission === 2) {
      checkpointRings.forEach(function (r, i) {
        if (i === s.checkpoints) {
          r.visible = true;
          var d = Math.hypot(r.position.x - heroPos.x, r.position.z - heroPos.z);
          if (d < 4.5) { s.checkpoints += 1; r.material.color.setHex(0x5df08a); MB.Audio.coin(); MB.HUD.showToast('CHECKPOINT ' + s.checkpoints + ' / 3'); }
        }
      });
    }
    // chase camera
    var fx = Math.sin(heading), fz = Math.cos(heading);
    var tx = heroPos.x - fx * 10.5, tz = heroPos.z - fz * 10.5, ty = 4.4;
    camera.position.x = MB.lerp(camera.position.x, tx, 1 - Math.pow(0.001, dt));
    camera.position.y = MB.lerp(camera.position.y, ty, 1 - Math.pow(0.001, dt));
    camera.position.z = MB.lerp(camera.position.z, tz, 1 - Math.pow(0.001, dt));
    camera.lookAt(heroPos.x + fx * 9, 1.6, heroPos.z + fz * 9);
    MB.Audio.engine(Math.abs(speed) / 26, true);
    MB.Audio.siren(MB.Police.wanted() > 0, t);
  }

  function updateFoot(dt) {
    var look = keys.look();
    camYaw -= look.dx * 0.004;
    camPitch = MB.clamp(camPitch + look.dy * 0.002, 0.08, 0.9);
    playerHeading = camYaw;
    var run = keys.down('shift') ? 2.1 : 1;
    var mv = (keys.down('w') ? 1 : 0) - (keys.down('s') ? 1 : 0);
    var st = (keys.down('d') ? 1 : 0) - (keys.down('a') ? 1 : 0);
    var sp = 4.2 * run;
    var fx = Math.sin(camYaw), fz = Math.cos(camYaw);
    playerPos.x += (fx * mv + fz * st) * sp * dt;
    playerPos.z += (fz * mv - fx * st) * sp * dt;
    playerPos.x = MB.clamp(playerPos.x, -12, 12);
    playerPos.z = MB.clamp(playerPos.z, -120, 26);
    playerOnFoot.position.copy(playerPos);
    playerOnFoot.rotation.y = playerHeading + Math.PI;
    if (mv !== 0 || st !== 0) MB.Characters.walkSwing(playerOnFoot, t, 0.5);
    // third-person camera
    var cx = playerPos.x - Math.sin(camYaw) * 5.2, cz = playerPos.z - Math.cos(camYaw) * 5.2;
    camera.position.set(cx, 2.4 + camPitch * 2, cz);
    camera.lookAt(playerPos.x, 1.3, playerPos.z);
    fireCooldown = Math.max(0, fireCooldown - dt);
    if (keys.consumeClick()) shoot();
    s.speedKmh = 0;
    MB.Audio.engine(0, false);
  }

  function updateTraffic(dt) {
    traffic.forEach(function (tc) {
      tc.group.position.z -= tc.speed * dt;
      if (tc.group.position.z < -135) { tc.group.position.z = 26; tc.group.position.x = tc.lane; }
    });
    peds.forEach(function (p) {
      p.group.position.z += p.dir * p.speed * dt;
      if (p.group.position.z < -120) p.group.position.z = 24;
      if (p.group.position.z > 26) p.group.position.z = -118;
      MB.Characters.walkSwing(p.group, t + p.phase, 0.35);
    });
  }

  function loop(now) {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    if (shotMode === 0) {
      MB.World.update(dt, t);
      updateTraffic(dt);
      if (mode === 'drive') updateDrive(dt);
      else if (mode === 'foot') updateFoot(dt);
      else if (mode === 'garage') MB.Garage.update(dt, t);
      MB.Police.update(dt, t, mode === 'foot' ? playerPos : heroPos, Math.abs(speed), mode === 'garage' ? 'garage' : mode);
      if (mode === 'drive' || mode === 'foot') {
        MB.Missions.update(dt, { wanted: MB.Police.wanted() });
        MB.HUD.update(s, {
          wanted: MB.Police.wanted(), t: t, onFoot: mode === 'foot',
          px: mode === 'foot' ? playerPos.x : heroPos.x,
          pz: mode === 'foot' ? playerPos.z : heroPos.z,
          heading: mode === 'foot' ? playerHeading : heading,
          dots: G.minimapDots(),
        });
        if (mode === 'foot' && s.mission === 1 && s.kills < 5) {
          MB.HUD.showBanner('SEARCHING — search zone 31 m · clear in 11 s');
        } else if (mode === 'drive' && MB.Police.wanted() >= 4) {
          MB.HUD.showBanner('WANTED ★★★★ — AIR ONE HAS THE LIGHT');
        } else {
          MB.HUD.showBanner(null);
        }
      }
      // title orbit camera
      if (mode === 'title') {
        camera.position.set(2.5 + Math.sin(t * 0.08) * 1.2, 3.2, 18.5);
        camera.lookAt(0, 3.8, -22);
      }
    } else {
      MB.World.update(dt, t);
      if (mode === 'garage') MB.Garage.update(dt, t);
    }
    renderer.render(scene, camera);
    if (++frames === 3) window.__gameReady = true;
  }

  // ---------- boot ----------
  if (shotMode >= 1 && shotMode <= 4) {
    // staged screenshot: hide the title, freeze gameplay, compose the shot
    mode = 'drive';
    MB.HUD.init();
    MB.Shots.stage({ scene: scene, camera: camera, hero: hero, playerOnFoot: playerOnFoot, traffic: traffic, minimapDots: G.minimapDots, enemies: enemies, downed: downed, burningTaxi: burningTaxi, fire: fireGroup, streetGroup: scene }, shotMode);
    if (shotMode === 4) mode = 'garage';
    if (shotMode === 2) mode = 'foot';
  } else {
    MB.HUD.setMode('title');
    MB.Police.setWanted(2);
  }
  window.MB = MB;
  window.__marisol = { state: s, heroPos: heroPos, playerPos: playerPos, traffic: traffic, enemies: enemies, police: MB.Police, missions: MB.Missions };
  requestAnimationFrame(loop);
})();
