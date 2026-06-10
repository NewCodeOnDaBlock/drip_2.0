/* ============================================================
   DRIPP IV — WebGL Particle System (Three.js r128)
   ============================================================ */

(function () {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  /* ── Scene Setup ── */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  /* ── Particle Data ── */
  const IS_MOBILE = innerWidth < 768;
  const COUNT = IS_MOBILE ? 1400 : 2800;

  const positions  = new Float32Array(COUNT * 3);
  const colors     = new Float32Array(COUNT * 3);
  const sizes      = new Float32Array(COUNT);
  const randoms    = new Float32Array(COUNT * 3); // per-particle random offsets

  /* Color palette: brand mauve #c98faa — muted, dusty, sophisticated */
  const paletteSrc = [
    new THREE.Color('#180b11'),
    new THREE.Color('#3d2030'),
    new THREE.Color('#6b3a52'),
    new THREE.Color('#9a5878'),
    new THREE.Color('#c98faa'),
    new THREE.Color('#a06585'),
  ];

  for (let i = 0; i < COUNT; i++) {
    /* Distribute in a flattened sphere */
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = Math.pow(Math.random(), 0.45) * 4.2;

    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta) + 1.4; // shift right to frame text
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.65;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3.5;

    /* Random per-particle phase offsets for organic motion */
    randoms[i * 3]     = Math.random() * Math.PI * 2;
    randoms[i * 3 + 1] = Math.random() * Math.PI * 2;
    randoms[i * 3 + 2] = Math.random() * Math.PI * 2;

    /* Size: small and subtle — barely-there glow */
    sizes[i] = Math.random() < 0.04 ? 1.2 + Math.random() * 0.8 : 0.25 + Math.random() * 0.65;

    /* Pick color from palette with slight interpolation */
    const t   = Math.random() * (paletteSrc.length - 1);
    const idx = Math.floor(t);
    const frac = t - idx;
    const col = paletteSrc[idx].clone().lerp(paletteSrc[Math.min(idx + 1, paletteSrc.length - 1)], frac);
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('aRandom',  new THREE.BufferAttribute(randoms, 3));

  /* ── Shaders ── */
  const vertexShader = /* glsl */`
    attribute vec3  aColor;
    attribute float aSize;
    attribute vec3  aRandom;

    uniform float uTime;
    uniform vec2  uMouse;
    uniform float uPixelRatio;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vColor = aColor;

      vec3 pos = position;

      /* Organic drift — each particle has its own phase */
      float t = uTime;
      pos.x += sin(t * 0.42 + aRandom.x) * 0.18;
      pos.y += cos(t * 0.37 + aRandom.y) * 0.14;
      pos.z += sin(t * 0.28 + aRandom.z) * 0.10;

      /* Gentle upward drift to simulate buoyancy */
      pos.y += sin(t * 0.15 + aRandom.x * 2.0) * 0.06;

      /* Mouse repulsion in world space */
      vec2 mouseWorld = uMouse * 4.5;
      vec2 diff = pos.xy - mouseWorld;
      float dist = length(diff);
      float repulse = smoothstep(1.8, 0.0, dist) * 0.7;
      pos.xy += normalize(diff + vec2(0.001)) * repulse;

      /* Depth-based alpha: particles near z edges fade out */
      vAlpha = smoothstep(-3.0, -0.5, pos.z) * smoothstep(3.0, 1.0, pos.z);
      vAlpha = clamp(vAlpha, 0.0, 1.0);

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aSize * uPixelRatio * (110.0 / -mvPos.z);
      gl_Position  = projectionMatrix * mvPos;
    }
  `;

  const fragmentShader = /* glsl */`
    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      /* Radial soft-circle SDF */
      float d = distance(gl_PointCoord, vec2(0.5));

      /* Soft diffuse glow — no hard core, very gentle falloff */
      float core  = 1.0 - smoothstep(0.0, 0.18, d);
      float halo  = 1.0 - smoothstep(0.18, 0.5, d);
      float alpha = core * 0.55 + halo * 0.12;

      alpha *= vAlpha;
      if (alpha < 0.005) discard;

      /* No brightness boost — keep colors muted */
      vec3 col = vColor + core * 0.08;

      gl_FragColor = vec4(col, alpha);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime:       { value: 0 },
      uMouse:      { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: renderer.getPixelRatio() },
    },
    transparent:  true,
    blending:     THREE.AdditiveBlending,
    depthWrite:   false,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* ── Second, sparser layer for depth ── */
  const COUNT2 = IS_MOBILE ? 300 : 600;
  const pos2 = new Float32Array(COUNT2 * 3);
  const col2 = new Float32Array(COUNT2 * 3);
  const sz2  = new Float32Array(COUNT2);
  const rnd2 = new Float32Array(COUNT2 * 3);
  const dimBlue = new THREE.Color('#180b11');

  for (let i = 0; i < COUNT2; i++) {
    pos2[i * 3]     = (Math.random() - 0.5) * 12;
    pos2[i * 3 + 1] = (Math.random() - 0.5) * 7;
    pos2[i * 3 + 2] = -2.5 + (Math.random() - 0.5) * 2;
    sz2[i] = 0.4 + Math.random() * 1.0;
    rnd2[i * 3]     = Math.random() * Math.PI * 2;
    rnd2[i * 3 + 1] = Math.random() * Math.PI * 2;
    rnd2[i * 3 + 2] = Math.random() * Math.PI * 2;
    col2[i * 3]     = dimBlue.r;
    col2[i * 3 + 1] = dimBlue.g;
    col2[i * 3 + 2] = dimBlue.b;
  }
  const geo2 = new THREE.BufferGeometry();
  geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
  geo2.setAttribute('aColor',   new THREE.BufferAttribute(col2, 3));
  geo2.setAttribute('aSize',    new THREE.BufferAttribute(sz2, 1));
  geo2.setAttribute('aRandom',  new THREE.BufferAttribute(rnd2, 3));

  const mat2 = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime:       { value: 0 },
      uMouse:      { value: new THREE.Vector2(99, 99) }, // no mouse effect on bg layer
      uPixelRatio: { value: renderer.getPixelRatio() },
    },
    transparent: true,
    blending:    THREE.AdditiveBlending,
    depthWrite:  false,
  });

  const points2 = new THREE.Points(geo2, mat2);
  scene.add(points2);

  /* ── Mouse ── */
  const mouseNDC    = new THREE.Vector2(0, 0);
  const mouseTarget = new THREE.Vector2(0, 0);

  window.addEventListener('mousemove', (e) => {
    mouseTarget.set(
      (e.clientX / innerWidth)  * 2 - 1,
      -(e.clientY / innerHeight) * 2 + 1
    );
  });

  /* ── Scroll parallax ── */
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  /* ── Animation loop ── */
  let time = 0;
  let lastTime = performance.now();

  function animate(now) {
    requestAnimationFrame(animate);

    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    time += delta;

    /* Smooth mouse */
    mouseNDC.lerp(mouseTarget, 0.06);
    mat.uniforms.uMouse.value.copy(mouseNDC);
    mat.uniforms.uTime.value = time;
    mat2.uniforms.uTime.value = time * 0.7;

    /* Slow drift rotation + scroll parallax */
    points.rotation.y = time * 0.03;
    points.rotation.x = Math.sin(time * 0.015) * 0.06;

    points2.rotation.y = -time * 0.015;

    /* Hero parallax: slide up as user scrolls */
    const hero = document.getElementById('hero');
    if (hero) {
      const heroH = hero.offsetHeight;
      const progress = Math.min(scrollY / heroH, 1);
      points.position.y  = progress * 1.2;
      points.scale.setScalar(1 - progress * 0.15);
    }

    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    mat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    mat2.uniforms.uPixelRatio.value = renderer.getPixelRatio();
  });
})();
