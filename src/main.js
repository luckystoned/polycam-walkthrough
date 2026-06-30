import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const initialCameraPosition = new THREE.Vector3(0.175, -4.261, 2.108);
const initialCameraRotation = new THREE.Euler(-0.239, 0.603, -0.000, 'YXZ');

camera.position.copy(initialCameraPosition);
camera.rotation.copy(initialCameraRotation);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.xr.enabled = true;

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.touchAction = 'none';

document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
scene.add(light);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const controls = new PointerLockControls(camera, document.body);
const playerRig = new THREE.Group();

scene.add(playerRig);
playerRig.add(controls.object);
controls.object.position.copy(initialCameraPosition);

/**
 * ============================================================
 * AUDIO
 * ============================================================
 */

const ambientAudio = new Audio('/audio.mp3');
ambientAudio.loop = true;
ambientAudio.volume = 0.8;

let audioStarted = false;

function startAudio() {
  if (audioStarted) return;

  ambientAudio
    .play()
    .then(() => {
      audioStarted = true;
    })
    .catch((error) => {
      console.warn('No se pudo reproducir el audio:', error);
    });
}

function stopAudio() {
  ambientAudio.pause();
  ambientAudio.currentTime = 0;
  audioStarted = false;
}

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

  console.error('Error completo cargando GLB:', error);

  const errorMessage =
    error?.message ||
    error?.target?.statusText ||
    JSON.stringify(error, null, 2) ||
    'Error desconocido';

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
      <div style="max-width: 720px;">
        <h2>Error cargando el modelo 3D</h2>

        <p>El archivo existe, pero Three.js no pudo interpretarlo.</p>

        <pre style="
          margin-top: 16px;
          padding: 16px;
          background: rgba(255,255,255,0.08);
          border-radius: 8px;
          text-align: left;
          white-space: pre-wrap;
          overflow: auto;
          max-height: 240px;
        ">${errorMessage}</pre>
      </div>
    </div>
  `;
}

/**
 * ============================================================
 * CARGA DEL MODELO GLB
 * ============================================================
 */

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load(
  '/model.glb',
  (gltf) => {
    console.log('GLB cargado correctamente:', gltf);

    const model = gltf.scene;

    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);

    scene.add(model);

    finishLoading();
  },
  (progress) => {
    console.log('Progreso GLB:', progress.loaded, progress.total);
  },
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
  up: false,
  down: false,
};

let moveX = 0;
let moveY = 0;

/**
 * ============================================================
 * CONTROLES DE TECLADO PARA DESKTOP
 * ============================================================
 */

document.addEventListener('keydown', (event) => {
  if (event.code === 'KeyW' || event.code === 'ArrowUp') {
    keys.forward = true;
    startAudio();
  }

  // S queda reservado para detener audio.
  // Para retroceder, usar Flecha abajo.
  if (event.code === 'ArrowDown') {
    keys.backward = true;
    startAudio();
  }

  if (event.code === 'KeyA' || event.code === 'ArrowLeft') {
    keys.left = true;
    startAudio();
  }

  if (event.code === 'KeyD' || event.code === 'ArrowRight') {
    keys.right = true;
    startAudio();
  }

  if (event.code === 'Space') {
    keys.up = true;
    startAudio();
  }

  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    keys.down = true;
    startAudio();
  }

  if (event.code === 'KeyS') {
    stopAudio();
  }

  if (event.code === 'KeyP') {
    logCurrentPosition();
  }

  if (event.code === 'KeyR') {
    resetPlayerPosition();
  }
});

document.addEventListener('keyup', (event) => {
  if (event.code === 'KeyW' || event.code === 'ArrowUp') keys.forward = false;
  if (event.code === 'ArrowDown') keys.backward = false;
  if (event.code === 'KeyA' || event.code === 'ArrowLeft') keys.left = false;
  if (event.code === 'KeyD' || event.code === 'ArrowRight') keys.right = false;
  if (event.code === 'Space') keys.up = false;
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') keys.down = false;
});

/**
 * ============================================================
 * PANEL DE INSTRUCCIONES DESKTOP
 * ============================================================
 */

const desktopInstructionsPanel = document.createElement('div');

desktopInstructionsPanel.innerHTML = `
  <strong>Controles</strong><br/>
  Oculus: izquierdo mueve, derecho gira/sube/baja<br/>
  W / Flecha arriba: avanzar<br/>
  Flecha abajo: retroceder<br/>
  A / D: moverse lateral<br/>
  Mouse: mirar<br/>
  Espacio: subir<br/>
  Shift: bajar<br/>
  S: detener audio<br/>
  R: resetear posición<br/>
  P: log de posición y rotación<br/>
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
  playerRig.position.set(0, 0, 0);
  playerRig.rotation.set(0, 0, 0);
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
 * LOG CURRENT POSITION
 * ============================================================
 */

function logCurrentPosition() {
  const position = controls.object.position;
  const rotation = camera.rotation;

  console.log('Posición actual:');
  console.log(`x: ${position.x.toFixed(3)}, y: ${position.y.toFixed(3)}, z: ${position.z.toFixed(3)}`);

  console.log('Rotación actual:');
  console.log(`x: ${rotation.x.toFixed(3)}, y: ${rotation.y.toFixed(3)}, z: ${rotation.z.toFixed(3)}`);

  console.log('Copiar para initialCameraPosition:');
  console.log(`const initialCameraPosition = new THREE.Vector3(${position.x.toFixed(3)}, ${position.y.toFixed(3)}, ${position.z.toFixed(3)});`);

  console.log('Copiar para initialCameraRotation:');
  console.log(`const initialCameraRotation = new THREE.Euler(${rotation.x.toFixed(3)}, ${rotation.y.toFixed(3)}, ${rotation.z.toFixed(3)}, 'YXZ');`);
}

