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
  const surfaceColor = new THREE.Color(grass);
  if (tint) surfaceColor.lerp(new THREE.Color(tint), .28);
  // Faceted rock tapers into an uneven point, leaving a clear gap above the sea.
  const rockColors = ['#c8ad86', '#b99b78', '#d5bb94', '#a99985', '#8f9791'];
  const rings = [
    { radius: radius - .27, y: .07, driftX: 0, driftZ: 0 },
    { radius: radius * .91, y: -.47, driftX: .06, driftZ: -.04 },
    { radius: radius * .68, y: -1.22, driftX: -.13, driftZ: .08 },
    { radius: radius * .31, y: -1.98, driftX: .11, driftZ: -.06 },
  ];
  const vertices = [];
  const colors = [];
  const point = (ring, index) => {
    const angle = index * Math.PI * 2 / sides + seed * .24;
    const variation = 1 + .11 * Math.sin(index * 2.7 + seed * 1.9 + ring.y);
    return [
      Math.cos(angle) * ring.radius * variation + ring.driftX,
      ring.y + .1 * Math.sin(index * 2.3 + seed + ring.y),
      Math.sin(angle) * ring.radius * variation + ring.driftZ,
    ];
  };
  const triangle = (a, b, c, shade) => {
    vertices.push(...a, ...b, ...c);
    const color = new THREE.Color(rockColors[shade % rockColors.length]);
    for (let i = 0; i < 3; i++) colors.push(color.r, color.g, color.b);
  };
  for (let level = 0; level < rings.length - 1; level++) {
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      const topA = point(rings[level], i);
      const topB = point(rings[level], next);
      const lowA = point(rings[level + 1], i);
      const lowB = point(rings[level + 1], next);
      triangle(topA, lowA, topB, i + level * 2 + seed);
      triangle(topB, lowA, lowB, i * 3 + level + seed);
    }
  }
  const tip = [.13 * Math.sin(seed * 2), -2.52 - .12 * (seed % 3), -.1];
  for (let i = 0; i < sides; i++) {
    triangle(point(rings[3], i), tip, point(rings[3], (i + 1) % sides), i + seed + 2);
  }
  const rock = new THREE.BufferGeometry();
  rock.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  rock.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  rock.computeVertexNormals();
  mesh(parent, rock, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1,
    flatShading: true, side: THREE.DoubleSide }));
  cylinder(parent, radius, radius - .15, .24, sides, material('#e6cda4'), 0, .18);
  const top = cylinder(parent, radius - .14, radius - .27, .26, sides, material(surfaceColor), 0, .43);
  top.rotation.y = seed * .24;
  return top;
}

function glassCanopy(parent, radius, height, color) {
  const tint = new THREE.Color(color);
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: { tint: { value: tint } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: `varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * vec4(vPosition, 1.0);
        }`,
      fragmentShader: `uniform vec3 tint;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float edge = pow(1.0 - abs(dot(normalize(vNormal), normalize(-vPosition))), 2.0);
          float alpha = 0.035 + edge * 0.30;
          gl_FragColor = vec4(mix(vec3(0.68, 0.86, 1.0), tint, 0.32), alpha);
        }`,
    }),
  );
  canopy.position.y = .52;
  canopy.scale.set(radius, height, radius);
  canopy.castShadow = false;
  canopy.receiveShadow = false;
  canopy.renderOrder = 5;
  canopy.raycast = () => {};
  parent.add(canopy);
  const rimMaterial = new THREE.MeshBasicMaterial({
    color: tint, transparent: true, opacity: .48, depthWrite: false,
  });
  const rim = mesh(parent, new THREE.TorusGeometry(radius, .035, 6, 64), rimMaterial, 0, .54, 0);
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = false;
  rim.receiveShadow = false;
  rim.raycast = () => {};
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

