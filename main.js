// main.js
import * as THREE from 'three';

// MediaPipe Tasks Vision（GestureRecognizer）
import {
  FilesetResolver,
  GestureRecognizer,
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js';

// ====== Scene Core ======
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 1.4, 6);

// 奢华光照：环境光 + 定向光 + 半球光
scene.add(new THREE.AmbientLight(0x232323, 0.6));
const keyLight = new THREE.DirectionalLight(0xfff3d0, 1.0);
keyLight.position.set(3, 6, 6);
scene.add(keyLight);
scene.add(new THREE.HemisphereLight(0x404050, 0x0b0b14, 0.35));

// ====== Particle Tree ======
const particleCount = 42000;
const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const targetTree = new Float32Array(particleCount * 3);
const targetScatter = new Float32Array(particleCount * 3);

const colorA = new THREE.Color(0xc8b47e); // 金色
const colorB = new THREE.Color(0xe8e6df); // 米白灯泡
const tmp = new THREE.Vector3();

// 生成圆锥形树（半径随高度线性缩小），带轻微扰动
function generateTreeTargets() {
  const height = 3.6;
  const baseRadius = 1.6;
  for (let i = 0; i < particleCount; i++) {
    const h = Math.random() * height;              // 0..H
    const r = baseRadius * (1 - h / height);       // 半径收敛
    const theta = Math.random() * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * 0.04;
    const x = (r + jitter) * Math.cos(theta);
    const z = (r + jitter) * Math.sin(theta);
    const y = h + (Math.random() - 0.5) * 0.03;

    targetTree[i * 3 + 0] = x;
    targetTree[i * 3 + 1] = y;
    targetTree[i * 3 + 2] = z;

    // 散开目标：大球壳上随机点（星云态）
    const R = 5.0;
    const u = Math.random();
    const v = Math.random();
    const phi = 2 * Math.PI * u;
    const costheta = 2 * v - 1;
    const sintheta = Math.sqrt(1 - costheta * costheta);
    const sx = R * sintheta * Math.cos(phi);
    const sy = R * sintheta * Math.sin(phi);
    const sz = R * costheta;

    targetScatter[i * 3 + 0] = sx;
    targetScatter[i * 3 + 1] = sy;
    targetScatter[i * 3 + 2] = sz;

    // 初始位置：从散开开始
    positions[i * 3 + 0] = targetScatter[i * 3 + 0];
    positions[i * 3 + 1] = targetScatter[i * 3 + 1];
    positions[i * 3 + 2] = targetScatter[i * 3 + 2];

    // 奢华双色灯泡渐变
    const mix = Math.pow(Math.random(), 1.6);
    const c = colorA.clone().lerp(colorB, mix);
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
}
generateTreeTargets();

particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particleMat = new THREE.PointsMaterial({
  size: 0.035,
  vertexColors: true,
  transparent: true,
  opacity: 0.95,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const particles = new THREE.Points(particleGeo, particleMat);
particles.position.y = 0.4;
scene.add(particles);

// ====== Snow Particles（飘雪）======
const snowCount = 800;
const snowGeo = new THREE.BufferGeometry();
const snowPos = new Float32Array(snowCount * 3);
const snowVel = new Float32Array(snowCount);
for (let i = 0; i < snowCount; i++) {
  snowPos[i * 3 + 0] = (Math.random() - 0.5) * 18;
  snowPos[i * 3 + 1] = Math.random() * 10;
  snowPos[i * 3 + 2] = (Math.random() - 0.5) * 18;
  snowVel[i] = 0.6 + Math.random() * 0.8;
}
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snowMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.02,
  transparent: true,
  opacity: 0.8,
  depthWrite: false,
});
const snow = new THREE.Points(snowGeo, snowMat);
scene.add(snow);

// ====== Photo Planes（相册）======
const textureLoader = new THREE.TextureLoader();
const photoUrls = [
  'assets/photos/01.jpg',
  'assets/photos/02.jpg',
  'assets/photos/03.jpg',
  'assets/photos/04.jpg',
  // ... 添加更多
];

const photos = [];
const photoGroup = new THREE.Group();
scene.add(photoGroup);

function spawnPhotos() {
  photoUrls.forEach((url, idx) => {
    const tex = textureLoader.load(url);
    const geo = new THREE.PlaneGeometry(1.0, 1.3);
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      roughness: 0.45,
      metalness: 0.0,
      sheen: 0.3,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 8,
      0.8 + (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 8
    );
    mesh.rotation.set(
      (Math.random() - 0.5) * 0.6,
      (Math.random() - 0.5) * 1.2,
      (Math.random() - 0.5) * 0.2
    );
    mesh.userData.floatPhase = Math.random() * Math.PI * 2;
    photos.push(mesh);
    photoGroup.add(mesh);
  });
}
spawnPhotos();

// ====== State Machine ======
const STATE = {
  TREE: 'TREE',
  SCATTER: 'SCATTER',
  FOCUS: 'FOCUS',
};
let currentState = STATE.SCATTER;
let morphT = 0; // 0: scatter, 1: tree
let focusPhoto = null;

// ====== Camera & Resize ======
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ====== MediaPipe Gesture ======
const videoEl = document.getElementById('cam');
let gestureRecognizer = null;
let lastGesture = null;
let lastGestureTime = 0;

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  videoEl.srcObject = stream;
  await videoEl.play();
}

