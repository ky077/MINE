import * as THREE from 'three';

const material = (color, options = {}) => new THREE.MeshStandardMaterial({
  color, roughness: .82, metalness: 0, ...options,
});
const M = {
  wood: material('#9c6c49'), roof: material('#d77861'), cream: material('#fff5d9'),
  stone: material('#ded2bb'), path: material('#f1dcab'), water: material('#61b9cc', { roughness: .35 }),
  trunk: material('#805f47'), leaf: material('#4c9b70'), dark: material('#265f68'),
  glass: material('#98d7db', { metalness: .18, roughness: .28 }),
};
function mesh(parent, geometry, mat, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, mat);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
const box = (parent, w, h, d, mat, x = 0, y = 0, z = 0) =>
  mesh(parent, new THREE.BoxGeometry(w, h, d), mat, x, y, z);
const cylinder = (parent, top, bottom, height, sides, mat, x = 0, y = 0, z = 0) =>
  mesh(parent, new THREE.CylinderGeometry(top, bottom, height, sides), mat, x, y, z);
const cone = (parent, radius, height, sides, mat, x = 0, y = 0, z = 0) =>
  mesh(parent, new THREE.ConeGeometry(radius, height, sides), mat, x, y, z);

export const locations = {
  career: [-10.7, 3.1],
  chinese: [-5.2, -9.1],
  reading: [5.5, -9.5],
  diagnostics: [11.3, 1.3],
  research: [2.8, 10.7],
};

function islandBase(parent, radius, grass, seed = 0, tint = null) {
  const sides = seed ? 9 + seed % 3 : 11;
  const earth = material(seed ? '#c9a77f' : '#bea17d');
  const surfaceColor = new THREE.Color(grass);
  if (tint) surfaceColor.lerp(new THREE.Color(tint), .28);
  cylinder(parent, radius - .25, radius - .7, 1.65, sides, earth, 0, -.75);
  cylinder(parent, radius, radius - .15, .24, sides, material('#e6cda4'), 0, .18);
  const top = cylinder(parent, radius - .14, radius - .27, .26, sides, material(surfaceColor), 0, .43);
  top.rotation.y = seed * .24;
  return top;
}

function path(parent, points, width = .27, mat = M.path) {
  for (let i = 1; i < points.length; i++) {
    const [x1, z1] = points[i - 1], [x2, z2] = points[i];
    const length = Math.hypot(x2 - x1, z2 - z1);
    const step = box(parent, width, .045, length, mat, (x1 + x2) / 2, .59, (z1 + z2) / 2);
    step.rotation.y = Math.atan2(x2 - x1, z2 - z1);
  }
}

function tree(parent, x, z, scale = 1, pine = false) {
  cylinder(parent, .07 * scale, .1 * scale, .55 * scale, 6, M.trunk, x, .83 * scale, z);
  if (pine) {
    cone(parent, .42 * scale, .9 * scale, 7, M.leaf, x, 1.35 * scale, z);
    cone(parent, .32 * scale, .72 * scale, 7, M.leaf, x, 1.7 * scale, z);
  } else {
    mesh(parent, new THREE.IcosahedronGeometry(.43 * scale, 0), M.leaf, x, 1.35 * scale, z);
  }
}

function house(parent, x, z, width = 1.1, depth = .9, roof = M.roof, walls = M.cream) {
  box(parent, width, .8, depth, walls, x, 1, z);
  const cap = cone(parent, width * .79, .52, 4, roof, x, 1.68, z);
  cap.rotation.y = Math.PI / 4;
  box(parent, width * .2, .42, .045, M.wood, x, .78, z + depth / 2 + .025);
  return cap;
}

function tower(parent, x, z, body = M.cream, cap = M.roof) {
  cylinder(parent, .35, .48, 1.8, 8, body, x, 1.45, z);
  cone(parent, .65, .62, 8, cap, x, 2.67, z);
  box(parent, .18, .34, .05, M.dark, x, 1.55, z + .36);
}

function bridge(world, [x, z], radius) {
  const distance = Math.hypot(x, z);
  const ux = x / distance, uz = z / distance;
  const start = 3.65, end = distance - radius + .2;
  const length = end - start;
  if (length <= 0) return;
  const angle = Math.atan2(ux, uz);
  const n = Math.ceil(length / .32);
  for (let i = 0; i <= n; i++) {
    const r = start + i * length / n;
    const plank = box(world, 1.2, .11, .24, M.wood, ux * r, .52, uz * r);
    plank.rotation.y = angle;
  }
  const middle = (start + end) / 2;
  const nx = -uz, nz = ux;
  for (const side of [-1, 1]) {
    const rail = box(world, .08, .07, length + .1, M.wood,
      ux * middle + nx * side * .65, .88, uz * middle + nz * side * .65);
    rail.rotation.y = angle;
    for (let i = 0; i <= 3; i++) {
      const r = start + i * length / 3;
      cylinder(world, .065, .075, .7, 6, M.wood,
        ux * r + nx * side * .65, .62, uz * r + nz * side * .65);
    }
  }
}