function airport(parent, x, z, accent, scale = 1) {
  const station = new THREE.Group();
  station.position.set(x, 0, z);
  station.scale.setScalar(scale);
  parent.add(station);
  const runway = material('#e3e8e9');
  const glow = material('#85e5f2', { emissive: '#36b9dc', emissiveIntensity: .6 });
  cylinder(station, .63, .68, .12, 12, runway, 0, .64, 0);
  const ring = mesh(station, new THREE.TorusGeometry(.49, .035, 6, 24), glow, 0, .72, 0);
  ring.rotation.x = Math.PI / 2;
  box(station, .42, .035, .07, accent, 0, .73, 0);
  box(station, .07, .035, .33, accent, -.18, .73, 0);
  box(station, .07, .035, .33, accent, .18, .73, 0);
  box(station, .45, .35, .42, M.cream, -.83, .77, -.12);
  box(station, .54, .09, .51, accent, -.83, .99, -.12);
  box(station, .22, .17, .04, M.glass, -.83, .79, .11);
  cylinder(station, .035, .04, .6, 6, M.stone, -.83, 1.3, -.12);
  mesh(station, new THREE.SphereGeometry(.1, 8, 6), glow, -.83, 1.62, -.12);
  return new THREE.Vector3(parent.position.x + x, 1.08, parent.position.z + z);
}

function mainIsland(group) {
  islandBase(group, 4.1, '#8bbf83');
  path(group, [[-3.5,.1],[-2.1,-.3],[-.9,-.1],[.2,.8],[1.2,.4],[3.5,.1]], .35);
  path(group, [[-1.7,-3.3],[-1.3,-1.9],[-.3,-.7],[.2,.8],[1.4,2],[2.5,3]], .32);
  // The academy's glass dome is the main island landmark.
  box(group, 3.35, 1.15, 2.15, M.cream, 0, 1.15, -.85);
  cylinder(group, 1.65, 1.65, .16, 24, M.stone, 0, 1.78, -.85);
  const glass = material('#79c8e5', {
    transparent: true, opacity: .62, roughness: .12, metalness: .12,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const dome = mesh(group, new THREE.SphereGeometry(1.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    glass, 0, 1.85, -.85);
  dome.castShadow = false;
  const trim = material('#e7b65e', { metalness: .25, roughness: .38 });
  const rim = mesh(group, new THREE.TorusGeometry(1.55, .055, 8, 36), trim, 0, 1.85, -.85);
  rim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;
    const points = Array.from({ length: 9 }, (_, step) => {
      const arc = step * Math.PI / 16;
      return new THREE.Vector3(
        1.55 * Math.sin(arc) * Math.cos(angle),
        1.85 + 1.55 * Math.cos(arc),
        -.85 + 1.55 * Math.sin(arc) * Math.sin(angle),
      );
    });
    mesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, .025, 5), trim);
  }
  // Arched entrance and three shallow steps face the visitor.
  box(group, 1.12, .88, .08, M.dark, 0, 1.05, .27);
  for (const x of [-.66, .66]) cylinder(group, .1, .11, 1.3, 8, trim, x, 1.14, .48);
  mesh(group, new THREE.TorusGeometry(.66, .13, 8, 22, Math.PI), trim, 0, 1.8, .48);
  for (let i = 0; i < 3; i++) {
    box(group, 1.7 + i * .28, .18 - i * .035, .3, M.stone, 0, .69 - i * .045, .55 + i * .28);
  }
  // One lighthouse stands behind the academy.
  const lighthouse = new THREE.Group();
  lighthouse.position.set(2.2, 0, -2.35);
  group.add(lighthouse);
  cylinder(lighthouse, .36, .57, 3.3, 10, M.cream, 0, 2.2, 0);
  cylinder(lighthouse, .52, .52, .12, 12, trim, 0, 3.9, 0);
  cylinder(lighthouse, .34, .34, .75, 10,
    material('#ffe4a1', { emissive: '#f5ae48', emissiveIntensity: .55 }), 0, 4.32, 0);
  cone(lighthouse, .55, .55, 10, M.roof, 0, 4.98, 0);
  cylinder(lighthouse, .035, .035, .56, 6, M.wood, 0, 5.44, 0);
  const flag = new THREE.Shape();
  flag.moveTo(.04, 5.67);
  flag.lineTo(.72, 5.52);
  flag.lineTo(.04, 5.36);
  flag.closePath();
  mesh(lighthouse, new THREE.ShapeGeometry(flag), M.roof);
  for (const [x,z] of [[-3,-2.2],[-2.7,1.8],[2.8,-2],[3,2.1]]) tree(group,x,z,.78);
}

