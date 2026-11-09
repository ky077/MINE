import * as THREE from 'three';

export function createScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d7f0ef');
  scene.fog = new THREE.Fog('#d7f0ef', 80, 160);
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 180);
  camera.position.set(0, 34, 44);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene.add(new THREE.AmbientLight(0xffffff, 1.75));
  const sun = new THREE.DirectionalLight(0xfff5df, 3.1);
  sun.position.set(-9, 18, 11);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -25;
  sun.shadow.camera.right = 25;
  sun.shadow.camera.top = 25;
  sun.shadow.camera.bottom = -25;
  sun.shadow.normalBias = .02;
  scene.add(sun);
  return { scene, camera, renderer };
}
