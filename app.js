import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';

// ── Global ─────────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();
let appData = null;
let activeScene = null;   // { tick, dispose }
let rafId = null;
let isTransitioning = false;

// ── DOM ────────────────────────────────────────────────────────────────────────
const root         = document.documentElement;
const sceneEl      = document.getElementById('scene');
const overlayEl    = document.getElementById('overlay');
const loadingEl    = document.getElementById('loadingScreen');
const themeBtn     = document.getElementById('themeToggle');
const fullscreenBtn= document.getElementById('fullscreenToggle');
const backBtn      = document.getElementById('backBtn');

// ── Theme ──────────────────────────────────────────────────────────────────────
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') root.classList.add('light');
themeBtn.addEventListener('click', () => {
  root.classList.toggle('light');
  localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
});
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
backBtn.addEventListener('click', () => navigate('#'));

// ── WebGL check ────────────────────────────────────────────────────────────────
const hasWebGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch { return false; }
})();
if (!hasWebGL) {
  document.body.classList.add('no-webgl');
  loadingEl.style.display = 'none';
}

// ── Section config ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'profile',    label: 'PROFILE',    color: '#ff6b6b', r: 2.8, speed: 0.003,  tilt:  8,  size: 0.42, initAngle: 0    },
  { key: 'skills',     label: 'SKILLS',     color: '#4ecdc4', r: 4.0, speed: 0.0022, tilt: -10, size: 0.38, initAngle: 1.05 },
  { key: 'experience', label: 'EXPERIENCE', color: '#45b7d1', r: 5.4, speed: 0.0015, tilt:  14, size: 0.44, initAngle: 2.09 },
  { key: 'projects',   label: 'PROJECTS',   color: '#f9ca24', r: 6.8, speed: 0.0011, tilt:  -6, size: 0.40, initAngle: 3.14 },
  { key: 'education',  label: 'EDUCATION',  color: '#a55eea', r: 8.2, speed: 0.0008, tilt:  18, size: 0.36, initAngle: 4.19 },
  { key: 'contact',    label: 'CONTACT',    color: '#26de81', r: 9.6, speed: 0.0006, tilt: -14, size: 0.34, initAngle: 5.24 },
];

// ── Transitions ────────────────────────────────────────────────────────────────
function fadeOut() {
  return new Promise(res => { overlayEl.classList.add('visible'); setTimeout(res, 400); });
}
function fadeIn() {
  return new Promise(res => { overlayEl.classList.remove('visible'); setTimeout(res, 420); });
}

function destroyActiveScene() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (activeScene) { activeScene.dispose(); activeScene = null; }
  sceneEl.innerHTML = '';
}

// ── Router ─────────────────────────────────────────────────────────────────────
async function navigate(hash) {
  if (isTransitioning) return;
  isTransitioning = true;

  await fadeOut();
  destroyActiveScene();

  const route = (hash || '#').replace('#', '') || 'home';
  if (route === 'home' || route === '') {
    activeScene = buildHomeScene(appData);
    backBtn.style.display = 'none';
  } else {
    const sec = SECTIONS.find(s => s.key === route);
    activeScene = sec ? buildSectionScene(sec, appData) : buildHomeScene(appData);
    backBtn.style.display = '';
  }

  history.pushState(null, '', hash || '#');

  function loop() { rafId = requestAnimationFrame(loop); activeScene.tick(); }
  loop();

  await fadeIn();
  isTransitioning = false;
}

window.addEventListener('popstate', () => navigate(window.location.hash));
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && backBtn.style.display !== 'none') navigate('#');
});

// ── Mobile detection ────────────────────────────────────────────────────────────
const isMobile = () => window.innerWidth < 768;
const isTouch  = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// ── Shared helpers ─────────────────────────────────────────────────────────────
function makeRenderer(w, h) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  r.setSize(w, h);
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.setClearColor(0x050810, 1);
  sceneEl.appendChild(r.domElement);
  return r;
}

function makeCamera(w, h, pos = [0, 4, 18]) {
  const cam = new THREE.PerspectiveCamera(60, w / h, 0.1, 200);
  cam.position.set(...pos);
  cam.lookAt(0, 0, 0);
  return cam;
}

function addLights(scene) {
  scene.add(new THREE.AmbientLight(0x1a2a5a, 2.0));
  scene.add(new THREE.HemisphereLight(0x1a3060, 0x050810, 1.2));
  const p1 = new THREE.PointLight(0x8ab4ff, 3.5, 35); p1.position.set(0, 6, 0); scene.add(p1);
  const p2 = new THREE.PointLight(0x7df9c6, 2.0, 28); p2.position.set(-8, -4, 6); scene.add(p2);
  const p3 = new THREE.PointLight(0xff6b6b, 1.2, 20); p3.position.set(8, 2, -6); scene.add(p3);
}