function careerIsland(group, accent, color) {
  islandBase(group, 3.15, '#78b771', 1, color);
  const hill = material('#6f9f61');
  const meadow = material('#a0cd78');
  const cliff = material('#9aa9a0');
  const snow = material('#f4f5e9');
  // The mountain and wooded hills sit behind the winding exploration route.
  cone(group, 1.05, 1.8, 7, cliff, -1.55, 1.44, -1.35);
  cone(group, .39, .62, 7, snow, -1.55, 2.52, -1.35);
  cone(group, .8, 1.28, 7, hill, -.55, 1.14, -1.8);
  cone(group, .65, .98, 7, meadow, -2.35, 1.04, -.7);
  path(group, [[-2.55,.3],[-1.8,.8],[-1.1,.45],[-.65,-.3],[-.1,-.85],
    [.65,-.35],[1.45,.35],[2.4,.5]], .3);
  path(group, [[-.7,-.25],[-.25,1.1],[.65,1.6],[1.45,1.85]], .25);
  // Career exploration base, experience cabins and a single lookout tower.
  house(group, .5, -.75, 1.1, .86, accent);
  box(group, .55, .3, .055, M.dark, .5, 1.19, -.29);
  house(group, -1.85, .95, .73, .68, accent);
  house(group, 1.95, -.7, .72, .68, accent);
  const lookout = new THREE.Group();
  lookout.position.set(1.55, 0, -1.8);
  group.add(lookout);
  for (const x of [-.3,.3]) for (const z of [-.3,.3]) {
    cylinder(lookout, .055, .075, 1.55, 6, M.wood, x, 1.25, z);
  }
  box(lookout, .9, .13, .9, M.wood, 0, 2.02, 0);
  for (const x of [-.4,.4]) box(lookout, .055, .28, .8, M.wood, x, 2.2, 0);
  for (const z of [-.4,.4]) box(lookout, .8, .28, .055, M.wood, 0, 2.2, z);
  const roof = cone(lookout, .77, .52, 4, accent, 0, 2.65, 0);
  roof.rotation.y = Math.PI / 4;
  for (const [x,z,s] of [[-2.6,-1.7,.65],[-2.35,1.8,.55],[-1.4,-2.35,.57],
    [-1.25,1.8,.47],[.15,-2.3,.64],[2.45,-1.55,.56],[2.5,1.3,.58]]) tree(group,x,z,s);
  for (const [x,z,s] of [[-2.2,-.15,.54],[-.45,-2.2,.58],[1.05,-2.35,.62],
    [2.45,-.2,.55]]) tree(group,x,z,s,true);
}

