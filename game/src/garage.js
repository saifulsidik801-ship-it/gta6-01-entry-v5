// MARISOL BAY — the garage. One job: the Hillside Garage interior scene
// (a real room, not a building facade) and the upgrade / gear store.
// The hero car sits on a lit turntable, fully visible, headlights on.
var MB = MB || {};
MB.Garage = (function () {
  var group = null, turntable = null, heroRef = null, neon = null;
  function build(scene) {
    group = new THREE.Group();
    // floor: dark concrete with a painted hazard ring
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 20), new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; group.add(floor);
    var ring = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.9, 48), new THREE.MeshStandardMaterial({ color: 0xffd23e, roughness: 0.7 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; group.add(ring);
    var ring2 = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.35, 48), new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.7 }));
    ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.02; group.add(ring2);
    // back wall: warm wood panels + a container wall on the side
    var wallMat = new THREE.MeshStandardMaterial({ color: 0x8a6b48, roughness: 0.9 });
    var back = new THREE.Mesh(new THREE.BoxGeometry(26, 7, 0.4), wallMat);
    back.position.set(0, 3.5, -9); group.add(back);
    var contMat = new THREE.MeshStandardMaterial({ color: 0x3a6a8a, roughness: 0.8, metalness: 0.3 });
    var cont = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6, 18), contMat);
    cont.position.set(-12.5, 3, 0); group.add(cont);
    // tool rack: pegboard + shelves with readable boxes and cans
    var board = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 0.15), new THREE.MeshStandardMaterial({ color: 0x6a4a28, roughness: 0.9 }));
    board.position.set(-7, 2.6, -8.7); group.add(board);
    var toolCols = [0xd92b1e, 0xffd23e, 0x3ec6ff, 0x5df08a, 0xff9f1c];
    for (var i = 0; i < 10; i++) {
      var tool = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.7, 0.1), new THREE.MeshStandardMaterial({ color: toolCols[i % toolCols.length], roughness: 0.6 }));
      tool.position.set(-9 + (i % 5) * 0.9, 2.9 - Math.floor(i / 5) * 1.1, -8.6); group.add(tool);
    }
    // tyre stacks (readable black donuts) + a workbench with parts
    var tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
    for (var s = 0; s < 2; s++) {
      for (var k = 0; k < 3; k++) {
        var tyre = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.18, 10, 20), tireMat);
        tyre.rotation.x = Math.PI / 2; tyre.position.set(8.5 + s * 2.2, 0.2 + k * 0.38, -7.5); tyre.castShadow = true; group.add(tyre);
      }
    }
    var bench = new THREE.Mesh(new THREE.BoxGeometry(4, 0.15, 1.2), new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.9 }));
    bench.position.set(7.5, 1.0, -8.2); bench.castShadow = true; group.add(bench);
    for (var b = 0; b < 4; b++) {
      var part = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.35), new THREE.MeshStandardMaterial({ color: toolCols[b], roughness: 0.5, metalness: 0.4 }));
      part.position.set(6.2 + b * 0.9, 1.2, -8.2); group.add(part);
    }
    // neon sign: HILLSIDE GARAGE in warm tubes
    neon = new THREE.Mesh(new THREE.BoxGeometry(7, 0.9, 0.12), new THREE.MeshStandardMaterial({ color: 0x201a10, emissive: 0xff5a4e, emissiveIntensity: 1.6 }));
    neon.position.set(0, 5.6, -8.7); group.add(neon);
    // ceiling lights: bright warm strips so the interior reads
    var stripMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffe9b0, emissiveIntensity: 2.4 });
    for (var l = 0; l < 3; l++) {
      var strip = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 0.5), stripMat);
      strip.position.set(-6 + l * 6, 6.4, -2); group.add(strip);
      var pl = new THREE.PointLight(0xffe0b0, 1.6, 16); pl.position.set(-6 + l * 6, 6, -2); group.add(pl);
    }
    // turntable + hero car, headlights ON, fully visible from the front 3/4
    turntable = new THREE.Group();
    var disc = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.18, 40), new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.5, metalness: 0.4 }));
    disc.position.y = 0.09; disc.receiveShadow = true; turntable.add(disc);
    heroRef = MB.Vehicles.wedgeCar(0xd92b1e, { pinstripe: true, headlights: true, underglow: false });
    heroRef.position.y = 0.18; heroRef.rotation.y = Math.PI + 0.6;
    turntable.add(heroRef);
    group.add(turntable);
    group.visible = false;
    scene.add(group);
    return group;
  }
  function show(v) { if (group) group.visible = v; }
  function update(dt, t) {
    if (!group || !group.visible) return;
    if (turntable) turntable.rotation.y = t * 0.25;
    if (neon) neon.material.emissiveIntensity = 1.4 + 0.4 * Math.sin(t * 3);
  }
  function buyUpgrade(i) {
    var u = MB.UPGRADES[i];
    if (!u || u.owned || u.lock) return 'locked';
    var s = MB.Missions.state;
    if (s.cash < u.price) return 'poor';
    s.cash -= u.price; u.owned = true;
    if (u.name === 'REPAIR') s.condition = 100;
    if (u.name === 'ARMOUR PLATING') s.armour = Math.min(100, s.armour + 25);
    return 'bought';
  }
  function buyGear(i) {
    var g = MB.GEAR[i];
    if (!g || g.owned) return 'locked';
    var s = MB.Missions.state;
    if (s.cash < g.price) return 'poor';
    s.cash -= g.price; g.owned = true;
    return 'bought';
  }
  return { build: build, show: show, update: update, buyUpgrade: buyUpgrade, buyGear: buyGear, hero: function () { return heroRef; } };
})();