function createStarfield(scene) {
  const count = 1500;
  const geo = new THREE.SphereGeometry(0.055, 4, 4);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const stars = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 30 + Math.random() * 50;
    dummy.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
    dummy.scale.setScalar(0.4 + Math.random() * 1.4);
    dummy.updateMatrix();
    stars.setMatrixAt(i, dummy.matrix);
  }
  stars.instanceMatrix.needsUpdate = true;
  scene.add(stars);
  return stars;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function makeLabelSprite(label, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 320; canvas.height = 72;
  const ctx = canvas.getContext('2d');
  const col = new THREE.Color(color);
  const hex = '#' + col.getHexString();
  ctx.fillStyle = 'rgba(5,8,18,0.88)';
  roundRect(ctx, 6, 10, 308, 52, 26); ctx.fill();
  ctx.strokeStyle = hex; ctx.lineWidth = 2.5;
  roundRect(ctx, 6, 10, 308, 52, 26); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 26px Inter,system-ui,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = hex; ctx.shadowBlur = 10;
  ctx.fillText(label, 160, 36);
  const mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false });
  const s = new THREE.Sprite(mat);
  s.scale.set(1.6, 0.36, 1);
  return s;
}

function makePlanetTexture(label, color) {
  const size = 512;
  const c = document.createElement('canvas'); c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const col = new THREE.Color(color); const hex = '#' + col.getHexString();
  const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
  grad.addColorStop(0, hex + 'dd'); grad.addColorStop(0.5, hex + '55'); grad.addColorStop(1, '#000000cc');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(256, 256, 244, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 68px Inter,system-ui,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = hex; ctx.shadowBlur = 28;
  ctx.fillText(label, 256, 256);
  return new THREE.CanvasTexture(c);
}

function onResize(camera, renderer) {
  const h = window.innerHeight - 48;
  camera.aspect = window.innerWidth / h;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, h);
}

function addPanel(html) {
  const div = document.createElement('div');
  div.className = 'level-panel';
  div.innerHTML = html;
  sceneEl.appendChild(div);
  return div;
}

function addHint(text) {
  const div = document.createElement('div');
  div.className = 'level-hint';
  div.textContent = text;
  sceneEl.appendChild(div);
}

