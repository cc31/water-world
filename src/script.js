import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import * as dat from "dat.gui";
import { TorusGeometry } from "three";

// Loading
const textureLoader = new THREE.TextureLoader();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Objects
const torusGeometry = new THREE.TorusGeometry(10, 1.2, 16, 100);

// Materials
const material = new THREE.MeshBasicMaterial();
material.color = new THREE.Color(0xff0000);
// Mesh
const torus = new THREE.Mesh(torusGeometry, material);
scene.add(torus);

let sun = new THREE.Vector3();
// Water
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
let water = new Water(waterGeometry, {
  textureWidth: 512,
  textureHeight: 512,
  waterNormals: textureLoader.load(
    "textures/waternormals.jpg",
    function (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }
  ),
  sunDirection: new THREE.Vector3(),
  sunColor: 0xffffff,
  waterColor: 0x001e0f,
  distortionScale: 3.7,
  fog: scene.fog !== undefined,
});

water.rotation.x = -Math.PI / 2;
scene.add(water);

// Skybox
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;

skyUniforms["turbidity"].value = 10;
skyUniforms["rayleigh"].value = 2;
skyUniforms["mieCoefficient"].value = 0.005;
skyUniforms["mieDirectionalG"].value = 0.8;

const parameters = {
  elevation: 0,
  azimuth: 180,
};

// Lights

// const pointLight = new THREE.PointLight(0xffffff, 0.1);
// pointLight.position.x = 2;
// pointLight.position.y = 3;
// pointLight.position.z = 4;
// scene.add(pointLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  1,
  20000
);
camera.position.set(30, 30, 100);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set(0, 10, 0);
controls.minDistance = 40.0;
controls.maxDistance = 200.0;
controls.update();
// controls.enableDamping = true
let hoverstate = false;
let INTERSECTED;
let raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
document.addEventListener("mousemove", onPointerMove);
function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (
    pointer.x < 0.1 &&
    pointer.x > -0.1 &&
    pointer.y < 0.2 &&
    pointer.y > -0.2
  ) {
    hoverstate = true;
  } else {
    hoverstate = false;
  }
}

/**
 * GUI - Debug
 */
const gui = new dat.GUI();
const folderTorus = gui.addFolder("Torus");
folderTorus.add(torus.position, "y", 0, 20, 0.1).name("y");
folderTorus.open();

const folderSky = gui.addFolder("Sky");
folderSky.add(parameters, "elevation", 0, 90, 0.1).onChange(updateSun);
folderSky.add(parameters, "azimuth", -180, 180, 0.1).onChange(updateSun);
folderSky.open();
const waterUniforms = water.material.uniforms;
const folderWater = gui.addFolder("Water");
folderWater
  .add(waterUniforms.distortionScale, "value", 0, 8, 0.1)
  .name("distortionScale");
folderWater.add(waterUniforms.size, "value", 0.1, 10, 0.1).name("size");
folderWater.open();

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */

// const pmremGenerator = new THREE.PMREMGenerator(renderer);

function updateSun() {
  const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
  const theta = THREE.MathUtils.degToRad(parameters.azimuth);

  sun.setFromSphericalCoords(1, phi, theta);

  sky.material.uniforms["sunPosition"].value.copy(sun);
  water.material.uniforms["sunDirection"].value.copy(sun).normalize();

  //   scene.environment = pmremGenerator.fromScene(sky).texture;
}

updateSun();

const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const time = performance.now() * 0.001;

  // Update objects
  if (hoverstate) {
    torus.position.y = 12;
    torusGeometry.scale(1.0001, 1, 1);
    torus.rotation.y = 0.3 * elapsedTime;
  } else {
    torus.position.y = 0;
    torus.rotation.y = 0.3 * elapsedTime;
  }

  water.material.uniforms["time"].value += 1.0 / 60.0;

  // Update Orbital Controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
