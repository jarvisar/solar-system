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

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

// define control variables
var scale = 3;
var enableOrbits = true;
var flightSensitivity = 10;
var rotationSpeed = 1.0;
var flightFov = 50;
var numAsteroids = 1;
var flightRotationSpeed = 1;
var orbitWidth = 1;

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
  rotationSpeed: 1.0,
  flightFov: 50,
  numAsteroids: 1,
  flightRotationSpeed: 1,
  orbitWidth: 1,
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

// add control for orbitWidth
systemSettings.add(guicontrols, "orbitWidth", 0, 15, 0.1).onChange((value) => {
  orbitWidth = value;
  removeOrbits();
  createOrbits();
}).name("Orbit Width").listen();


// add control for enableOrbits
systemSettings.add(guicontrols, "enableOrbits").onChange((value) => {
  if (value) {
    enableOrbits = true;
    // add all orbits
    createOrbits();
  } else {
    enableOrbits = false;
    removeOrbits();
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

function removeOrbits(){
  // remove all orbits
  scene.remove(mercuryOrbit);
  scene.remove(venusOrbit);
  scene.remove(earthOrbit);
  earth.remove(moonOrbit);
  scene.remove(marsOrbit);
  mars.remove(deimosOrbit);
  mars.remove(phobosOrbit);
  scene.remove(jupiterOrbit);
  jupiter.remove(ioOrbit);
  jupiter.remove(europaOrbit);
  jupiter.remove(ganymedeOrbit);
  jupiter.remove(callistoOrbit);
  scene.remove(saturnOrbit);
  saturn.remove(titanOrbit);
  saturn.remove(enceladusOrbit);
  saturn.remove(iapetusOrbit);
  scene.remove(uranusOrbit);
  scene.remove(neptuneOrbit);
  scene.remove(plutoOrbit);
}

var mercuryDistance
var venusDistance 

var earthDistance
var moonDistance 

var marsDistance
var deimosDistance
var phobosDistance 

var jupiterDistance 
var ioDistance
var europaDistance
var ganymedeDistance
var callistoDistance

var saturnDistance
var titanDistance 
var enceladusDistance
var iapetusDistance

var uranusDistance 
var neptuneDistance 
var plutoDistance
var plutoTilt
var plutoAngle

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
var deimos;
var phobos;
var jupiter;
var io;
var europa;
var ganymede;
var callisto;
var saturn;
var saturnRing;
var titan;
var enceladus;
var iapetus;
var uranus;
var neptune;
var pluto;

var asteroidRing;
var kuiperRing;

//define all orbits
var mercuryOrbit;
var venusOrbit;
var earthOrbit;
var moonOrbit;
var marsOrbit;
var deimosOrbit;
var phobosOrbit;
var jupiterOrbit;
var ioOrbit;
var europaOrbit;
var ganymedeOrbit;
var callistoOrbit;
var saturnOrbit;
var titanOrbit;
var enceladusOrbit;
var iapetusOrbit;
var uranusOrbit;
var neptuneOrbit;
var plutoOrbit;

var sunLight;

function createPlanets(){

  mercuryDistance = 1200 * scale * 1.2
  venusDistance = 1500 * scale * 1.2
  earthDistance = 2100 * scale * 1.2
  moonDistance = 200 * scale
  marsDistance = 2700 * scale * 1.2
  deimosDistance = 150 * scale
  phobosDistance = 250 * scale
  jupiterDistance = 4400 * scale * 1.2
  ioDistance = 200 * scale
  europaDistance = 300 * scale
  ganymedeDistance = 400 * scale
  callistoDistance = 500 * scale
  saturnDistance = 5300 * scale * 1.2
  titanDistance = 300 * scale
  enceladusDistance = 200 * scale
  iapetusDistance = 400 * scale
  uranusDistance = 6200 * scale * 1.2
  neptuneDistance = 7100 * scale * 1.2
  plutoDistance = 8000 * scale * 1.2

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
  moon.rotation.y = Math.PI;
  earth.add(moon);

  // mars
  const marsGeometry = new THREE.SphereGeometry(14 * scale, 64, 64);
  const marsMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_mars.jpg'), bumpMap: new THREE.TextureLoader().load('public/mars_elevation.jpg'), bumpScale: 0.2 * scale });
  mars = new THREE.Mesh(marsGeometry, marsMaterial);
  mars.castShadow = true;
  mars.receiveShadow = true;
  mars.position.set(0, 0, marsDistance);
  scene.add(mars);

  // deimos from deimos.glb
  const deimosLoader = new GLTFLoader();
  deimos = new THREE.Object3D();
  deimosLoader.load('public/deimos.glb', function (gltf) {
    let model = gltf.scene;
    deimos.scale.set(0.25 * scale, 0.25 * scale, 0.25 * scale);
    deimos.position.set(0, 0, deimosDistance);
    deimos.add(model);
  });
  mars.add(deimos);

  // phobos from phobos.glb
  const phobosLoader = new GLTFLoader();
  phobos = new THREE.Object3D();
  phobosLoader.load('public/phobos.glb', function (gltf) {
    let model = gltf.scene;
    phobos.scale.set(0.25 * scale, 0.25 * scale, 0.25 * scale);
    phobos.position.set(0, 0, phobosDistance);
    phobos.add(model);
  });
  mars.add(phobos);

  // jupiter
  const jupiterGeometry = new THREE.SphereGeometry(100 * scale, 128, 128);
  const jupiterMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_jupiter.jpg') });
  jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
  jupiter.castShadow = true;
  jupiter.receiveShadow = true;
  jupiter.position.set(0, 0, jupiterDistance);
  scene.add(jupiter);

  // io
  const ioGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const ioMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/io_texture.jpg'), bumpMap: new THREE.TextureLoader().load('public/io_elevation.png'), bumpScale: 0.05 * scale, shininess: 4 });
  io = new THREE.Mesh(ioGeometry, ioMaterial);
  io.castShadow = true;
  io.receiveShadow = true;
  io.position.set(0, 0, ioDistance);
  jupiter.add(io); 

  // europa
  const europaGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const europaMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/europa_texture.png'), bumpMap: new THREE.TextureLoader().load('public/europa_elevation.png'), bumpScale: 0.05 * scale, shininess: 4 });
  europa = new THREE.Mesh(europaGeometry, europaMaterial);
  europa.castShadow = true;
  europa.receiveShadow = true;
  europa.position.set(0, 0, europaDistance);
  jupiter.add(europa);

  // ganymede
  const ganymedeGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const ganymedeMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/ganymede_texture.png'), bumpMap: new THREE.TextureLoader().load('public/ganymede_elevation.jpg'), bumpScale: 0.05 * scale, shininess: 4 });
  ganymede = new THREE.Mesh(ganymedeGeometry, ganymedeMaterial);
  ganymede.castShadow = true;
  ganymede.receiveShadow = true;
  ganymede.position.set(0, 0, ganymedeDistance);
  jupiter.add(ganymede);

  // callisto
  const callistoGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const callistoMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/callisto_texture.jpg'), bumpMap: new THREE.TextureLoader().load('public/callisto_elevation.jpg'), bumpScale: 0.05 * scale, shininess: 4 });
  callisto = new THREE.Mesh(callistoGeometry, callistoMaterial);
  callisto.castShadow = true;
  callisto.receiveShadow = true;
  callisto.position.set(0, 0, callistoDistance);
  jupiter.add(callisto);

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
  saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
  saturnRing.rotation.x = Math.PI / 2;
  saturnRing.receiveShadow = true;
  saturnRing.castShadow = true;
  saturn.add(saturnRing);

  // titan
  const titanGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const titanMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/titan_texture.png'), bumpMap: new THREE.TextureLoader().load('public/titan_elevation.png'), bumpScale: 0.05 * scale, shininess: 4 });
  titan = new THREE.Mesh(titanGeometry, titanMaterial);
  titan.castShadow = true;
  titan.receiveShadow = true;
  titan.position.set(0, 0, titanDistance);
  saturn.add(titan);

  // enceladus
  const enceladusGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const enceladusMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/enceladus_texture.jpg'), bumpMap: new THREE.TextureLoader().load('public/enceladus_elevation.png'), bumpScale: 0.05 * scale, shininess: 4 });
  enceladus = new THREE.Mesh(enceladusGeometry, enceladusMaterial);
  enceladus.castShadow = true;
  enceladus.receiveShadow = true;
  enceladus.position.set(0, 0, enceladusDistance);
  enceladus.rotation.y = Math.PI / 2;
  saturn.add(enceladus);

  // iapetus
  const iapetusGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const iapetusMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/iapetus_texture.png'), bumpMap: new THREE.TextureLoader().load('public/iapetus_elevation.png'), bumpScale: 0.05 * scale, shininess: 4 });
  iapetus = new THREE.Mesh(iapetusGeometry, iapetusMaterial);
  iapetus.castShadow = true;
  iapetus.receiveShadow = true;
  iapetus.position.set(0, 0, iapetusDistance);
  saturn.add(iapetus);

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
  
  // pluto
  const plutoGeometry = new THREE.SphereGeometry(5 * scale, 64, 64);
  const plutoMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_pluto.webp'), bumpMap: new THREE.TextureLoader().load('public/pluto_elevation.png'), bumpScale: 0.05 * scale, specularMap: new THREE.TextureLoader().load('public/pluto_spec.png'), specular: new THREE.Color('grey'), shininess: 2 });
  pluto = new THREE.Mesh(plutoGeometry, plutoMaterial);
  pluto.castShadow = true;
  pluto.receiveShadow = true;

  // position and tilt pluto
  plutoTilt = 8.58 * (Math.PI / 180);
  plutoAngle = Math.PI / 4;
  pluto.position.set(
    plutoDistance * Math.cos(plutoAngle),
    plutoDistance * Math.sin(plutoAngle) * Math.sin(plutoTilt),
    plutoDistance * Math.sin(plutoAngle) * Math.cos(plutoTilt)
  );

  scene.add(pluto);
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
  for (let i = 0; i < 4000  * numAsteroids; i++) {
    var angle = Math.random() * Math.PI * 2;
    var deviation = 750 * scale; // adjust this value to control the amount of deviation
    var distance = THREE.MathUtils.randFloat(neptuneDistance + neptune.geometry.parameters.radius + (50 * scale), neptuneDistance + (scale * 1700));
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
  const mercuryOrbitGeometry = new THREE.RingGeometry(mercuryDistance - (.2 * (scale/2) * orbitWidth), mercuryDistance + (.2 * (scale/2) * orbitWidth), 1024);
  const mercuryOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  mercuryOrbit = new THREE.Mesh(mercuryOrbitGeometry, mercuryOrbitMaterial);
  mercuryOrbit.rotation.x = Math.PI / 2;
  scene.add(mercuryOrbit);

  // venus orbit
  const venusOrbitGeometry = new THREE.RingGeometry(venusDistance - (.2 * (scale/2) * orbitWidth), venusDistance + (.2 * (scale/2) * orbitWidth), 1024);
  const venusOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  venusOrbit = new THREE.Mesh(venusOrbitGeometry, venusOrbitMaterial);
  venusOrbit.rotation.x = Math.PI / 2;
  scene.add(venusOrbit);

  // earth orbit
  const earthOrbitGeometry = new THREE.RingGeometry(earthDistance - (.2 * (scale/2) * orbitWidth), earthDistance + (.2 * (scale/2) * orbitWidth), 1024);
  const earthOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  earthOrbit = new THREE.Mesh(earthOrbitGeometry, earthOrbitMaterial);
  earthOrbit.rotation.x = Math.PI / 2;
  scene.add(earthOrbit);

  // moon orbit
  const moonOrbitGeometry = new THREE.RingGeometry(moonDistance - (.1 * (scale/2) * orbitWidth), moonDistance + (.1 * (scale/2) * orbitWidth), 256);
  const moonOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  moonOrbit = new THREE.Mesh(moonOrbitGeometry, moonOrbitMaterial);
  moonOrbit.rotation.x = Math.PI / 2;
  earth.add(moonOrbit); // add moon orbit to the earth so that it orbits around the sun along with the earth

  // mars orbit
  const marsOrbitGeometry = new THREE.RingGeometry(marsDistance - (.2 * (scale/2) * orbitWidth), marsDistance + (.2 * (scale/2) * orbitWidth), 1024);
  const marsOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  marsOrbit = new THREE.Mesh(marsOrbitGeometry, marsOrbitMaterial);
  marsOrbit.rotation.x = Math.PI / 2;
  scene.add(marsOrbit);

  // phobos orbit
  const phobosOrbitGeometry = new THREE.RingGeometry(phobosDistance - (.1 * (scale/2) * orbitWidth), phobosDistance + (.1 * (scale/2) * orbitWidth), 256);
  const phobosOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  phobosOrbit = new THREE.Mesh(phobosOrbitGeometry, phobosOrbitMaterial);
  phobosOrbit.rotation.x = Math.PI / 2;
  mars.add(phobosOrbit); // add phobos orbit to the mars so that it orbits around the sun along with the mars

  // deimos orbit
  const deimosOrbitGeometry = new THREE.RingGeometry(deimosDistance - (.1 * (scale/2) * orbitWidth), deimosDistance + (.1 * (scale/2) * orbitWidth), 256);
  const deimosOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  deimosOrbit = new THREE.Mesh(deimosOrbitGeometry, deimosOrbitMaterial);
  deimosOrbit.rotation.x = Math.PI / 2;
  mars.add(deimosOrbit); // add deimos orbit to the mars so that it orbits around the sun along with the mars

  // jupiter orbit
  const jupiterOrbitGeometry = new THREE.RingGeometry(jupiterDistance - (.2 * (scale/2) * orbitWidth), jupiterDistance + (.2 * (scale/2) * orbitWidth), 1024);
  const jupiterOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  jupiterOrbit = new THREE.Mesh(jupiterOrbitGeometry, jupiterOrbitMaterial);
  jupiterOrbit.rotation.x = Math.PI / 2;
  scene.add(jupiterOrbit);

  // io orbit
  const ioOrbitGeometry = new THREE.RingGeometry(ioDistance - (.1 * (scale/2) * orbitWidth), ioDistance + (.1 * (scale/2) * orbitWidth), 256);
  const ioOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  ioOrbit = new THREE.Mesh(ioOrbitGeometry, ioOrbitMaterial);
  ioOrbit.rotation.x = Math.PI / 2;
  jupiter.add(ioOrbit); // add io orbit to the jupiter so that it orbits around the sun along with the jupiter

  // europa orbit
  const europaOrbitGeometry = new THREE.RingGeometry(europaDistance - (.1 * (scale/2) * orbitWidth), europaDistance + (.1 * (scale/2) * orbitWidth), 256);
  const europaOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  europaOrbit = new THREE.Mesh(europaOrbitGeometry, europaOrbitMaterial);
  europaOrbit.rotation.x = Math.PI / 2;
  jupiter.add(europaOrbit); // add europa orbit to the jupiter so that it orbits around the sun along with the jupiter

  // ganymede orbit
  const ganymedeOrbitGeometry = new THREE.RingGeometry(ganymedeDistance - (.1 * (scale/2) * orbitWidth), ganymedeDistance + (.1 * (scale/2) * orbitWidth), 256);
  const ganymedeOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  ganymedeOrbit = new THREE.Mesh(ganymedeOrbitGeometry, ganymedeOrbitMaterial);
  ganymedeOrbit.rotation.x = Math.PI / 2;
  jupiter.add(ganymedeOrbit); // add ganymede orbit to the jupiter so that it orbits around the sun along with the jupiter

  // callisto orbit
  const callistoOrbitGeometry = new THREE.RingGeometry(callistoDistance - (.1 * (scale/2) * orbitWidth), callistoDistance + (.1 * (scale/2) * orbitWidth), 256);
  const callistoOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  callistoOrbit = new THREE.Mesh(callistoOrbitGeometry, callistoOrbitMaterial);
  callistoOrbit.rotation.x = Math.PI / 2;
  jupiter.add(callistoOrbit); // add callisto orbit to the jupiter so that it orbits around the sun along with the jupiter
  
  // saturn orbit
  const saturnOrbitGeometry = new THREE.RingGeometry(saturnDistance - (.2 * (scale/2) * orbitWidth), saturnDistance + (.2 * (scale/2) * orbitWidth), 1024);
  const saturnOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  saturnOrbit = new THREE.Mesh(saturnOrbitGeometry, saturnOrbitMaterial);
  saturnOrbit.rotation.x = Math.PI / 2;
  scene.add(saturnOrbit);

  // titan orbit
  const titanOrbitGeometry = new THREE.RingGeometry(titanDistance - (.1 * (scale/2) * orbitWidth), titanDistance + (.1 * (scale/2) * orbitWidth), 256);
  const titanOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  titanOrbit = new THREE.Mesh(titanOrbitGeometry, titanOrbitMaterial);
  titanOrbit.rotation.x = Math.PI / 2;
  saturn.add(titanOrbit); // add titan orbit to the saturn so that it orbits around the sun along with the saturn

  // enceladus orbit
  const enceladusOrbitGeometry = new THREE.RingGeometry(enceladusDistance - (.1 * (scale/2) * orbitWidth), enceladusDistance + (.1 * (scale/2) * orbitWidth), 256);
  const enceladusOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  enceladusOrbit = new THREE.Mesh(enceladusOrbitGeometry, enceladusOrbitMaterial);
  enceladusOrbit.rotation.x = Math.PI / 2;
  saturn.add(enceladusOrbit); // add enceladus orbit to the saturn so that it orbits around the sun along with the saturn

  // iapetus orbit
  const iapetusOrbitGeometry = new THREE.RingGeometry(iapetusDistance - (.1 * (scale/2) * orbitWidth), iapetusDistance + (.1 * (scale/2) * orbitWidth), 256);
  const iapetusOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  iapetusOrbit = new THREE.Mesh(iapetusOrbitGeometry, iapetusOrbitMaterial);
  iapetusOrbit.rotation.x = Math.PI / 2;
  saturn.add(iapetusOrbit); // add iapetus orbit to the saturn so that it orbits around the sun along with the saturn

  // uranus orbit
  const uranusOrbitGeometry = new THREE.RingGeometry(uranusDistance - (.2 * (scale/2) * orbitWidth), uranusDistance + (.2 * (scale/2) * orbitWidth), 1024);
  const uranusOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  uranusOrbit = new THREE.Mesh(uranusOrbitGeometry, uranusOrbitMaterial);
  uranusOrbit.rotation.x = Math.PI / 2;
  scene.add(uranusOrbit);
  
  // neptune orbit
  const neptuneOrbitGeometry = new THREE.RingGeometry(neptuneDistance - (.2 * (scale/2) * orbitWidth), neptuneDistance + (.2 * (scale/2) * orbitWidth), 1024);
  const neptuneOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  neptuneOrbit = new THREE.Mesh(neptuneOrbitGeometry, neptuneOrbitMaterial);
  neptuneOrbit.rotation.x = Math.PI / 2;
  scene.add(neptuneOrbit);

  // pluto orbit
  const plutoOrbitGeometry = new THREE.RingGeometry(plutoDistance - (0.2 * (scale / 2) * orbitWidth), plutoDistance + (0.2 * (scale / 2) * orbitWidth), 1024);
  const plutoOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  plutoOrbit = new THREE.Mesh(plutoOrbitGeometry, plutoOrbitMaterial);

  // tilt pluto orbit
  plutoOrbit.rotation.x = Math.PI / 2 - plutoTilt;
  scene.add(plutoOrbit);
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
let phobosAngle = 0;
let deimosAngle = Math.PI * 0.5;
// jupiter is 1/8
let jupiterAngle = Math.PI * 0.25;
let ioAngle = 0;
let europaAngle = Math.PI * 0.5;;
let ganymedeAngle = Math.PI * 1.5;;
let callistoAngle = Math.PI * 0.25;
// saturn is 5/8
let saturnAngle = 5 * (Math.PI / 4);
let titanAngle = 0;
let enceladusAngle = Math.PI * 0.5;
let iapetusAngle = Math.PI * 1.5;
// uranus is 3/8
let uranusAngle = 3 * (Math.PI / 4);
// neptune is 7/8
let neptuneAngle = 7 * (Math.PI / 4);
// pluto is 0
let plutoRotation = 0;

let focusedPlanet = null;
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
  scene.remove(pluto);
  scene.remove(sunMesh);
  scene.remove(asteroidRing);
  scene.remove(kuiperRing);

  // remove all orbits from scene
  removeOrbits();

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
  orbitWidth = 1;
  // reset controls
  guicontrols.scale = scale;
  guicontrols.flightSensitivity = flightSensitivity;
  guicontrols.enableOrbits = enableOrbits;
  guicontrols.rotationSpeed = rotationSpeed;
  guicontrols.flightFov = flightFov;
  guicontrols.numAsteroids = numAsteroids;
  guicontrols.orbitWidth = orbitWidth;
  regenerate()
}

// add regenerate button to gui
gui.add({ regenerate }, 'regenerate').name("Regenerate System");
gui.add({ defaultSettings }, 'defaultSettings').name("Restore Default Settings");
gui.close() // close gui by default

// flight crosshair
var reticule = document.getElementById("reticule");

// animate function (very important)
function render() {
  requestAnimationFrame(render);

  // check for orbit control movement from keys
  if (moveForward) {
    controls.object.translateZ(-10);
  }
  if (moveBackward) {
    controls.object.translateZ(10);
  }
  if (moveLeft) {
    controls.object.translateX(-10);
  }
  if (moveRight) {
    controls.object.translateX(10);
  }
  if (moveUp) {
    controls.object.translateY(10);
  }
  if (moveDown) {
    controls.object.translateY(-10);
  }
  
  // rotate in place
  sunMesh.rotation.y -= 0.0005 * rotationSpeed * 0.15;
  mercury.rotation.y -= 0.002 * rotationSpeed * 0.15;

  venus.rotation.y -= 0.002 * rotationSpeed * 0.15;
  venusAtmo.rotation.y += 0.0005 * rotationSpeed * 0.15;

  earth.rotation.y -= 0.002 * rotationSpeed * 0.15;
  cloudMesh.rotation.y += 0.0003 * rotationSpeed * 0.15;
  moon.rotation.y -= 0.002 * rotationSpeed * 0.15;

  mars.rotation.y -= 0.002 * rotationSpeed * 0.15;
  phobos.rotation.y -= 0.002 * rotationSpeed * 0.15;
  deimos.rotation.y -= 0.002 * rotationSpeed * 0.15;

  jupiter.rotation.y -= 0.001 * rotationSpeed * 0.15;
  io.rotation.y -= 0.001 * rotationSpeed * 0.15;
  europa.rotation.y -= 0.001 * rotationSpeed * 0.15;
  ganymede.rotation.y -= 0.001 * rotationSpeed * 0.15;
  callisto.rotation.y -= 0.001 * rotationSpeed * 0.15;

  saturn.rotation.y -= 0.001 * rotationSpeed * 0.15;
  titan.rotation.y -= 0.001 * rotationSpeed * 0.15;
  enceladus.rotation.y -= 0.001 * rotationSpeed * 0.15;

  uranus.rotation.z -= 0.001 * rotationSpeed * 0.15;
  neptune.rotation.y -= 0.001 * rotationSpeed * 0.15;

  asteroidRing.rotation.y -= 0.00004 * rotationSpeed * 0.2;
  kuiperRing.rotation.y -= 0.00001 * rotationSpeed * 0.2;

  spaceship.rotation.y += 0.001 * rotationSpeed;

  const center = new THREE.Vector3(0, 0, 0);

  // create array of planets
  const planets = [
    { distance: mercuryDistance, angle: mercuryAngle, object: mercury },
    { distance: venusDistance, angle: venusAngle, object: venus },
    { distance: earthDistance, angle: earthAngle, object: earth },
    { distance: moonDistance, angle: moonAngle, object: moon },
    { distance: marsDistance, angle: marsAngle, object: mars },
    { distance: phobosDistance, angle: phobosAngle, object: phobos },
    { distance: deimosDistance, angle: deimosAngle, object: deimos },
    { distance: jupiterDistance, angle: jupiterAngle, object: jupiter },
    { distance: ioDistance, angle: ioAngle, object: io },
    { distance: europaDistance, angle: europaAngle, object: europa },
    { distance: ganymedeDistance, angle: ganymedeAngle, object: ganymede },
    { distance: callistoDistance, angle: callistoAngle, object: callisto },
    { distance: saturnDistance, angle: saturnAngle, object: saturn },
    { distance: titanDistance, angle: titanAngle, object: titan },
    { distance: enceladusDistance, angle: enceladusAngle, object: enceladus },
    { distance: iapetusDistance, angle: iapetusAngle, object: iapetus },
    { distance: uranusDistance, angle: uranusAngle, object: uranus },
    { distance: neptuneDistance, angle: neptuneAngle, object: neptune }
  ];
  
  planets.forEach(planet => {
    if (planet != pluto){
      const x = planet.distance * Math.cos(planet.angle);
      const z = planet.distance * Math.sin(planet.angle);
      planet.object.position.set(x, 0, z);
    }
  });

  // pluto is tilted
  const x = plutoDistance * Math.cos(plutoAngle);
  const y = plutoDistance * Math.sin(plutoAngle) * Math.sin(plutoTilt);
  const z = plutoDistance * Math.sin(plutoAngle) * Math.cos(plutoTilt);
  pluto.position.set(x, y, z);
  pluto.lookAt(center);
  pluto.rotateZ(Math.PI / 2 - plutoAngle);
  // rotate pluto in place
  pluto.rotateX(plutoRotation);
  
  // Increase the angle for the next frame
  mercuryAngle += 0.00025 * rotationSpeed * 0.15;
  venusAngle += 0.00025 * rotationSpeed * 0.15;
  earthAngle += 0.0001 * rotationSpeed * 0.15;
  marsAngle += 0.000125 * rotationSpeed * 0.15;
  jupiterAngle += 0.0000625 * rotationSpeed * 0.15;
  saturnAngle += 0.00003125 * rotationSpeed * 0.15;
  uranusAngle += 0.000015625 * rotationSpeed * 0.15;
  neptuneAngle += 0.000015625 * rotationSpeed * 0.15;
  plutoAngle += 0.000015625 * rotationSpeed * 0.15;
  plutoRotation += 0.002 * rotationSpeed * 0.15;

  if (focusedPlanet) {

    // Update the controls target to the position of the focused planet
    if (focusedPlanet == spaceship) { // Flight enabled
      enableFlight();
    } else if (focusedPlanet == moon){ // need to check if focusedPlanet is a child
      setMoonPosition(moon, 0);
    } else if (focusedPlanet == phobos){
      setMoonPosition(phobos, 0);
    } else if (focusedPlanet == deimos){
      setMoonPosition(deimos, 0);
    } else if (focusedPlanet == io){
      setMoonPosition(io, 0);
    } else if (focusedPlanet == europa){
      setMoonPosition(europa, 0);
    } else if (focusedPlanet == ganymede){
      setMoonPosition(ganymede, 0);
    } else if (focusedPlanet == callisto){
      setMoonPosition(callisto, 0);
    } else if (focusedPlanet == titan){
      setMoonPosition(titan, 0);
    } else if (focusedPlanet == enceladus){
      setMoonPosition(enceladus, 0);
    } else if (focusedPlanet == iapetus){
      setMoonPosition(iapetus, 0);
    } else { // Flight disabled
      disableFlight();
      //lerp controls
      controls.target.x = lerp(controls.target.x, focusedPlanet.position.x, lerpSpeed);
      controls.target.y = lerp(controls.target.y, focusedPlanet.position.y, lerpSpeed);
      controls.target.z = lerp(controls.target.z, focusedPlanet.position.z, lerpSpeed);
      // move spaceship above planet with lerp
      spaceship.position.x = lerp(spaceship.position.x, focusedPlanet.position.x, lerpSpeed + 0.01);
      spaceship.position.y = lerp(spaceship.position.y, focusedPlanet.geometry.parameters.radius + 240, lerpSpeed + 0.01);
      spaceship.position.z = lerp(spaceship.position.z, focusedPlanet.position.z, lerpSpeed + 0.01);
    }
    camera.position.copy(controls.object.position);
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

function setMoonPosition(moon, offsetY) {
  disableFlight();
  var moonPosition = new THREE.Vector3();
  moonPosition.setFromMatrixPosition(moon.matrixWorld); // get moon position
  // lerp spaceship and controls
  controls.target.x = lerp(controls.target.x, moonPosition.x, lerpSpeed);
  controls.target.y = lerp(controls.target.y, 0, lerpSpeed);
  controls.target.z = lerp(controls.target.z, moonPosition.z, lerpSpeed);
  // move spaceship above planet with lerp
  spaceship.position.x = lerp(spaceship.position.x, moonPosition.x, lerpSpeed + 0.01);
  // if not deimos or phobos, move up
  if (moon != deimos && moon != phobos){
  spaceship.position.y = lerp(spaceship.position.y, focusedPlanet.geometry.parameters.radius + 240 + offsetY, lerpSpeed + 0.01);
  } else {
    spaceship.position.y = lerp(spaceship.position.y, 240, lerpSpeed + 0.01);
  }
  spaceship.position.z = lerp(spaceship.position.z, moonPosition.z, lerpSpeed + 0.01);
}

function enableFlight(){
  controls.enabled = false;
  flyControls.enabled = true;
  reticule.style.display = 'block';
  document.body.style.cursor = 'crosshair';
  // increase fov when flying
  camera.fov = flightFov;
  camera.updateProjectionMatrix();
}

function disableFlight(){
  controls.enabled = true; // enable orbit controls
  flyControls.enabled = false;
  reticule.display = 'none'; // hide reticule
  document.body.style.cursor = 'default';
  // decrease fov when not flying
  camera.fov = 45
  camera.updateProjectionMatrix();
}

// Lerp function for smooth transitions
function lerp(start, end, alpha) {
  return (1 - alpha) * start + alpha * end;
}

function changeFocusedPlanet(planet) {
  if (planet == "earth" || planet == earth || planet == cloudMesh) {
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
  } else if (planet == "phobos" || planet == phobos) {
    focusedPlanet = phobos;
    dropdown.value = "phobos";
    window.history.pushState(null, null, '?planet=phobos');
  } else if (planet == "deimos" || planet == deimos) {
    focusedPlanet = deimos;
    dropdown.value = "deimos";
    window.history.pushState(null, null, '?planet=deimos');
  } else if (planet == "moon" || planet == moon) {
    focusedPlanet = moon;
    dropdown.value = "moon";
    window.history.pushState(null, null, '?planet=moon');
  } else if (planet == "jupiter" || planet == jupiter) {
    focusedPlanet = jupiter;
    dropdown.value = "jupiter";
    window.history.pushState(null, null, '?planet=jupiter');
  } else if (planet == "io" || planet == io) {
    focusedPlanet = io;
    dropdown.value = "io";
    window.history.pushState(null, null, '?planet=io');
  } else if (planet == "europa" || planet == europa) {
    focusedPlanet = europa;
    dropdown.value = "europa";
    window.history.pushState(null, null, '?planet=europa');
  } else if (planet == "ganymede" || planet == ganymede) {
    focusedPlanet = ganymede;
    dropdown.value = "ganymede";
    window.history.pushState(null, null, '?planet=ganymede');
  } else if (planet == "callisto" || planet == callisto) {
    focusedPlanet = callisto;
    dropdown.value = "callisto";
    window.history.pushState(null, null, '?planet=callisto');
  } else if (planet == "saturn" || planet == saturn || planet == saturnRing) {
    focusedPlanet = saturn;
    dropdown.value = "saturn";
    window.history.pushState(null, null, '?planet=saturn');
  } else if (planet == "titan" || planet == titan) {
    focusedPlanet = titan;
    dropdown.value = "titan";
    window.history.pushState(null, null, '?planet=titan');
  } else if (planet == "enceladus" || planet == enceladus) {
    focusedPlanet = enceladus;
    dropdown.value = "enceladus";
    window.history.pushState(null, null, '?planet=enceladus');
  } else if (planet == "iapetus" || planet == iapetus) { 
    focusedPlanet = iapetus;
    dropdown.value = "iapetus";
    window.history.pushState(null, null, '?planet=iapetus');
  } else if (planet == "uranus" || planet == uranus) {
    focusedPlanet = uranus;
    dropdown.value = "uranus";
    window.history.pushState(null, null, '?planet=uranus');
  } else if (planet == "neptune" || planet == neptune) {
    focusedPlanet = neptune;
    dropdown.value = "neptune";
    window.history.pushState(null, null, '?planet=neptune');
  } else if (planet == "pluto" || planet == pluto) {
    focusedPlanet = pluto;
    dropdown.value = "pluto";
    window.history.pushState(null, null, '?planet=pluto');
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
      console.log(intersects[0].object.name)
      if (intersects[0].object.name.includes("mesh_0")) { // UFO
        changeFocusedPlanet("spaceship");
      }
      if (intersects[0].object.name.includes("deimos")){
        changeFocusedPlanet("deimos");
      }
      if (intersects[0].object.name.includes("phobos")){
        changeFocusedPlanet("phobos");
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


// Use WASD, space, and shift for orbit controls

document.addEventListener("keydown", function(event) {
  if (focusedPlanet == spaceship) return;
  if (event.code === "KeyR") {
    moveForward = true;
  } else if (event.code === "KeyF") {
    moveBackward = true;
  } else if (event.code === "KeyA") {
    moveLeft = true;
  } else if (event.code === "KeyD") {
    moveRight = true;
  } else if (event.code === "KeyW") {
    moveUp = true;
  } else if (event.code === "KeyS") {
    moveDown = true;
  }
});

document.addEventListener("keyup", function(event) {
  if (focusedPlanet == spaceship) return;
  if (event.code === "KeyR") {
    moveForward = false;
  } else if (event.code === "KeyF") {
    moveBackward = false;
  } else if (event.code === "KeyA") {
    moveLeft = false;
  } else if (event.code === "KeyD") {
    moveRight = false;
  } else if (event.code === "KeyW") {
    moveUp = false;
  } else if (event.code === "KeyS") {
    moveDown = false;
  }
});

// Space sets rotationSpeed to 0 if flight is disabled
var previousRotationSpeed;
document.addEventListener("keydown", function(event) {
  if (event.code === "Space") {
    if (focusedPlanet == spaceship) return;
    if (rotationSpeed == 0) { // if rotationSpeed is already 0, set it to previousRotationSpeed
      rotationSpeed = previousRotationSpeed;
    } else {
      previousRotationSpeed = rotationSpeed;
      rotationSpeed = 0;
    }
  }
});