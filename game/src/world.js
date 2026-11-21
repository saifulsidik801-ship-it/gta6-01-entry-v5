// MARISOL BAY — the city itself. One job: renderer, dusk sky, lights,
// streets, buildings, palms, beach, traffic and pedestrians. Everything here
// is placed with the seeded RNG so ?seed=1 always builds the same city.
var MB = MB || {};
MB.World = (function () {
  var W = 1024, H = 576;
  var renderer, scene, camera;
  var traffic = [], peds = [], lamps = [], fires = [];
  var winMatOn, winMatOff, glowWhite, glowRed, glowBlue, glowOrange;

  function glowTexture(inner, outer) {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, inner); grad.addColorStop(1, outer);
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  function glowSprite(tex, scale, opacity) {
    var m = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: opacity });
    var s = new THREE.Sprite(m); s.scale.set(scale, scale, 1); return s;
  }

  function buildSky() {
    var skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, fog: false, depthWrite: false, uniforms: {},
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vP; void main(){ float t = clamp(normalize(vP).y, -0.05, 1.0); vec3 top = vec3(0.22,0.13,0.38); vec3 mid = vec3(0.88,0.38,0.52); vec3 hor = vec3(1.0,0.70,0.42); vec3 c = mix(hor, mid, smoothstep(0.0,0.22,t)); c = mix(c, top, smoothstep(0.22,0.75,t)); gl_FragColor = vec4(c, 1.0); }'
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), skyMat));
    // low dusk clouds: flat warm ellipses drifting above the skyline
    var cloudMat = new THREE.MeshBasicMaterial({ color: 0xff9a7a, transparent: true, opacity: 0.35, fog: false });
    for (var i = 0; i < 9; i++) {
      var cl = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), cloudMat);
      cl.scale.set(MB.range(14, 30), MB.range(1.6, 3), MB.range(5, 9));
      cl.position.set(MB.range(-120, 120), MB.range(34, 58), MB.range(-160, -40));
      scene.add(cl);
    }
  }

  function buildLights() {
    var sun = new THREE.DirectionalLight(0xffb36b, 3.2);
    sun.position.set(55, 30, -70); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
    sun.shadow.camera.far = 260;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x8a6fd6, 0x5a3a28, 1.25));
    var fill = new THREE.DirectionalLight(0xffe0b0, 1.0);
    fill.position.set(10, 20, 40); scene.add(fill);
  }

  function buildGround() {
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: 0x6a5a50, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; scene.add(ground);
    var road = new THREE.Mesh(new THREE.PlaneGeometry(15, 320), new THREE.MeshStandardMaterial({ color: 0x9a8690, roughness: 0.9 }));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -60); road.receiveShadow = true; scene.add(road);
    // cross streets
    for (var cz = -20; cz > -120; cz -= 40) {
      var cross = new THREE.Mesh(new THREE.PlaneGeometry(90, 10), new THREE.MeshStandardMaterial({ color: 0x5d4b55, roughness: 0.9 }));
      cross.rotation.x = -Math.PI / 2; cross.position.set(0, 0.01, cz); cross.receiveShadow = true; scene.add(cross);
    }
    var dashMat = new THREE.MeshStandardMaterial({ color: 0xd8d2c0, roughness: 0.8 });
    for (var z = 30; z > -140; z -= 8) {
      var d = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 2.4), dashMat);
      d.position.set(0, 0.02, z); scene.add(d);
    }
    // sidewalks
    var walkMat = new THREE.MeshStandardMaterial({ color: 0x8a7a72, roughness: 1 });
    for (var side of [-1, 1]) {
      var w = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 320), walkMat);
      w.rotation.x = -Math.PI / 2; w.position.set(side * 9.8, 0.03, -60); w.receiveShadow = true; scene.add(w);
    }
    var sand = new THREE.Mesh(new THREE.PlaneGeometry(60, 320), new THREE.MeshStandardMaterial({ color: 0xc9a06a, roughness: 1 }));
    sand.rotation.x = -Math.PI / 2; sand.position.set(42, 0.02, -60); sand.receiveShadow = true; scene.add(sand);
    var sea = new THREE.Mesh(new THREE.PlaneGeometry(120, 320), new THREE.MeshStandardMaterial({ color: 0x2a5f8a, roughness: 0.18, metalness: 0.45 }));
    sea.rotation.x = -Math.PI / 2; sea.position.set(120, 0.0, -60); scene.add(sea);
    // beach umbrellas
    for (var u of [[20, -6, 0xff5a5a], [26, -18, 0xffd23e], [22, -30, 0x3ec6ff], [30, 8, 0xff8a80]]) {
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
      pole.position.set(u[0], 1.1, u[1]); scene.add(pole);
      var top = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.7, 10), new THREE.MeshStandardMaterial({ color: u[2], roughness: 0.8 }));
      top.position.set(u[0], 2.4, u[1]); top.castShadow = true; scene.add(top);
    }
  }

  function building(x, z, w, h, d, col) {
    var g = new THREE.Group();
    var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: col, roughness: 0.85 }));
    b.position.y = h / 2; b.castShadow = true; b.receiveShadow = true; g.add(b);
    // roof rim light strip (dusk neon edge)
    var rim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.12, d + 0.1), new THREE.MeshStandardMaterial({ color: 0x201a10, emissive: 0xff7a5a, emissiveIntensity: 0.7 }));
    rim.position.y = h + 0.05; g.add(rim);
    var face = (x < 0) ? 1 : -1;
    var cols = Math.max(2, Math.floor(w / 2.4)), rows = Math.max(2, Math.floor(h / 2.6));
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      if (MB.rng() < 0.45) continue;
      var win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), MB.rng() < 0.62 ? winMatOn : winMatOff);
      win.position.set((c - (cols - 1) / 2) * 2.4, 2 + r * 2.6, face * (d / 2 + 0.03));
      if (face < 0) win.rotation.y = Math.PI;
      g.add(win);
    }
    g.position.set(x, 0, z);
    scene.add(g);
  }

  function buildBuildings() {
    var bcols = [0x7a8296, 0x8a8a9e, 0x6a768e, 0x9a8a72, 0x5a6a8e];
    for (var z = 20; z > -100; z -= 18) {
      building(-16 - MB.rng() * 4, z, 9 + MB.rng() * 5, 10 + MB.rng() * 16, 9, MB.pick(bcols));
      building(26 + MB.rng() * 4, z - 9, 9 + MB.rng() * 5, 10 + MB.rng() * 16, 9, MB.pick(bcols));
    }
    // a taller landmark tower down the avenue, lit crown
    var tw = new THREE.Mesh(new THREE.BoxGeometry(12, 34, 12), new THREE.MeshStandardMaterial({ color: 0x5a6a8e, roughness: 0.8 }));
    tw.position.set(-20, 17, -78); tw.castShadow = true; scene.add(tw);
    var crown = new THREE.Mesh(new THREE.BoxGeometry(12.3, 1.2, 12.3), new THREE.MeshStandardMaterial({ color: 0x201a10, emissive: 0xffc46a, emissiveIntensity: 1.8 }));
    crown.position.set(-20, 34.5, -78); scene.add(crown);
  }

  function palm(lean) {
    var g = new THREE.Group();
    var curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(lean * 0.7, 3.4, 0),
      new THREE.Vector3(lean * 1.6, 6.4, 0)
    );
    var trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.17, 7), new THREE.MeshStandardMaterial({ color: 0x8a6b48, roughness: 1 }));
    trunk.castShadow = true; g.add(trunk);
    var top = new THREE.Vector3(lean * 1.6, 6.4, 0);
    var frondMat = new THREE.MeshStandardMaterial({ color: 0x3f8f3a, roughness: 0.9, side: THREE.DoubleSide });
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * Math.PI * 2;
      var f = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.55), frondMat);
      f.position.set(top.x + Math.cos(a) * 1.2, top.y + 0.15, top.z + Math.sin(a) * 1.2);
      f.rotation.set(0.55, -a, 0.3, 'YXZ');
      f.castShadow = true; g.add(f);
    }
    return g;
  }

  function buildPalms() {
    for (var z = 24; z > -90; z -= 14) {
      var p1 = palm(1); p1.position.set(-9.5, 0, z); scene.add(p1);
      var p2 = palm(-1); p2.position.set(9.8, 0, z - 7); scene.add(p2);
    }
  }

  function buildLamps() {
    var poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.6, metalness: 0.5 });
    var lampMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffd9a0, emissiveIntensity: 2.2 });
    for (var z = 18; z > -90; z -= 22) {
      for (var side of [-1, 1]) {
        var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 5.4, 8), poleMat);
        pole.position.set(side * 7.6, 2.7, z); pole.castShadow = true; scene.add(pole);
        var head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), lampMat);
        head.position.set(side * 7.6, 5.5, z); scene.add(head);
        var gl = glowSprite(glowWhite, 3.2, 0.5); gl.position.set(side * 7.6, 5.5, z); scene.add(gl);
        lamps.push(gl);
      }
    }
  }

  function addFire(x, z, big) {
    var g = new THREE.Group();
    var flame = glowSprite(glowOrange, big ? 6 : 3.5, 0.9); flame.position.set(0, 1.2, 0); g.add(flame);
    var smoke = glowSprite(glowWhite, big ? 7 : 4, 0.25); smoke.position.set(0, 3.2, 0); g.add(smoke);
    var light = new THREE.PointLight(0xff7722, 6, 14); light.position.set(0, 1.5, 0); g.add(light);
    g.position.set(x, 0, z); scene.add(g);
    fires.push({ group: g, flame: flame, base: big ? 6 : 3.5, t: MB.rng() * 10 });
    return g;
  }

  return {
    init: function (canvas) {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(W, H); renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.78;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xe08a55, 70, 260);
      camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 800);
      camera.position.set(2.5, 3.2, 18.5); camera.lookAt(0, 3.8, -22);
      winMatOn = new THREE.MeshStandardMaterial({ color: 0x201a10, emissive: 0xffc46a, emissiveIntensity: 1.4 });
      winMatOff = new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: 0.6 });
      glowWhite = glowTexture('rgba(255,244,200,0.95)', 'rgba(255,244,200,0)');
      glowRed = glowTexture('rgba(255,40,40,0.9)', 'rgba(255,40,40,0)');
      glowBlue = glowTexture('rgba(60,120,255,0.9)', 'rgba(60,120,255,0)');
      glowOrange = glowTexture('rgba(255,140,30,0.95)', 'rgba(255,80,10,0)');
      buildSky(); buildLights(); buildGround(); buildBuildings(); buildPalms(); buildLamps();
      return { renderer: renderer, scene: scene, camera: camera };
    },
    glowSprite: glowSprite,
    textures: function () { return { white: glowWhite, red: glowRed, blue: glowBlue, orange: glowOrange }; },
    addFire: addFire,
    update: function (dt, t) {
      for (var i = 0; i < fires.length; i++) {
        var f = fires[i]; f.t += dt;
        f.flame.material.opacity = 0.65 + 0.3 * Math.sin(f.t * 9 + i * 2);
        f.flame.scale.setScalar(f.base * (0.9 + 0.15 * Math.sin(f.t * 7)));
      }
      for (var j = 0; j < lamps.length; j++) lamps[j].material.opacity = 0.42 + 0.08 * Math.sin(t * 2 + j);
    },
    traffic: traffic, peds: peds, scene: function () { return scene; },
    camera: function () { return camera; }, renderer: function () { return renderer; },
  };
})();
