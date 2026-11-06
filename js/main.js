import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { planets } from './data.js';
import { createScene, addStarfield, addNebula } from './scene.js';
import { createPlanet, createCore } from './planets.js';
import { createInteractionManager } from './interactions.js';
import { initUI, openPlanet } from './ui.js';

const canvas=document.getElementById('universe');
const {scene,camera,renderer}=createScene(canvas);
const universe=new THREE.Group();
scene.add(universe);
const stars=addStarfield(scene);
const nebula=addNebula(scene);
const core=createCore();
universe.add(core);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.055;
controls.enablePan=false;
controls.minDistance=18;
controls.maxDistance=90;
controls.rotateSpeed=.48;
controls.zoomSpeed=.72;
controls.target.set(0,0,0);
controls.autoRotate=true;
controls.autoRotateSpeed=.22;

const planetMeshes=[];
const planetGroups=new Map();
for(const def of planets){
  const {group,sphere}=createPlanet(def);
  universe.add(group);
  planetMeshes.push(group);
  planetGroups.set(def.id,group);
}

let cameraTween=null;
function animateCamera(position,target,duration=1200){
  cameraTween={start:performance.now(),duration,from:camera.position.clone(),to:new THREE.Vector3(...position),targetFrom:controls.target.clone(),targetTo:new THREE.Vector3(...target)};
  controls.autoRotate=false;
}
function focusPlanet(id){
  const def=planets.find(p=>p.id===id);
  if(!def)return;
  const p=new THREE.Vector3(...def.position);
  const direction=p.clone().normalize();
  const cameraPosition=p.clone().add(direction.multiplyScalar(def.radius*3.5+8)).add(new THREE.Vector3(0,def.radius*.8,0));
  animateCamera(cameraPosition.toArray(),p.toArray(),1100);
  openPlanet(id);
}
function goHome(){
  document.getElementById('planetPanel').classList.remove('is-open');
  document.getElementById('projectModal').classList.remove('is-open');
  animateCamera([0,25,49],[0,0,0],1200);
  controls.autoRotate=true;
}
const ui=initUI({onSelectPlanet:focusPlanet,onHome:goHome});
const disposeInteractions=createInteractionManager({
  camera,controls,planetMeshes,
  onPlanet:def=>focusPlanet(def.id),
  onEmpty:()=>{}
});

const clock=new THREE.Clock();
function tick(now){
  requestAnimationFrame(tick);
  const elapsed=clock.getElapsedTime();
  core.rotation.y+=.0018;
  core.rotation.x=Math.sin(elapsed*.12)*.025;
  for(const [id,group] of planetGroups.entries()){
    group.rotation.y+=.0015+(Number(id.length)*.0001);
    group.position.y=planets.find(p=>p.id===id).position[1]+Math.sin(elapsed*.55+planets.findIndex(p=>p.id===id))*0.18;
  }
  stars.rotation.y+=.000025;
  nebula.rotation.z+=.000015;
  if(cameraTween){
    const t=Math.min(1,(now-cameraTween.start)/cameraTween.duration);
    const eased=1-Math.pow(1-t,3);
    camera.position.lerpVectors(cameraTween.from,cameraTween.to,eased);
    controls.target.lerpVectors(cameraTween.targetFrom,cameraTween.targetTo,eased);
    if(t>=1)cameraTween=null;
  }
  controls.update();
  renderer.render(scene,camera);
}
requestAnimationFrame(tick);

function resize(){
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
}
window.addEventListener('resize',resize);
window.addEventListener('beforeunload',disposeInteractions);
setTimeout(()=>document.getElementById('loading').classList.add('done'),650);
