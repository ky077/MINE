import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { planets } from './data.js';
import { createScene } from './scene.js';
import { createIsland, locations, elevations, islandScale } from './island.js';
import { createInteractionManager } from './interactions.js';
import { initUI, openPlanet } from './ui.js';

const canvas = document.getElementById('universe');
const { scene, camera, renderer, updateSky } = createScene(canvas);
const { landmarks, updateTraffic } = createIsland(scene, planets);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = .065;
controls.minDistance = 10;
controls.maxDistance = 92;
controls.minPolarAngle = .22;
controls.maxPolarAngle = Math.PI * .46;
controls.enablePan = false;
controls.rotateSpeed = .55;
controls.zoomSpeed = .75;
controls.update();

const homePosition = new THREE.Vector3(0, 26, 34);
const homeTarget = new THREE.Vector3(0, 0, 0);
let tween = null;
let hoveredId = null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function moveCamera(position, target) {
  if (reducedMotion.matches) {
    camera.position.copy(position);
    controls.target.copy(target);
    controls.update();
    return;
  }
  tween = {
    start: performance.now(),
    from: camera.position.clone(),
    to: position,
    targetFrom: controls.target.clone(),
    targetTo: target,
    duration: 1050,
  };
  controls.enabled = false;
}

function focus(id) {
  if (id === 'main') {
    home();
    return;
  }
  const [x, z] = locations[id];
  if (x === undefined) return;
  const target = new THREE.Vector3(x, elevations[id] + .8 * islandScale(planets.find(item => item.id === id)), z);
  const position = target.clone().add(new THREE.Vector3(0, 9, 13));
  moveCamera(position, target);
  openPlanet(id);
}

function home() {
  document.getElementById('planetPanel').classList.remove('is-open');
  document.getElementById('planetPanel').setAttribute('aria-hidden', 'true');
  document.getElementById('projectModal').classList.remove('is-open');
  document.getElementById('projectModal').setAttribute('aria-hidden', 'true');
  moveCamera(homePosition.clone(), homeTarget.clone());
}

initUI({ onSelectPlanet: focus, onHome: home });
createInteractionManager({
  canvas, camera, landmarks, onSelect: focus,
  onHover: id => { hoveredId = id; },
});

const labelLayer = document.getElementById('islandLabels');
const labels = [
  { id: 'main', text: "KyLin's Work at NTNU", x: 0, z: 0, y: 6, color: '#de7863' },
  ...planets.map(planet => {
    const [x, z] = locations[planet.id];
    return { id: planet.id, text: `${planet.number} ${planet.name}`, x, z,
      y: elevations[planet.id] + 3.8 * islandScale(planet), color: planet.color };
  }),
].map(label => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'island-label';
  button.dataset.islandId = label.id;
  button.textContent = label.text;
  button.style.setProperty('--island-color', label.color);
  button.addEventListener('click', () => focus(label.id));
  labelLayer.append(button);
  return { ...label, button };
});
const labelPosition = new THREE.Vector3();

function updateLabels() {
  const width = labelLayer.clientWidth;
  const height = labelLayer.clientHeight;
  const visibleLabels = [];
  for (const label of labels) {
    labelPosition.set(label.x, label.y, label.z).project(camera);
    const visible = labelPosition.z > -1 && labelPosition.z < 1 &&
      Math.abs(labelPosition.x) < 1.1 && Math.abs(labelPosition.y) < 1.1;
    label.button.hidden = !visible;
    if (!visible) continue;
    const x = (labelPosition.x + 1) * width / 2;
    const y = (1 - labelPosition.y) * height / 2;
    const halfWidth = label.button.offsetWidth / 2;
    visibleLabels.push({
      button: label.button,
      x: Math.max(halfWidth + 6, Math.min(width - halfWidth - 6, x)),
      y,
      width: label.button.offsetWidth,
      height: label.button.offsetHeight,
    });
  }
  const placed = [];
  for (const item of visibleLabels.sort((a, b) => a.y - b.y)) {
    let chosen = item.y;
    for (const offset of [0, -30, 30, -60, 60]) {
      const candidate = Math.max(item.height + 8, Math.min(height - 8, item.y + offset));
      const box = {
        left: item.x - item.width / 2 - 4,
        right: item.x + item.width / 2 + 4,
        top: candidate - item.height - 4,
        bottom: candidate + 4,
      };
      if (placed.every(other =>
        box.right < other.left || box.left > other.right ||
        box.bottom < other.top || box.top > other.bottom)) {
        chosen = candidate;
        placed.push(box);
        break;
      }
    }
    item.button.style.left = `${item.x}px`;
    item.button.style.top = `${chosen}px`;
  }
}

function tick(now) {
  requestAnimationFrame(tick);
  updateSky(now, reducedMotion.matches);
  updateTraffic(now, reducedMotion.matches);
  for (const group of landmarks) {
    const active = group.userData.islandId === hoveredId;
    const idle = reducedMotion.matches ? 1 : 1 + Math.sin(now * .0015 + group.userData.phase) * .008;
    group.scale.lerp(new THREE.Vector3().setScalar(
      (group.userData.baseScale || 1) * (active ? 1.055 : idle)), .12);
  }
  if (tween) {
    const progress = Math.min(1, (now - tween.start) / tween.duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    camera.position.lerpVectors(tween.from, tween.to, eased);
    controls.target.lerpVectors(tween.targetFrom, tween.targetTo, eased);
    if (progress === 1) {
      tween = null;
      controls.enabled = true;
    }
  }
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}
requestAnimationFrame(tick);

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  const distance = innerWidth < 650 ? 68 : innerWidth < 1050 ? 42 : 34;
  homePosition.set(0, distance * .77, distance);
  if (!document.getElementById('planetPanel').classList.contains('is-open') && !tween) {
    camera.position.copy(homePosition);
    controls.target.copy(homeTarget);
    controls.update();
  }
}
window.addEventListener('resize', resize);
resize();
setTimeout(() => document.getElementById('loading').classList.add('done'),
  reducedMotion.matches ? 0 : Math.max(0, 1100 - performance.now()));
