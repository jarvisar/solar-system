import GUI from "https://cdn.skypack.dev/lil-gui@0.18.0";
import { MathUtils, Clock } from "https://cdn.skypack.dev/three@0.149.0";
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/controls/OrbitControls'
import { DragControls } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/controls/DragControls'
import * as THREE from "https://cdn.skypack.dev/three@0.149.0";
import  { Perlin, FBM } from "https://cdn.skypack.dev/three-noise@1.1.2";
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/loaders/GLTFLoader'
import { FlyControls } from "./FlyControls.js";

// Create a Three.js scene
const scene = new THREE.Scene();

// define control variables
var scale = 3;
var enableOrbits = true;
var flightSensitivity = 10;
var rotationSpeed = 0.2;
var flightFov = 50;
var numAsteroids = 1;
var flightRotationSpeed = 1;

var dropdown = document.getElementById("title");

const customTheme = {
  color: '#ffffff', // white text
  backgroundColor: '#000220', // dark blue background
  borderRadius: '7.5px',
  borderColor: '#ffffff', // white border
  fontSize: '24px',
};

// add gui controls
const gui = new GUI({ autoPlace: false, theme: customTheme });
const flightSettings = gui.addFolder("Flight Settings");
const systemSettings = gui.addFolder("Solar System Settings");
document.getElementById('dat-gui-container').appendChild(gui.domElement); 
const guicontrols = {
  scale: 3,
  flightSensitivity: 10,
  enableOrbits: true,
  rotationSpeed: 0.2,
  flightFov: 50,
  numAsteroids: 1,
  flightRotationSpeed: 1,
};

// add control for scale
systemSettings.add(guicontrols, "scale", 0.1, 10, 0.1).onChange((value) => {
  scale = value;
}).name("System Scale").listen();

// add control for rotationSpeed
systemSettings.add(guicontrols, "rotationSpeed", 0, 10, 0.1).onChange((value) => {
  rotationSpeed = value;
}).name("Orbit Rotation Speed").listen();

// add control for numAsteroids
systemSettings.add(guicontrols, "numAsteroids", 0, 2, 0.1).onChange((value) => {
  scene.remove(asteroidRing);
  scene.remove(kuiperRing);
  numAsteroids = value;
  createAsteroidBelts();
}).name("Asteroid Belt Density").listen();

// add control for enableOrbits
systemSettings.add(guicontrols, "enableOrbits").onChange((value) => {
  if (value) {
    enableOrbits = true;
    // add all orbits
    createOrbits();
  } else {
    enableOrbits = false;
    // remove all orbits
    scene.remove(mercuryOrbit);
    scene.remove(venusOrbit);
    scene.remove(earthOrbit);
    earth.remove(moonOrbit);
    scene.remove(marsOrbit);
    scene.remove(jupiterOrbit);
    scene.remove(saturnOrbit);
    scene.remove(uranusOrbit);
    scene.remove(neptuneOrbit);
  }
}).name("Enable Orbits").listen();

// add control for flightSenstivity
flightSettings.add(guicontrols, "flightSensitivity", 1, 20, 1).onChange((value) => {
  flightSensitivity = value;
  flyControls.rollSpeed = Math.PI / value;
}).name("Flight Sensitivity").listen();

// add control for flightFov
flightSettings.add(guicontrols, "flightFov", 1, 100, 1).onChange((value) => {
  flightFov = value;
}).name("Flight FOV").listen();

// add control for flightRotationSpeed
flightSettings.add(guicontrols, "flightRotationSpeed", 0.1, 5, 0.1).onChange((value) => {
  flightRotationSpeed = value;
  flyControls.rotationSpeed = flightRotationSpeed;
}).name("Flight Rotation Speed").listen();

// Create a camera and position it so it's looking at the scene center
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  400000 * scale
);
camera.position.set(400 * (scale), 300 * (scale), -1600 * (scale));

window.addEventListener('resize', () => {
  // Update the camera's aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update the renderer's size
  renderer.setSize(window.innerWidth, window.innerHeight);
});

