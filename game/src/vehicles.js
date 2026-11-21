// MARISOL BAY — vehicles. One job: every car and the helicopter, built from
// shaped meshes (extruded wedge profiles, lathe fuselage), never boxes.
// BEVEL RULE: the body bevel adds ~0.10 to every surface — side details sit
// at z >= 1.09, roof details at y >= 1.12, rear at x <= -2.54, front at
// x >= 2.56, or the bevel swallows them.
var MB = MB || {};
MB.Vehicles = (function () {
  var T = MB.World;

  // The hero wedge: ONE smooth dome (peak 1.16), no cabin hump, no glass,
  // no lights / wing / grille on the car itself — the reference car is a
  // single smooth red pod with a gold pinstripe.
  function wedgeCar(paint, opts) {
    opts = opts || {};
    var g = new THREE.Group();
    var s = new THREE.Shape();
    s.moveTo(-2.42, 0.3);
    s.quadraticCurveTo(-2.52, 0.62, -1.95, 0.78);
    s.bezierCurveTo(-1.1, 1.08, -0.3, 1.16, 0.4, 1.02);   // roof DOME, peak 1.16
    s.bezierCurveTo(1.1, 0.88, 1.8, 0.6, 2.35, 0.4);
    s.quadraticCurveTo(2.62, 0.32, 2.5, 0.22);
    s.quadraticCurveTo(2.2, 0.2, 1.9, 0.22);
    s.lineTo(-2.42, 0.3);
    var geo = new THREE.ExtrudeGeometry(s, {
      depth: 1.95, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.10, bevelSegments: 3, steps: 1
    });
    geo.translate(0, 0, -0.975);
    var paintMat = new THREE.MeshStandardMaterial({ color: paint, metalness: 0.6, roughness: 0.3 });
    var body = new THREE.Mesh(geo, paintMat);
    body.castShadow = true; body.receiveShadow = true; g.add(body);
    var trimMat = new THREE.MeshStandardMaterial({ color: 0x14141a, roughness: 0.6, metalness: 0.3 });
    if (!opts.simple) {
      // fender haunches over the wheels
      for (var h of [[-1.55, 1.15], [1.55, 0.95]]) {
        for (var wz of [1.0, -1.0]) {
          var ha = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), paintMat);
          ha.scale.set(h[1], 0.62, 0.32); ha.position.set(h[0], 0.62, wz * 0.92); ha.castShadow = true; g.add(ha);
        }
      }
      // wheel-arch trim
      var archMat = new THREE.MeshStandardMaterial({ color: 0x14141a, roughness: 0.6 });
      for (var a of [[1.55, 1.06], [1.55, -1.06], [-1.55, 1.06], [-1.55, -1.06]]) {
        var arch = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.045, 8, 20, Math.PI), archMat);
        arch.position.set(a[0], 0.42, a[1]);
        if (a[1] < 0) arch.rotation.y = Math.PI;
        g.add(arch);
      }
      // door outline + handle + mirrors (z >= 1.09, outside the bevel)
      for (var dz of [1.09, -1.09]) {
        var sk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 0.05), trimMat);
        sk.position.set(0, 0.3, dz); g.add(sk);
        var edges = [[0.65, 0.48, 0.07, 0.3], [-0.95, 0.48, 0.07, 0.3], [-0.15, 0.62, 1.67, 0.07], [-0.15, 0.34, 1.67, 0.07]];
        for (var e of edges) {
          var em = new THREE.Mesh(new THREE.BoxGeometry(e[2], e[3], 0.03), trimMat);
          em.position.set(e[0], e[1], dz); g.add(em);
        }
        var handle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.04), new THREE.MeshStandardMaterial({ color: 0xd8dce0, metalness: 0.9, roughness: 0.2 }));
        handle.position.set(0.4, 0.56, dz * 1.01); g.add(handle);
        var stalk = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.16), trimMat);
        stalk.position.set(0.7, 0.82, dz); g.add(stalk);
        var mir = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.16), paintMat);
        mir.position.set(0.7, 0.88, dz * 1.1); g.add(mir);
      }
      // front splitter + hood creases
      var lip = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 2.0), trimMat);
      lip.position.set(2.62, 0.16, 0); g.add(lip);
      var bulge = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.9), paintMat);
      bulge.position.set(1.3, 0.64, 0); bulge.rotation.z = -0.14; g.add(bulge);
    }
    // wheels: tyre r 0.42, plain grey disc r 0.28 (like the reference)
    var wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 20);
    var tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    var discMat = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.6, roughness: 0.4 });
    for (var w of [[1.55, 0.95], [1.55, -0.95], [-1.55, 0.95], [-1.55, -0.95]]) {
      var wh = new THREE.Mesh(wheelGeo, tireMat); wh.rotation.x = Math.PI / 2; wh.position.set(w[0], 0.42, w[1]); wh.castShadow = true; g.add(wh);
      var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.36, 20), discMat);
      disc.rotation.x = Math.PI / 2; disc.position.set(w[0], 0.42, w[1]); g.add(disc);
    }
    if (opts.pinstripe) {
      for (var pz of [1.09, -1.09]) {
        var ps = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.03, 0.03), new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 }));
        ps.position.set(0, 0.7, pz); g.add(ps);
      }
    }
    if (opts.headlights) {
      var headMat = new THREE.MeshStandardMaterial({ color: 0x333322, emissive: 0xffe9b0, emissiveIntensity: 2.0 });
      for (var hz of [0.6, -0.6]) {
        var hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.55), headMat);
        hl.position.set(2.56, 0.5, hz); g.add(hl);
      }
      var hg = T.glowSprite(T.textures().white, 1.6, 0.4); hg.position.set(2.9, 0.5, 0); g.add(hg);
      var tailMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff1a1a, emissiveIntensity: 2.0 });
      for (var tz of [0.6, -0.6]) {
        var tl = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 16), tailMat);
        tl.rotation.z = Math.PI / 2; tl.position.set(-2.54, 0.5, tz); g.add(tl);
      }
    }
    if (opts.underglow) {
      var ug = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.2), new THREE.MeshBasicMaterial({ map: T.textures().red, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
      ug.rotation.x = -Math.PI / 2; ug.position.set(0, 0.06, 0); g.add(ug);
      var upl = new THREE.PointLight(0xff2222, 5, 7); upl.position.set(0, 0.6, 0); g.add(upl);
    }
    if (opts.lightBar) {
      var bar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 1.3), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4 }));
      bar.position.set(-0.15, 1.06, 0); g.add(bar);
      var r = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.6), new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2222, emissiveIntensity: 3 }));
      r.position.set(-0.15, 1.16, 0.32); g.add(r);
      var b = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.6), new THREE.MeshStandardMaterial({ color: 0x000033, emissive: 0x2244ff, emissiveIntensity: 3 }));
      b.position.set(-0.15, 1.16, -0.32); g.add(b);
      var tex = T.textures();
      var pr = T.glowSprite(tex.red, 3.0, 0.5); pr.position.set(0, 0.3, 1.6); g.add(pr);
      var pb = T.glowSprite(tex.blue, 3.0, 0.5); pb.position.set(0, 0.3, -1.6); g.add(pb);
      var plR = new THREE.PointLight(0xff2222, 3, 9); plR.position.set(0, 1.2, 1.6); g.add(plR);
      var plB = new THREE.PointLight(0x2244ff, 3, 9); plB.position.set(0, 1.2, -1.6); g.add(plB);
    }
    return g;
  }

  // Classic sedan: long flat hood, upright glasshouse, chrome bumpers.
  function sedanCar(paint) {
    var g = new THREE.Group();
    var paintMat = new THREE.MeshStandardMaterial({ color: paint, metalness: 0.5, roughness: 0.35 });
    var chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8dce0, metalness: 0.95, roughness: 0.15 });
    var trimMat = new THREE.MeshStandardMaterial({ color: 0x14141a, roughness: 0.6, metalness: 0.3 });
    var s = new THREE.Shape();
    s.moveTo(2.3, 0.22); s.quadraticCurveTo(2.48, 0.3, 2.48, 0.48); s.lineTo(2.35, 0.62);
    s.lineTo(0.7, 0.62); s.quadraticCurveTo(0.35, 0.85, 0.05, 1.0); s.lineTo(-0.9, 1.0);
    s.quadraticCurveTo(-1.3, 0.95, -1.6, 0.68); s.lineTo(-2.15, 0.64); s.lineTo(-2.2, 0.22); s.lineTo(2.3, 0.22);
    var geo = new THREE.ExtrudeGeometry(s, { depth: 2.0, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 });
    geo.translate(0, 0, -1.0);
    var body = new THREE.Mesh(geo, paintMat); body.castShadow = true; body.receiveShadow = true; g.add(body);
    var gs = new THREE.Shape();
    gs.moveTo(0.65, 0.62); gs.quadraticCurveTo(0.4, 0.92, 0.05, 1.06); gs.lineTo(-0.85, 1.06);
    gs.quadraticCurveTo(-1.2, 1.0, -1.45, 0.68); gs.lineTo(0.65, 0.62);
    var ggeo = new THREE.ExtrudeGeometry(gs, { depth: 2.2, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
    ggeo.translate(0, 0, -1.1);
    var glass = new THREE.Mesh(ggeo, new THREE.MeshStandardMaterial({ color: 0x1a2836, metalness: 0.85, roughness: 0.08 }));
    glass.castShadow = true; g.add(glass);
    for (var bx of [2.58, -2.32]) {
      var b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.95), chromeMat);
      b.position.set(bx, 0.28, 0); g.add(b);
    }
    var headMat = new THREE.MeshStandardMaterial({ color: 0x333322, emissive: 0xffe9b0, emissiveIntensity: 2.0 });
    for (var hz of [0.75, -0.75]) {
      var hl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 20), headMat);
      hl.rotation.z = Math.PI / 2; hl.position.set(2.56, 0.5, hz); g.add(hl);
    }
    var wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 20);
    var tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    for (var w of [[1.45, 0.9], [1.45, -0.9], [-1.45, 0.9], [-1.45, -0.9]]) {
      var wh = new THREE.Mesh(wheelGeo, tireMat); wh.rotation.x = Math.PI / 2; wh.position.set(w[0], 0.38, w[1]); wh.castShadow = true; g.add(wh);
      var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 16), chromeMat);
      cap.rotation.x = Math.PI / 2; cap.position.set(w[0], 0.38, w[1]); g.add(cap);
    }
    return g;
  }

  // Helicopter: lathe fuselage (white), dark belly + glass, tail boom,
  // rotor disc, spotlight cone + ground pool. Reads clearly from below
  // because the belly carries its own searchlight housing.
  function buildHeli() {
    var heli = new THREE.Group();
    var prof = [];
    prof.push(new THREE.Vector2(0.02, -2.6)); prof.push(new THREE.Vector2(0.55, -2.3));
    prof.push(new THREE.Vector2(0.85, -1.2)); prof.push(new THREE.Vector2(0.88, 0.0));
    prof.push(new THREE.Vector2(0.78, 1.1)); prof.push(new THREE.Vector2(0.45, 1.9));
    prof.push(new THREE.Vector2(0.02, 2.15));
    var fus = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), new THREE.MeshStandardMaterial({ color: 0xf4f4f0, metalness: 0.35, roughness: 0.35 }));
    fus.rotation.x = Math.PI / 2; fus.castShadow = true; heli.add(fus);
    var belly = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), new THREE.MeshStandardMaterial({ color: 0x4a5a73, metalness: 0.4, roughness: 0.5 }));
    belly.scale.set(0.95, 0.45, 2.1); belly.position.set(0, -0.45, 0.1); heli.add(belly);
    var sl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffffff, emissiveIntensity: 2.5 }));
    sl.position.set(0, -0.82, -0.6); heli.add(sl);
    var glass = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), new THREE.MeshStandardMaterial({ color: 0x0a1424, metalness: 0.9, roughness: 0.1 }));
    glass.scale.set(1.0, 0.75, 1.1); glass.position.set(0, 0.18, -1.75); heli.add(glass);
    // red rescue stripe along the flank so the white body reads at dusk
    var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 3.4), new THREE.MeshStandardMaterial({ color: 0xd92b1e, roughness: 0.5 }));
    stripe.position.set(0.88, 0.05, 0); heli.add(stripe);
    var stripe2 = stripe.clone(); stripe2.position.x = -0.88; heli.add(stripe2);
    var boom = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 3.4, 10), new THREE.MeshStandardMaterial({ color: 0xe8e8e2, metalness: 0.3, roughness: 0.4 }));
    boom.rotation.x = Math.PI / 2; boom.position.set(0, 0.12, 3.6); boom.castShadow = true; heli.add(boom);
    var fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.7), new THREE.MeshStandardMaterial({ color: 0x16233d, metalness: 0.3, roughness: 0.5 }));
    fin.position.set(0, 0.55, 5.1); heli.add(fin);
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    mast.position.set(0, 1.0, 0); heli.add(mast);
    var bladeMat = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.6 });
    for (var a of [0, Math.PI / 2]) {
      var bl = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.06, 0.34), bladeMat);
      bl.position.set(0, 1.35, 0); bl.rotation.y = a; bl.castShadow = true; heli.add(bl);
    }
    var disc = new THREE.Mesh(new THREE.CircleGeometry(3.9, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.set(0, 1.35, 0); heli.add(disc);
    var cone = new THREE.Mesh(new THREE.ConeGeometry(2.8, 22, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff8dd, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.position.set(0, -12.4, -1.5); cone.rotation.x = 0.06; heli.add(cone);
    var pool = T.glowSprite(T.textures().white, 11, 0.5);
    pool.position.set(0, -24.4, -3); heli.add(pool);
    heli.userData.pool = pool; // ground pool: correct for orbit height 20 / scale 0.8; staged shots re-place it
    return heli;
  }

  return { wedgeCar: wedgeCar, sedanCar: sedanCar, buildHeli: buildHeli };
})();