function mainIsland(group) {
  islandBase(group, 4.1, '#8bbf83');
  path(group, [[-3.5,.1],[-2.1,-.3],[-.9,-.1],[.2,.8],[1.2,.4],[3.5,.1]], .35);
  path(group, [[-1.7,-3.3],[-1.3,-1.9],[-.3,-.7],[.2,.8],[1.4,2],[2.5,3]], .32);
  // The academy anchors the central island.
  box(group, 2.8, 1.35, 1.65, M.cream, 0, 1.22, -.9);
  box(group, 3.15, .17, 2, M.roof, 0, 2.02, -.9);
  box(group, 1.05, .58, .13, M.dark, 0, 1.36, -.01);
  for (const x of [-1.15, -.78, .78, 1.15]) {
    box(group, .14, .66, .12, M.wood, x, 1.22, .02);
  }
  box(group, 1.45, .26, .55, M.stone, 0, .64, .23);
  tower(group, -1.75, -1.35);
  tower(group, 1.75, -1.35);
  // A winding stream reaches the cliff, where it becomes a waterfall.
  path(group, [[1.9,-3.1],[2.25,-2],[2,-1],[2.55,.15],[3.55,1.05]], .33, M.water);
  box(group, .44, 2.2, .1, M.water, 3.62, -.6, 1.12).rotation.y = -.8;
  for (const [x,z] of [[-3,-2.2],[-2.7,1.8],[2.8,-2],[3,2.1]]) tree(group,x,z,.78);
}

function careerIsland(group, accent, color) {
  islandBase(group, 3.15, '#78b771', 1, color);
  path(group, [[2.7,-.2],[1.5,.1],[.4,-.4],[-.6,.45],[-2,1]], .24);
  cone(group, 1.25, .95, 7, material('#72a766'), -1.5, .95, -1.15);
  cone(group, .8, .62, 7, material('#94c57d'), -2.1, .83, -.45);
  house(group, .65, -.8, 1.15, .8, accent);
  house(group, -1.3, 1.25, .78, .72, accent);
  tower(group, 1.75, 1.15, M.stone, accent);
  for (const [x,z] of [[-2.3,-2],[-2.35,.8],[-.4,-2.35],[.3,1.85],[1.9,-1.8],[2.35,.2]]) tree(group,x,z,.68);
}

function chineseIsland(group, accent, color) {
  islandBase(group, 3.05, '#87bba3', 2, color);
  path(group, [[.2,2.5],[-.4,1.4],[.3,.2],[1.1,-.9]], .26, M.stone);
  path(group, [[-2,-1.6],[-1.3,-.7],[-1.7,.2],[-.8,1.5]], .5, M.water);
  box(group, .5, 2.15, .09, M.water, -2.45, -.59, -1.7).rotation.y = -.7;
  house(group, .5, -.45, 1.45, 1, accent);
  box(group, 1.65, .09, 1.24, accent, .5, 1.81, -.45);
  tower(group, 1.75, 1.25, material('#f1e1c7'), accent);
  cylinder(group, .55, .55, .09, 8, M.stone, -1.5, 1.08, 1.25);
  cone(group, .78, .42, 8, accent, -1.5, 1.46, 1.25);
  const arch = box(group, 1.12, .14, .3, M.stone, -1.35, .78, -.15);
  arch.rotation.y = -.36;
  for (const [x,z] of [[-2.25,1.7],[-2,-2],[2.25,-1.8],[.1,-2.3]]) tree(group,x,z,.65,true);
  // A simple 山 glyph formed from raised gold strokes on the academy facade.
  const gold = material('#cfab5c');
  box(group,.54,.045,.04,gold,.5,1.14,.075);
  box(group,.045,.43,.04,gold,.5,1.33,.075);
  box(group,.045,.26,.04,gold,.27,1.25,.075);
  box(group,.045,.26,.04,gold,.73,1.25,.075);
}