var mercuryDistance
var venusDistance 
var earthDistance
var moonDistance 
var marsDistance 
var jupiterDistance 
var saturnDistance 
var uranusDistance 
var neptuneDistance 

// add star background to scene
const starGeometry = new THREE.SphereGeometry(300000 * scale, 32, 32);
const starMaterial = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('public/8k_stars_milky_way.jpg'), side: THREE.BackSide, depthWrite: false });
const starMesh = new THREE.Mesh(starGeometry, starMaterial);
// darken a bit
starMesh.material.color.setRGB(0.5, 0.5, 0.5);
scene.add(starMesh);

//add faint ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Create a renderer and add it to the document
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, autoClear: true });

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

//define all meshes
var sunMesh;
var mercury;
var venus;
var venusAtmo;
var earth;
var cloudMesh;
var moon;
var mars;
var jupiter;
var saturn;
var uranus;
var neptune;

var asteroidRing;
var kuiperRing;

//define all orbits
var mercuryOrbit;
var venusOrbit;
var earthOrbit;
var moonOrbit;
var marsOrbit;
var jupiterOrbit;
var saturnOrbit;
var uranusOrbit;
var neptuneOrbit;

var sunLight;

function createPlanets(){

  mercuryDistance = 1200 * scale * 1.2
  venusDistance = 1500 * scale * 1.2
  earthDistance = 2100 * scale * 1.2
  moonDistance = 200 * scale
  marsDistance = 2700 * scale * 1.2
  jupiterDistance = 4400 * scale * 1.2
  saturnDistance = 5300 * scale * 1.2
  uranusDistance = 6200 * scale * 1.2
  neptuneDistance = 7100 * scale * 1.2

  // Create a sphere for the Sun and add it to the scene as a light source
  sunLight = new THREE.PointLight(0xffffff, 1, 100000 * (scale/3));
  sunLight.shadow.mapSize.width = 4096;
  sunLight.shadow.mapSize.height = 4096;
  sunLight.shadow.camera.near = 0.1;
  sunLight.shadow.camera.far = 1000;
  sunLight.position.set(0, 0, 0);
  sunLight.castShadow = true;
  scene.add(sunLight);

  const sunGeometry = new THREE.SphereGeometry(200 * scale, 128, 128);
  const sunMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_sun.jpg'), emissive: 0xffff00, emissiveIntensity: 1, emissiveMap: new THREE.TextureLoader().load('public/2k_sun.jpg') });
  sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
  sunMesh.position.set(0, 0, 0);
  scene.add(sunMesh);

  // mercury
  const mercuryGeometry = new THREE.SphereGeometry(10 * scale, 64, 64);
  const mercuryMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_mercury.jpg'), bumpMap: new THREE.TextureLoader().load('public/mercury_elevation.jpg'), bumpScale: 0.2 * scale });
  mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
  mercury.castShadow = true;
  mercury.receiveShadow = true;
  mercury.position.set(mercuryDistance, 0, 0);
  scene.add(mercury);

  //venus
  const venusGeometry = new THREE.SphereGeometry(20 * scale, 128, 128);
  const venusMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_venus_surface.jpg'), bumpMap: new THREE.TextureLoader().load('public/venus_elevation.jpg'), bumpScale: 0.2 * scale });
  venus = new THREE.Mesh(venusGeometry, venusMaterial);
  venus.castShadow = true;
  venus.receiveShadow = true;
  venus.position.set(-venusDistance, 0, 0);
  scene.add(venus);

  const venusAtmoGeometry = new THREE.SphereGeometry(20.1 * scale, 128, 128);
  const venusAtmoMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_venus_atmosphere.jpg'), transparent: true, opacity: 0.75 });
  venusAtmo = new THREE.Mesh(venusAtmoGeometry, venusAtmoMaterial);
  venusAtmo.position.set(0, 0, 0);
  venus.add(venusAtmo);

  // earth
  const earthGeometry = new THREE.SphereGeometry(20 * scale, 128, 128);
  const earthMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/8k_earth_daymap.jpg'), bumpMap: new THREE.TextureLoader().load('public/earth_elevation.jpg'), bumpScale: 0.2 * scale, 
  specularMap: new THREE.TextureLoader().load('public/2k_earth_specular_map.tif'), specular: new THREE.Color('grey'), 
  emissiveMap: new THREE.TextureLoader().load('public/2k_earth_nightmap.jpg'), emissive: 0xffffff, emissiveIntensity: 0.2 });
  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.castShadow = true;
  earth.receiveShadow = true;
  earth.position.set(0, 0, earthDistance);
  scene.add(earth);

  // add sphere for cloud layer just barely bigger than earth
  const cloudGeometry = new THREE.SphereGeometry(20.1 * scale, 128, 128);
  const cloudMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/earth_clouds.png'), transparent: true, opacity: 0.6 });
  cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
  cloudMesh.position.set(0, 0, 0);
  earth.add(cloudMesh);

  //moon
  const moonGeometry = new THREE.SphereGeometry(4 * scale, 32, 32);
  const moonMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_moon.jpg'), bumpMap: new THREE.TextureLoader().load('public/moon_elevation.jpg'), bumpScale: 0.1 * scale });
  moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.castShadow = true;
  moon.receiveShadow = true;
  moon.position.set(0, 0, moonDistance);
  earth.add(moon);

  // mars
  const marsGeometry = new THREE.SphereGeometry(14 * scale, 64, 64);
  const marsMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_mars.jpg'), bumpMap: new THREE.TextureLoader().load('public/mars_elevation.jpg'), bumpScale: 0.2 * scale });
  mars = new THREE.Mesh(marsGeometry, marsMaterial);
  mars.castShadow = true;
  mars.receiveShadow = true;
  mars.position.set(0, 0, marsDistance);
  scene.add(mars);

  // jupiter
  const jupiterGeometry = new THREE.SphereGeometry(100 * scale, 128, 128);
  const jupiterMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_jupiter.jpg') });
  jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
  jupiter.castShadow = true;
  jupiter.receiveShadow = true;
  jupiter.position.set(0, 0, jupiterDistance);
  scene.add(jupiter);

  // saturn
  const saturnGeometry = new THREE.SphereGeometry(80 * scale, 128, 128);
  const saturnMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_saturn.jpg') });
  saturn = new THREE.Mesh(saturnGeometry, saturnMaterial);
  saturn.castShadow = true;
  saturn.receiveShadow = true;
  saturn.position.set(0, 0, saturnDistance);
  scene.add(saturn);

  // saturn ring load from 2k_saturn_ring_alpha.png and repoeat image around the ring
  const saturnRingGeometry = new THREE.RingGeometry(100 * scale, 180 * scale, 256);
  const saturnRingMaterial = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('public/saturn_rings.png'), side: THREE.DoubleSide, transparent: true });
  const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
  saturnRing.rotation.x = Math.PI / 2;
  saturnRing.receiveShadow = true;
  saturnRing.castShadow = true;
  saturn.add(saturnRing);

  // uranus
  const uranusGeometry = new THREE.SphereGeometry(60 * scale, 128, 128);
  const uranusMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_uranus.jpg') });
  uranus = new THREE.Mesh(uranusGeometry, uranusMaterial);
  uranus.castShadow = true;
  uranus.receiveShadow = true;
  uranus.position.set(0, 0, uranusDistance);
  scene.add(uranus);

  // neptune
  const neptuneGeometry = new THREE.SphereGeometry(60 * scale, 128, 128);
  const neptuneMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_neptune.jpg') });
  neptune = new THREE.Mesh(neptuneGeometry, neptuneMaterial);
  neptune.castShadow = true;
  neptune.receiveShadow = true;
  neptune.position.set(0, 0, neptuneDistance);
  scene.add(neptune);
  
}

