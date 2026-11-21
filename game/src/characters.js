// MARISOL BAY — people. One job: low-poly characters (player, enemies,
// pedestrians) with readable poses: aiming, downed, walking, fleeing.
var MB = MB || {};
MB.Characters = (function () {
  function mat(color, rough) {
    return new THREE.MeshStandardMaterial({ color: color, roughness: rough === undefined ? 0.85 : rough });
  }
  // A standing person: head, torso, arms, legs. ~1.8 units tall.
  function buildPerson(shirt, pants, skin, opts) {
    opts = opts || {};
    var g = new THREE.Group();
    var skinM = mat(skin || 0xc98a5e), shirtM = mat(shirt), pantsM = mat(pants);
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.34), skinM);
    head.position.y = 1.62; head.castShadow = true; g.add(head);
    var hair = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.36), mat(0x1a1210));
    hair.position.y = 1.84; g.add(hair);
    var torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 0.34), shirtM);
    torso.position.y = 1.08; torso.castShadow = true; g.add(torso);
    var armL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.66, 0.16), shirtM);
    armL.position.set(-0.4, 1.08, 0); armL.castShadow = true; g.add(armL);
    var armR = armL.clone(); armR.position.x = 0.4; g.add(armR);
    var legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.22), pantsM);
    legL.position.set(-0.16, 0.36, 0); legL.castShadow = true; g.add(legL);
    var legR = legL.clone(); legR.position.x = 0.16; g.add(legR);
    if (opts.aim) {
      // both arms forward, gun in hand: the aiming pose
      armL.position.set(-0.18, 1.28, 0.3); armL.rotation.x = -Math.PI / 2 + 0.25;
      armR.position.set(0.18, 1.28, 0.3); armR.rotation.x = -Math.PI / 2 + 0.25;
      var gun = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.42), mat(0x14141a, 0.4));
      gun.position.set(0, 1.32, 0.62); g.add(gun);
      g.userData.muzzle = new THREE.Vector3(0, 1.32, 0.85);
    }
    if (opts.cap) {
      var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12), mat(0x16233d));
      cap.position.y = 1.92; g.add(cap);
    }
    g.userData.armL = armL; g.userData.armR = armR;
    g.userData.legL = legL; g.userData.legR = legR;
    return g;
  }
  // A downed person: lying flat on the road, arms out.
  function buildDowned(shirt, pants, skin) {
    var g = buildPerson(shirt, pants, skin);
    g.rotation.x = -Math.PI / 2 + 0.12;
    g.rotation.z = 0.5;
    g.position.y = 0.22;
    return g;
  }
  // Red diamond marker floating over a hostile (canvas sprite).
  function markerSprite() {
    var c = document.createElement('canvas'); c.width = 64; c.height = 64;
    var x = c.getContext('2d');
    x.fillStyle = '#ff2222'; x.strokeStyle = '#ffffff'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(32, 6); x.lineTo(58, 32); x.lineTo(32, 58); x.lineTo(6, 32); x.closePath();
    x.fill(); x.stroke();
    var t = new THREE.CanvasTexture(c);
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
    s.scale.set(0.9, 0.9, 1); return s;
  }
  // Walk-cycle swing for a pedestrian.
  function walkSwing(person, t, amp) {
    var s = Math.sin(t * 6) * (amp || 0.5);
    person.userData.legL.rotation.x = s;
    person.userData.legR.rotation.x = -s;
    person.userData.armL.rotation.x = -s * 0.7;
    person.userData.armR.rotation.x = s * 0.7;
  }
  return { buildPerson: buildPerson, buildDowned: buildDowned, markerSprite: markerSprite, walkSwing: walkSwing };
})();
