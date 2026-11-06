import * as THREE from "three";
import {
  OrbitControls
} from "three/addons/controls/OrbitControls.js";

/* =====================================================
   1. DOM 元素
===================================================== */

const container = document.querySelector("#scene-container");

const modal = document.querySelector("#project-modal");
const modalClose = document.querySelector("#modal-close");

const modalCategory = document.querySelector("#modal-category");
const modalTitle = document.querySelector("#modal-title");
const modalDescription = document.querySelector("#modal-description");
const modalLink = document.querySelector("#modal-link");


/* =====================================================
   2. Three.js 場景、相機、Renderer
===================================================== */

// 建立場景
const scene = new THREE.Scene();

scene.background = new THREE.Color("#0a2234");

scene.fog = new THREE.Fog("#0a2234", 22, 48);


// 建立透視相機
const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// 相機初始位置
const initialCameraPosition = new THREE.Vector3(12, 11, 17);

camera.position.copy(initialCameraPosition);


// 建立 WebGL Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

// 開啟陰影
renderer.shadowMap.enabled = true;

renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 色彩與曝光
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.15;

// 將 Canvas 加入 HTML
container.appendChild(renderer.domElement);


/* =====================================================
   3. 燈光設定
===================================================== */

// 環境光
const ambientLight = new THREE.AmbientLight(
  0xffffff,
  1.7
);

scene.add(ambientLight);


// 方向光：模擬太陽
const sunLight = new THREE.DirectionalLight(
  0xfff1d6,
  3.2
);

sunLight.position.set(-8, 14, 9);

sunLight.castShadow = true;

// 陰影解析度
sunLight.shadow.mapSize.set(2048, 2048);

// 陰影範圍
sunLight.shadow.camera.left = -16;
sunLight.shadow.camera.right = 16;
sunLight.shadow.camera.top = 16;
sunLight.shadow.camera.bottom = -16;

sunLight.shadow.bias = -0.0002;

scene.add(sunLight);


/* =====================================================
   4. OrbitControls 相機控制
===================================================== */

const controls = new OrbitControls(
  camera,
  renderer.domElement
);

// 慣性效果
controls.enableDamping = true;

controls.dampingFactor = 0.06;

// 禁止平移
controls.enablePan = false;

// 縮放限制
controls.minDistance = 10;
controls.maxDistance = 30;

// 垂直旋轉限制
controls.minPolarAngle = 0.35;
controls.maxPolarAngle = Math.PI * 0.43;

// 相機注視位置
controls.target.set(0, 0.6, 0);

controls.update();


// 記錄初始全景視角
const homeCameraPosition = camera.position.clone();

const homeTarget = controls.target.clone();


/* =====================================================
   5. 海洋
===================================================== */

// 使用圓形幾何體製作海洋
const oceanGeometry = new THREE.CircleGeometry(
  40,
  96
);

const oceanMaterial = new THREE.MeshStandardMaterial({
  color: 0x17617a,
  roughness: 0.72,
  metalness: 0.05
});

const ocean = new THREE.Mesh(
  oceanGeometry,
  oceanMaterial
);

// 將圓盤轉成水平面
ocean.rotation.x = -Math.PI / 2;

ocean.position.y = -0.28;

ocean.receiveShadow = true;

scene.add(ocean);


/* =====================================================
   6. 島嶼地形
===================================================== */

// 島嶼底層：圓柱體
const islandBaseGeometry = new THREE.CylinderGeometry(
  7.2,
  7.7,
  1.25,
  64,
  1
);

const islandBaseMaterial = new THREE.MeshStandardMaterial({
  color: 0x755a3d,
  roughness: 0.95
});

const islandBase = new THREE.Mesh(
  islandBaseGeometry,
  islandBaseMaterial
);

islandBase.position.y = 0.35;

islandBase.castShadow = true;
islandBase.receiveShadow = true;

scene.add(islandBase);


// 島嶼上層：草地
const islandTopGeometry = new THREE.CylinderGeometry(
  7.18,
  7.18,
  0.28,
  64
);

const islandTopMaterial = new THREE.MeshStandardMaterial({
  color: 0x65a96d,
  roughness: 1
});

const islandTop = new THREE.Mesh(
  islandTopGeometry,
  islandTopMaterial
);

islandTop.position.y = 1.1;

islandTop.castShadow = true;
islandTop.receiveShadow = true;

scene.add(islandTop);


/* =====================================================
   7. 島嶼裝飾：石頭
===================================================== */

const stoneMaterial = new THREE.MeshStandardMaterial({
  color: 0x9aab9a,
  roughness: 1
});

const stonePositions = [
  [-4.8, 1.27, -2.2, 0.48],
  [4.7, 1.25, 2.4, 0.34],
  [-2.8, 1.25, 4.1, 0.28],
  [3.2, 1.25, -4.2, 0.4]
];

stonePositions.forEach(([x, y, z, scale]) => {

  const stone = new THREE.Mesh(
    new THREE.DodecahedronGeometry(scale, 0),
    stoneMaterial
  );

  stone.position.set(x, y, z);

  stone.rotation.set(0.3, 0.6, 0.2);

  stone.castShadow = true;
  stone.receiveShadow = true;

  scene.add(stone);

});