function createAsteroidBelts() {
  // asteroid ring between mars and jupiter
  const asteroidRingGeometry = new THREE.BufferGeometry();
  const asteroidRingMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 * scale, sizeAttenuation: false, opacity: 0.45, transparent: true });

  const vertices = [];
  for (let i = 0; i < 3500 * numAsteroids; i++) {
    var angle = Math.random() * Math.PI * 2;
    var deviation = 200 * scale; // adjust this value to control the amount of deviation
    var distance = THREE.MathUtils.randFloat(marsDistance + mars.geometry.parameters.radius + (scale * 350), jupiterDistance - jupiter.geometry.parameters.radius - (scale * 350));
    var deviationX = THREE.MathUtils.randFloatSpread(deviation);
    var deviationZ = THREE.MathUtils.randFloatSpread(deviation);
    var x = Math.cos(angle) * distance + deviationX;
    var y = THREE.MathUtils.randFloatSpread(75 * scale);
    var z = Math.sin(angle) * distance + deviationZ;
    vertices.push(x, y, z);
  }

  asteroidRingGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  asteroidRing = new THREE.Points(asteroidRingGeometry, asteroidRingMaterial);
  asteroidRing.position.set(0, 0, 0); // place the ring between Mars and Jupiter
  scene.add(asteroidRing);

  // kuiper belt past neptune
  const kuiperRingGeometry = new THREE.BufferGeometry();
  const kuiperRingMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 * scale, sizeAttenuation: false, opacity: 0.45, transparent: true });

  const kuipervertices = [];
  for (let i = 0; i < 3500  * numAsteroids; i++) {
    var angle = Math.random() * Math.PI * 2;
    var deviation = 750 * scale; // adjust this value to control the amount of deviation
    var distance = THREE.MathUtils.randFloat(neptuneDistance + neptune.geometry.parameters.radius + (50 * scale), neptuneDistance + (scale * 1500));
    var deviationX = THREE.MathUtils.randFloatSpread(deviation);
    var deviationZ = THREE.MathUtils.randFloatSpread(deviation);
    var x = Math.cos(angle) * distance + deviationX;
    var y = THREE.MathUtils.randFloatSpread(200 * scale);
    var z = Math.sin(angle) * distance + deviationZ;
    kuipervertices.push(x, y, z);
  }

  kuiperRingGeometry.setAttribute('position', new THREE.Float32BufferAttribute(kuipervertices, 3));
  kuiperRing = new THREE.Points(kuiperRingGeometry, kuiperRingMaterial);
  kuiperRing.position.set(0, 0, 0); // place the ring between Mars and Jupiter
  scene.add(kuiperRing);
}