/**
 * ============================================================
 * PANTALLA DE INICIO DESKTOP
 * ============================================================
 */

let desktopStartOverlay = null;

if (!isMobile) {
  const instructions = document.createElement('div');
  desktopStartOverlay = instructions;

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
 * WEBXR / OCULUS
 * ============================================================
 */

let isInXR = false;

const xrStickDeadzone = 0.15;
const xrTurnSpeed = 1.8;
const xrVerticalSpeed = 2;
const xrMoveDirection = new THREE.Vector3();
const xrHeadEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const xrHeadYaw = new THREE.Quaternion();
const xrHeadPosition = new THREE.Vector3();
const xrRigOffset = new THREE.Vector3();
const xrWorldUp = new THREE.Vector3(0, 1, 0);

renderer.xr.addEventListener('sessionstart', () => {
  isInXR = true;
  controls.unlock();
  startAudio();

  desktopInstructionsPanel.style.display = 'none';

  if (desktopStartOverlay) {
    desktopStartOverlay.style.display = 'none';
  }
});

renderer.xr.addEventListener('sessionend', () => {
  isInXR = false;

  if (!isMobile) {
    desktopInstructionsPanel.style.display = 'block';

    if (desktopStartOverlay && !controls.isLocked) {
      desktopStartOverlay.style.display = 'block';
    }
  }
});

function normalizeXRStick(x, y) {
  const strength = Math.sqrt(x * x + y * y);

  if (strength < xrStickDeadzone) {
    return { x: 0, y: 0 };
  }

  if (strength > 1) {
    return {
      x: x / strength,
      y: y / strength,
    };
  }

  return { x, y };
}

function getXRInputStick(inputSource) {
  const axes = inputSource.gamepad?.axes;

  if (!axes || axes.length < 2) {
    return { x: 0, y: 0 };
  }

  const candidates = [
    [2, 3],
    [0, 1],
  ];

  let bestX = 0;
  let bestY = 0;
  let bestStrength = 0;

  for (const [xIndex, yIndex] of candidates) {
    const x = axes[xIndex] ?? 0;
    const y = axes[yIndex] ?? 0;
    const strength = x * x + y * y;

    if (strength > bestStrength) {
      bestX = x;
      bestY = y;
      bestStrength = strength;
    }
  }

  return normalizeXRStick(bestX, bestY);
}

function readXRThumbsticks() {
  const session = renderer.xr.getSession();

  if (!session) {
    return {
      left: { x: 0, y: 0 },
      right: { x: 0, y: 0 },
    };
  }

  const sticks = {
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
  };

  for (const inputSource of session.inputSources) {
    const hand = inputSource.handedness;

    if (hand !== 'left' && hand !== 'right') continue;

    sticks[hand] = getXRInputStick(inputSource);
  }

  return sticks;
}

function getXRHeadYaw() {
  const xrCamera = renderer.xr.getCamera(camera);

  xrHeadEuler.setFromQuaternion(xrCamera.quaternion);
  xrHeadEuler.x = 0;
  xrHeadEuler.z = 0;
  xrHeadYaw.setFromEuler(xrHeadEuler);

  return xrHeadYaw;
}

function rotatePlayerRigAroundHead(angle) {
  if (angle === 0) return;

  const xrCamera = renderer.xr.getCamera(camera);

  xrCamera.getWorldPosition(xrHeadPosition);
  xrRigOffset.copy(playerRig.position).sub(xrHeadPosition);
  xrRigOffset.applyAxisAngle(xrWorldUp, angle);

  playerRig.position.copy(xrHeadPosition).add(xrRigOffset);
  playerRig.rotation.y += angle;
}

function movePlayerWithXRController(delta) {
  const { left, right } = readXRThumbsticks();
  const isMoving = left.x !== 0 || left.y !== 0 || right.x !== 0 || right.y !== 0;

  if (!isMoving) return;

  startAudio();

  if (left.x !== 0 || left.y !== 0) {
    xrMoveDirection.set(left.x, 0, left.y);
    xrMoveDirection.applyQuaternion(getXRHeadYaw());
    playerRig.position.addScaledVector(xrMoveDirection, speed * delta);
  }

  if (right.x !== 0) {
    rotatePlayerRigAroundHead(-right.x * xrTurnSpeed * delta);
  }

  if (right.y !== 0) {
    playerRig.position.y += -right.y * xrVerticalSpeed * delta;
  }
}

/**
 * ============================================================
 * LOOP PRINCIPAL DE ANIMACIÓN
 * ============================================================
 */

const clock = new THREE.Clock();
const speed = 3;

function animate() {
  const delta = clock.getDelta();

  if (isInXR) {
    movePlayerWithXRController(delta);
  } else if (controls.isLocked || isMobile) {
    const moveDirection = new THREE.Vector3();

    if (keys.forward) moveDirection.z -= 1;
    if (keys.backward) moveDirection.z += 1;

    if (keys.left) moveDirection.x -= 1;
    if (keys.right) moveDirection.x += 1;

    if (keys.up) moveDirection.y += 1;
    if (keys.down) moveDirection.y -= 1;

    if (isMobile) {
      moveDirection.z += moveY;
      moveDirection.x += moveX;

      const isMovingWithJoystick = Math.abs(moveX) > 0.05 || Math.abs(moveY) > 0.05;

      if (isMovingWithJoystick) {
        startAudio();
      }
    }

    if (moveDirection.lengthSq() > 0) {
      moveDirection.normalize();
      moveDirection.applyQuaternion(camera.quaternion);
      controls.object.position.addScaledVector(moveDirection, speed * delta);
    }
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

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