/* =====================================================
   8. 三個作品資料
===================================================== */

// 集中管理作品資訊
// 日後修改作品名稱、介紹、網址、位置都在這裡。

const projectData = [

  {
    id: "project-a",

    name: "Project A",

    category: "WEB DESIGN",

    description: "專案 A 的介紹文字。可以在這裡描述網站目標、設計概念、使用技術與你的負責項目。",

    url: "https://example.com",

    color: 0xffbd69,

    position: [-3.4, 2.05, -1.8],

    geometry: new THREE.BoxGeometry(
      1.25,
      1.25,
      1.25
    )
  },

  {
    id: "project-b",

    name: "Project B",

    category: "INTERACTIVE",

    description: "專案 B 的介紹文字。建議用兩到三句話說明作品特色，以及它解決了什麼問題。",

    url: "https://example.com",

    color: 0x70d6c1,

    position: [3.2, 2.15, -1.6],

    geometry: new THREE.OctahedronGeometry(
      0.9,
      0
    )
  },

  {
    id: "project-c",

    name: "Project C",

    category: "CREATIVE",

    description: "專案 C 的介紹文字。也可以放入個人創作、視覺設計或其他想展示的成果。",

    url: "https://example.com",

    color: 0xb49aff,

    position: [0.2, 2.1, 3.7],

    geometry: new THREE.TorusKnotGeometry(
      0.58,
      0.2,
      96,
      12
    )
  }

];


// 存放可互動的 3D 物件
const interactiveObjects = [];


/* =====================================================
   9. 建立作品展示物件
===================================================== */

projectData.forEach((project, index) => {

  // 作品材質
  const material = new THREE.MeshStandardMaterial({

    color: project.color,

    roughness: 0.35,

    metalness: 0.12,

    emissive: project.color,

    emissiveIntensity: 0.08

  });


  // 建立作品幾何物件
  const mesh = new THREE.Mesh(
    project.geometry,
    material
  );

  mesh.position.set(...project.position);

  mesh.castShadow = true;

  mesh.receiveShadow = true;


  // 將專案資料附加在物件上
  mesh.userData.project = project;

  mesh.userData.baseY = mesh.position.y;

  mesh.userData.floatOffset = index * 1.7;

  mesh.userData.baseScale = 1;


  // 建立展示底座
  const pedestal = new THREE.Mesh(

    new THREE.CylinderGeometry(
      0.78,
      0.9,
      0.18,
      32
    ),

    new THREE.MeshStandardMaterial({
      color: 0xe1e9d9,
      roughness: 0.7
    })

  );

  pedestal.position.set(
    project.position[0],
    1.31,
    project.position[2]
  );

  pedestal.castShadow = true;

  pedestal.receiveShadow = true;

  scene.add(pedestal);


  // 加入場景
  scene.add(mesh);

  // 加入 Raycaster 偵測清單
  interactiveObjects.push(mesh);

});


/* =====================================================
   10. Raycaster：滑鼠互動偵測
===================================================== */

const raycaster = new THREE.Raycaster();

const pointer = new THREE.Vector2();

let hoveredObject = null;

let selectedObject = null;

let isCameraAnimating = false;

let cameraTween = null;


// 更新滑鼠位置
function updatePointerPosition(event) {

  const rect = renderer.domElement.getBoundingClientRect();

  pointer.x =
    ((event.clientX - rect.left) / rect.width) * 2 - 1;

  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

}


// Hover 效果
function setHoveredObject(nextObject) {

  if (hoveredObject === nextObject) return;


  // 還原上一個物件
  if (hoveredObject && hoveredObject !== selectedObject) {

    hoveredObject.scale.setScalar(1);

    hoveredObject.material.emissiveIntensity = 0.08;

  }


  hoveredObject = nextObject;


  // 放大目前 Hover 的物件
  if (hoveredObject && hoveredObject !== selectedObject) {

    hoveredObject.scale.setScalar(1.13);

    hoveredObject.material.emissiveIntensity = 0.28;

  }


  // 更改滑鼠游標
  renderer.domElement.style.cursor =
    hoveredObject ? "pointer" : "grab";

}


// 滑鼠移動偵測
renderer.domElement.addEventListener(
  "pointermove",
  (event) => {

    if (selectedObject || isCameraAnimating) return;

    updatePointerPosition(event);

    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(
      interactiveObjects,
      false
    );

    setHoveredObject(
      intersections.length
      ? intersections[0].object
      : null
    );

  }
);


// 滑鼠離開畫布
renderer.domElement.addEventListener(
  "pointerleave",
  () => {

    if (!selectedObject) {
      setHoveredObject(null);
    }

  }
);


// 滑鼠點擊作品
renderer.domElement.addEventListener(
  "click",
  (event) => {

    if (selectedObject || isCameraAnimating) return;

    updatePointerPosition(event);

    raycaster.setFromCamera(pointer, camera);

    const intersections = raycaster.intersectObjects(
      interactiveObjects,
      false
    );

    if (intersections.length > 0) {

      openProject(intersections[0].object);

    }

  }
);