function createOrbits(){
  // mercury orbit
  const mercuryOrbitGeometry = new THREE.RingGeometry(mercuryDistance - (.2 * (scale/2)), mercuryDistance + (.2 * (scale/2)), 256);
  const mercuryOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  mercuryOrbit = new THREE.Mesh(mercuryOrbitGeometry, mercuryOrbitMaterial);
  mercuryOrbit.rotation.x = Math.PI / 2;
  scene.add(mercuryOrbit);

  // venus orbit
  const venusOrbitGeometry = new THREE.RingGeometry(venusDistance - (.2 * (scale/2)), venusDistance + (.2 * (scale/2)), 256);
  const venusOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  venusOrbit = new THREE.Mesh(venusOrbitGeometry, venusOrbitMaterial);
  venusOrbit.rotation.x = Math.PI / 2;
  scene.add(venusOrbit);

  // earth orbit
  const earthOrbitGeometry = new THREE.RingGeometry(earthDistance - (.2 * (scale/2)), earthDistance + (.2 * (scale/2)), 256);
  const earthOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  earthOrbit = new THREE.Mesh(earthOrbitGeometry, earthOrbitMaterial);
  earthOrbit.rotation.x = Math.PI / 2;
  scene.add(earthOrbit);

  // moon orbit
  const moonOrbitGeometry = new THREE.RingGeometry(moonDistance - (.1 * (scale/2)), moonDistance + (.1 * (scale/2)), 256);
  const moonOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  moonOrbit = new THREE.Mesh(moonOrbitGeometry, moonOrbitMaterial);
  moonOrbit.rotation.x = Math.PI / 2;
  earth.add(moonOrbit); // add moon orbit to the earth so that it orbits around the sun along with the earth

  // mars orbit
  const marsOrbitGeometry = new THREE.RingGeometry(marsDistance - (.2 * (scale/2)), marsDistance + (.2 * (scale/2)), 256);
  const marsOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  marsOrbit = new THREE.Mesh(marsOrbitGeometry, marsOrbitMaterial);
  marsOrbit.rotation.x = Math.PI / 2;
  scene.add(marsOrbit);

  // jupiter orbit
  const jupiterOrbitGeometry = new THREE.RingGeometry(jupiterDistance - (.2 * (scale/2)), jupiterDistance + (.2 * (scale/2)), 256);
  const jupiterOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  jupiterOrbit = new THREE.Mesh(jupiterOrbitGeometry, jupiterOrbitMaterial);
  jupiterOrbit.rotation.x = Math.PI / 2;
  scene.add(jupiterOrbit);
  
  // saturn orbit
  const saturnOrbitGeometry = new THREE.RingGeometry(saturnDistance - (.2 * (scale/2)), saturnDistance + (.2 * (scale/2)), 256);
  const saturnOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  saturnOrbit = new THREE.Mesh(saturnOrbitGeometry, saturnOrbitMaterial);
  saturnOrbit.rotation.x = Math.PI / 2;
  scene.add(saturnOrbit);

  // uranus orbit
  const uranusOrbitGeometry = new THREE.RingGeometry(uranusDistance - (.2 * (scale/2)), uranusDistance + (.2 * (scale/2)), 256);
  const uranusOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  uranusOrbit = new THREE.Mesh(uranusOrbitGeometry, uranusOrbitMaterial);
  uranusOrbit.rotation.x = Math.PI / 2;
  scene.add(uranusOrbit);
  
  // neptune orbit
  const neptuneOrbitGeometry = new THREE.RingGeometry(neptuneDistance - (.2 * (scale/2)), neptuneDistance + (.2 * (scale/2)), 256);
  const neptuneOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  neptuneOrbit = new THREE.Mesh(neptuneOrbitGeometry, neptuneOrbitMaterial);
  neptuneOrbit.rotation.x = Math.PI / 2;
  scene.add(neptuneOrbit);
}