// ── HOME SCENE — Solar System ──────────────────────────────────────────────────
function buildHomeScene(_data) {
  const W = window.innerWidth, H = window.innerHeight - 48;
  const scene    = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050810, 0.008);
  // Pull camera back on mobile/portrait so all planets stay in view
  const homeCamZ = isMobile() || W < H ? 26 : 18;
  const camera   = makeCamera(W, H, [0, 4, homeCamZ]);
  const renderer = makeRenderer(W, H);
  addLights(scene);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.04;
  controls.minDistance = 4; controls.maxDistance = 45;
  controls.autoRotate = false; controls.autoRotateSpeed = 0.4;

  // Central star
  const photoTex = new THREE.TextureLoader().load('assets/avatar.jpg', undefined, undefined, () => {});
  photoTex.colorSpace = THREE.SRGBColorSpace;
  const centralGroup = new THREE.Group();

  const coreMat = new THREE.MeshPhysicalMaterial({
    map: photoTex, clearcoat: 1.0, clearcoatRoughness: 0.1,
    iridescence: 0.6, iridescenceIOR: 1.5, metalness: 0.15, roughness: 0.35,
  });
  centralGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.92, 48, 48), coreMat));

  const glowMat = new THREE.MeshBasicMaterial({ color: 0x8ab4ff, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false });
  const centralGlow = new THREE.Mesh(new THREE.SphereGeometry(1.15, 32, 32), glowMat);
  centralGroup.add(centralGlow);

  const rMat1 = new THREE.MeshBasicMaterial({ color: 0x8ab4ff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.035, 8, 80), rMat1);
  ring1.rotation.x = Math.PI / 2; centralGroup.add(ring1);

  const rMat2 = new THREE.MeshBasicMaterial({ color: 0x7df9c6, transparent: true, opacity: 0.20, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.022, 8, 80), rMat2);
  ring2.rotation.x = Math.PI / 2.8; ring2.rotation.z = Math.PI / 5; centralGroup.add(ring2);

  // Name sprite
  const nc = document.createElement('canvas'); nc.width = 512; nc.height = 112;
  const nctx = nc.getContext('2d');
  nctx.fillStyle = 'rgba(5,8,18,0.90)'; roundRect(nctx, 6, 8, 500, 96, 28); nctx.fill();
  const nb = nctx.createLinearGradient(0, 0, 512, 0);
  nb.addColorStop(0, '#8ab4ff'); nb.addColorStop(1, '#7df9c6');
  nctx.strokeStyle = nb; nctx.lineWidth = 2.5; roundRect(nctx, 6, 8, 500, 96, 28); nctx.stroke();
  nctx.fillStyle = '#fff'; nctx.font = 'bold 34px Inter,system-ui,sans-serif';
  nctx.textAlign = 'center'; nctx.textBaseline = 'middle'; nctx.shadowColor = '#8ab4ff'; nctx.shadowBlur = 12;
  nctx.fillText('Arushi Singh', 256, 38);
  nctx.shadowColor = '#7df9c6'; nctx.shadowBlur = 8;
  nctx.font = '500 22px Inter,system-ui,sans-serif'; nctx.fillStyle = '#a0c8ff';
  nctx.fillText('3D Visualization & Frontend Engineer', 256, 76);
  const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(nc), transparent: true, depthWrite: false }));
  nameSprite.scale.set(3.2, 0.7, 1); nameSprite.position.set(0, 1.75, 0);
  centralGroup.add(nameSprite);
  scene.add(centralGroup);

  // Orbit systems
  const orbitObjects = [];
  SECTIONS.forEach(sec => {
    const tiltRad = THREE.MathUtils.degToRad(sec.tilt);
    const pivot = new THREE.Object3D(); pivot.rotation.x = tiltRad; scene.add(pivot);

    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(sec.color), transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(sec.r, 0.013, 8, 128), ringMat);
    ring.rotation.x = Math.PI / 2; pivot.add(ring);

    const planetMat = new THREE.MeshStandardMaterial({ map: makePlanetTexture(sec.label, sec.color), metalness: 0.05, roughness: 0.55, emissive: new THREE.Color(sec.color), emissiveIntensity: 0.10 });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(sec.size, 28, 28), planetMat);
    planet.position.x = Math.cos(sec.initAngle) * sec.r;
    planet.position.z = Math.sin(sec.initAngle) * sec.r;
    planet.userData = { section: sec, targetScale: 1.0 };
    pivot.add(planet);

    const labelSprite = makeLabelSprite(sec.label, sec.color);
    labelSprite.position.set(0, sec.size + 0.52, 0); planet.add(labelSprite);

    const glowMat2 = new THREE.MeshBasicMaterial({ color: new THREE.Color(sec.color), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(sec.size * 1.65, 16, 16), glowMat2);
    planet.add(glow);

    orbitObjects.push({ pivot, ring, planet, glow, ringMat, planetMat, glowMat: glowMat2, section: sec, angle: sec.initAngle });
  });

  const stars = createStarfield(scene);
  addHint(isTouch() ? 'Tap a planet to explore' : 'Click a planet to explore');

  // Raycasting
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let pointerDragging = false, pointerStartX = 0, pointerStartY = 0;
  const dragThreshold = isTouch() ? 10 : 4;

  renderer.domElement.addEventListener('pointermove', e => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    if (Math.abs(e.clientX - pointerStartX) > dragThreshold || Math.abs(e.clientY - pointerStartY) > dragThreshold) pointerDragging = true;
  });
  renderer.domElement.addEventListener('pointerdown', e => {
    pointerDragging = false; pointerStartX = e.clientX; pointerStartY = e.clientY;
  });
  renderer.domElement.addEventListener('pointerup', e => {
    if (pointerDragging) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(orbitObjects.map(o => o.planet), false);
    if (hits.length > 0) {
      const sec = hits[0].object.userData.section;
      // Glow burst then navigate
      orbitObjects.forEach(o => {
        const active = o.section.key === sec.key;
        o.planetMat.emissiveIntensity = active ? 0.8 : 0.10;
        o.glowMat.opacity = active ? 0.25 : 0;
      });
      setTimeout(() => navigate('#' + sec.key), 200);
    }
  });

  const resizeFn = () => {
    onResize(camera, renderer);
    // Reposition camera z on orientation change
    const newZ = isMobile() || window.innerWidth < window.innerHeight ? 26 : 18;
    camera.position.setZ(newZ);
  };
  window.addEventListener('resize', resizeFn);

  return {
    tick() {
      const t = clock.getElapsedTime();
      orbitObjects.forEach(obj => {
        obj.angle += obj.section.speed;
        obj.planet.position.x = Math.cos(obj.angle) * obj.section.r;
        obj.planet.position.z = Math.sin(obj.angle) * obj.section.r;
        obj.planet.rotation.y += 0.007;
        const ts = obj.planet.userData.targetScale ?? 1.0;
        obj.planet.scale.lerp(new THREE.Vector3(ts, ts, ts), 0.08);
      });
      centralGroup.rotation.y += 0.003;
      centralGlow.material.opacity = 0.07 + 0.05 * Math.sin(t * 1.8);
      stars.rotation.y += 0.00015;
      stars.rotation.x += 0.00005;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(orbitObjects.map(o => o.planet), false);
      document.body.style.cursor = hits.length > 0 ? 'pointer' : 'default';
      controls.update();
      renderer.render(scene, camera);
    },
    dispose() {
      window.removeEventListener('resize', resizeFn);
      controls.dispose();
      renderer.dispose();
      document.body.style.cursor = 'default';
    }
  };
}

