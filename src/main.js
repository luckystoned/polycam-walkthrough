import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

/**
 * ============================================================
 * DETECCIÓN DE DISPOSITIVO
 * ============================================================
 */

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/**
 * ============================================================
 * CONFIGURACIÓN GENERAL DE LA ESCENA
 * ============================================================
 */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const initialCameraPosition = new THREE.Vector3(0, 1.7, 3);
const initialCameraRotation = new THREE.Euler(0, 0, 0, 'YXZ');

camera.position.copy(initialCameraPosition);
camera.rotation.copy(initialCameraRotation);

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.touchAction = 'none';

document.body.appendChild(renderer.domElement);

/**
 * ============================================================
 * ILUMINACIÓN
 * ============================================================
 */

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
scene.add(light);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

/**
 * ============================================================
 * CONTROLES DE CÁMARA
 * ============================================================
 */

const controls = new PointerLockControls(camera, document.body);

scene.add(controls.object);
controls.object.position.copy(initialCameraPosition);

/**
 * ============================================================
 * LOADER VISUAL
 * ============================================================
 */

const loadingScreen = document.createElement('div');

loadingScreen.innerHTML = `
  <div style="
    position: fixed;
    inset: 0;
    z-index: 999;
    display: grid;
    place-items: center;
    background: #111;
    color: white;
    font-family: sans-serif;
    text-align: center;
  ">
    <div style="width: 280px;">
      <h2 style="margin-bottom: 24px;">
        Cargando recorrido 3D...
      </h2>

      <div style="
        width: 100%;
        height: 10px;
        background: rgba(255,255,255,0.1);
        border-radius: 999px;
        overflow: hidden;
      ">
        <div id="loading-bar" style="
          width: 0%;
          height: 100%;
          background: white;
          transition: width 0.2s ease;
        "></div>
      </div>

      <p id="loading-progress" style="
        margin-top: 12px;
        opacity: 0.8;
      ">
        0%
      </p>

      <p style="
        opacity: 0.5;
        font-size: 13px;
        margin-top: 20px;
      ">
        En mobile puede tardar unos segundos.
      </p>
    </div>
  </div>
`;

document.body.appendChild(loadingScreen);

const loadingBar = document.getElementById('loading-bar');
const loadingProgress = document.getElementById('loading-progress');

let fakeProgress = 0;
let modelLoaded = false;

/**
 * Fake loader progresivo.
 * Avanza lentamente hasta 90%.
 * Cuando el modelo termina de cargar → pasa a 100%.
 */
const fakeLoaderInterval = setInterval(() => {
  if (modelLoaded) return;

  if (fakeProgress < 90) {
    fakeProgress += Math.random() * 8;

    fakeProgress = Math.min(fakeProgress, 90);

    loadingBar.style.width = `${fakeProgress}%`;
    loadingProgress.innerText = `${Math.round(fakeProgress)}%`;
  }
}, 200);

function finishLoading() {
  modelLoaded = true;

  clearInterval(fakeLoaderInterval);

  loadingBar.style.width = `100%`;
  loadingProgress.innerText = `100%`;

  setTimeout(() => {
    loadingScreen.style.opacity = '0';

    loadingScreen.style.transition = 'opacity 0.4s ease';

    setTimeout(() => {
      loadingScreen.remove();
    }, 400);
  }, 300);
}

function showLoadingError(error) {
  clearInterval(fakeLoaderInterval);

  loadingScreen.innerHTML = `
    <div style="
      position: fixed;
      inset: 0;
      z-index: 999;
      display: grid;
      place-items: center;
      background: #111;
      color: white;
      font-family: sans-serif;
      text-align: center;
      padding: 24px;
    ">
      <div>
        <h2>Error cargando el modelo 3D</h2>

        <p>
          Revisá que el archivo exista en:
        </p>

        <code>/public/model.glb</code>

        <p style="
          opacity: 0.7;
          font-size: 14px;
          margin-top: 16px;
        ">
          También puede pasar si el archivo es demasiado pesado para mobile.
        </p>
      </div>
    </div>
  `;

  console.error(error);
}

/**
 * ============================================================
 * CARGA DEL MODELO GLB
 * ============================================================
 */

const loader = new GLTFLoader();

loader.load(

  '/model.glb',

  (gltf) => {

    const model = gltf.scene;

    model.position.set(0, 0, 0);

    model.scale.set(1, 1, 1);

    scene.add(model);

    finishLoading();

  },

  undefined,

  (error) => {

    showLoadingError(error);

  }

);

/**
 * ============================================================
 * ESTADO DE MOVIMIENTO
 * ============================================================
 */

const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

let moveX = 0;
let moveY = 0;

/**
 * ============================================================
 * CONTROLES DE TECLADO PARA DESKTOP
 * ============================================================
 */

document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyW' || event.code === 'ArrowUp') keys.forward = true;
  if (event.code === 'KeyS' || event.code === 'ArrowDown') keys.backward = true;
  if (event.code === 'KeyA' || event.code === 'ArrowLeft') keys.left = true;
  if (event.code === 'KeyD' || event.code === 'ArrowRight') keys.right = true;

  if (event.code === 'KeyR') {
    resetPlayerPosition();
  }
});