createPlanets();
createOrbits();
createAsteroidBelts();

// load spaceship from UFO_Empty.glb but declare it outside callback so I can uypdate position from animate function
// spaceship from UFO_Empty.glb
const loader = new GLTFLoader();
const spaceship = new THREE.Object3D(); // create empty Object3D

loader.load('public/ufo.glb', function (gltf) {
  // use the loaded model to replace the empty Object3D
  const model = gltf.scene.children[0];
  model.scale.set(18.1, 18.1, 18.1);
  model.position.set(0, -200, 0);
  model.rotation.set(0, 0, 0);

  spaceship.add(model);
});

// add the spaceship to the scene outside of the callback function
scene.add(spaceship);
// add point light to spaceship
const pointLight = new THREE.PointLight(0x3cd070 , 50, 90);
pointLight.position.set(0, -130, 0);
spaceship.add(pointLight);

// Add orbit controls to let the user rotate the camera around the scene
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const flyControls = new FlyControls(camera, renderer.domElement);
flyControls.movementSpeed = 100;
flyControls.rollSpeed = Math.PI / 12;
flyControls.autoForward = true;


// seperate angle for each planet
let mercuryAngle = 0;
// venus is haflway
let venusAngle = Math.PI;
// earth is 1/4
let earthAngle = Math.PI * 0.5;
let moonAngle = 0;
// mars is 3/4
let marsAngle = Math.PI * 1.5;
// jupiter is 1/8
let jupiterAngle = Math.PI * 0.25;
// saturn is 5/8
let saturnAngle = 5 * (Math.PI / 4);
// uranus is 3/8
let uranusAngle = 3 * (Math.PI / 4);
// neptune is 7/8
let neptuneAngle = 7 * (Math.PI / 4);

let focusedPlanet = null;
let cameraTarget = new THREE.Vector3();
let lerpSpeed = 0.08; // Adjust this value to control the speed of the animation

