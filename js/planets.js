import * as THREE from 'three';

// Each planet is a small spherical diorama: surface biomes, paths and landmark architecture.
const UP = new THREE.Vector3(0, 1, 0);
const mats = {};
function mat(color, roughness=.82, metalness=.05, emissive=0x000000, intensity=0) {
  const key=[color,roughness,metalness,emissive,intensity].join(':');
  if (!mats[key]) mats[key]=new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity:intensity});
  return mats[key];
}
function surfacePoint(dir, radius, offset=0) {
  return new THREE.Vector3(dir[0],dir[1],dir[2]).normalize().multiplyScalar(radius+offset);
}
function attach(parent, object, dir, radius, offset=0) {
  const normal=new THREE.Vector3(...dir).normalize();
  object.position.copy(normal.clone().multiplyScalar(radius+offset));
  object.quaternion.setFromUnitVectors(UP,normal);
  parent.add(object);
  return object;
}
function addPatch(parent,radius,dir,color,sx,sz,offset=.025) {
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat(color));
  mesh.scale.set(sx,.055,sz);
  return attach(parent,mesh,dir,radius,offset);
}
function addTree(parent,radius,dir,scale=1,leaf=0x4c9a68) {
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.035*scale,.055*scale,.25*scale,7),mat(0x76513a));
  trunk.position.y=.12*scale; g.add(trunk);
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.18*scale,1),mat(leaf,.9,0,leaf,.08));
  crown.position.y=.32*scale; g.add(crown);
  const crown2=new THREE.Mesh(new THREE.IcosahedronGeometry(.12*scale,1),mat(leaf));
  crown2.position.set(.08*scale,.43*scale,.025*scale); g.add(crown2);
  attach(parent,g,dir,radius,.035);
}
function addPine(parent,radius,dir,scale=1,color=0x3b8069) {
  const g=new THREE.Group();
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.035*scale,.05*scale,.18*scale,6),mat(0x6e503a));
  trunk.position.y=.09*scale; g.add(trunk);
  for(let i=0;i<3;i++){
    const cone=new THREE.Mesh(new THREE.ConeGeometry((.17-i*.035)*scale,.24*scale,7),mat(color));
    cone.position.y=(.22+i*.105)*scale; g.add(cone);
  }
  attach(parent,g,dir,radius,.035);
}
function addBuilding(parent,radius,dir,opts={}) {
  const {w=.42,h=.42,d=.38,color=0xe6e4dc,roof=0x566b9c,kind='tower'}=opts;
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,.68,.12));
  body.position.y=h/2; g.add(body);
  if(kind==='pagoda'){
    for(let i=0;i<3;i++){
      const s=1-i*.19;
      const cap=new THREE.Mesh(new THREE.CylinderGeometry(w*.78*s,w*.92*s,.09,8),mat(roof,.55,.18));
      cap.position.y=h*(.36+i*.28); g.add(cap);
      const tip=new THREE.Mesh(new THREE.ConeGeometry(.07*(1-i*.1),.2,7),mat(0xd9bd76,.5,.35));
      tip.position.y=h*(.43+i*.28)+.09; g.add(tip);
    }
  } else if(kind==='dome'){
    const dome=new THREE.Mesh(new THREE.SphereGeometry(w*.58,16,10,0,Math.PI*2,0,Math.PI/2),mat(roof,.48,.18));
    dome.position.y=h; g.add(dome);
  } else if(kind==='library'){
    const roofMesh=new THREE.Mesh(new THREE.ConeGeometry(w*.78,.32,4),mat(roof,.55,.12));
    roofMesh.position.y=h+.13; roofMesh.rotation.y=Math.PI/4; g.add(roofMesh);
    for(let i=-1;i<=1;i++){
      const win=new THREE.Mesh(new THREE.BoxGeometry(.045,.16,.012),mat(0x8ce3ef,.3,.2,0x59c8e8,.8));
      win.position.set(i*w*.22,h*.55,d/2+.008); g.add(win);
    }
  } else {
    const roofMesh=new THREE.Mesh(new THREE.ConeGeometry(w*.75,.22,5),mat(roof,.55,.15));
    roofMesh.position.y=h+.11; g.add(roofMesh);
  }
  // luminous windows on the front face
  for(let i=0;i<2;i++){
    const win=new THREE.Mesh(new THREE.BoxGeometry(.055,.09,.012),mat(0xffdf9a,.35,.1,0xffb94d,.45));
    win.position.set((i-.5)*.14,h*.52,d/2+.01); g.add(win);
  }
  attach(parent,g,dir,radius,.045);
  return g;
}
function addTower(parent,radius,dir,color=0x9bdcff,height=.9) {
  const g=new THREE.Group();
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.09,.15,height,7),mat(0x34466d,.45,.35));
  stem.position.y=height/2; g.add(stem);
  const cap=new THREE.Mesh(new THREE.OctahedronGeometry(.2,1),mat(color,.25,.35,color,.75));
  cap.position.y=height+.08; g.add(cap);
  attach(parent,g,dir,radius,.04);
}
function addPath(parent,radius,dirs,color,width=.09) {
  // A short curved path following the surface, represented by small connected pavers.
  for(let i=0;i<dirs.length;i++){
    const p=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),mat(color,.95));
    p.scale.set(width,.025,width*1.35);
    attach(parent,p,dirs[i],radius,.06);
  }
}
function addBook(parent,radius,dir,scale=1,color=0xe9d9b5) {
  const g=new THREE.Group();
  const cover=new THREE.Mesh(new THREE.BoxGeometry(.32*scale,.055*scale,.24*scale),mat(color,.65));
  g.add(cover);
  const pages=new THREE.Mesh(new THREE.BoxGeometry(.28*scale,.035*scale,.21*scale),mat(0xf5edda));
  pages.position.y=.035*scale; g.add(pages);
  const spine=new THREE.Mesh(new THREE.BoxGeometry(.035*scale,.065*scale,.25*scale),mat(0x8e5d4d));
  spine.position.x=-.145*scale; g.add(spine);
  attach(parent,g,dir,radius,.06);
}
function addCrystal(parent,radius,dir,color=0x8deaff,scale=1) {
  const g=new THREE.Group();
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.19*scale,0),mat(color,.25,.3,color,.5));
  crystal.scale.y=1.8; crystal.position.y=.2*scale; g.add(crystal);
  attach(parent,g,dir,radius,.035);
}
function addCloud(parent,radius,dir,scale=1) {
  const g=new THREE.Group();
  for(let i=0;i<4;i++){
    const c=new THREE.Mesh(new THREE.SphereGeometry(.17*scale,12,8),new THREE.MeshBasicMaterial({color:0xe5f0ff,transparent:true,opacity:.32,depthWrite:false}));
    c.position.set((i-1.5)*.19*scale,.06*scale,Math.sin(i*1.7)*.06*scale); g.add(c);
  }
  attach(parent,g,dir,radius,.32);
}
function makePlanetTexture(baseColor,accentColor,planetId) {
  const canvas=document.createElement('canvas'); canvas.width=1024; canvas.height=512;
  const ctx=canvas.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,1024,512); grad.addColorStop(0,baseColor); grad.addColorStop(.5,accentColor); grad.addColorStop(1,baseColor);
  ctx.fillStyle=grad; ctx.fillRect(0,0,1024,512);
  const palettes={
    career:['#315f45','#76a96b','#b2c98a'],chinese:['#235c82','#3c9eaa','#7ac6c0'],
    reading:['#345f61','#54a69b','#a7d7bd'],diagnostics:['#80613a','#d39b4c','#f0ce79'],
    research:['#3e4778','#7886c5','#d1b77a']
  };
  const palette=palettes[planetId]||['#506080','#8090b0','#c0d0e0'];
  for(let i=0;i<75;i++){
    const x=Math.random()*1024,y=Math.random()*512;
    ctx.fillStyle=palette[i%palette.length];
    ctx.globalAlpha=.12+Math.random()*.25;
    ctx.beginPath();ctx.ellipse(x,y,25+Math.random()*100,10+Math.random()*32,Math.random(),0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  for(let i=0;i<1800;i++){ctx.fillStyle=`rgba(255,255,255,${Math.random()*.1})`;ctx.fillRect(Math.random()*1024,Math.random()*512,1+Math.random()*2,1);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function addAtmosphere(parent,radius,color) {
  const glow=new THREE.Mesh(new THREE.SphereGeometry(radius*1.12,40,28),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.09,side:THREE.BackSide,depthWrite:false}));
  parent.add(glow);
}
function addOrbit(parent,radius,color) {
  const ring=new THREE.Mesh(new THREE.TorusGeometry(radius*1.34,.018,6,140),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.38}));
  ring.rotation.x=Math.PI/2+.35;ring.rotation.y=.2;parent.add(ring);
}
function buildCareer(g,r) {
  // Green highlands, forest belts, a lookout station and a career exploration hub.
  [[.15,.94,.28],[.48,.78,-.12],[-.48,.72,.2],[-.72,.36,-.22],[.76,.42,.15]].forEach((d,i)=>addPatch(g,r,d,[0x497b50,0x69975a,0x8eaa69][i%3],.72+i%2*.18,.5));
  for(let i=0;i<18;i++){
    const a=i*2.399, y=.12+((i*7)%9)*.075, rr=Math.sqrt(1-y*y);
    addTree(g,r,[Math.cos(a)*rr,y,Math.sin(a)*rr],.65+(i%3)*.18,[0x4c8d5b,0x6ba56b,0x3c7457][i%3]);
  }
  addBuilding(g,r,[.18,.94,.28],{w:.65,h:.55,d:.52,color:0xd6d6c1,roof:0x456c55,kind:'dome'});
  addTower(g,r,[-.72,.57,.38],0xffd58b,1.05);
  addPath(g,r,[[.18,.94,.28],[.35,.87,.3],[.48,.78,.2],[.58,.7,.1]],0xc9b98b,.075);
  addCrystal(g,r,[-.25,.9,-.3],0x9de4a6,.75);
}
function buildChinese(g,r) {
  // Blue archipelago, stepped waterways, pagodas and a Chinese learning pavilion.
  [[.2,.91,.25],[-.42,.84,.28],[.58,.72,-.12],[-.7,.55,-.1],[.05,.68,-.72]].forEach((d,i)=>addPatch(g,r,d,[0x3d8e9a,0x65b6b5,0x2f718d][i%3],.66,.48));
  addBuilding(g,r,[.2,.91,.25],{w:.52,h:.48,d:.48,color:0xf0dfc4,roof:0xb94d42,kind:'pagoda'});
  addBuilding(g,r,[-.42,.84,.28],{w:.42,h:.34,d:.4,color:0xe8d5b8,roof:0x356c9b,kind:'pagoda'});
  for(let i=0;i<9;i++){
    const a=i*2.4,y=.22+(i%3)*.12,rr=Math.sqrt(1-y*y);
    addPine(g,r,[Math.cos(a)*rr,y,Math.sin(a)*rr],.75,0x2e7f72);
  }
  addPath(g,r,[[.2,.91,.25],[.02,.95,.22],[-.2,.93,.25],[-.42,.84,.28]],0xe6d5ad,.07);
  addTower(g,r,[.65,.68,.28],0x9deaff,.85);
  addCloud(g,r,[-.25,.96,-.15],.9);
}
function buildReading(g,r) {
  // Teal reading groves, book-shaped landmarks, library and floating books.
  [[.2,.93,.22],[-.5,.78,.36],[.58,.73,.16],[-.35,.7,-.62]].forEach((d,i)=>addPatch(g,r,d,[0x3c8878,0x66a98b,0x9bc6a0][i%3],.68,.5));
  addBuilding(g,r,[.2,.93,.22],{w:.68,h:.55,d:.5,color:0xd9d3b8,roof:0x425e6b,kind:'library'});
  addBuilding(g,r,[-.5,.78,.36],{w:.38,h:.32,d:.36,color:0xc8d8c7,roof:0x7a9b8b,kind:'dome'});
  for(let i=0;i<11;i++){
    const a=i*2.4,y=.1+(i%4)*.12,rr=Math.sqrt(1-y*y);
    addPine(g,r,[Math.cos(a)*rr,y,Math.sin(a)*rr],.55+(i%3)*.12,0x477e69);
  }
  addBook(g,r,[.58,.73,.16],1.15,0xe9d3a4);
  addBook(g,r,[-.35,.7,-.62],.8,0xc6d9e8);
  addCrystal(g,r,[-.68,.55,-.35],0xa5f3df,.8);
  addPath(g,r,[[.2,.93,.22],[.38,.86,.18],[.58,.73,.16]],0xe1d3ad,.07);
}
function buildDiagnostics(g,r) {
  // Amber mineral mesas, laboratory domes, data towers and glowing diagnostic nodes.
  [[.18,.92,.3],[-.5,.82,.25],[.58,.68,-.2],[-.28,.68,-.68]].forEach((d,i)=>addPatch(g,r,d,[0x987044,0xc18b47,0xe0b968][i%3],.72,.48));
  addBuilding(g,r,[.18,.92,.3],{w:.62,h:.52,d:.55,color:0xd9c59e,roof:0x4b6682,kind:'dome'});
  addBuilding(g,r,[-.5,.82,.25],{w:.42,h:.38,d:.42,color:0xe1d3b5,roof:0x647c98,kind:'dome'});
  for(let i=0;i<7;i++){
    const a=i*2.399,y=.18+(i%3)*.14,rr=Math.sqrt(1-y*y);
    addTower(g,r,[Math.cos(a)*rr,y,Math.sin(a)*rr],[0x79d9e9,0xffd17c,0x9daeff][i%3],.65+(i%3)*.18);
  }
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    addCrystal(g,r,[Math.cos(a)*.8,.45,Math.sin(a)*.8],0x8deaff,.65);
  }
  addPath(g,r,[[.18,.92,.3],[.36,.83,.28],[.58,.68,-.2]],0x8ed4d9,.06);
}
function buildResearch(g,r) {
  // Academic campus, formal plazas, observatory, museum and research institute.
  [[.18,.93,.25],[-.48,.8,.2],[.55,.72,.12],[-.28,.7,-.65],[.72,.42,-.2]].forEach((d,i)=>addPatch(g,r,d,[0x606f9c,0x8995bb,0xb2a77f][i%3],.7,.52));
  addBuilding(g,r,[.18,.93,.25],{w:.7,h:.58,d:.55,color:0xe1dfd0,roof:0x4b5d8e,kind:'library'});
  addBuilding(g,r,[-.48,.8,.2],{w:.48,h:.42,d:.46,color:0xd8d7ca,roof:0x7d8cae,kind:'dome'});
  addBuilding(g,r,[.55,.72,.12],{w:.4,h:.5,d:.4,color:0xe2d5b8,roof:0x8b704d,kind:'pagoda'});
  addTower(g,r,[-.28,.7,-.65],0xc6d7ff,1.15);
  for(let i=0;i<7;i++){
    const a=i*2.4,y=.12+(i%3)*.14,rr=Math.sqrt(1-y*y);
    addTree(g,r,[Math.cos(a)*rr,y,Math.sin(a)*rr],.55,0x697e86);
  }
  addPath(g,r,[[.18,.93,.25],[.38,.86,.22],[.55,.72,.12]],0xd9c99e,.075);
  addCrystal(g,r,[.72,.42,-.2],0xc7d7ff,.85);
}