function chineseIsland(group, accent, color) {
  islandBase(group, 3.05, '#87bba3', 2, color);
  const red = material('#ad5a49');
  const gold = material('#d7b75f');
  path(group, [[.2,2.55],[-.15,1.55],[-.5,.55],[-.35,-.45],[.2,-1.45]], .26, M.stone);
  // Courtyard academy with a broad blue tiled roof and red columns.
  box(group,1.65,.8,.95,M.cream,-1.35,1.02,-.65);
  box(group,1.95,.15,1.22,accent,-1.35,1.51,-.65);
  for (const x of [-2,-1.55,-1.1,-.7]) cylinder(group,.055,.065,.72,7,red,x,.99,-.11);
  for (const x of [-1.9,-1.35,-.8]) box(group,.22,.38,.055,M.dark,x,1.08,-.085);
  for (let i=0;i<3;i++) box(group,1.45+i*.18,.08,.22,M.stone,-1.35,.69-i*.035,.04+i*.19);
  // Tiered pagoda on the rear hill, with roof color tied to this island.
  cylinder(group,.85,.98,.55,8,material('#8aa978'),1.65,.86,-1.45);
  for (let level=0;level<3;level++) {
    const y=1.35+level*.57;
    cylinder(group,.39-level*.055,.42-level*.055,.43,8,M.cream,1.65,y,-1.45);
    cone(group,.68-level*.085,.27,8,accent,1.65,y+.34,-1.45);
  }
  cone(group,.17,.35,8,gold,1.65,3.25,-1.45);
  // Pavilion, brush and open book make the language theme readable at a glance.
  cylinder(group,.5,.5,.1,8,M.stone,-1.8,.64,1.45);
  for (const x of [-2.12,-1.48]) cylinder(group,.045,.05,.45,6,red,x,.91,1.45);
  cone(group,.72,.38,8,accent,-1.8,1.32,1.45);
  const pageA=box(group,.42,.045,.65,M.cream,1.5,.65,1.55);
  pageA.rotation.z=.12;
  const pageB=box(group,.42,.045,.65,M.cream,1.93,.65,1.55);
  pageB.rotation.z=-.12;
  cylinder(group,.045,.055,.9,8,M.wood,2.35,1.03,1.28).rotation.z=-.28;
  for (const [x,z] of [[-2.4,-1.75],[-.35,-2.25],[2.35,.05]]) tree(group,x,z,.55,true);
  for (const [x,z] of [[-2.5,.85],[2.4,2.1]]) tree(group,x,z,.5);
  // 山 on the academy front.
  box(group,.43,.035,.045,gold,-1.35,1.12,-.07);
  for (const [x,h] of [[-1.54,.24],[-1.35,.4],[-1.16,.24]])
    box(group,.035,h,.045,gold,x,1.12+h/2,-.06);
}

function readingIsland(group, accent, color) {
  islandBase(group, 3.15, '#9bbf88', 3, color);
  // The island's front edge opens like two thick pages of a book.
  for (const [x,tilt] of [[-1.35,-.11],[.15,.11]]) {
    for(let i=0;i<3;i++) {
      const page=box(group,1.48,.065,1.05,M.cream,x,.65+i*.065,1.87-i*.025);
      page.rotation.z=tilt;
    }
  }
  box(group,.13,.29,1.13,accent,-.6,.75,1.82);
  path(group, [[-.5,2.55],[.15,1.55],[-.35,.65],[.55,-.2],[1.45,-.85]], .29);
  path(group, [[-.35,.65],[-1.45,.25],[-2.3,-.3]], .25);
  // Grand library with a rounded reading dome and symmetrical wings.
  box(group,1.65,1.05,1.12,M.cream,-.15,1.18,-1.1);
  box(group,.7,.78,.95,M.cream,-1.3,1.05,-1.1);
  box(group,.7,.78,.95,M.cream,1,1.05,-1.1);
  box(group,2.75,.12,1.35,accent,-.15,1.75,-1.1);
  cylinder(group,.8,.8,.1,16,M.stone,-.15,1.86,-1.1);
  const dome=mesh(group,new THREE.SphereGeometry(.72,16,8,0,Math.PI*2,0,Math.PI/2),accent,-.15,1.92,-1.1);
  dome.castShadow=true;
  cylinder(group,.055,.055,.42,8,M.wood,-.15,2.75,-1.1);
  for (const x of [-1.32,-.86,.58,1.02]) box(group,.17,.38,.055,M.glass,x,1.2,-.525);
  box(group,.38,.58,.06,M.wood,-.15,.95,-.515);
  for(let i=0;i<2;i++) box(group,1.02+i*.18,.08,.25,M.stone,-.15,.64-i*.035,-.33+i*.22);
  house(group,2.1,.8,.8,.68,accent);
  // Oversized standing books and an open book beside the reading path.
  for(let i=0;i<3;i++) box(group,.31,.82+i*.08,.48,
    material(['#ce8354','#77b2a3','#b8955d'][i]),-2.15+i*.34,1.04,-.7);
  for (const x of [-2.05,-1.65]) box(group,.38,.05,.53,M.cream,x,.64,1.15).rotation.z=x< -1.8?-.12:.12;
  for (const [x,z] of [[-2.4,-1.8],[-1.6,-2.3],[1.8,-2.1],[2.5,-.5],[2.15,1.95]]) tree(group,x,z,.53);
}

