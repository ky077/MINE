import * as THREE from 'three';

export function createInteractionManager({ canvas, camera, landmarks, onSelect, onHover }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;
  let hovered = null;
  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(landmarks, true)[0];
    let object = hit?.object;
    while (object && !object.userData.islandId) object = object.parent;
    return object || null;
  }
  function move(event) {
    const next = pick(event);
    if (next !== hovered) {
      hovered = next;
      onHover(next?.userData.islandId || null);
    }
    canvas.style.cursor = next ? 'pointer' : 'grab';
  }
  function up(event) {
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 7) {
      const object = pick(event);
      if (object) onSelect(object.userData.islandId);
    }
    down = null;
  }
  canvas.addEventListener('pointerdown', event => { down = { x: event.clientX, y: event.clientY }; });
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointerleave', () => { hovered = null; onHover(null); canvas.style.cursor = 'grab'; });
}
