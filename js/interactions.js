import * as THREE from 'three';

export function createInteractionManager({ camera, controls, planetMeshes, onPlanet, onEmpty }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let down = null;
  function pointerDown(event) { down = {x:event.clientX,y:event.clientY}; }
  function pointerUp(event) {
    if (!down || Math.hypot(event.clientX-down.x,event.clientY-down.y)>6) { down=null; return; }
    const rect = event.target.getBoundingClientRect();
    pointer.x = ((event.clientX-rect.left)/rect.width)*2-1;
    pointer.y = -((event.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(pointer,camera);
    const hits = raycaster.intersectObjects(planetMeshes,true);
    if (hits.length) {
      let obj = hits[0].object;
      while (obj && !obj.userData.planet) obj = obj.parent;
      if (obj?.userData.planet) onPlanet(obj.userData.planet);
    } else if (onEmpty) onEmpty();
    down=null;
  }
  function pointerMove(event) {
    const rect=event.target.getBoundingClientRect();
    pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
    pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(planetMeshes,true);
    document.body.style.cursor=hits.length?'pointer':'grab';
  }
  const canvas = controls.domElement;
  canvas.addEventListener('pointerdown',pointerDown);
  canvas.addEventListener('pointerup',pointerUp);
  canvas.addEventListener('pointermove',pointerMove);
  return () => {
    canvas.removeEventListener('pointerdown',pointerDown);
    canvas.removeEventListener('pointerup',pointerUp);
    canvas.removeEventListener('pointermove',pointerMove);
    document.body.style.cursor='';
  };
}