// add regenerate button to gui to reset the scene
const regenerate = () => {
  // remove all planets from scene
  scene.remove(mercury);
  scene.remove(venus);
  scene.remove(venusAtmo);
  scene.remove(earth);
  scene.remove(cloudMesh)
  scene.remove(moon);
  scene.remove(mars);
  scene.remove(jupiter);
  scene.remove(saturn);
  scene.remove(uranus);
  scene.remove(neptune);
  scene.remove(sunMesh);
  scene.remove(asteroidRing);
  scene.remove(kuiperRing);

  //remove orbit lines
  scene.remove(mercuryOrbit);
  scene.remove(venusOrbit);
  scene.remove(earthOrbit);
  scene.remove(moonOrbit);
  scene.remove(marsOrbit);
  scene.remove(jupiterOrbit);
  scene.remove(saturnOrbit);
  scene.remove(uranusOrbit);
  scene.remove(neptuneOrbit);

  camera.position.set(400 * scale, 250 * scale, -1600 * scale);

  //reset light
  scene.remove(sunLight);

  flyControls.enabled = false;
  controls.enabled = true;

  // recreate all planets
  createPlanets();
  createAsteroidBelts();
  console.log(enableOrbits)
  if (enableOrbits) {
    createOrbits();
  }
  focusedPlanet = sunMesh;
  dropdown.value = "sun";
}

const defaultSettings = () => {
  // reset all values to default
  scale = 3;
  flightSensitivity = 10;
  enableOrbits = true;
  rotationSpeed = 0.5;
  flightFov = 50;
  numAsteroids = 1;
  // reset controls
  guicontrols.scale = scale;
  guicontrols.flightSensitivity = flightSensitivity;
  guicontrols.enableOrbits = enableOrbits;
  guicontrols.rotationSpeed = rotationSpeed;
  guicontrols.flightFov = flightFov;
  guicontrols.numAsteroids = numAsteroids;
  regenerate()
}

// add regenerate button to gui
gui.add({ regenerate }, 'regenerate').name("Regenerate System");
gui.add({ defaultSettings }, 'defaultSettings').name("Restore Default Settings");
gui.close() // close gui by default

// flight crosshair
var reticule = document.getElementById("reticule");
var reticuleX = window.innerWidth / 2;
var reticuleY = window.innerHeight / 2;
reticule.style.display = 'none'; // hide crosshair by default
var xMouse;
var yMouse;
document.addEventListener("mousemove", function(event) {
  xMouse = event.clientX;
  yMouse = event.clientY;
  // move crosshair in render()
});