function readingIsland(group, accent, color) {
  islandBase(group, 3.15, '#9bbf88', 3, color);
  // Open-book terrain: two raised pages and a central spine.
  const pageA = box(group, 1.65, .18, 1.3, M.cream, -1.15, .66, .6);
  pageA.rotation.z = -.08;
  const pageB = box(group, 1.65, .18, 1.3, M.cream, .55, .66, .6);
  pageB.rotation.z = .08;
  box(group, .13, .23, 1.3, accent, -.3, .68, .6);
  path(group, [[-2.6,-.6],[-1.5,-.25],[-.45,-1.35],[1.2,-1.6],[2.6,-.4]], .24);
  house(group, .25, -1.35, 1.8, 1.15, accent);
  box(group, 1.2, .38, .07, M.dark, .25, 1.25, -.74);
  house(group, -1.95, -1.2, .75, .7, accent);
  for (const [x,z] of [[-2.35,1.7],[-1.95,-2.2],[1.7,1.75],[2.2,-1.65]]) tree(group,x,z,.65);
  for (let i=0;i<4;i++) box(group,.22,.31,.37,material(['#e39b75','#80aeb9','#d1b264','#a193bf'][i]),1.2+i*.28,.8,.65);
}

function diagnosticsIsland(group, accent, color) {
  islandBase(group, 3.15, '#a4b5aa', 4, color);
  for (const [x,z,h] of [[-1.8,-1.6,1.1],[-1.15,-2,1.45],[-2.2,-.8,.8]]) {
    cone(group,.7,h,5,material('#8a9fa1'),x,.57+h/2,z);
  }
  path(group, [[-2.5,.6],[-1.2,.1],[0,.8],[1.2,1.3],[2.6,.6]], .25, material('#c8d7d0'));
  box(group,1.55,.9,1.05,M.glass,.5,1.03,-.8);
  box(group,1.7,.15,1.2,accent,.5,1.58,-.8);
  box(group,1.15,.8,.9,M.cream,-1.2,1.0,1.15);
  box(group,1.3,.12,1.02,accent,-1.2,1.47,1.15);
  cylinder(group,.38,.54,1.7,6,accent,1.8,1.45,1.2);
  const light = material(color,{emissive:color,emissiveIntensity:1.2});
  mesh(group,new THREE.OctahedronGeometry(.38),light,1.8,2.5,1.2);
  for (const [x,z] of [[-2.2,1.9],[2.4,-1.7]]) cylinder(group,.23,.3,.35,6,light,x,.78,z);
}

function researchIsland(group, accent, color) {
  islandBase(group, 3.3, '#88bb8e', 5, color);
  path(group, [[-2.8,-.2],[-1.5,.1],[-.3,0],[1.2,.2],[2.8,.1]], .27, M.stone);
  path(group, [[-.2,-2.7],[.1,-1.5],[-.3,0],[.1,1.4],[.4,2.7]], .24, M.stone);
  box(group,1.7,1.15,1.25,M.cream,-.45,1.13,-.75);
  cone(group,1.07,.7,8,accent,-.45,2.1,-.75);
  for (const x of [-1.15,-.75,-.3,.15]) cylinder(group,.07,.07,.65,6,M.stone,x,.94,-.07);
  house(group,1.85,-.85,.95,.88,accent);
  house(group,-1.85,-.7,.9,.8,accent);
  cylinder(group,.62,.62,.14,10,M.stone,1.65,.63,1.6);
  mesh(group,new THREE.SphereGeometry(.48,10,8),M.glass,1.65,1.08,1.6);
  for (const [x,z] of [[-2,1.7],[-1.2,2.2],[.1,2.2],[2.4,2.3]]) tree(group,x,z,.58);
  for (const [x,z] of [[-1.1,1.2],[-.5,1.5],[.5,1.55]]) cylinder(group,.2,.2,.08,8,material('#e9b88b'),x,.61,z);
}

export function createIsland(scene, definitions) {
  const world = new THREE.Group();
  scene.add(world);
  const sea = mesh(scene, new THREE.CircleGeometry(70, 96), M.water, 0, -1.75, 0);
  sea.rotation.x = -Math.PI / 2;
  const center = new THREE.Group();
  center.userData.islandId = 'main';
  center.userData.phase = 0;
  world.add(center);
  mainIsland(center);
  const builders = [careerIsland, chineseIsland, readingIsland, diagnosticsIsland, researchIsland];
  const landmarks = [center];
  definitions.forEach((definition, index) => {
    const group = new THREE.Group();
    const [x,z] = locations[definition.id];
    group.position.set(x, 0, z);
    group.userData.islandId = definition.id;
    group.userData.phase = index * 1.3;
    world.add(group);
    const accent = material(definition.color);
    builders[index](group, accent, definition.color);
    bridge(world, [x,z], index === 4 ? 3.3 : index === 1 ? 3.05 : 3.15);
    landmarks.push(group);
  });
  return { landmarks, world };
}