// ── SECTION SCENE builder ──────────────────────────────────────────────────────
function buildSectionScene(sec, data) {
  switch (sec.key) {
    case 'profile':    return buildProfileScene(data);
    case 'skills':     return buildSkillsScene(data);
    case 'experience': return buildExperienceScene(data);
    case 'projects':   return buildProjectsScene(data);
    case 'education':  return buildEducationScene(data);
    case 'contact':    return buildContactScene(data);
    default:           return buildHomeScene(data);
  }
}

// ── Shared scene scaffolding ───────────────────────────────────────────────────
function makeBaseScene(camPos) {
  const W = window.innerWidth, H = window.innerHeight - 48;
  const scene    = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050810, 0.006);
  const camera   = makeCamera(W, H, camPos || [0, 2, 14]);
  const renderer = makeRenderer(W, H);
  addLights(scene);
  const stars = createStarfield(scene);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.05;
  controls.minDistance = 3; controls.maxDistance = 40;
  const resizeFn = () => onResize(camera, renderer);
  window.addEventListener('resize', resizeFn);
  return { scene, camera, renderer, controls, stars, resizeFn, W, H };
}

function finishScene({ renderer, scene, camera, controls, stars, resizeFn }, tickExtra) {
  return {
    tick() {
      stars.rotation.y += 0.00012;
      controls.update();
      if (tickExtra) tickExtra(clock.getElapsedTime());
      renderer.render(scene, camera);
    },
    dispose() {
      window.removeEventListener('resize', resizeFn);
      controls.dispose();
      renderer.dispose();
    }
  };
}

// ── PROFILE LEVEL ─────────────────────────────────────────────────────────────
function buildProfileScene(data) {
  const base = makeBaseScene([0, 0, 8]);
  const { scene } = base;

  // Avatar sphere with MeshPhysicalMaterial
  const photoTex = new THREE.TextureLoader().load('assets/avatar.jpg', undefined, undefined, () => {});
  photoTex.colorSpace = THREE.SRGBColorSpace;
  const avatarMat = new THREE.MeshPhysicalMaterial({
    map: photoTex, clearcoat: 1.0, clearcoatRoughness: 0.08,
    iridescence: 0.8, iridescenceIOR: 1.6, metalness: 0.1, roughness: 0.25,
  });
  const avatar = new THREE.Mesh(new THREE.SphereGeometry(1.5, 64, 64), avatarMat);
  scene.add(avatar);

  // Pulsing glow halo
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false });
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1.85, 32, 32), haloMat);
  scene.add(halo);

  // Orbital rings around avatar
  const colors = [0xff6b6b, 0x8ab4ff, 0x7df9c6];
  const rings3d = [];
  [1.9, 2.3, 2.8].forEach((r, i) => {
    const mat = new THREE.MeshBasicMaterial({ color: colors[i], transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018, 8, 80), mat);
    mesh.rotation.x = Math.PI / (2 + i * 0.4);
    mesh.rotation.z = i * Math.PI / 3;
    scene.add(mesh);
    rings3d.push(mesh);
  });

  // Floating particles around avatar
  const partGeo = new THREE.SphereGeometry(0.04, 4, 4);
  const partMat = new THREE.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
  const particles = [];
  for (let i = 0; i < 40; i++) {
    const p = new THREE.Mesh(partGeo, partMat);
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r = 2.2 + Math.random() * 1.8;
    p.position.set(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
    p.userData.offset = Math.random() * Math.PI * 2;
    scene.add(p);
    particles.push(p);
  }

  // HTML content panel
  addPanel(`
    <h2>${data.name}</h2>
    <p class="meta">${data.role} · ${data.location}</p>
    <p>${data.profile}</p>
    <div class="chips">
      ${Object.entries(data.links).map(([k, v]) => `<a class="chip" href="${v}" target="_blank" rel="noopener">${k}</a>`).join('')}
    </div>
  `);

  return finishScene(base, t => {
    avatar.rotation.y += 0.004;
    halo.material.opacity = 0.06 + 0.04 * Math.sin(t * 1.5);
    rings3d.forEach((r, i) => { r.rotation.y += 0.006 * (i % 2 === 0 ? 1 : -1); });
    particles.forEach((p, _i) => {
      p.position.y += Math.sin(t * 0.8 + p.userData.offset) * 0.002;
      p.material.opacity = 0.4 + 0.35 * Math.sin(t * 1.2 + p.userData.offset);
    });
  });
}