// animate function (very important)
function render() {
  requestAnimationFrame(render);
  
  // rotate sun in place
  sunMesh.rotation.y -= 0.0005 * rotationSpeed;
  // rotate all planets in place
  mercury.rotation.y -= 0.002 * rotationSpeed;
  venus.rotation.y -= 0.002 * rotationSpeed;
  venusAtmo.rotation.y += 0.0001 * rotationSpeed;

  earth.rotation.y -= 0.002 * rotationSpeed;
  cloudMesh.rotation.y += 0.0001 * rotationSpeed;
  moon.rotation.y -= 0.002 * rotationSpeed;

  mars.rotation.y -= 0.002 * rotationSpeed;
  jupiter.rotation.y -= 0.001 * rotationSpeed;
  saturn.rotation.y -= 0.001 * rotationSpeed;
  uranus.rotation.y -= 0.001 * rotationSpeed;
  neptune.rotation.y -= 0.001 * rotationSpeed;

  asteroidRing.rotation.y -= 0.00004 * rotationSpeed;
  kuiperRing.rotation.y -= 0.00001 * rotationSpeed;

  spaceship.rotation.y += 0.001 * rotationSpeed;

  // create array of planets
  const planets = [
    { distance: mercuryDistance, angle: mercuryAngle, object: mercury },
    { distance: venusDistance, angle: venusAngle, object: venus },
    { distance: earthDistance, angle: earthAngle, object: earth },
    { distance: moonDistance, angle: moonAngle, object: moon },
    { distance: marsDistance, angle: marsAngle, object: mars },
    { distance: jupiterDistance, angle: jupiterAngle, object: jupiter },
    { distance: saturnDistance, angle: saturnAngle, object: saturn },
    { distance: uranusDistance, angle: uranusAngle, object: uranus },
    { distance: neptuneDistance, angle: neptuneAngle, object: neptune }
  ];
  
  planets.forEach(planet => {
    const x = planet.distance * Math.cos(planet.angle);
    const z = planet.distance * Math.sin(planet.angle);
    planet.object.position.set(x, 0, z);
  });
  
  // Increase the angle for the next frame
  mercuryAngle += 0.00025 * rotationSpeed;
  venusAngle += 0.00025 * rotationSpeed;
  earthAngle += 0.0001 * rotationSpeed;
  marsAngle += 0.000125 * rotationSpeed;
  moonAngle += 0.001 * rotationSpeed;
  jupiterAngle += 0.0000625 * rotationSpeed;
  saturnAngle += 0.00003125 * rotationSpeed;
  uranusAngle += 0.000015625 * rotationSpeed;
  neptuneAngle += 0.000015625 * rotationSpeed;

  if (focusedPlanet) {
    // Update the camera target to the position of the focused planet
    if (focusedPlanet === moon) {    // if moon, add moon position to earth position
      cameraTarget.x = earth.position.x + 100;
      cameraTarget.y = earth.position.y + 100;
      cameraTarget.z = earth.position.z + 100;
    } else {
      cameraTarget.x = focusedPlanet.position.x + 100;
      cameraTarget.y = focusedPlanet.position.y + 100;
      cameraTarget.z = focusedPlanet.position.z + 100;
    }

    // Update the controls target to the position of the focused planet
    if (focusedPlanet == spaceship) { // Flight enabled
      controls.enabled = false;
      flyControls.enabled = true;
      reticule.style.display = 'block';
      document.body.style.cursor = 'crosshair';
      //move reticule to mouse position 
      reticuleX += (xMouse - reticuleX) * 0.06;
      reticuleY += (yMouse - reticuleY) * 0.06;
      reticule.style.left = reticuleX + "px";
      reticule.style.top = reticuleY + "px";
      // increase fov when flying
      camera.fov = flightFov;
      camera.updateProjectionMatrix();
    } else { // Flight disabled
      controls.enabled = true; // enable orbit controls
      flyControls.enabled = false;
      reticule.display = 'none'; // hide reticule
      document.body.style.cursor = 'default';
      // decrease fov when not flying
      camera.fov = 45
      camera.updateProjectionMatrix();
      //lerp controls
      controls.target.x = lerp(controls.target.x, focusedPlanet.position.x, lerpSpeed);
      controls.target.y = lerp(controls.target.y, focusedPlanet.position.y, lerpSpeed);
      controls.target.z = lerp(controls.target.z, focusedPlanet.position.z, lerpSpeed);
      // move spaceship above planet with lerp
      spaceship.position.x = lerp(spaceship.position.x, focusedPlanet.position.x, lerpSpeed + 0.01);
      spaceship.position.y = lerp(spaceship.position.y, focusedPlanet.position.y + focusedPlanet.geometry.parameters.radius + 240, lerpSpeed + 0.01);
      spaceship.position.z = lerp(spaceship.position.z, focusedPlanet.position.z, lerpSpeed + 0.01);
    }
    camera.position.copy(controls.object.position);
    camera.rotation.copy(controls.object.rotation);
  }
  // Update the camera position
  
  // Update the controls and render the scene
  if (flyControls.enabled) {
    flyControls.update(clock.getDelta()); // update position using fly controls
    // move spaceship inside sun to hide
    spaceship.position.x = sunMesh.position.x;
    spaceship.position.y = sunMesh.position.y + 400000 * scale;
    spaceship.position.z = sunMesh.position.z;
  } else {
    controls.update(clock.getDelta()); // update position using orbit controls
  }
  renderer.render(scene, camera);
}
const clock = new THREE.Clock();