function diagnosticsIsland(group, accent, color) {
  islandBase(group, 3.15, '#a4b5aa', 4, color);
  const blue=material('#54c8ed',{ emissive:'#157ba7',emissiveIntensity:.3 });
  const crystal=material('#84d9ee',{ metalness:.15,roughness:.25 });
  const mountain=material('#788e9c');
  const light=material(color,{emissive:color,emissiveIntensity:1.15});
  for (const [x,z,h] of [[-1.85,-1.7,1.15],[-1.05,-2.15,1.55],[-2.35,-.7,.8]])
    cone(group,.65,h,5,mountain,x,.56+h/2,z);
  for (const [x,z,h] of [[-2.45,1.55,.7],[2.35,1.9,.85],[2.65,-.95,.62]])
    mesh(group,new THREE.OctahedronGeometry(h,0),crystal,x,.62+h*.42,z);
  path(group, [[-.1,2.8],[-.35,1.75],[-.9,.8],[-.35,-.15],[.65,-.65]], .3, M.stone);
  path(group, [[-.9,.8],[.15,.55],[1.55,.9]], .23, M.stone);
  // Circular diagnosis center and luminous instrument dome.
  cylinder(group,1.13,1.18,.93,16,M.cream,-.55,1.06,-.45);
  cylinder(group,1.22,1.22,.14,16,accent,-.55,1.61,-.45);
  const dome=mesh(group,new THREE.SphereGeometry(.84,18,9,0,Math.PI*2,0,Math.PI/2),
    M.glass,-.55,1.7,-.45);
  dome.castShadow=false;
  cylinder(group,.87,.87,.065,18,blue,-.55,1.73,-.45);
  for(let i=0;i<10;i++) {
    const a=i*Math.PI/5;
    cylinder(group,.045,.045,.52,6,accent,-.55+1.07*Math.cos(a),1.04,-.45+1.07*Math.sin(a));
  }
  box(group,.34,.48,.07,blue,-.55,.98,.72);
  // Data analysis wing and a freestanding chart display.
  box(group,1.12,.79,.82,M.cream,1.5,1.01,.15);
  box(group,1.3,.11,1.0,accent,1.5,1.47,.15);
  for(const x of [1.18,1.55,1.92]) box(group,.19,.32,.055,M.glass,x,1.07,.59);
  box(group,.85,.6,.08,M.dark,.85,1.03,1.75);
  for(const [x,h] of [[.58,.18],[.82,.31],[1.06,.4]])
    box(group,.11,h,.05,light,x,.84+h/2,1.8);
  cylinder(group,.045,.045,.4,6,M.stone,.85,.58,1.75);
  // Tall data tower with three glowing rings.
  cylinder(group,.32,.43,2.35,10,accent,1.65,1.8,-1.85);
  cylinder(group,.2,.2,2.28,10,blue,1.65,1.86,-1.85);
  for(const y of [1.15,2.05,2.9]) {
    const ring=mesh(group,new THREE.TorusGeometry(.55,.055,6,24),light,1.65,y,-1.85);
    ring.rotation.x=Math.PI/2;
  }
  cone(group,.18,.42,8,light,1.65,3.25,-1.85);
  for(const [x,z] of [[-2.2,.75],[-1.5,1.8],[2.5,.55]]) tree(group,x,z,.46);
}