// ---------------- 2.5D isometric career island ----------------
// Flat illustrated colors and clean silhouettes: deliberately no PBR textures or dramatic lighting.
const flatMat = (color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
function careerShape(scale=1) {
  const pts = [[-3.9,-.25],[-3.45,-1.45],[-2.5,-2.15],[-1.25,-2.35],[.15,-2.28],[1.55,-2.0],[2.85,-1.45],[3.65,-.55],[3.8,.45],[3.1,1.45],[1.9,2.05],[.45,2.28],[-1.1,2.12],[-2.45,1.72],[-3.45,.95]];
  const shape = new THREE.Shape();
  pts.forEach(([x,z],i)=> i ? shape.lineTo(x*scale,z*scale) : shape.moveTo(x*scale,z*scale));
  shape.closePath(); return shape;
}
function careerExtrusion(name, scale, depth, y, material) {
  const geo = new THREE.ExtrudeGeometry(careerShape(scale), {depth, bevelEnabled:true, bevelSegments:1, steps:1, bevelSize:.08, bevelThickness:.08});
  geo.rotateX(Math.PI/2);
  const mesh = new THREE.Mesh(geo, material); mesh.name=name; mesh.position.y=y; return mesh;
}
function careerBox(parent,name,x,y,z,w,h,d,color,rot=0) {
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),flatMat(color)); m.name=name; m.position.set(x,y,z); m.rotation.y=rot; parent.add(m); return m;
}
function careerCone(parent,name,x,y,z,r,h,color,segments=6) {
  const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,segments),flatMat(color)); m.name=name; m.position.set(x,y,z); parent.add(m); return m;
}
function careerTree(parent,x,z,s=1,pine=true) {
  const g=new THREE.Group(); g.position.set(x,.55,z); parent.add(g);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.055*s,.075*s,.28*s,5),flatMat(0x98633f)); trunk.position.y=.14*s; g.add(trunk);
  if(pine){
    [[.28,.42],[.23,.62],[.16,.8]].forEach(([r,y],i)=>{const c=new THREE.Mesh(new THREE.ConeGeometry(r*s,.42*s,6),flatMat([0x34734c,0x43895a,0x5b9d63][i]));c.position.y=y*s;g.add(c);});
  } else {
    const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.27*s,1),flatMat(0x69a85f)); crown.position.y=.52*s; g.add(crown);
    const crown2=new THREE.Mesh(new THREE.IcosahedronGeometry(.19*s,1),flatMat(0x82ba6c)); crown2.position.set(.13*s,.66*s,.02*s);g.add(crown2);
  }
  return g;
}
function careerHouse(parent,x,z,s=1,roofColor=0xc96f4b) {
  const g=new THREE.Group();g.position.set(x,.56,z);g.scale.setScalar(s);parent.add(g);
  careerBox(g,'職業體驗小屋',0,.38,0,.72,.7,.62,0xf4d9a6);
  careerBox(g,'小屋門',0,.2,.316,.16,.4,.025,0x8c6045);
  careerBox(g,'小屋窗',-.22,.46,.323,.14,.16,.025,0x83b9c5);
  careerBox(g,'小屋窗',.22,.46,.323,.14,.16,.025,0x83b9c5);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(.58,.48,4),flatMat(roofColor));roof.position.y=.94;roof.rotation.y=Math.PI/4;g.add(roof);
  return g;
}
function careerPath(parent, points, color=0xe7c98d, radius=.12) {
  const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,.57,z)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,48,radius,7,false),flatMat(color));mesh.name='蜿蜒探索道路';parent.add(mesh);return mesh;
}
function buildCareerIsometric(parent) {
  // Jagged floating rock layers, broad grassy top.
  const underside=careerExtrusion('不規則浮空岩層',1,1.22,-.12,flatMat(0x806b5b)); parent.add(underside);
  const lower=careerExtrusion('岩層下緣',.88,.38,-1.12,flatMat(0x5e5960)); lower.position.y=-.48; parent.add(lower);
  const grass=careerExtrusion('草原島面',.985,.13,.55,flatMat(0x75ad68)); parent.add(grass);
  // top meadow patches create illustrated terrain regions.
  const hillData=[[-2.25,.75,.95,.68,0x8fc879],[-.5,1.15,1.25,.7,0x9bce7e],[1.75,.8,1.05,.65,0x6da95f],[2.35,-.75,.8,.6,0x86bd70],[-2.3,-.95,.9,.62,0x6fae68]];
  hillData.forEach(([x,z,rx,rz,c],i)=>{const m=new THREE.Mesh(new THREE.CircleGeometry(1,28),flatMat(c));m.rotation.x=-Math.PI/2;m.scale.set(rx,rz,1);m.position.set(x,.69,z);parent.add(m);});
  // Mountain range at the back, layered and graphic.
  [[-.85,1.48,.78,1.55,0x789b83],[-.05,1.62,.9,2.05,0x638b78],[.82,1.45,.72,1.48,0x86a78a],[1.48,1.2,.55,1.08,0x789b83]].forEach(([x,z,r,h,c])=>{
    const m=new THREE.Mesh(new THREE.ConeGeometry(r,h,5),flatMat(c));m.position.set(x,.68+h/2,z);m.rotation.y=.25;parent.add(m);
    const cap=new THREE.Mesh(new THREE.ConeGeometry(r*.28,h*.25,5),flatMat(0xe7e5d0));cap.position.set(x,.68+h*.88,z);parent.add(cap);
  });
  // Meandering exploration trail and a small crossing bridge.
  careerPath(parent,[[-3.05,-1.0],[-2.25,-1.45],[-1.35,-1.35],[-.55,-.85],[.2,-.45],[1.05,-.55],[1.9,-.95],[2.85,-.55]],0xe8cf9b,.13);
  careerBox(parent,'木橋橋面',-.78,-.02,-.48,.95,.12,.42,0xb57b4b,-.12);
  for(let i=0;i<4;i++)careerBox(parent,'木橋欄杆',-.78,-.0,-.68+i*.13,.95,.07,.045,0x875b3e,-.12);
  // Career exploration center, main focal building.
  const hub=new THREE.Group();hub.position.set(.35,.72,-.45);parent.add(hub);
  careerBox(hub,'職涯探索基地主體',0,.48,0,1.22,.9,.92,0xf1e1bd);
  careerBox(hub,'基地玻璃門',0,.35,.47,.27,.58,.035,0x6fa9b8);
  for(let i=-1;i<=1;i++)careerBox(hub,'基地窗戶',i*.38,.58,.477,.19,.25,.025,0x8fc4ca);
  const hubRoof=new THREE.Mesh(new THREE.ConeGeometry(.94,.62,4),flatMat(0x4d8062));hubRoof.position.y=1.18;hubRoof.rotation.y=Math.PI/4;hub.add(hubRoof);
  // Watchtower and job-experience cottages.
  careerBox(parent,'瞭望塔塔身',-2.75,.98,.15,.34,1.25,.34,0xd8c18f);
  const towerRoof=new THREE.Mesh(new THREE.ConeGeometry(.36,.42,5),flatMat(0xb96c4b));towerRoof.position.set(-2.75,1.82,.15);parent.add(towerRoof);
  careerHouse(parent,-1.85,-1.35,.78,0xc87850);
  careerHouse(parent,2.15,-1.25,.82,0x668b70);
  careerHouse(parent,2.65,.45,.66,0xd18a53);
  // Groves around the perimeter, leaving the central landmarks visible.
  [[-3.0,.55,.9],[-2.65,1.15,.72],[-1.95,1.55,.72],[-3.0,-.45,.7],[-2.25,-1.85,.65],[-1.55,-1.8,.55],[2.95,1.05,.75],[3.05,-.25,.82],[2.45,-1.75,.58],[1.45,1.75,.55],[-1.15,.15,.55],[1.85,.2,.55]].forEach(([x,z,s],i)=>careerTree(parent,x,z,s,i%3!==0));
  // Bushes, stepping stones and tiny route markers.
  [[-1.2,-.3],[1.45,-1.35],[.95,1.05],[-2.7,-1.45],[2.75,.85]].forEach(([x,z])=>{const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.19,1),flatMat(0x79b96b));b.position.set(x,.68,z);parent.add(b);});
  // A small sign at the entrance.
  careerBox(parent,'探索路線指示牌',1.55,.86,-.05,.42,.32,.07,0xf4e7c9);
  careerBox(parent,'指示牌立柱',1.55,.64,-.05,.055,.42,.055,0x8a6546);
}
function createCareerIsland(def) {
  const group=new THREE.Group();group.position.set(...def.position);group.userData.planet=def;
  buildCareerIsometric(group);
  // subtle illustrated outline halo, not a realistic atmospheric glow
  const halo=new THREE.Mesh(new THREE.CircleGeometry(4.55,64),new THREE.MeshBasicMaterial({color:0x8fcf83,transparent:true,opacity:.08,side:THREE.DoubleSide,depthWrite:false}));
  halo.rotation.x=-Math.PI/2;halo.position.y=-1.45;group.add(halo);
  return {group,sphere:group};
}

