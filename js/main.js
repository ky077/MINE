import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { planets } from './data.js';
import { createScene, addStarfield, addNebula } from './scene.js';
import { createPlanet, createMainPlanet, MAIN_POSITION } from './planets.js';
import { createBridgeNetwork } from './bridges.js';
import { createInteractionManager } from './interactions.js';
import { initUI, openPlanet } from './ui.js';

const canvas=document.getElementById('universe');
const {scene,camera,renderer}=createScene(canvas);
const universe=new THREE.Group();
scene.add(universe);
const stars=addStarfield(scene);
const nebula=addNebula(scene);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.055;
controls.enablePan=true;
controls.minDistance=18;
controls.maxDistance=100;
controls.rotateSpeed=.48;
controls.zoomSpeed=.72;
controls.target.set(0,0,0);
controls.autoRotate=false;

const planetMeshes=[];
const planetGroups=new Map();
for(const def of planets){
  const {group,sphere}=createPlanet(def);
  universe.add(group);
  planetMeshes.push(group);
  planetGroups.set(def.id,group);
}
let initialMainStyle='observatory';
try { if(localStorage.getItem('mainPlanetStyle')==='tree') initialMainStyle='tree'; } catch {}
const {group:mainPlanet,setStyle:setMainStyle}=createMainPlanet(initialMainStyle);
universe.add(mainPlanet);
planetMeshes.push(mainPlanet);
const bridgeNetwork=createBridgeNetwork(universe,mainPlanet,planetGroups,planets);

const conceptPanel=document.getElementById('conceptPanel');
const conceptButton=document.getElementById('conceptButton');
function closeConceptPanel(){
  conceptPanel.classList.remove('is-open');
  conceptPanel.setAttribute('aria-hidden','true');
  conceptButton.setAttribute('aria-expanded','false');
}
function openConceptPanel(){
  conceptPanel.classList.add('is-open');
  conceptPanel.setAttribute('aria-hidden','false');
  conceptButton.setAttribute('aria-expanded','true');
}
function selectMainStyle(style){
  setMainStyle(style);
  conceptPanel.querySelectorAll('[data-main-style]').forEach(button=>{
    button.setAttribute('aria-pressed',String(button.dataset.mainStyle===style));
  });
  conceptButton.querySelector('span').textContent=style==='tree'?'B':'A';
  try {localStorage.setItem('mainPlanetStyle',style);} catch {}
}
selectMainStyle(initialMainStyle);
conceptButton.addEventListener('click',openConceptPanel);
document.getElementById('closeConcept').addEventListener('click',closeConceptPanel);
conceptPanel.addEventListener('click',event=>{
  if(event.target.matches('[data-concept-close]')) closeConceptPanel();
  const choice=event.target.closest('[data-main-style]');
  if(choice) selectMainStyle(choice.dataset.mainStyle);
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeConceptPanel();});

let cameraTween=null;
function animateCamera(position,target,duration=1200){
  cameraTween={start:performance.now(),duration,from:camera.position.clone(),to:new THREE.Vector3(...position),targetFrom:controls.target.clone(),targetTo:new THREE.Vector3(...target)};
  controls.autoRotate=false;
}
function focusPlanet(id){
  const def=planets.find(p=>p.id===id);
  if(!def)return;
  const p=planetGroups.get(id).getWorldPosition(new THREE.Vector3());
  // Approach the illustrated front of the island so its landmarks stay readable.
  const cameraPosition=p.clone().add(new THREE.Vector3(0,def.radius*1.65,def.radius*3.9+7));
  animateCamera(cameraPosition.toArray(),p.toArray(),1100);
  openPlanet(id);
}
function goHome(){
  for(const id of ['planetPanel','projectModal']){
    const panel=document.getElementById(id);
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden','true');
  }
  closeConceptPanel();
  animateCamera([0,17,innerWidth<620?76:49],[0,0,0],1200);
}
const ui=initUI({onSelectPlanet:focusPlanet,onHome:goHome});
const disposeInteractions=createInteractionManager({
  camera,controls,planetMeshes,
  onPlanet:def=>def.id==='main'?openConceptPanel():focusPlanet(def.id),
  onEmpty:()=>{}
});

const clock=new THREE.Clock();
function tick(now){
  requestAnimationFrame(tick);
  const elapsed=clock.getElapsedTime();
  for(const [index,def] of planets.entries()){
    const group=planetGroups.get(def.id);
    // A small sway keeps the diorama facing forward; the camera remains draggable.
    group.rotation.y=Math.sin(elapsed*.28+index*.6)*.12;
    group.position.y=def.position[1]+Math.sin(elapsed*.55+index)*.18;
  }
  mainPlanet.rotation.y=Math.sin(elapsed*.22)*.08;
  mainPlanet.position.y=MAIN_POSITION[1]+Math.sin(elapsed*.45)*.12;
  bridgeNetwork.animate(elapsed);
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
  const mobile=innerWidth<620;
  for(const def of planets) planetGroups.get(def.id).position.x=def.position[0]*(mobile?.68:1);
  mainPlanet.position.x=MAIN_POSITION[0]*(mobile?.68:1);
  bridgeNetwork.rebuild();
  if(!cameraTween && !document.getElementById('planetPanel').classList.contains('is-open')){
    camera.position.set(0,17,mobile?76:49);
    controls.target.set(0,0,0);
  }
}
window.addEventListener('resize',resize);
resize();
window.addEventListener('beforeunload',disposeInteractions);
setTimeout(()=>document.getElementById('loading').classList.add('done'),650);