function researchIsland(group, accent, color) {
  islandBase(group, 3.3, '#88bb8e', 5, color);
  const blue=material('#75b9dc');
  const gold=material('#d7b66b');
  path(group, [[0,2.95],[0,1.75],[-.2,.75],[-.25,-.45],[-.4,-2.55]], .29, M.stone);
  path(group, [[-2.7,.3],[-1.6,.5],[-.2,.75],[1.15,.65],[2.7,.5]], .26, M.stone);
  // Main university hall with columned portico and colored roof.
  box(group,1.95,1.05,1.15,M.cream,-.45,1.15,-.75);
  const roof=cone(group,1.19,.56,4,accent,-.45,1.99,-.75);
  roof.rotation.y=Math.PI/4;
  box(group,1.38,.15,.42,M.stone,-.45,1.45,.04);
  for(const x of [-1.03,-.65,-.27,.11])
    cylinder(group,.065,.075,.72,8,M.stone,x,1.02,.24);
  for(let i=0;i<3;i++) box(group,1.25+i*.18,.07,.23,M.stone,-.45,.66-i*.025,.4+i*.2);
  // Clock tower, museum and contemporary research center.
  box(group,.5,1.72,.5,M.cream,-2.05,1.5,-1.35);
  cone(group,.46,.55,4,accent,-2.05,2.6,-1.35).rotation.y=Math.PI/4;
  cylinder(group,.16,.16,.035,12,gold,-2.05,1.99,-1.075).rotation.x=Math.PI/2;
  house(group,-1.95,.85,.95,.78,accent);
  box(group,1.0,.84,.8,M.cream,1.75,1.04,-.45);
  box(group,1.16,.12,.95,accent,1.75,1.52,-.45);
  for(const x of [1.45,1.78,2.11]) box(group,.2,.3,.05,M.glass,x,1.05,-.02);
  // Observatory is raised on a small hill behind the campus.
  cylinder(group,.73,.93,.52,10,material('#8fae7f'),1.75,.8,-1.95);
  cylinder(group,.55,.55,.38,12,M.cream,1.75,1.22,-1.95);
  mesh(group,new THREE.SphereGeometry(.56,16,8,0,Math.PI*2,0,Math.PI/2),blue,1.75,1.43,-1.95);
  cylinder(group,.13,.19,.72,8,M.stone,2.12,1.91,-2.03).rotation.z=-.6;
  // Fountain plaza, garden beds and shaded campus routes.
  cylinder(group,.76,.76,.08,18,M.stone,.35,.63,1.53);
  cylinder(group,.55,.55,.055,18,blue,.35,.69,1.53);
  cylinder(group,.08,.1,.55,8,M.stone,.35,1.0,1.53);
  cone(group,.17,.32,8,blue,.35,1.43,1.53);
  for(const [x,z] of [[-1.7,1.85],[-1.05,2.2],[1.55,1.9],[2.2,1.1]])
    cylinder(group,.24,.24,.09,8,material('#e6ad95'),x,.61,z);
  for(const [x,z] of [[-2.4,-.3],[-2.35,2],[.3,-2.55],[2.55,-.95],[2.45,2.05]])
    tree(group,x,z,.53);
}

function spacecraft(type, color) {
  const craft = new THREE.Group();
  const shell = material('#f2f6fa', { metalness: .18, roughness: .35 });
  const accent = material(color, { metalness: .15, roughness: .38 });
  const engine = material('#ffc36a', { emissive: '#ff8b42', emissiveIntensity: .85 });
  if (type === 'rocket') {
    cylinder(craft, .16, .23, .68, 10, shell, 0, .08, 0);
    cone(craft, .18, .35, 10, accent, 0, .59, 0);
    cylinder(craft, .09, .09, .08, 10, M.glass, 0, .23, .17).rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) box(craft, .09, .25, .22, accent, side * .22, -.23, 0);
    cone(craft, .11, .25, 8, engine, 0, -.46, 0).rotation.z = Math.PI;
  } else if (type === 'aircraft') {
    cylinder(craft, .1, .15, .88, 8, shell, 0, .07, 0).rotation.x = Math.PI / 2;
    cone(craft, .12, .28, 8, accent, 0, .07, .55).rotation.x = Math.PI / 2;
    box(craft, .95, .05, .27, accent, 0, .05, -.04);
    box(craft, .46, .05, .16, accent, 0, .12, -.35);
    box(craft, .1, .2, .16, accent, 0, .2, -.34);
    mesh(craft, new THREE.SphereGeometry(.12, 10, 6), M.glass, 0, .18, .16);
    cylinder(craft, .09, .09, .04, 8, engine, 0, .07, -.47).rotation.x = Math.PI / 2;
  } else {
    const hull = mesh(craft, new THREE.SphereGeometry(.48, 18, 8), accent);
    hull.scale.set(1, .24, 1);
    const dome = mesh(craft, new THREE.SphereGeometry(.24, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      M.glass, 0, .1, 0);
    dome.castShadow = false;
    const rim = mesh(craft, new THREE.TorusGeometry(.4, .035, 6, 24), engine);
    rim.rotation.x = Math.PI / 2;
  }
  return craft;
}

