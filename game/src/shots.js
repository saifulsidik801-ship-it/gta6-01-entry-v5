// MARISOL BAY — staged screenshots. One job: the four ?shot= compositions
// the dossier is judged on. Each one sets the scene, the camera and the HUD
// to a fixed, seeded frame — no input, no randomness between runs.
var MB = MB || {};
MB.Shots = (function () {
  var tracer = null, muzzle = null;
  function line(a, b) {
    var geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.95 }));
  }
  function stage(G, shot) {
    var scene = G.scene, cam = G.camera, s = MB.Missions.state;
    // common: dusk chase dressing — cops ahead, traffic, heli up
    var hero = G.hero;
    if (shot === 1) {
      // COVER — the dusk chase, locked to Sidik's reference: hero wedge big
      // in the foreground, white cruisers ahead, heli top-centre, palms and
      // lit towers both sides, magenta-to-orange dusk.
      hero.visible = true;
      hero.position.set(1.5, 0, 2); hero.rotation.y = Math.PI + 0.35; hero.scale.setScalar(0.85);
      G.playerOnFoot.visible = false;
      MB.Police.setWanted(2);
      MB.Police.spawnCruisers(scene, 3);
      MB.Police.spawnHeli(scene);
      var h = MB.Police.heli();
      h.position.set(-0.5, 13.5, -28); h.scale.setScalar(1.15); h.rotation.y = 0.15; h.visible = true;
      if (h.userData.pool) h.userData.pool.position.y = (0.6 - 13.5) / 1.15; // pool back on the road
      G.traffic.forEach(function (c) { c.group.visible = true; });
      G.traffic[0].group.position.set(-3.4, 0, -16);
      G.traffic[1].group.position.set(3.0, 0, -24);
      cam.position.set(2.5, 3.2, 18.5); cam.lookAt(0, 3.8, -22);
      s.speedKmh = 45; s.mission = 0; s.stage = 1; s.timer = 149;
      MB.HUD.say(0);
      MB.HUD.setMode('drive');
      MB.HUD.update(s, { wanted: 2, t: 0, onFoot: false, px: 1.5, pz: 6, heading: Math.PI, dots: G.minimapDots() });
    } else if (shot === 2) {
      // GUNFIGHT — a REAL shootout: Milo on foot, aiming, tracer + muzzle
      // flash, four marked hostiles, one down, one taxi burning, peds fleeing.
      MB.Missions.startMission(1);
      s.kills = 1; s.stage = 2;
      hero.visible = false;
      G.playerOnFoot.visible = true;
      G.playerOnFoot.position.set(0, 0, 4); G.playerOnFoot.rotation.y = Math.PI;
      MB.Police.setWanted(3);
      MB.Police.spawnCruisers(scene, 2);
      G.enemies.forEach(function (e) { e.group.visible = true; });
      G.downed.visible = true;
      G.downed.position.set(3.5, 0.22, -3);
      G.burningTaxi.visible = true;
      G.burningTaxi.position.set(5.5, 0, -12);
      G.fire.visible = true;
      G.fire.position.set(6.5, 0, -6);
      G.traffic[0].group.position.set(-4.5, 0, -14);
      G.traffic[1].group.position.set(5, 0, -20);
      var cr = MB.Police.cruisers();
      if (cr[0]) { cr[0].position.set(-5, 0, -16); cr[0].rotation.y = Math.PI + 0.1; }
      if (cr[1]) { cr[1].position.set(5.5, 0, -22); cr[1].rotation.y = Math.PI - 0.15; }
      cam.position.set(0.5, 3.4, 14); cam.lookAt(0, 1.0, -8);
      // tracer from Milo's gun (offset to his right so it reads past his
      // shoulder) to the nearest hostile + muzzle flash
      var a = new THREE.Vector3(0.9, 1.4, 3.2), b = new THREE.Vector3(-0.6, 1.2, -6);
      tracer = line(a, b); scene.add(tracer);
      muzzle = MB.World.glowSprite(MB.World.textures().white, 1.6, 0.95);
      muzzle.position.copy(a); scene.add(muzzle);
      s.speedKmh = 0;
      MB.HUD.say(2);
      MB.HUD.setMode('foot');
      MB.HUD.showBanner('SEARCHING — search zone 31 m · clear in 11 s');
      MB.HUD.showPrompt('<b>F</b> STEAL TAXI');
      MB.HUD.update(s, { wanted: 3, t: 0, onFoot: true, px: 0, pz: 4, heading: Math.PI, dots: G.minimapDots() });
    } else if (shot === 3) {
      // HELI — the air unit, big and readable: white fuselage lit, red
      // stripe, rotor disc, spotlight cone + road pool, city below.
      hero.visible = true;
      hero.position.set(0, 0, -18); hero.rotation.y = Math.PI + 0.35; hero.scale.setScalar(0.85);
      G.playerOnFoot.visible = false;
      MB.Police.setWanted(4);
      MB.Police.spawnCruisers(scene, 3);
      var hh = MB.Police.spawnHeli(scene);
      hh.position.set(-1, 13, -26); hh.scale.setScalar(1.25); hh.rotation.y = 0.4; hh.visible = true;
      if (hh.userData.pool) hh.userData.pool.position.y = (0.6 - 13) / 1.25;
      var key = new THREE.PointLight(0xffe0b0, 3.5, 30);
      key.position.set(6, 16, -8); scene.add(key);
      G.traffic.forEach(function (c) { c.group.visible = true; });
      cam.position.set(12, 9, 6); cam.lookAt(-1, 7, -18); // past the z=14 palm row so its fronds don't fill the frame
      s.speedKmh = 61; s.mission = 0; s.stage = 2; s.timer = 96;
      MB.HUD.say(0);
      MB.HUD.setMode('drive');
      MB.HUD.update(s, { wanted: 4, t: 0, onFoot: false, px: 0, pz: -18, heading: Math.PI, dots: G.minimapDots() });
      document.getElementById('dialog').style.display = 'none'; // hero sits behind the dialogue bar otherwise
    } else if (shot === 4) {
      // GARAGE — the interior: hero wedge on the turntable, headlights on,
      // tool racks + tyre stacks readable, upgrade + gear panels.
      MB.Garage.show(true);
      hero.visible = false;
      G.playerOnFoot.visible = false;
      G.traffic.forEach(function (c) { c.group.visible = false; });
      MB.Police.setWanted(0);
      var gh = MB.Police.heli(); if (gh) gh.visible = false;
      cam.position.set(126.5, 3.0, -11.5); cam.lookAt(120, 0.9, -20);
      MB.HUD.setMode('garage');
      MB.HUD.renderGarage();
      MB.HUD.update(s, { wanted: 0, t: 0, onFoot: false, px: 0, pz: 0, heading: 0, dots: [] });
    }
  }
  return { stage: stage };
})();