// ── SKILLS LEVEL ──────────────────────────────────────────────────────────────
function buildSkillsScene(data) {
  const base = makeBaseScene([0, 0, 16]);
  const { scene } = base;

  const categories = {
    'Frontend':  { color: '#4ecdc4', skills: ['React', 'Redux', 'Three.js', 'React Three Fiber', 'HTML', 'CSS', 'JavaScript', 'Material UI', 'Bootstrap'] },
    '3D/Viz':    { color: '#f9ca24', skills: ['Autodesk Forge Viewer', 'WebGL', 'React Three Fiber', 'Three.js', 'CesiumJS'] },
    'Backend':   { color: '#45b7d1', skills: ['Flask', 'RESTful APIs', 'Python'] },
    'Cloud':     { color: '#a55eea', skills: ['AWS Lambda', 'AWS Cognito', 'EC2', 'ECS', 'MQTT', 'DynamoDB'] },
    'Other':     { color: '#ff6b6b', skills: ['UI/UX Design', 'Project Management', 'Problem-Solving', 'Web Design'] },
  };

  const skillMeshes = [];
  let idx = 0;

  Object.entries(categories).forEach(([catName, cat], ci) => {
    const col = new THREE.Color(cat.color);
    const catAngle = (ci / Object.keys(categories).length) * Math.PI * 2;
    const catR = 4.5;
    const catX = Math.cos(catAngle) * catR;
    const catZ = Math.sin(catAngle) * catR;

    // Category center label
    const labelSprite = makeLabelSprite(catName, cat.color);
    labelSprite.position.set(catX, 2.5, catZ);
    labelSprite.scale.set(2.0, 0.45, 1);
    scene.add(labelSprite);

    cat.skills.forEach((skill, si) => {
      const r = 0.18 + Math.random() * 0.12;
      const mat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.3, metalness: 0.1, roughness: 0.5 });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), mat);
      const spread = 2.2;
      const angle2 = (si / cat.skills.length) * Math.PI * 2;
      mesh.position.set(catX + Math.cos(angle2) * spread, (Math.random() - 0.5) * 3, catZ + Math.sin(angle2) * spread);
      mesh.userData = { offset: idx * 0.4, baseY: mesh.position.y };
      scene.add(mesh);

      const lbl = makeLabelSprite(skill, cat.color);
      lbl.scale.set(1.4, 0.32, 1);
      lbl.position.set(0, r + 0.35, 0);
      mesh.add(lbl);

      skillMeshes.push(mesh);
      idx++;
    });
  });

  // Connecting lines between category centers
  const linesMat = new THREE.LineBasicMaterial({ color: 0x8ab4ff, transparent: true, opacity: 0.12 });
  const catPositions = Object.keys(categories).map((_, ci) => {
    const a = (ci / Object.keys(categories).length) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * 4.5, 2.5, Math.sin(a) * 4.5);
  });
  const lineGeo = new THREE.BufferGeometry().setFromPoints([...catPositions, catPositions[0]]);
  scene.add(new THREE.Line(lineGeo, linesMat));

  addPanel(`
    <h2>Skills</h2>
    <p class="meta">Explore the skill galaxy — each cluster is a category</p>
    <div class="chips">
      ${data.skills.map(s => `<span class="chip">${s}</span>`).join('')}
    </div>
  `);

  return finishScene(base, t => {
    skillMeshes.forEach(m => {
      m.position.y = m.userData.baseY + Math.sin(t * 0.6 + m.userData.offset) * 0.15;
      m.rotation.y += 0.008;
    });
  });
}

