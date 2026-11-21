// MARISOL BAY — wanted level and police. One job: stars, police cruisers
// that chase / ram / flank, and the air unit. The heli's orbit (26 m radius,
// 20 m height, 0.45 rad/s) is a gameplay constant from config — visuals only
// change the body, never these numbers.
var MB = MB || {};
MB.Police = (function () {
  var cruisers = [], heli = null, heliAngle = 0.6, heliLight = null;
  var wanted = 2, heat = 0;

  function spawnCruisers(scene, n) {
    clear(scene);
    var spots = [[-2.2, -4, 0.15], [3.0, -12, -0.2], [-3.4, -22, 0.1], [4.4, -30, -0.3], [-1.0, 14, 2.9]];
    for (var i = 0; i < n; i++) {
      var c = MB.Vehicles.wedgeCar(0xf2f2ee, { lightBar: true, headlights: true });
      var sp = spots[i % spots.length];
      c.position.set(sp[0], 0, sp[1]);
      c.rotation.y = Math.PI + sp[2];
      c.userData = { speed: 0, lane: sp[0], target: null };
      scene.add(c); cruisers.push(c);
    }
  }
  function clear(scene) {
    for (var i = 0; i < cruisers.length; i++) scene.remove(cruisers[i]);
    cruisers = [];
  }
  function spawnHeli(scene) {
    if (heli) scene.remove(heli);
    heli = MB.Vehicles.buildHeli();
    heli.position.set(-0.5, 15, -36); heli.scale.setScalar(0.8); heli.rotation.y = 0.15;
    scene.add(heli);
    heliLight = new THREE.PointLight(0xfff2c0, 2.2, 30);
    scene.add(heliLight);
    return heli;
  }
  function update(dt, t, playerPos, playerSpeed, mode) {
    // wanted decays when the player is slow and out of sight, rises on crime
    if (mode === 'drive' && playerSpeed < 2) heat = Math.max(0, heat - dt * 0.06);
    if (heat <= 0 && wanted > 0 && mode === 'drive') wanted = Math.max(0, wanted - dt * 0.02);
    // cruisers: steer toward the player and ram; fall back when wanted is 0
    for (var i = 0; i < cruisers.length; i++) {
      var c = cruisers[i];
      if (wanted === 0 || mode === 'garage') { c.userData.speed = Math.max(0, c.userData.speed - dt * 4); }
      else {
        var dx = playerPos.x - c.position.x, dz = playerPos.z - c.position.z;
        var dist = Math.max(0.1, Math.sqrt(dx * dx + dz * dz));
        var want = Math.atan2(dx, dz);
        var cur = c.rotation.y;
        var diff = want - cur;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        c.rotation.y = cur + MB.clamp(diff, -1.6 * dt, 1.6 * dt);
        c.userData.speed = MB.clamp(c.userData.speed + dt * 6, 0, 13 + wanted);
        if (dist < 3.2) c.userData.speed = Math.max(0, c.userData.speed - dt * 10);
      }
      c.position.x += Math.sin(c.rotation.y) * c.userData.speed * dt;
      c.position.z += Math.cos(c.rotation.y) * c.userData.speed * dt;
      if (c.position.z < -90) c.position.z = 20;
      if (c.position.z > 28) c.position.z = -80;
    }
    // heli: orbit the player at the locked gameplay radius / height / speed
    if (heli) {
      heliAngle += MB.HELI_ORBIT_W * dt;
      var vis = wanted >= 2;
      heli.visible = vis;
      if (heliLight) heliLight.visible = vis;
      if (vis) {
        heli.position.set(
          playerPos.x + Math.cos(heliAngle) * MB.HELI_ORBIT_R,
          MB.HELI_ORBIT_H,
          playerPos.z + Math.sin(heliAngle) * MB.HELI_ORBIT_R
        );
        heli.rotation.y = Math.atan2(playerPos.x - heli.position.x, playerPos.z - heli.position.z) + Math.PI;
        if (heliLight) heliLight.position.set(heli.position.x, heli.position.y - 1, heli.position.z);
      }
    }
  }
  return {
    spawnCruisers: spawnCruisers, spawnHeli: spawnHeli, update: update,
    cruisers: function () { return cruisers; },
    heli: function () { return heli; },
    wanted: function () { return wanted; },
    setWanted: function (w) { wanted = MB.clamp(Math.round(w), 0, 4); heat = wanted > 0 ? 1 : 0; },
    addHeat: function (h) { heat = MB.clamp(heat + h, 0, 4); wanted = Math.max(wanted, Math.ceil(heat)); },
    coolDown: function () { heat = 0; wanted = 0; },
  };
})();