function createTraffic(world, pads, colors) {
  const routes = new THREE.Group();
  world.add(routes);
  const types = ['rocket', 'aircraft', 'saucer'];
  const vehicles = Array.from({ length: 7 }, (_, index) => {
    const type = index < 3 ? types[index] : types[Math.floor(Math.random() * types.length)];
    const origin = index % pads.length;
    const object = spacecraft(type, colors[origin]);
    routes.add(object);
    return { object, type, origin, current: origin, next: origin,
      phase: 'dwell', start: performance.now(), duration: 1.4 + Math.random() * 3 };
  });
  return (now, reducedMotion = false) => {
    for (const vehicle of vehicles) {
      if (reducedMotion) {
        vehicle.object.position.copy(pads[vehicle.origin]);
        vehicle.object.rotation.set(0, 0, 0);
        continue;
      }
      const elapsed = (now - vehicle.start) / 1000;
      if (elapsed >= vehicle.duration) {
        if (vehicle.phase === 'dwell') {
          vehicle.phase = 'flight';
          const other = Math.floor(Math.random() * (pads.length - 1));
          vehicle.next = other >= vehicle.current ? other + 1 : other;
          vehicle.duration = 5 + Math.random() * 2.5;
        } else {
          vehicle.phase = 'dwell';
          vehicle.current = vehicle.next;
          vehicle.duration = 2 + Math.random() * 2.5;
        }
        vehicle.start = now;
      }
      if (vehicle.phase === 'flight') {
        const t = Math.min(1, (now - vehicle.start) / (vehicle.duration * 1000));
        const from = pads[vehicle.current], to = pads[vehicle.next];
        vehicle.object.position.lerpVectors(from, to, t);
        vehicle.object.position.y += Math.sin(Math.PI * t) * (4.2 + vehicle.origin * .23);
        vehicle.object.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);
        vehicle.object.rotation.z = vehicle.type === 'aircraft' ? Math.sin(Math.PI * t) * .12 : 0;
        vehicle.object.rotation.x = vehicle.type === 'rocket' ? .22 * Math.sin(Math.PI * t) : 0;
      } else {
        vehicle.object.position.copy(pads[vehicle.current]);
        vehicle.object.position.y += Math.sin(now * .003 + vehicle.origin) * .055;
        vehicle.object.rotation.z = 0;
        vehicle.object.rotation.x = 0;
        if (vehicle.type === 'saucer') vehicle.object.rotation.y += .012;
      }
    }
  };
}

export function createIsland(scene, definitions) {
  const world = new THREE.Group();
  scene.add(world);
  const center = new THREE.Group();
  center.userData.islandId = 'main';
  center.userData.phase = 0;
  world.add(center);
  mainIsland(center);
  const pads = [airport(center, -2.55, -1.15, material('#88c9f2'), 1.1)];
  glassCanopy(center, 5.1, 7.4, '#88c9f2');
  const builders = [careerIsland, chineseIsland, readingIsland, diagnosticsIsland, researchIsland];
  const landmarks = [center];
  const airportSites = [[.9, 2.2], [-.7, 2.1], [-2.15, .65], [-.6, 2.15], [2.25, .6]];
  definitions.forEach((definition, index) => {
    const group = new THREE.Group();
    const [x,z] = locations[definition.id];
    group.position.set(x, 0, z);
    group.userData.islandId = definition.id;
    group.userData.phase = index * 1.3;
    world.add(group);
    const accent = material(definition.color);
    builders[index](group, accent, definition.color);
    pads.push(airport(group, ...airportSites[index], accent, .8));
    glassCanopy(group, index === 4 ? 3.9 : 3.7, index === 1 ? 4.6 : 4.2, definition.color);
    landmarks.push(group);
  });
  const updateTraffic = createTraffic(world, pads, ['#88c9f2', ...definitions.map(item => item.color)]);
  return { landmarks, world, updateTraffic };
}