async function setupGesture() {
  const filesetResolver = await FilesetResolver.forVisionTasks(
    // 本地/远程 WASM 资源自动解析
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  gestureRecognizer = await GestureRecognizer.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float32/1/gesture_recognizer.task',
    },
    runningMode: 'VIDEO',
  });
}

function mapGesture(categoryName) {
  // 统一到三种语义
  // 典型类别包含 Open_Palm / Closed_Fist / Pinch 等（随模型版本会有差异）
  if (!categoryName) return null;
  const name = categoryName.toLowerCase();
  if (name.includes('closed') || name.includes('fist')) return 'FIST';
  if (name.includes('open') || name.includes('palm')) return 'OPEN';
  if (name.includes('pinch')) return 'PINCH';
  return null;
}

async function runGestureLoop() {
  await setupCamera();
  await setupGesture();

  const processFrame = () => {
    if (!gestureRecognizer || videoEl.readyState < 2) {
      requestAnimationFrame(processFrame);
      return;
    }
    const now = performance.now();
    const result = gestureRecognizer.recognizeForVideo(videoEl, now);
    if (result && result.gestures && result.gestures[0] && result.gestures[0][0]) {
      const category = result.gestures[0][0].categoryName;
      const mapped = mapGesture(category);
      if (mapped && mapped !== lastGesture) {
        lastGesture = mapped;
        lastGestureTime = now;
        onGesture(mapped);
      }
    }
    requestAnimationFrame(processFrame);
  };
  processFrame();
}

function onGesture(mapped) {
  // 手势状态切换
  if (mapped === 'FIST') {
    currentState = STATE.TREE;
  } else if (mapped === 'OPEN') {
    currentState = STATE.SCATTER;
    focusPhoto = null;
  } else if (mapped === 'PINCH') {
    // 捏合：选最近照片并聚焦
    focusPhoto = pickClosestPhotoToCamera();
    if (focusPhoto) currentState = STATE.FOCUS;
  }
}

// 最近照片
function pickClosestPhotoToCamera() {
  let best = null;
  let bestD = Infinity;
  const camPos = new THREE.Vector3().copy(camera.position);
  photos.forEach(p => {
    const d = p.position.distanceTo(camPos);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  });
  return best;
}

// ====== Animate Loop ======
const clock = new THREE.Clock();

function animate() {
  const dt = clock.getDelta();

  // 雪花下落
  const sPos = snowGeo.attributes.position.array;
  for (let i = 0; i < snowCount; i++) {
    sPos[i * 3 + 1] -= snowVel[i] * dt;
    sPos[i * 3 + 0] += Math.sin(i * 0.013 + performance.now() * 0.0008) * 0.005;
    if (sPos[i * 3 + 1] < -1) {
      sPos[i * 3 + 1] = 8 + Math.random() * 2;
      sPos[i * 3 + 0] = (Math.random() - 0.5) * 18;
      sPos[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
  }
  snowGeo.attributes.position.needsUpdate = true;

  // 粒子状态插值
  const speed = 0.8;
  if (currentState === STATE.TREE) morphT = Math.min(1, morphT + dt * speed);
  else if (currentState === STATE.SCATTER) morphT = Math.max(0, morphT - dt * speed);

  const pos = particleGeo.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    pos[i3 + 0] = targetScatter[i3 + 0] * (1 - morphT) + targetTree[i3 + 0] * (morphT);
    pos[i3 + 1] = targetScatter[i3 + 1] * (1 - morphT) + targetTree[i3 + 1] * (morphT);
    pos[i3 + 2] = targetScatter[i3 + 2] * (1 - morphT) + targetTree[i3 + 2] * (morphT);
  }
  particleGeo.attributes.position.needsUpdate = true;

  // 相册漂浮与聚焦
  photos.forEach(p => {
    p.userData.floatPhase += dt * 0.5;
    const sway = Math.sin(p.userData.floatPhase) * 0.02;
    p.position.y += sway;
    p.rotation.y += 0.15 * dt;
    p.rotation.x += 0.07 * dt;
  });

  if (currentState === STATE.FOCUS && focusPhoto) {
    // 平滑将照片移到镜头前
    const targetPos = new THREE.Vector3(0, 1.2, camera.position.z - 1.8);
    focusPhoto.position.lerp(targetPos, 0.15);
    focusPhoto.rotation.set(0, 0, 0);
    // 非焦点略微暗化
    photos.forEach(p => {
      p.material.opacity = p === focusPhoto ? 1.0 : 0.35;
    });
  } else {
    photos.forEach(p => (p.material.opacity = 1.0));
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

runGestureLoop();
animate();
