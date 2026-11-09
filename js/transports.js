import * as THREE from 'three';
import { MAIN_RADIUS } from './planets.js';

const FORWARD = new THREE.Vector3(0, 0, 1);
const basic = color => new THREE.MeshBasicMaterial({color, toneMapped: false});
const metal = color => new THREE.MeshStandardMaterial({color, roughness: .34, metalness: .35, flatShading: true});

function piece(parent, geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function rocket(color) {
  const craft = new THREE.Group();
  const shell = metal(0xf4f1e6);
  const trim = metal(color);
  const glass = basic(0x81e6ff);
  piece(craft, new THREE.CylinderGeometry(.18, .23, .72, 9), shell).rotation.x = Math.PI / 2;
  piece(craft, new THREE.ConeGeometry(.18, .31, 9), trim, 0, 0, .52).rotation.x = Math.PI / 2;
  piece(craft, new THREE.SphereGeometry(.105, 10, 8), glass, 0, .19, .08);
  for (const side of [-1, 1]) {
    const fin = piece(craft, new THREE.BoxGeometry(.1, .36, .3), trim, side * .24, -.02, -.29);
    fin.rotation.z = side * .35;
  }
  const flame = piece(craft, new THREE.ConeGeometry(.14, .36, 8), basic(0x7be8ff), 0, 0, -.58);
  flame.rotation.x = -Math.PI / 2;
  return {craft, flame};
}

function shuttle(color) {
  const craft = new THREE.Group();
  const body = piece(craft, new THREE.SphereGeometry(.4, 16, 10), metal(0xf5eee0));
  body.scale.set(1, .52, 1.65);
  const canopy = piece(craft, new THREE.SphereGeometry(.23, 12, 8), basic(0x76dfff), 0, .17, .15);
  canopy.scale.set(1.15, .62, 1.45);
  for (const side of [-1, 1]) {
    const wing = piece(craft, new THREE.BoxGeometry(.48, .07, .43), metal(color), side * .48, -.08, -.09);
    wing.rotation.z = side * -.18;
    piece(craft, new THREE.CylinderGeometry(.09, .09, .22, 8), metal(0x527391), side * .22, -.06, -.48)
      .rotation.x = Math.PI / 2;
  }
  const flame = piece(craft, new THREE.ConeGeometry(.13, .29, 8), basic(0x92f4ff), 0, -.03, -.72);
  flame.rotation.x = -Math.PI / 2;
  return {craft, flame};
}

export function createTransportFleet(parent, mainPlanet, planetGroups, planets) {
  const fleet = new THREE.Group();
  parent.add(fleet);
  const flights = planets.map((planet, index) => {
    const vehicle = index % 2 === 0 ? shuttle(planet.color) : rocket(planet.color);
    fleet.add(vehicle.craft);
    for (let i = 0; i < 3; i++) {
      const trail = piece(vehicle.craft, new THREE.SphereGeometry(.07 - i * .015, 8, 6),
        new THREE.MeshBasicMaterial({color: planet.color, transparent: true, opacity: .48 - i * .12, toneMapped: false}),
        0, 0, -.82 - i * .16);
      trail.scale.setScalar(1 - i * .15);
    }
    return {planet, index, ...vehicle, curve: null};
  });

  function rebuildRoutes() {
    for (const flight of flights) {
      const origin = mainPlanet.position;
      const destination = planetGroups.get(flight.planet.id).position;
      const direction = new THREE.Vector3(destination.x - origin.x, 0, destination.z - origin.z).normalize();
      const start = new THREE.Vector3(origin.x, origin.y + 1.3, origin.z)
        .addScaledVector(direction, MAIN_RADIUS * .48);
      const end = new THREE.Vector3(destination.x, destination.y + 1.2, destination.z)
        .addScaledVector(direction, -flight.planet.radius * .45);
      const middle = start.clone().lerp(end, .5);
      middle.y = Math.max(start.y, end.y) + 3.5;
      middle.z += 1.1;
      flight.curve = new THREE.CatmullRomCurve3([
        start,
        start.clone().lerp(middle, .55),
        middle,
        middle.clone().lerp(end, .55),
        end
      ]);
    }
  }

  function animate(elapsed) {
    for (const flight of flights) {
      const cycle = (elapsed * (.12 + flight.index * .008) + flight.index * .38) % 2;
      const outbound = cycle <= 1;
      const t = outbound ? cycle : 2 - cycle;
      const point = flight.curve.getPointAt(t);
      const tangent = flight.curve.getTangentAt(t);
      if (!outbound) tangent.negate();
      flight.craft.position.copy(point);
      flight.craft.quaternion.setFromUnitVectors(FORWARD, tangent.normalize());
      flight.craft.rotateZ(Math.sin(elapsed * 2 + flight.index) * .08);
      flight.flame.scale.y = .8 + Math.sin(elapsed * 14 + flight.index) * .2;
    }
  }

  rebuildRoutes();
  return {fleet, rebuildRoutes, animate};
}