/* =====================================================
   11. 相機動畫與 Modal
===================================================== */

// 時間控制
const clock = new THREE.Clock();


// 點擊作品
function openProject(object) {

  selectedObject = object;

  setHoveredObject(null);

  const project = object.userData.project;


  // 填入 Modal 內容
  modalCategory.textContent = project.category;

  modalTitle.textContent = project.name;

  modalDescription.textContent = project.description;

  modalLink.href = project.url;


  // 計算相機目標位置
  const focusDirection = new THREE.Vector3(
    0.8,
    0.55,
    1
  ).normalize();

  const destination = object.position.clone().add(
    focusDirection.multiplyScalar(5.2)
  );

  destination.y = Math.max(
    destination.y,
    3.4
  );


  // 相機平滑移動
  startCameraTween(

    camera.position.clone(),

    destination,

    controls.target.clone(),

    object.position.clone()

  );


  // 相機動畫期間禁止手動操作
  controls.enabled = false;


  // 顯示 Modal
  modal.classList.add("is-visible");

  modal.setAttribute("aria-hidden", "false");

  modalClose.focus();

}


// 關閉作品介紹
function closeProject() {

  if (!selectedObject) return;


  // 隱藏 Modal
  modal.classList.remove("is-visible");

  modal.setAttribute("aria-hidden", "true");


  // 相機返回原本的全景位置
  startCameraTween(

    camera.position.clone(),

    homeCameraPosition.clone(),

    controls.target.clone(),

    homeTarget.clone(),

    () => {

      selectedObject.scale.setScalar(1);

      selectedObject.material.emissiveIntensity = 0.08;

      selectedObject = null;

      controls.enabled = true;

      controls.update();

    }

  );

}


// 相機移動動畫
function startCameraTween(
  fromPosition,
  toPosition,
  fromTarget,
  toTarget,
  onComplete = null
) {

  cameraTween = {

    startTime: clock.elapsedTime,

    duration: 1.15,

    fromPosition,

    toPosition,

    fromTarget,

    toTarget,

    onComplete

  };

  isCameraAnimating = true;

}


// 關閉按鈕
modalClose.addEventListener(
  "click",
  closeProject
);


// 按 ESC 關閉 Modal
window.addEventListener("keydown", (event) => {

  if (event.key === "Escape" && selectedObject) {

    closeProject();

  }

});


/* =====================================================
   12. RWD：視窗尺寸調整
===================================================== */

window.addEventListener("resize", () => {

  const width = container.clientWidth;

  const height = container.clientHeight;


  // 更新相機比例
  camera.aspect = width / height;

  camera.updateProjectionMatrix();


  // 更新 Renderer
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(width, height);

});


/* =====================================================
   13. 動畫迴圈
===================================================== */

function animate() {

  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();


  // 作品上下浮動與自轉
  interactiveObjects.forEach((object, index) => {

    if (object === selectedObject) return;


    // 上下浮動
    object.position.y =
      object.userData.baseY
      + Math.sin(
        elapsed * 1.5
        + object.userData.floatOffset
      ) * 0.13;


    // 緩慢旋轉
    object.rotation.y += 0.006 + index * 0.001;


    // TorusKnot 特別動畫
    if (object.geometry.type === "TorusKnotGeometry") {

      object.rotation.x =
        Math.sin(elapsed * 0.8) * 0.15;

    }

  });


  // 相機平滑移動
  if (cameraTween) {

    const rawProgress =
      (elapsed - cameraTween.startTime)
      / cameraTween.duration;

    const t = THREE.MathUtils.clamp(
      rawProgress,
      0,
      1
    );


    // Smoothstep 緩動
    const eased = t * t * (3 - 2 * t);


    // 相機位置插值
    camera.position.lerpVectors(

      cameraTween.fromPosition,

      cameraTween.toPosition,

      eased

    );


    // 相機注視位置插值
    controls.target.lerpVectors(

      cameraTween.fromTarget,

      cameraTween.toTarget,

      eased

    );


    // 動畫結束
    if (t >= 1) {

      const callback = cameraTween.onComplete;

      cameraTween = null;

      isCameraAnimating = false;

      callback ? .();

    }

  }


  // 更新 OrbitControls
  if (controls.enabled) {

    controls.update();

  }


  // 渲染場景
  renderer.render(scene, camera);

}


// 啟動動畫
animate();


/* =====================================================
   14. 未來擴充：GLTF 模型載入
=====================================================

import { GLTFLoader } from
  "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();

loader.load(
  "./models/project-a.glb",

  (gltf) => {

    const model = gltf.scene;

    model.position.set(-3.4, 1.4, -1.8);

    model.scale.setScalar(1);

    model.traverse((child) => {

      if (child.isMesh) {

        child.castShadow = true;

        child.receiveShadow = true;

      }

    });

    scene.add(model);

  },

  undefined,

  (error) => {

    console.error("GLTF 載入失敗：", error);

  }
);

===================================================== */
