import * as THREE from 'three';

function addGalaxy(camera) {
  // Keep the distant sky centered on the viewer while the islands orbit in front.
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 48, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `varying vec3 vDirection;
      float hash(vec3 p) {
        return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
      }
      float noise(vec3 p) {
        vec3 cell = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(cell), hash(cell + vec3(1.0, 0.0, 0.0)), f.x),
              mix(hash(cell + vec3(0.0, 1.0, 0.0)), hash(cell + vec3(1.0, 1.0, 0.0)), f.x), f.y),
          mix(mix(hash(cell + vec3(0.0, 0.0, 1.0)), hash(cell + vec3(1.0, 0.0, 1.0)), f.x),
              mix(hash(cell + vec3(0.0, 1.0, 1.0)), hash(cell + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
      }
      void main() {
        vec3 d = normalize(vDirection);
        float band = abs(d.y - d.x * 0.32 + 0.04);
        float wide = 1.0 - smoothstep(0.08, 0.42, band);
        float core = 1.0 - smoothstep(0.0, 0.17, band);
        float clouds = noise(d * 85.0) * 0.32 + noise(d * 31.0) * 0.68;
        vec3 color = mix(vec3(0.012, 0.018, 0.065), vec3(0.025, 0.035, 0.105), d.y * 0.5 + 0.5);
        color += vec3(0.105, 0.075, 0.19) * wide * (0.55 + clouds);
        color += vec3(0.10, 0.17, 0.27) * core * (0.35 + clouds);
        gl_FragColor = vec4(color, 1.0);
      }`,
  }));
  sky.frustumCulled = false;
  camera.add(sky);

  const positions = [];
  const colors = [];
  let state = 43621;
  const random = () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 1600; i++) {
    const galaxy = i < 700;
    const x = (random() - .5) * 150;
    const y = galaxy ? x * .32 + (random() - .5) * 23 : (random() - .5) * 105;
    positions.push(x, y, -85 - random() * 10);
    const brightness = .42 + random() * .58;
    const color = new THREE.Color(galaxy && random() < .38 ? '#b9c8ff' : '#f5f3ff');
    colors.push(color.r * brightness, color.g * brightness, color.b * brightness);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  camera.add(new THREE.Points(geometry, new THREE.PointsMaterial({
    size: .6, vertexColors: true, sizeAttenuation: true, transparent: true,
    opacity: .9, depthWrite: false,
  })));
}

export function createScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#060b22');
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 180);
  camera.position.set(0, 34, 44);
  camera.lookAt(0, 0, 0);
  scene.add(camera);
  addGalaxy(camera);
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