export function createPlanet(def) {
  if (def.id === 'career') return createCareerIsland(def);
  const group=new THREE.Group();
  group.position.set(...def.position);
  group.userData.planet=def;
  const r=def.radius, color=new THREE.Color(def.color);
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(r,72,56),new THREE.MeshStandardMaterial({
    map:makePlanetTexture(def.color,def.accent,def.id),roughness:.9,metalness:.04,emissive:color,emissiveIntensity:.035
  }));
  sphere.userData.planet=def;group.add(sphere);
  const builders={career:buildCareer,chinese:buildChinese,reading:buildReading,diagnostics:buildDiagnostics,research:buildResearch};
  (builders[def.id]||buildCareer)(group,r);
  addAtmosphere(group,r,color);
  addOrbit(group,r,color);
  return {group,sphere};
}

export function createCore() {
  const group=new THREE.Group();
  const core=new THREE.Mesh(new THREE.SphereGeometry(5.1,72,56),new THREE.MeshStandardMaterial({
    color:0x263a75,emissive:0x253c91,emissiveIntensity:.62,metalness:.48,roughness:.3
  }));
  group.add(core);
  const halo=new THREE.Mesh(new THREE.SphereGeometry(5.7,40,28),new THREE.MeshBasicMaterial({color:0x7e9dff,transparent:true,opacity:.1,side:THREE.BackSide}));
  group.add(halo);
  for(let i=0;i<3;i++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(7.3+i*.65,.025,8,180),new THREE.MeshBasicMaterial({color:i===1?0xb3c7ff:0x617bd1,transparent:true,opacity:.5-i*.1}));
    ring.rotation.x=Math.PI/2+i*.19;ring.rotation.y=i*.35;group.add(ring);
  }
  // The central identity core remains a distinct portfolio hub, not a sixth category.
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=160;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#eaf0ff';ctx.font='600 48px Arial';ctx.textAlign='center';ctx.fillText('MY PORTFOLIO',320,70);
  ctx.fillStyle='#aebfff';ctx.font='22px Arial';ctx.fillText('CREATIVE UNIVERSE',320,112);
  const tex=new THREE.CanvasTexture(canvas);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
  sprite.scale.set(10,2.5,1);sprite.position.y=6.4;group.add(sprite);
  return group;
}
