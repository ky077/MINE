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
  const phases = [];
  const sizes = [];
  let state = 43621;
  const random = () => ((state = (1664525 * state + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 1600; i++) {
    const galaxy = i < 700;
    const x = (random() - .5) * 150;
    const y = galaxy ? x * .32 + (random() - .5) * 23 : (random() - .5) * 105;
    positions.push(x, y, -85 - random() * 10);
    const brightness = .55 + random() * .45;
    const color = new THREE.Color(galaxy && random() < .38 ? '#b9c8ff' : '#f5f3ff');
    colors.push(color.r * brightness, color.g * brightness, color.b * brightness);
    phases.push(random() * Math.PI * 2);
    sizes.push(random() < .06 ? 4.2 : 1.8 + random() * 1.3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('phase', new THREE.Float32BufferAttribute(phases, 1));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
  const starMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec3 color;
      attribute float phase;
      attribute float size;
      uniform float time;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float pulse = 0.72 + 0.28 * sin(time * 1.5 + phase);
        vColor = color;
        vAlpha = pulse;
        gl_PointSize = size * (0.8 + pulse * 0.35);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float distanceToCenter = length(gl_PointCoord - vec2(0.5));
        float glow = 1.0 - smoothstep(0.1, 0.5, distanceToCenter);
        gl_FragColor = vec4(vColor, glow * vAlpha);
      }`,
  });
  camera.add(new THREE.Points(geometry, starMaterial));

  const meteors = Array.from({ length: 2 }, (_, index) => {
    const group = new THREE.Group();
    const trail = new THREE.Mesh(new THREE.PlaneGeometry(8, .08), new THREE.MeshBasicMaterial({
      color: '#b9ecff', transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }));
    trail.position.x = -4;
    group.add(trail);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), new THREE.MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    group.add(head);
    group.visible = false;
    camera.add(group);
    return { group, trail, head, start: -1, next: 2600 + index * 3600,
      duration: 1000, direction: 1, startX: -55, startY: 0 };
  });
  return (now, reducedMotion = false) => {
    starMaterial.uniforms.time.value = reducedMotion ? 0 : now * .001;
    for (const meteor of meteors) {
      if (reducedMotion) { meteor.group.visible = false; continue; }
      if (meteor.start < 0 && now >= meteor.next) {
        meteor.start = now;
        meteor.duration = 900 + random() * 450;
        meteor.direction = random() < .5 ? 1 : -1;
        meteor.startX = -meteor.direction * 58;
        meteor.startY = (random() - .5) * 34;
        meteor.group.rotation.z = meteor.direction > 0 ? -.35 : Math.PI - .35;
      }
      if (meteor.start < 0) continue;
      const t = (now - meteor.start) / meteor.duration;
      if (t >= 1) {
        meteor.group.visible = false;
        meteor.start = -1;
        meteor.next = now + 3800 + random() * 6500;
        continue;
      }
      meteor.group.visible = true;
      meteor.group.position.set(meteor.startX + meteor.direction * t * 110,
        meteor.startY - meteor.direction * t * 40, -75);
      meteor.trail.material.opacity = Math.sin(Math.PI * t) * .62;
      meteor.head.material.opacity = Math.sin(Math.PI * t);
    }
  };
}

export function createScene(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#060b22');
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 180);
  camera.position.set(0, 34, 44);
  camera.lookAt(0, 0, 0);
  scene.add(camera);
  const updateSky = addGalaxy(camera);
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
  return { scene, camera, renderer, updateSky };
}
