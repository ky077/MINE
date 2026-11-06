import * as THREE from 'three';

export function createScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050711);
  scene.fog = new THREE.FogExp2(0x050711, 0.0038);

  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 500);
  camera.position.set(0, 17, 49);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.32;

  scene.add(new THREE.AmbientLight(0xffffff, 1.55));
  const key = new THREE.PointLight(0xe9f5ff, 1700, 180);
  key.position.set(-18, 25, 22);
  scene.add(key);
  const fill = new THREE.PointLight(0x8a63ff, 850, 130);
  fill.position.set(22, -10, -20);
  scene.add(fill);

  return { scene, camera, renderer };
}

export function addStarfield(scene, count = 4200) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const colorA = new THREE.Color(0x829bdc);
  const colorB = new THREE.Color(0xffffff);
  for (let i = 0; i < count; i++) {
    const radius = 65 + Math.random() * 145;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i*3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = radius * Math.cos(phi);
    positions[i*3+2] = radius * Math.sin(phi) * Math.sin(theta);
    const c = colorA.clone().lerp(colorB, Math.random() * 0.65);
    colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: 0.23, vertexColors: true, transparent: true, opacity: 0.9, sizeAttenuation: true });
  const stars = new THREE.Points(geo, mat);
  scene.add(stars);
  return stars;
}

export function addNebula(scene) {
  const group = new THREE.Group();
  const colors = [0x273b83, 0x472a75, 0x1c536d];
  for (let i = 0; i < 7; i++) {
    const material = new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: 0.055, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(42 + Math.random()*25, 25 + Math.random()*22), material);
    mesh.position.set((Math.random()-.5)*70, (Math.random()-.5)*35, -35 - Math.random()*30);
    mesh.rotation.z = Math.random() * Math.PI;
    group.add(mesh);
  }
  scene.add(group);
  return group;
}
