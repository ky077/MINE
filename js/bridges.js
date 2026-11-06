import * as THREE from 'three';
import { MAIN_RADIUS } from './planets.js';

const UP = new THREE.Vector3(0, 1, 0);

// A separate network makes bridge geometry easy to rebuild at responsive breakpoints.
export function createBridgeNetwork(parent, mainGroup, planetGroups, planets) {
  const group = new THREE.Group();
  parent.add(group);
  const travelers = [];

  function clear() {
    group.traverse(object => {
      object.geometry?.dispose();
      if (object.material && !Array.isArray(object.material)) object.material.dispose();
    });
    group.clear();
    travelers.length = 0;
  }

  function rebuild() {
    clear();
    for (const [index, def] of planets.entries()) {
      const center = mainGroup.position;
      const destination = planetGroups.get(def.id).position;
      const direction = new THREE.Vector3(destination.x - center.x, 0, destination.z - center.z).normalize();
      const side = new THREE.Vector3(-direction.z, 0, direction.x);
      const start = new THREE.Vector3(center.x, center.y + .58, center.z)
        .addScaledVector(direction, MAIN_RADIUS * .79);
      const end = new THREE.Vector3(destination.x, destination.y + .55, destination.z)
        .addScaledVector(direction, -def.radius * .78);
      const midpoint = start.clone().lerp(end, .5);
      midpoint.y += 1.35;
      midpoint.z += .35;
      const makeCurve = offset => new THREE.CatmullRomCurve3([
        start.clone().addScaledVector(side, offset),
        start.clone().lerp(midpoint, .42).addScaledVector(side, offset),
        midpoint.clone().addScaledVector(side, offset),
        midpoint.clone().lerp(end, .58).addScaledVector(side, offset),
        end.clone().addScaledVector(side, offset)
      ]);
      const centerCurve = makeCurve(0);
      const deck = new THREE.Mesh(new THREE.TubeGeometry(centerCurve, 56, .19, 7, false),
        new THREE.MeshStandardMaterial({color: 0x54718d, roughness: .42, metalness: .58}));
      group.add(deck);

      const bridgeColor = new THREE.Color(def.color);
      for (const offset of [-.32, .32]) {
        const rail = new THREE.Mesh(new THREE.TubeGeometry(makeCurve(offset), 56, .04, 5, false),
          new THREE.MeshBasicMaterial({color: bridgeColor, transparent: true, opacity: .94, toneMapped: false}));
        group.add(rail);
      }
      for (let i = 1; i <= 9; i++) {
        const point = centerCurve.getPointAt(i / 10);
        const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .65, 6),
          new THREE.MeshBasicMaterial({color: 0xd3eeff, toneMapped: false}));
        crossbar.position.copy(point);
        crossbar.position.y += .08;
        crossbar.quaternion.setFromUnitVectors(UP, side);
        group.add(crossbar);
        for (const offset of [-.32, .32]) {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(.027, .027, .24, 6),
            new THREE.MeshBasicMaterial({color: bridgeColor, toneMapped: false}));
          post.position.copy(point).addScaledVector(side, offset);
          post.position.y += .14;
          group.add(post);
        }
      }
      for (const phase of [0, .5]) {
        const pulse = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6),
          new THREE.MeshBasicMaterial({color: bridgeColor, toneMapped: false}));
        group.add(pulse);
        travelers.push({mesh: pulse, curve: centerCurve, phase, speed: .08 + index * .008});
      }
    }
  }

  function animate(elapsed) {
    for (const traveler of travelers) {
      traveler.mesh.position.copy(traveler.curve.getPointAt((elapsed * traveler.speed + traveler.phase) % 1));
      traveler.mesh.position.y += .15;
    }
  }

  rebuild();
  return {group, rebuild, animate};
}