// ── EXPERIENCE LEVEL ──────────────────────────────────────────────────────────
function buildExperienceScene(data) {
  const base = makeBaseScene([0, 0, 14]);
  const { scene } = base;

  const jobs = data.experience;
  const colors = ['#45b7d1', '#8ab4ff', '#7df9c6'];

  jobs.forEach((job, i) => {
    // Most recent (i=0) at top — reverse y direction
    const y = (jobs.length - 1 - i) * 3.5 - (jobs.length - 1) * 1.75;
    const col = new THREE.Color(colors[i % colors.length]);

    // Platform disc
    const platMat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0.9 });
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.15, 32), platMat);
    plat.position.set(0, y, 0);
    scene.add(plat);

    // Glow ring around platform
    const ringMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.04, 8, 64), ringMat);
    ring.position.set(0, y, 0);
    scene.add(ring);

    // Vertical beam connecting platforms
    if (i < jobs.length - 1) {
      const beamGeo = new THREE.CylinderGeometry(0.02, 0.02, 3.5, 8);
      const beamMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(0, y + 1.75, 0);
      scene.add(beam);
    }

    // Floating label — extract short name from parentheses if present
    const shortName = (job.company.match(/\(([^)]+)\)/) || [])[1] || job.company;
    const sprite = makeLabelSprite(shortName.toUpperCase(), colors[i % colors.length]);
    sprite.position.set(0, y + 0.6, 0);
    sprite.scale.set(2.2, 0.5, 1);
    scene.add(sprite);
  });

  // Hovering particles along the timeline
  for (let i = 0; i < 30; i++) {
    const geo = new THREE.SphereGeometry(0.04, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x45b7d1, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
    const p = new THREE.Mesh(geo, mat);
    p.position.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * (jobs.length * 3.5), (Math.random() - 0.5) * 4);
    p.userData.offset = Math.random() * Math.PI * 2;
    scene.add(p);
  }

  addPanel(`
    <h2>Experience</h2>
    ${data.experience.map(e => `
      <div class="job">
        <strong>${e.title}</strong> — ${e.company} <span class="meta">(${e.dates})</span>
        <ul>${e.bullets.map(b => `<li>${b}</li>`).join('')}</ul>
        ${e.achievements ? `<div class="achievements"><strong>Key Achievements:</strong> ${e.achievements.join(', ')}</div>` : ''}
      </div>
    `).join('')}
  `);

  return finishScene(base, t => {
    scene.children.forEach(child => {
      if (child.userData.offset !== undefined) {
        child.position.y += Math.sin(t * 0.7 + child.userData.offset) * 0.003;
        child.material.opacity = 0.3 + 0.3 * Math.sin(t * 1.1 + child.userData.offset);
      }
    });
  });
}

// ── PROJECTS LEVEL ────────────────────────────────────────────────────────────
function buildProjectsScene(data) {
  const base = makeBaseScene([0, 1, 14]);
  const { scene } = base;

  const projects = data.projects;
  const panelColors = ['#f9ca24', '#ff6b6b', '#7df9c6'];
  const panels3d = [];

  projects.forEach((proj, i) => {
    const angle = (i / projects.length) * Math.PI * 2;
    const r = 4.5;
    const col = new THREE.Color(panelColors[i % panelColors.length]);
    const hex = '#' + col.getHexString();

    // Holographic display panel
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, 320);
    bg.addColorStop(0, 'rgba(5,8,18,0.95)');
    bg.addColorStop(1, 'rgba(10,15,30,0.95)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 320);

    // Border
    ctx.strokeStyle = hex; ctx.lineWidth = 3;
    roundRect(ctx, 8, 8, 496, 304, 16); ctx.stroke();

    // Corner accents
    [0,1,2,3].forEach(c => {
      const cx = c < 2 ? 14 : 498, cy = c % 2 === 0 ? 14 : 298;
      ctx.strokeStyle = hex; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy + (c % 2 === 0 ? 20 : -20)); ctx.lineTo(cx, cy); ctx.lineTo(cx + (c < 2 ? 20 : -20), cy); ctx.stroke();
    });

    // Project name
    ctx.fillStyle = hex; ctx.font = 'bold 28px Inter,system-ui,sans-serif';
    ctx.textAlign = 'center'; ctx.shadowColor = hex; ctx.shadowBlur = 12;
    ctx.fillText(proj.name, 256, 70);

    // Summary (word wrap)
    ctx.fillStyle = '#c0cce0'; ctx.font = '16px Inter,system-ui,sans-serif'; ctx.shadowBlur = 0;
    const words = proj.summary.split(' ');
    let line = '', y2 = 110;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > 460 && line) {
        ctx.fillText(line.trim(), 256, y2); line = word + ' '; y2 += 22;
        if (y2 > 200) { ctx.fillText('...', 256, y2); break; }
      } else { line = test; }
    }
    if (y2 <= 200) ctx.fillText(line.trim(), 256, y2);

    // Stack chips
    ctx.font = 'bold 13px Inter,system-ui,sans-serif'; ctx.fillStyle = hex; ctx.textAlign = 'left';
    const stackStr = proj.stack.slice(0, 5).join('  ·  ');
    ctx.fillText(stackStr, 24, 285);

    const tex = new THREE.CanvasTexture(canvas);
    const planeMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.8), planeMat);
    plane.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
    plane.rotation.y = -angle + Math.PI / 2;
    scene.add(plane);

    // Glow edge frame
    const edgeMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, wireframe: true });
    const edgeMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 3.0), edgeMat);
    edgeMesh.position.copy(plane.position); edgeMesh.rotation.copy(plane.rotation);
    scene.add(edgeMesh);

    panels3d.push({ plane, edgeMesh, baseAngle: angle, r });
  });

  addPanel(`
    <h2>Projects</h2>
    ${data.projects.map(p => `
      <div class="proj">
        <strong>${p.name}</strong> <span class="meta">(${p.dates})</span>
        <p>${p.summary}</p>
        <div class="chips">${p.stack.map(s => `<span class="chip">${s}</span>`).join('')}</div>
        <div class="chips">${Object.entries(p.links).map(([k, v]) => `<a class="chip" href="${v}" target="_blank">${k}</a>`).join('')}</div>
      </div>
    `).join('')}
  `);

  return finishScene(base, t => {
    panels3d.forEach(({ plane, edgeMesh, baseAngle, r }, i) => {
      const newAngle = baseAngle + t * 0.04;
      plane.position.set(Math.cos(newAngle) * r, Math.sin(t * 0.3 + i) * 0.15, Math.sin(newAngle) * r);
      plane.rotation.y = -newAngle + Math.PI / 2;
      edgeMesh.position.copy(plane.position); edgeMesh.rotation.copy(plane.rotation);
      edgeMesh.material.opacity = 0.25 + 0.2 * Math.sin(t * 1.4 + i);
    });
  });
}