// Lerp function for smooth transitions
function lerp(start, end, alpha) {
  return (1 - alpha) * start + alpha * end;
}

function changeFocusedPlanet(planet) {
  if (planet == "earth" || planet == earth || planet == moon || planet == cloudMesh) {
    focusedPlanet = earth;
    dropdown.value = "earth";
    window.history.pushState(null, null, '?planet=earth');
  } else if (planet == "venus" || planet == venus || planet == venusAtmo) {
    focusedPlanet = venus;
    dropdown.value = "venus";
    window.history.pushState(null, null, '?planet=venus');
  } else if (planet == "mercury" || planet == mercury) {
    focusedPlanet = mercury;
    dropdown.value = "mercury";
    window.history.pushState(null, null, '?planet=mercury');
  } else if (planet == "sun" || planet == sunMesh) {
    focusedPlanet = sunMesh;
    dropdown.value = "sun";
    window.history.pushState(null, null, '?planet=sun');
  } else if (planet == "mars" || planet == mars) {
    focusedPlanet = mars;
    dropdown.value = "mars";
    window.history.pushState(null, null, '?planet=mars');
  } else if (planet == "moon" || planet == moon) {
    focusedPlanet = earth;
    dropdown.value = "moon";
    window.history.pushState(null, null, '?planet=moon');
  } else if (planet == "jupiter" || planet == jupiter) {
    focusedPlanet = jupiter;
    dropdown.value = "jupiter";
    window.history.pushState(null, null, '?planet=jupiter');
  } else if (planet == "saturn" || planet == saturn || planet == saturnRing) {
    focusedPlanet = saturn;
    dropdown.value = "saturn";
    window.history.pushState(null, null, '?planet=saturn');
  } else if (planet == "uranus" || planet == uranus) {
    focusedPlanet = uranus;
    dropdown.value = "uranus";
    window.history.pushState(null, null, '?planet=uranus');
  } else if (planet == "neptune" || planet == neptune) {
    focusedPlanet = neptune;
    dropdown.value = "neptune";
    window.history.pushState(null, null, '?planet=neptune');
  } else if (planet == "spaceship" || planet == spaceship) {
    camera.position.copy(spaceship.position);
    // enable flight reticule
    reticule.style.display = "block";
    focusedPlanet = spaceship;
    dropdown.value = "spaceship";
    window.history.pushState(null, null, '?planet=spaceship');
  }
}

// Click listener for planets
renderer.domElement.addEventListener('click', function(event) {
  // Calculate mouse position in normalized device coordinates
  const mouse = new THREE.Vector2();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  // Raycast from camera to mouse position
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera( mouse, camera );
  const intersects = raycaster.intersectObjects( scene.children, true );
  const spaceshipIntersects = raycaster.intersectObjects( spaceship.children, true );
  intersects.push(...spaceshipIntersects);
  this.update
    if (intersects.length > 0) {
      // Hide reticule by default
      reticule.style.display = 'none';
      changeFocusedPlanet(intersects[0].object);
      if (intersects[0].object.name.includes("mesh_0")) { // UFO
        changeFocusedPlanet("spaceship");
      }
    }
});

// set focusedPlanet based on URL query parameters
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('planet')) {
  changeFocusedPlanet(urlParams.get('planet'));
}

// if escape key is pressed, change focused planet to sun
document.addEventListener('keydown', function(event) {
  if (event.code === 'Escape') {
    changeFocusedPlanet("sun");
  }
});

// add event listener for "title" select element on change
dropdown.addEventListener("change", function() {
  changeFocusedPlanet(dropdown.value);
});

render();

// event listener for toggle-flight-button
document.getElementById('toggle-flight-button').addEventListener('click', function() {
  if (focusedPlanet != spaceship){
    focusedPlanet = spaceship;
    dropdown.value = "spaceship";
  } else {
    focusedPlanet = sunMesh;
  }
});

// open tetris if user enters konami code
const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"];
let konamiIndex = 0;
document.addEventListener("keydown", function(event) {
  if (event.code === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      window.location.href = "tetris.html";
    }
  } else {
    konamiIndex = 0;
  }
});
