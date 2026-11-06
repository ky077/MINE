import * as THREE from 'three';

// Five small dioramas share a silhouette, while their landmarks tell the story of each field.
const materials = new Map();
function paint(color, glow = false) {
  const key = `${color}:${glow}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
    color, roughness: glow ? .42 : .88, metalness: glow ? .18 : 0,
    flatShading: true, emissive: glow ? color : 0x000000,
    emissiveIntensity: glow ? .38 : 0,
    side: THREE.DoubleSide
  }));
  return materials.get(key);
}
function add(parent, geometry, color, x, y, z, glow = false) {
  const object = new THREE.Mesh(geometry, paint(color, glow));
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}
const box = (p, w, h, d, c, x, y, z) => add(p, new THREE.BoxGeometry(w, h, d), c, x, y, z);
const ball = (p, r, c, x, y, z, detail = 1) => add(p, new THREE.IcosahedronGeometry(r, detail), c, x, y, z);
const cone = (p, r, h, c, x, y, z, sides = 6) => add(p, new THREE.ConeGeometry(r, h, sides), c, x, y, z);
const cylinder = (p, rt, rb, h, c, x, y, z, sides = 8) => add(p, new THREE.CylinderGeometry(rt, rb, h, sides), c, x, y, z);

const themes = {
  career: {orb: 0x1684f3, rim: 0x63d6ff, grass: 0x83c651, light: 0xa4db69, rock: 0x8a8177, dark: 0x595d65},
  chinese: {orb: 0x8c5af4, rim: 0xd5a5ff, grass: 0x79bb57, light: 0x9bd568, rock: 0x827c92, dark: 0x5c5974},
  reading: {orb: 0x2ac8c2, rim: 0x97fff0, grass: 0x8bc769, light: 0xa8db7e, rock: 0x807c72, dark: 0x586870},
  diagnostics: {orb: 0xf3b943, rim: 0xffeb90, grass: 0x8ac35e, light: 0xb8d974, rock: 0x9b8b75, dark: 0x6b6470},
  research: {orb: 0xf26991, rim: 0xffa8c9, grass: 0x84bf5a, light: 0xaddb72, rock: 0x927a7e, dark: 0x675b70},
  observatory: {orb: 0x388df2, rim: 0x89f1ff, grass: 0x86c867, light: 0xb3de7d, rock: 0x8d8d91, dark: 0x5a6480},
  tree: {orb: 0x755de0, rim: 0xbafaff, grass: 0x83c96a, light: 0xb5df82, rock: 0x8c8498, dark: 0x666283}
};

function islandShape(seed, scale = 1) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 20; i++) {
    const angle = i * Math.PI * 2 / 20;
    const variation = 1 + Math.sin(i * 2.63 + seed) * .07 + Math.cos(i * 4.12 + seed) * .04;
    const x = Math.cos(angle) * 3.5 * variation * scale;
    const z = Math.sin(angle) * 2.45 * variation * scale;
    if (i === 0) shape.moveTo(x, z); else shape.lineTo(x, z);
  }
  shape.closePath();
  return shape;
}
function islandLayer(parent, seed, scale, depth, top, color) {
  const geometry = new THREE.ExtrudeGeometry(islandShape(seed, scale), {
    depth, steps: 1, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 1,
    curveSegments: 2
  });
  geometry.rotateX(Math.PI / 2);
  return add(parent, geometry, color, 0, top, 0);
}
function makeGround(group, theme, seed) {
  islandLayer(group, seed, .84, .35, -.77, theme.dark);
  islandLayer(group, seed, .97, .96, .12, theme.rock);
  islandLayer(group, seed, 1, .18, .41, theme.grass);
  for (let i = 0; i < 15; i++) {
    const a = i * Math.PI * 2 / 15;
    const x = Math.cos(a) * (3.13 + .13 * Math.sin(i * 3 + seed));
    const z = Math.sin(a) * (2.13 + .1 * Math.cos(i * 2 + seed));
    const chunk = cone(group, .31 + i % 3 * .05, .75 + i % 4 * .11,
      i % 3 ? theme.rock : theme.dark, x, -.77, z, 5);
    chunk.rotation.z = Math.PI + Math.sin(i * 2) * .12;
  }
  // Broad, irregular patches create the illustrated meadow surface.
  [[-2, -.55, .82, .55], [1.7, -.9, .9, .5], [-.5, 1.12, 1.1, .55], [2.2, .85, .68, .42]].forEach(([x, z, sx, sz]) => {
    const patch = add(group, new THREE.CircleGeometry(1, 24), theme.light, x, .426, z);
    patch.rotation.x = -Math.PI / 2;
    patch.scale.set(sx, sz, 1);
  });
}
function tree(parent, x, z, size = 1, pine = true, leaf = 0x388756) {
  const g = new THREE.Group(); g.position.set(x, .44, z); g.scale.setScalar(size); parent.add(g);
  cylinder(g, .055, .075, .35, 0x8c6040, 0, .17, 0, 6);
  if (pine) {
    cone(g, .32, .55, leaf, 0, .45, 0, 7);
    cone(g, .25, .48, 0x4e9b61, 0, .72, 0, 7);
    cone(g, .17, .36, 0x6bad6c, 0, .98, 0, 7);
  } else {
    ball(g, .35, leaf, -.1, .58, 0);
    ball(g, .29, 0x75b95f, .22, .65, .06);
    ball(g, .26, leaf, 0, .86, -.04);
  }
  return g;
}
function grove(parent, leaf, offset = 0) {
  const spots = [[-2.85,-.8],[-2.8,.55],[-2.35,1.45],[-1.5,-1.8],[2.8,-.65],[2.67,.65],[2.1,1.55],[.65,-1.85],[-.7,1.8]];
  spots.forEach(([x,z], i) => tree(parent, x, z, .68 + (i % 3) * .12, i % 4 !== 0, leaf));
  if (offset) tree(parent, -1.85, .6, .65, false, leaf);
}
function path(parent, points, color = 0xe4cc99, width = .12) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x,z]) => new THREE.Vector3(x, .47, z)));
  add(parent, new THREE.TubeGeometry(curve, 32, width, 7, false), color, 0, 0, 0);
}
function building(parent, x, z, width, height, depth, wall, roof, style = 'house') {
  const g = new THREE.Group(); g.position.set(x, .45, z); parent.add(g);
  box(g, width, height, depth, wall, 0, height / 2, 0);
  box(g, width * .19, height * .47, .025, 0x6a5a55, 0, height * .25, depth / 2 + .02);
  for (const side of [-1, 1]) {
    box(g, width * .16, height * .24, .025, 0x8adbec,
      side * width * .28, height * .56, depth / 2 + .02);
  }
  if (style === 'dome') {
    const dome = add(g, new THREE.SphereGeometry(width * .57, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), roof, 0, height, 0);
    dome.scale.z = depth / width;
  } else if (style === 'temple') {
    box(g, width * 1.2, .12, depth * 1.2, roof, 0, height + .06, 0);
    box(g, width * .9, .18, depth * .9, roof, 0, height + .18, 0);
    cone(g, width * .61, .3, roof, 0, height + .38, 0, 4).rotation.y = Math.PI / 4;
  } else {
    cone(g, width * .73, .45, roof, 0, height + .19, 0, 4).rotation.y = Math.PI / 4;
  }
  return g;
}
function mountains(parent, colors = [0x648c80, 0x769e86, 0x92ad92]) {
  [[-1.35,-1.13,.72,1.4],[-.55,-1.42,.85,1.95],[.46,-1.43,.72,1.55],[1.2,-1.1,.6,1.15]].forEach(([x,z,r,h], i) => {
    cone(parent, r, h, colors[i % colors.length], x, .45 + h / 2, z, 5);
    cone(parent, r * .28, h * .27, 0xe9edf0, x, .45 + h * .89, z, 5);
  });
}
function cloud(parent, x, y, z, scale = 1) {
  const g = new THREE.Group(); g.position.set(x,y,z); g.scale.setScalar(scale); parent.add(g);
  [[-.35,0,.26],[0,.14,.38],[.36,0,.26],[.1,-.06,.25]].forEach(([dx,dy,r]) => {
    const puff = add(g, new THREE.SphereGeometry(r, 12, 8), 0xf4f8ff, dx,dy,0);
    puff.material = new THREE.MeshBasicMaterial({color: 0xf4f8ff, transparent: true, opacity: .88, depthWrite: false});
  });
}
function waterfall(parent, x, z, width = .34) {
  const stream = box(parent, width, .93, .08, 0x49c9f4, x, -.3, z);
  stream.material = paint(0x65d8ff, true);
  ball(parent, width * .85, 0xd6fbff, x, -.85, z, 1);
}
function flowerTree(parent, x, z) {
  const g = tree(parent, x, z, .98, false, 0xf698bc);
  g.children.slice(1).forEach((child, i) => { child.material = paint([0xffb4d1, 0xf482b2, 0xffc6d9][i % 3]); });
}
function book(parent, x, y, z, scale = 1) {
  const g = new THREE.Group(); g.position.set(x,y,z); g.scale.setScalar(scale); parent.add(g);
  for (const side of [-1,1]) {
    const cover = box(g, .48, .07, .72, 0xc96f49, side * .23, -.05, 0);
    cover.rotation.z = side * .15;
    const page = box(g, .44, .065, .66, 0xfff2d2, side * .23, .01, 0);
    page.rotation.z = side * .15;
    box(g, .3, .01, .016, 0xd4ba91, side * .24, .065, -.12);
  }
  box(g, .06, .13, .74, 0x8d5d43, 0, -.02, 0);
}
function pagoda(parent, x, z) {
  const g = new THREE.Group(); g.position.set(x,.44,z); parent.add(g);
  for (let i = 0; i < 3; i++) {
    const w = .72 - i * .15;
    box(g, w, .45, w * .8, 0xf1cf9c, 0, .27 + i * .55, 0);
    box(g, w * 1.3, .09, w * 1.05, 0x315d91, 0, .53 + i * .55, 0);
    cone(g, w * .75, .28, 0x315d91, 0, .71 + i * .55, 0, 4).rotation.y = Math.PI / 4;
  }
  cone(g, .1, .3, 0xf6bd5b, 0, 2.04, 0);
}
function orbitAndOrb(parent, theme) {
  const orb = new THREE.Mesh(new THREE.SphereGeometry(4.18, 48, 32),
    new THREE.MeshBasicMaterial({color: theme.orb, side: THREE.BackSide, transparent: true, opacity: .7, depthWrite: false, toneMapped: false}));
  orb.position.y = -.06;
  orb.renderOrder = -2;
  parent.add(orb);
  const haze = new THREE.Mesh(new THREE.SphereGeometry(4.35, 32, 20),
    new THREE.MeshBasicMaterial({color: theme.rim, side: THREE.BackSide, transparent: true, opacity: .09, depthWrite: false, toneMapped: false}));
  haze.position.y = -.06; haze.renderOrder = -3; parent.add(haze);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4.36, .026, 6, 144),
    new THREE.MeshBasicMaterial({color: theme.rim, transparent: true, opacity: .9, depthWrite: false, toneMapped: false}));
  ring.rotation.x = Math.PI / 2 - .16;
  ring.rotation.y = -.12;
  ring.position.y = -.24;
  parent.add(ring);
}

function career(g) {
  mountains(g);
  path(g, [[-2.6,1.1],[-2,.4],[-1.3,-.5],[-.5,.15],[.3,.78],[1.25,.3],[2.45,1.1]]);
  building(g, .15, -.2, 1.13, .92, .85, 0xf6dda9, 0x397a74);
  building(g, -2, .8, .72, .64, .65, 0xf5d79d, 0xb66742);
  building(g, 2.15, .45, .68, .58, .6, 0xf3d398, 0xc87347);
  cylinder(g, .18, .24, 1.35, 0x9d6239, -2.52, 1.1, -1.01, 5);
  box(g, .82, .12, .82, 0xc98243, -2.52, 1.79, -1.01);
  cone(g, .56, .42, 0xe3943e, -2.52, 2.01, -1.01, 4).rotation.y = Math.PI / 4;
  grove(g, 0x348a52, 1);
  waterfall(g, -.82, 2.1, .37);
  cloud(g, -2.45, 2.4, -1.9, .8);
}
function chinese(g) {
  mountains(g, [0x7b8791,0x9ba28a,0x647f7d]);
  path(g, [[-2.7,1],[-1.8,.45],[-.8,.7],[.25,.75],[1.3,.38],[2.2,1.1]], 0xe8d6b0);
  building(g, -.48, -.12, 1.55, 1.04, .95, 0xe8b69c, 0x315f95, 'temple');
  pagoda(g, 1.85, -1.05);
  const bridge = box(g, 1.05, .12, .4, 0xefe1c6, .78, .58, 1.23); bridge.rotation.y = -.2;
  for (const x of [.3,.65,1,1.35]) cylinder(g, .035,.035,.35,0xf4ead7,x,.78,1.03,6);
  flowerTree(g, -2.15, 1.1);
  grove(g, 0x35855a);
  waterfall(g, 1.33, 2.1, .42);
  cloud(g, -2.5, 2.3, -1.5, .75);
}
function reading(g) {
  path(g, [[-2.6,1],[-1.8,.25],[-.5,-.2],[.5,.1],[1.5,.55],[2.3,1.3]], 0xe6d4a8);
  building(g, .36, -.72, 1.7, 1.16, 1.02, 0xf2d6a7, 0x7cc69f, 'dome');
  cylinder(g, .6, .68, .17, 0xebbd85, .36, .5, -.72, 12);
  building(g, 2.45, .52, .65, .55, .6, 0xf5d99e, 0xd18045);
  book(g, -.45, .6, 1.38, 1.3);
  for (let i=0;i<4;i++) box(g, .16, .5 + i*.06, .42, [0xf17857,0x48a6a9,0xe9b953,0x6688cb][i], -2.25+i*.2, .72, -.42);
  grove(g, 0x38916a, 1);
  cloud(g, 2.7, 2.15, -1.3, .74);
}
function diagnostics(g) {
  mountains(g, [0x8ba8aa,0x729aaa,0x9fb4a0]);
  path(g, [[-2.55,1.2],[-1.65,.6],[-.7,.85],[.3,.5],[1.35,.9],[2.5,1.4]], 0xe6d9b8);
  building(g, -.72, -.23, 1.3, .92, 1.1, 0xc8e2e8, 0x3f9cdb, 'dome');
  building(g, 1.85, .52, .92, .74, .72, 0xd7e9e8, 0x83badd);
  cylinder(g, .16, .21, 1.55, 0x65c5ee, 1.18, 1.22, -1.35, 10);
  for (const y of [1.45,1.85,2.24]) {
    const ring = add(g, new THREE.TorusGeometry(.38,.035,6,32), 0x8ff2ff, 1.18, y, -1.35, true);
    ring.rotation.x = Math.PI / 2;
  }
  for (const [x,z] of [[-2.6,1.02],[-2.2,-1.03],[2.55,-.5]]) {
    const crystal = add(g, new THREE.OctahedronGeometry(.32,0), 0x70d8fb, x, .78, z, true);
    crystal.scale.y = 1.7;
  }
  grove(g, 0x3f995b);
  cloud(g, -2.55, 2.22, -1.3, .85);
}
function research(g) {
  path(g, [[-2.65,1.02],[-1.6,.7],[-.55,.95],[.3,.4],[1.4,.6],[2.5,1.23]], 0xe7d4ad);
  building(g, -.18, -.68, 1.82, 1.08, 1.04, 0xf3d9a7, 0x4e79ae, 'temple');
  building(g, -2.15, .75, .78, .66, .7, 0xf1d5a8, 0x587fb0);
  building(g, 2.22, .6, .78, .72, .7, 0xd9e4e9, 0x6da2cb);
  cylinder(g, .22, .27, 1.22, 0xf4cc83, -1.8, 1.08, -1.1, 8);
  cone(g, .38, .43, 0x517db7, -1.8, 1.88, -1.1, 4).rotation.y = Math.PI / 4;
  ball(g, .12, 0xfff0d7, -1.8, 1.3, -.86);
  cylinder(g, .5, .53, .12, 0xdde4e9, 1.8, .52, -1.35, 12);
  const dome = add(g, new THREE.SphereGeometry(.53, 16, 10, 0, Math.PI*2, 0, Math.PI/2), 0x69ace1, 1.8, .58, -1.35);
  dome.rotation.z = .1;
  cylinder(g, .47, .59, .15, 0xe8edf2, .3, .48, 1.28, 12);
  cylinder(g, .06, .1, .42, 0x70d8f3, .3, .72, 1.28, 10);
  ball(g, .13, 0xa7f6ff, .3, .95, 1.28);
  grove(g, 0x3d9361);
  flowerTree(g, -2.68, -.15);
  flowerTree(g, 2.75, .1);
  cloud(g, -2.8, 2.28, -1.45, .72);
}

const builders = {career, chinese, reading, diagnostics, research};
export function createPlanet(def) {
  const group = new THREE.Group();
  group.position.set(...def.position);
  group.scale.setScalar(def.radius / 4);
  group.userData.planet = def;
  const theme = themes[def.id];
  orbitAndOrb(group, theme);
  makeGround(group, theme, Number(def.number));
  builders[def.id](group);
  return {group, sphere: group};
}

function addMainDocks(group, color) {
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5 + .24;
    const x = Math.cos(angle) * 2.98;
    const z = Math.sin(angle) * 2.06;
    cylinder(group, .28, .3, .12, 0xd8e3e7, x, .52, z, 12);
    const ring = add(group, new THREE.TorusGeometry(.21, .025, 5, 24), color, x, .6, z, true);
    ring.rotation.x = Math.PI / 2;
  }
}
function mainObservatory(group) {
  building(group, 0, -.28, 1.72, 1.08, 1.25, 0xe8e2d2, 0x7dcced, 'dome');
  cylinder(group, .16, .21, 1.6, 0xe2d2ac, .04, 1.74, -.53, 10);
  const beacon = ball(group, .2, 0x9dffff, .04, 2.62, -.53);
  beacon.material = paint(0x9dffff, true);
  building(group, -1.85, .6, .66, .6, .55, 0xf2dcb2, 0x4b91bc);
  waterfall(group, .4, 2.1, .34);
  path(group, [[-2.2,1.1],[-1.25,.76],[-.4,.94],[.32,.5],[1.6,.88],[2.45,1.2]], 0xf0d4a5);
  flowerTree(group, -1.8, -.95);
  grove(group, 0x399866, 1);
  addMainDocks(group, 0x91f5ff);
}
function mainTree(group) {
  cylinder(group, .12, .18, 1.67, 0xb78b5d, 0, 1.3, -.42, 8);
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI * 2 / 6;
    const x = Math.cos(angle) * .72;
    const z = -.42 + Math.sin(angle) * .58;
    ball(group, .63, i % 2 ? 0x89d780 : 0xa4e39a, x, 2.2 + i % 2 * .18, z);
    ball(group, .17, 0x9ae9f4, x * 1.13, 2.6 + i % 2 * .14, z, 0).material = paint(0x9ae9f4, true);
  }
  cylinder(group, 1.17, 1.17, .13, 0xe9d7b4, 0, .51, -.45, 16);
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI * 2 / 9;
    cylinder(group, .045, .045, .58, 0xf3e2c4, Math.cos(a)*1.02, .83, -.45+Math.sin(a)*.83, 6);
  }
  path(group, [[-2.5,.9],[-1.5,.42],[-.5,.85],[.45,.6],[1.6,.95],[2.45,1.1]], 0xebd0aa);
  flowerTree(group, -2.05, .1);
  grove(group, 0x51a36b);
  waterfall(group, 1.1, 2, .34);
  addMainDocks(group, 0xbafaff);
}

export const MAIN_POSITION = [3, 0, 1];
export const MAIN_RADIUS = 4.6;
export function createMainPlanet(initialStyle = 'observatory') {
  const group = new THREE.Group();
  group.position.set(...MAIN_POSITION);
  group.scale.setScalar(1.1);
  group.userData.planet = {id: 'main', name: '主星球'};
  const variants = {};
  for (const [style, build] of [['observatory', mainObservatory], ['tree', mainTree]]) {
    const variant = new THREE.Group();
    orbitAndOrb(variant, themes[style]);
    makeGround(variant, themes[style], style === 'observatory' ? 6 : 9);
    build(variant);
    group.add(variant);
    variants[style] = variant;
  }
  function setStyle(style) {
    const selected = variants[style] ? style : 'observatory';
    for (const [name, variant] of Object.entries(variants)) variant.visible = name === selected;
    group.userData.style = selected;
  }
  setStyle(initialStyle);
  return {group, setStyle};
}