// ── EDUCATION LEVEL ───────────────────────────────────────────────────────────
function buildEducationScene(data) {
  const base = makeBaseScene([0, 3, 12]);
  const { scene } = base;

  // Constellation pattern — nodes connected by lines
  const nodes = [];
  const nodePositions = [
    [0, 0, 0], [3, 1.5, -1], [-3, 1, 1], [1.5, -2, 2], [-2, -1.5, -2],
    [4, -1, 2], [-4, 2, -1], [0, 3, 1], [2, 2.5, -3],
  ];

  const nodeMat = new THREE.MeshStandardMaterial({ color: 0xa55eea, emissive: 0xa55eea, emissiveIntensity: 0.5, metalness: 0.2, roughness: 0.4 });
  nodePositions.forEach((pos, i) => {
    const size = i === 0 ? 0.35 : i === 6 ? 0.30 : 0.18 + Math.random() * 0.12;
    const node = new THREE.Mesh(new THREE.SphereGeometry(size, 20, 20), nodeMat.clone());
    node.position.set(...pos);
    node.userData.offset = i * 0.7;
    scene.add(node);
    nodes.push(node);

    const glowMat2 = new THREE.MeshBasicMaterial({ color: 0xa55eea, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(size * 2.2, 12, 12), glowMat2);
    node.add(glow);
  });

  // Connect nodes with lines
  const pairs = [[0,1],[0,2],[0,3],[0,4],[1,5],[2,6],[3,4],[1,8],[6,7],[7,8]];
  pairs.forEach(([a, b]) => {
    const points = [nodes[a].position.clone(), nodes[b].position.clone()];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xa55eea, transparent: true, opacity: 0.25 });
    scene.add(new THREE.Line(geo, mat));
  });

  // Labels on main nodes — one per education entry
  data.education.forEach((edu, i) => {
    const targetNode = nodes[i === 0 ? 0 : 6]; // node 0 = center, node 6 = far left
    if (!targetNode) return;
    // Shorten to first 3 words
    const short = edu.institution.split(' ').slice(0, 3).join(' ').toUpperCase();
    const spr = makeLabelSprite(short, '#a55eea');
    spr.position.set(0, targetNode.geometry.parameters.radius * 2.5 + 0.5, 0);
    spr.scale.set(2.4, 0.54, 1);
    targetNode.add(spr);
  });

  // Floating academic particles
  for (let i = 0; i < 25; i++) {
    const geo = new THREE.SphereGeometry(0.06, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0xa55eea, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    const p = new THREE.Mesh(geo, mat);
    p.position.set((Math.random()-0.5)*12, (Math.random()-0.5)*8, (Math.random()-0.5)*12);
    p.userData.offset = Math.random() * Math.PI * 2;
    scene.add(p);
  }

  addPanel(`
    <h2>Education</h2>
    ${data.education.map(e => `
      <div class="job">
        <strong>${e.degree}</strong>
        <p class="meta">${e.institution}</p>
        ${e.year ? `<p class="meta">${e.year}</p>` : ''}
      </div>
    `).join('')}
  `);

  return finishScene(base, t => {
    nodes.forEach(n => {
      n.material.emissiveIntensity = 0.3 + 0.3 * Math.sin(t * 0.8 + n.userData.offset);
      n.rotation.y += 0.006;
    });
  });
}