document.addEventListener('keyup', (event) => {
  if (event.code === 'KeyW' || event.code === 'ArrowUp') keys.forward = false;
  if (event.code === 'KeyS' || event.code === 'ArrowDown') keys.backward = false;
  if (event.code === 'KeyA' || event.code === 'ArrowLeft') keys.left = false;
  if (event.code === 'KeyD' || event.code === 'ArrowRight') keys.right = false;
});

/**
 * ============================================================
 * PANEL DE INSTRUCCIONES DESKTOP
 * ============================================================
 */

const desktopInstructionsPanel = document.createElement('div');

desktopInstructionsPanel.innerHTML = `
  <strong>Controles</strong><br/>
  WASD / Flechas: moverse<br/>
  Mouse: mirar<br/>
  R: resetear posición<br/>
  ESC: salir
`;

desktopInstructionsPanel.style.position = 'fixed';
desktopInstructionsPanel.style.top = '16px';
desktopInstructionsPanel.style.left = '16px';
desktopInstructionsPanel.style.zIndex = '150';
desktopInstructionsPanel.style.padding = '12px 14px';
desktopInstructionsPanel.style.borderRadius = '12px';
desktopInstructionsPanel.style.background = 'rgba(0,0,0,0.55)';
desktopInstructionsPanel.style.color = 'white';
desktopInstructionsPanel.style.fontFamily = 'sans-serif';
desktopInstructionsPanel.style.fontSize = '14px';
desktopInstructionsPanel.style.lineHeight = '1.45';
desktopInstructionsPanel.style.backdropFilter = 'blur(8px)';
desktopInstructionsPanel.style.border = '1px solid rgba(255,255,255,0.2)';
desktopInstructionsPanel.style.display = isMobile ? 'none' : 'block';

document.body.appendChild(desktopInstructionsPanel);

/**
 * ============================================================
 * BOTÓN RESET MOBILE
 * ============================================================
 */

const resetButton = document.createElement('button');

resetButton.innerText = 'Reset';

resetButton.style.position = 'fixed';
resetButton.style.top = '16px';
resetButton.style.right = '16px';
resetButton.style.zIndex = '200';
resetButton.style.padding = '10px 14px';
resetButton.style.border = '1px solid rgba(255,255,255,0.35)';
resetButton.style.borderRadius = '999px';
resetButton.style.background = 'rgba(0,0,0,0.55)';
resetButton.style.color = 'white';
resetButton.style.fontFamily = 'sans-serif';
resetButton.style.fontSize = '14px';
resetButton.style.cursor = 'pointer';
resetButton.style.backdropFilter = 'blur(8px)';
resetButton.style.display = isMobile ? 'block' : 'none';

resetButton.addEventListener('click', () => {
  resetPlayerPosition();
});

document.body.appendChild(resetButton);

/**
 * ============================================================
 * UI MOBILE
 * ============================================================
 */

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
    display: ${isMobile ? 'block' : 'none'};
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
    display: ${isMobile ? 'block' : 'none'};
  "></div>
`;

document.body.appendChild(mobileUI);

const leftZone = document.getElementById('left-zone');
const rightZone = document.getElementById('right-zone');
const joystickStick = document.getElementById('joystick-stick');
const joystickBase = document.getElementById('joystick-base');

let joystickActive = false;
let joystickPointerId = null;
let joystickCenter = { x: 0, y: 0 };

const joystickRadius = 50;

leftZone.addEventListener('pointerdown', (event) => {
  if (!isMobile) return;

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
  if (!isMobile) return;
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

  joystickStick.style.transform = 'translate(0px, 0px)';
}

/**
 * ============================================================
 * CONTROL DE MIRADA MOBILE
 * ============================================================
 */

let lookActive = false;
let lookPointerId = null;
let lastLookX = 0;
let lastLookY = 0;

const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const lookSensitivity = 0.003;

rightZone.addEventListener('pointerdown', (event) => {
  if (!isMobile) return;

  lookActive = true;
  lookPointerId = event.pointerId;
  rightZone.setPointerCapture(event.pointerId);

  lastLookX = event.clientX;
  lastLookY = event.clientY;
});

rightZone.addEventListener('pointermove', (event) => {
  if (!isMobile) return;
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

/**
 * ============================================================
 * RESET DE POSICIÓN
 * ============================================================
 */

function resetPlayerPosition() {
  controls.object.position.copy(initialCameraPosition);

  camera.rotation.copy(initialCameraRotation);
  camera.quaternion.setFromEuler(initialCameraRotation);

  moveX = 0;
  moveY = 0;

  if (joystickStick) {
    joystickStick.style.transform = 'translate(0px, 0px)';
  }
}

/**
 * ============================================================
 * PANTALLA DE INICIO DESKTOP
 * ============================================================
 */

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

/**
 * ============================================================
 * LOOP PRINCIPAL DE ANIMACIÓN
 * ============================================================
 */

const clock = new THREE.Clock();
const speed = 3;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (controls.isLocked) {
    if (keys.forward) controls.moveForward(speed * delta);
    if (keys.backward) controls.moveForward(-speed * delta);
    if (keys.left) controls.moveRight(-speed * delta);
    if (keys.right) controls.moveRight(speed * delta);
  }

  if (isMobile) {
    const forwardAmount = -moveY;
    const rightAmount = moveX;

    controls.moveForward(forwardAmount * speed * delta);
    controls.moveRight(rightAmount * speed * delta);
  }

  renderer.render(scene, camera);
}

animate();

/**
 * ============================================================
 * RESPONSIVE
 * ============================================================
 */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});