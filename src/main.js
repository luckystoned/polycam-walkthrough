import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.7, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.touchAction = 'none';
document.body.appendChild(renderer.domElement);

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
scene.add(light);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const controls = new PointerLockControls(camera, document.body);
scene.add(controls.object);

const loader = new GLTFLoader();
loader.load('/model.glb', (gltf) => {
  const model = gltf.scene;
  model.position.set(0, 0, 0);
  model.scale.set(1, 1, 1);
  scene.add(model);
});

// ---------- DESKTOP CONTROLS ----------

const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyW' || event.code === 'ArrowUp') keys.forward = true;
  if (event.code === 'KeyS' || event.code === 'ArrowDown') keys.backward = true;
  if (event.code === 'KeyA' || event.code === 'ArrowLeft') keys.left = true;
  if (event.code === 'KeyD' || event.code === 'ArrowRight') keys.right = true;
});

document.addEventListener('keyup', (event) => {
  if (event.code === 'KeyW' || event.code === 'ArrowUp') keys.forward = false;
  if (event.code === 'KeyS' || event.code === 'ArrowDown') keys.backward = false;
  if (event.code === 'KeyA' || event.code === 'ArrowLeft') keys.left = false;
  if (event.code === 'KeyD' || event.code === 'ArrowRight') keys.right = false;
});

// ---------- MOBILE UI ----------

const mobileUI = document.createElement('div');
mobileUI.innerHTML = `
  <div id="left-zone" style="
    position: fixed;
    left: 0;
    bottom: 0;
    width: 50vw;
    height: 100vh;
    z-index: 20;
    touch-action: none;
  ">
    <div id="joystick-base" style="
      position: absolute;
      left: 40px;
      bottom: 40px;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.35);
      background: rgba(255,255,255,0.08);
    ">
      <div id="joystick-stick" style="
        position: absolute;
        left: 35px;
        top: 35px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(255,255,255,0.45);
      "></div>
    </div>
  </div>

  <div id="right-zone" style="
    position: fixed;
    right: 0;
    bottom: 0;
    width: 50vw;
    height: 100vh;
    z-index: 20;
    touch-action: none;
  "></div>
`;
document.body.appendChild(mobileUI);

const leftZone = document.getElementById('left-zone');
const rightZone = document.getElementById('right-zone');
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');

let moveX = 0;
let moveY = 0;

let joystickActive = false;
let joystickPointerId = null;
let joystickCenter = { x: 0, y: 0 };
const joystickRadius = 50;

leftZone.addEventListener('pointerdown', (event) => {
  joystickActive = true;
  joystickPointerId = event.pointerId;
  leftZone.setPointerCapture(event.pointerId);

  const rect = joystickBase.getBoundingClientRect();
  joystickCenter = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };

  updateJoystick(event.clientX, event.clientY);
});

leftZone.addEventListener('pointermove', (event) => {
  if (!joystickActive || event.pointerId !== joystickPointerId) return;
  updateJoystick(event.clientX, event.clientY);
});

leftZone.addEventListener('pointerup', resetJoystick);
leftZone.addEventListener('pointercancel', resetJoystick);

function updateJoystick(clientX, clientY) {
  const dx = clientX - joystickCenter.x;
  const dy = clientY - joystickCenter.y;

  const distance = Math.min(Math.sqrt(dx * dx + dy * dy), joystickRadius);
  const angle = Math.atan2(dy, dx);

  const limitedX = Math.cos(angle) * distance;
  const limitedY = Math.sin(angle) * distance;

  joystickStick.style.transform = `translate(${limitedX}px, ${limitedY}px)`;

  moveX = limitedX / joystickRadius;
  moveY = limitedY / joystickRadius;
}

function resetJoystick(event) {
  if (event && event.pointerId !== joystickPointerId) return;

  joystickActive = false;
  joystickPointerId = null;

  moveX = 0;
  moveY = 0;

  joystickStick.style.transform = `translate(0px, 0px)`;
}

// ---------- MOBILE LOOK CONTROL ----------

let lookActive = false;
let lookPointerId = null;
let lastLookX = 0;
let lastLookY = 0;

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const lookSensitivity = 0.003;

rightZone.addEventListener('pointerdown', (event) => {
  lookActive = true;
  lookPointerId = event.pointerId;
  rightZone.setPointerCapture(event.pointerId);

  lastLookX = event.clientX;
  lastLookY = event.clientY;
});

rightZone.addEventListener('pointermove', (event) => {
  if (!lookActive || event.pointerId !== lookPointerId) return;

  const dx = event.clientX - lastLookX;
  const dy = event.clientY - lastLookY;

  lastLookX = event.clientX;
  lastLookY = event.clientY;

  euler.setFromQuaternion(camera.quaternion);

  euler.y -= dx * lookSensitivity;
  euler.x -= dy * lookSensitivity;

  const maxVerticalLook = Math.PI / 2 - 0.05;
  euler.x = Math.max(-maxVerticalLook, Math.min(maxVerticalLook, euler.x));

  camera.quaternion.setFromEuler(euler);
});

rightZone.addEventListener('pointerup', resetLook);
rightZone.addEventListener('pointercancel', resetLook);

function resetLook(event) {
  if (event && event.pointerId !== lookPointerId) return;

  lookActive = false;
  lookPointerId = null;
}

// ---------- DESKTOP START SCREEN ----------

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

if (!isMobile) {
  const instructions = document.createElement('div');
  instructions.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(0,0,0,0.65);
      color: white;
      font-family: sans-serif;
      text-align: center;
      cursor: pointer;
      z-index: 100;
    ">
      <div>
        <h1>Entrar al recorrido</h1>
        <p>Click para empezar</p>
        <p>WASD / Flechas: moverse<br/>Mouse: mirar<br/>ESC: salir</p>
      </div>
    </div>
  `;
  document.body.appendChild(instructions);

  instructions.addEventListener('click', () => controls.lock());

  controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
  });

  controls.addEventListener('unlock', () => {
    instructions.style.display = 'block';
  });
} else {
  controls.unlock();
}

// ---------- LOOP ----------

const clock = new THREE.Clock();
const speed = 3;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  const usingKeyboard = controls.isLocked;
  const usingTouch = isMobile;

  if (usingKeyboard) {
    if (keys.forward) controls.moveForward(speed * delta);
    if (keys.backward) controls.moveForward(-speed * delta);
    if (keys.left) controls.moveRight(-speed * delta);
    if (keys.right) controls.moveRight(speed * delta);
  }

  if (usingTouch) {
    const forwardAmount = -moveY;
    const rightAmount = moveX;

    controls.moveForward(forwardAmount * speed * delta);
    controls.moveRight(rightAmount * speed * delta);
  }

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});