// ── CONTACT LEVEL ─────────────────────────────────────────────────────────────
function buildContactScene(data) {
  const base = makeBaseScene([0, 3, 12]);
  const { scene } = base;

  // Central communication sphere
  const centralMat = new THREE.MeshPhysicalMaterial({ color: 0x26de81, emissive: 0x26de81, emissiveIntensity: 0.3, clearcoat: 1.0, clearcoatRoughness: 0.1, metalness: 0.2, roughness: 0.3 });
  const central = new THREE.Mesh(new THREE.SphereGeometry(1.0, 48, 48), centralMat);
  scene.add(central);

  const centralGlowMat = new THREE.MeshBasicMaterial({ color: 0x26de81, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false });
  const centralGlow = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 32), centralGlowMat);
  scene.add(centralGlow);

  // Contact method orbits
  const contacts = [
    { label: 'EMAIL', color: '#ff6b6b',  r: 3.5, speed: 0.004,  angle: 0,    tilt: 15 },
    { label: 'LINKEDIN', color: '#45b7d1', r: 4.8, speed: 0.003, angle: 2.1,  tilt: -10 },
    { label: 'GITHUB', color: '#f9ca24', r: 6.0, speed: 0.002, angle: 4.2,  tilt: 20 },
    { label: 'PHONE', color: '#a55eea', r: 3.0, speed: 0.005, angle: 1.05, tilt: -20 },
  ];

  const contactObjs = contacts.map(c => {
    const tilt = THREE.MathUtils.degToRad(c.tilt);
    const pivot = new THREE.Object3D(); pivot.rotation.x = tilt; scene.add(pivot);

    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(c.color), transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(c.r, 0.018, 8, 80), ringMat);
    ring.rotation.x = Math.PI / 2; pivot.add(ring);

    const planetMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(c.color), emissive: new THREE.Color(c.color), emissiveIntensity: 0.4, metalness: 0.1, roughness: 0.5 });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 20), planetMat);
    planet.position.x = Math.cos(c.angle) * c.r;
    planet.position.z = Math.sin(c.angle) * c.r;
    pivot.add(planet);

    const lbl = makeLabelSprite(c.label, c.color);
    lbl.position.set(0, 0.75, 0); planet.add(lbl);

    const glowM = new THREE.MeshBasicMaterial({ color: new THREE.Color(c.color), transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), glowM);
    planet.add(glow);

    return { planet, pivot, angle: c.angle, speed: c.speed, r: c.r };
  });

  // Energy lines from center to each orbit
  contacts.forEach(c => {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(c.r, 0, 0)]);
    const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(c.color), transparent: true, opacity: 0.15 });
    scene.add(new THREE.Line(geo, mat));
  });

  addPanel(`
    <h2>Contact</h2>
    <p class="meta">Let's connect!</p>
    <p><a href="mailto:${data.email}" class="chip" style="text-decoration:none">${data.email}</a></p>
    <p><a href="tel:${data.phone}" class="chip" style="text-decoration:none">${data.phone}</a></p>
    <div class="chips">
      ${Object.entries(data.links).map(([k, v]) => `<a class="chip" href="${v}" target="_blank" rel="noopener">${k}</a>`).join('')}
    </div>
    <p class="meta" style="margin-top:1rem">Based in ${data.location}</p>
  `);

  return finishScene(base, t => {
    central.rotation.y += 0.005;
    centralGlow.material.opacity = 0.06 + 0.04 * Math.sin(t * 1.6);
    contactObjs.forEach(obj => {
      obj.angle += obj.speed;
      obj.planet.position.x = Math.cos(obj.angle) * obj.r;
      obj.planet.position.z = Math.sin(obj.angle) * obj.r;
      obj.planet.rotation.y += 0.008;
    });
  });
}

// ── Data loading ───────────────────────────────────────────────────────────────
async function loadData() {
  const res = await fetch('data.json');
  if (!res.ok) throw new Error(`Failed to load data.json: ${res.status}`);
  return res.json();
}

// ── Init ───────────────────────────────────────────────────────────────────────
(async function main() {
  try {
    appData = await loadData();

    // Hide loading screen
    setTimeout(() => {
      loadingEl.classList.add('hidden');
      setTimeout(() => { loadingEl.style.display = 'none'; }, 500);
    }, 1000);

    // Navigate to current hash or home
    await navigate(window.location.hash || '#');

  } catch (err) {
    console.error('Error in main:', err);
    document.body.classList.add('no-webgl');
    loadingEl.style.display = 'none';
  }
})();
