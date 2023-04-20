import GUI from "https://cdn.skypack.dev/lil-gui@0.18.0";
import { MathUtils, Clock } from "https://cdn.skypack.dev/three@0.149.0";
import { OrbitControls } from "https://unpkg.com/three@0.138.0/examples/jsm/controls/OrbitControls.js"
import { DragControls } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/controls/DragControls'
import * as THREE from "https://cdn.skypack.dev/three@0.149.0";
import  { Perlin, FBM } from "https://cdn.skypack.dev/three-noise@1.1.2";
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/loaders/GLTFLoader'
import { FlyControls } from "./FlyControls.js";

// Create a Three.js scene
const scene = new THREE.Scene();

let vrMode = false;

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
var enableMoons = true;
var enableDwarfs = true;

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
  enableMoons: true,
  enableDwarfs: true,
};

// add control for scale
systemSettings.add(guicontrols, "scale", 0.1, 10, 0.1).onChange((value) => {
  scale = value;
}).name("System Scale").listen();

// add control for rotationSpeed
systemSettings.add(guicontrols, "rotationSpeed", 0, 30, 0.1).onChange((value) => {
  rotationSpeed = value;
}).name("Orbit Rotation Speed").listen();

// add control for numAsteroids
systemSettings.add(guicontrols, "numAsteroids", 0, 3, 0.1).onChange((value) => {
  scene.remove(asteroidRing);
  scene.remove(kuiperRing);
  numAsteroids = value;
  createAsteroidBelts();
}).name("Asteroid Belt Density").listen();

// add control for orbitWidth
systemSettings.add(guicontrols, "orbitWidth", 0, 35, 0.1).onChange((value) => {
  orbitWidth = value;
  removeOrbits();
  removeMoonOrbits();
  removeDwarfOrbits();
  if (enableOrbits) {
    createOrbits();
    if (enableMoons) {
      createMoonOrbits();
    }
    if (enableDwarfs) {
      createDwarfOrbits();
    }
  }
}).name("Orbit Width").listen();

// add control for enableMoons
systemSettings.add(guicontrols, "enableMoons").onChange((value) => {
  if (value) {
    enableMoons = true;
    if (enableOrbits) {
      createMoonOrbits();
    }
    createMoons();
  } else { 
    enableMoons = false;
    removeMoonOrbits();
    removeMoons();
  }
}).name("Enable Moons").listen();

// add control for enableDwarfs
systemSettings.add(guicontrols, "enableDwarfs").onChange((value) => {
  if (value) {
    enableDwarfs = true;
    createDwarfs();
    if (enableOrbits) {
      createDwarfOrbits();
    }
    document.querySelector('#title option[value="pluto"]').disabled = false;
  } else {
    enableDwarfs = false;
    removeDwarfOrbits();
    removeDwarfs();
    // disable pluto option value in id="title" select in html
    document.querySelector('#title option[value="pluto"]').disabled = true;
  }
}).name("Enable Dwarf Planets").listen();

// add control for enableOrbits
systemSettings.add(guicontrols, "enableOrbits").onChange((value) => {
  if (value) {
    enableOrbits = true;
    // add all orbits
    createOrbits();
    if (enableMoons) {
      createMoonOrbits();
    }
    if (enableDwarfs) {
      createDwarfOrbits();
    }
  } else {
    enableOrbits = false;
    removeOrbits();
    removeMoonOrbits();
    removeDwarfOrbits();
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
  scene.remove(jupiterOrbit);
  scene.remove(saturnOrbit);
  scene.remove(uranusOrbit);
  scene.remove(neptuneOrbit);
}

function removeMoonOrbits(){
  mars.remove(deimosOrbit);
  mars.remove(phobosOrbit);
  jupiter.remove(ioOrbit);
  jupiter.remove(europaOrbit);
  jupiter.remove(ganymedeOrbit);
  jupiter.remove(callistoOrbit);
  saturn.remove(titanOrbit);
  saturn.remove(enceladusOrbit);
  saturn.remove(iapetusOrbit);
  neptune.remove(tritonOrbit)
}

function removeDwarfOrbits(){
  scene.remove(ceresOrbit);
  scene.remove(plutoOrbit);
  scene.remove(erisOrbit);
  scene.remove(makemakeOrbit);
}

var starTexture
var sunTexture
var mercuryTexture
var mercuryBumpTexture
var venusTexture
var venusBumpTexture
var venusAtmo
var earthTexture
var earthBumpTexture
var earthSpecular
var earthEmissive
var earthCloud
var moonTexture
var moonBumpTexture
var marsTexture
var marsBumpTexture
var ceresTexture
var ceresBumpTexture
var jupiterTexture
var ioTexture
var ioBumpTexture
var europaTexture
var europaBumpTexture
var ganymedeTexture
var ganymedeBumpTexture
var callistoTexture
var callistoBumpTexture
var saturnTexture
var saturnRingTexture
var titanTexture
var titanBumpTexture
var enceladusTexture
var enceladusBumpTexture
var iapetusTexture
var iapetusBumpTexture
var uranusTexture
var neptuneTexture
var tritonTexture
var tritonBumpTexture
var plutoTexture
var plutoBumpTexture
var plutoSpecular
var makemakeTexture
var erisTexture
var erisBumpTexture

// Start animation loop
const loadingManager = new THREE.LoadingManager(() => {
});

function loadAllTextures(){
  // load textures
  const loader = new THREE.TextureLoader();
  starTexture = loader.load('public/8k_stars_milky_way.jpg', () => {
    loadingManager.itemEnd('starTexture');
  });
  sunTexture = loader.load('public/2k_sun.jpg', () => {
    loadingManager.itemEnd('sunTexture');
  });
  mercuryTexture = loader.load('public/2k_mercury.jpg', () => {
    loadingManager.itemEnd('mercuryTexture');
  });
  mercuryBumpTexture = loader.load('public/mercury_elevation.jpg', () => {
    loadingManager.itemEnd('mercuryBumpTexture');
  });
  venusTexture = loader.load('public/2k_venus_surface.jpg', () => {
    loadingManager.itemEnd('venusTexture');
  });
  venusBumpTexture = loader.load('public/venus_elevation.jpg', () => {
    loadingManager.itemEnd('venusBumpTexture');
  });
  venusAtmo = loader.load('public/2k_venus_atmosphere.jpg', () => {
    loadingManager.itemEnd('venusAtmo');
  });
  earthTexture = loader.load('public/8k_earth_daymap.jpg', () => {
    loadingManager.itemEnd('earthTexture');
  });
  earthBumpTexture = loader.load('public/earth_elevation.jpg', () => {
    loadingManager.itemEnd('earthBumpTexture');
  });
  earthSpecular = loader.load('public/2k_earth_specular_map.tif', () => {
    loadingManager.itemEnd('earthSpecular');
  });
  earthEmissive = loader.load('public/2k_earth_nightmap.jpg', () => {
    loadingManager.itemEnd('earthEmissive');
  });
  earthCloud = loader.load('public/earth_clouds.png', () => {
    loadingManager.itemEnd('earthCloud');
  });
  moonTexture = loader.load('public/2k_moon.jpg', () => {
    loadingManager.itemEnd('moonTexture');
  });
  moonBumpTexture = loader.load('public/moon_elevation.jpg', () => {
    loadingManager.itemEnd('moonBumpTexture');
  });
  marsTexture = loader.load('public/2k_mars.jpg', () => {
    loadingManager.itemEnd('marsTexture');
  });
  marsBumpTexture = loader.load('public/mars_elevation.jpg', () => {
    loadingManager.itemEnd('marsBumpTexture');
  });
  ceresTexture = loader.load('public/2k_ceres.jpg', () => {
    loadingManager.itemEnd('ceresTexture');
  });
  ceresBumpTexture = loader.load('public/ceres_elevation.png', () => {
    loadingManager.itemEnd('ceresBumpTexture');
  });
  jupiterTexture = loader.load('public/2k_jupiter.jpg', () => {
    loadingManager.itemEnd('jupiterTexture');
  });
  ioTexture = loader.load('public/io_texture.jpg', () => {
    loadingManager.itemEnd('ioTexture');
  });
  ioBumpTexture = loader.load('public/io_elevation.png', () => {
    loadingManager.itemEnd('ioBumpTexture');
  });
  europaTexture = loader.load('public/europa_texture.png', () => {
    loadingManager.itemEnd('europaTexture');
  });
  europaBumpTexture = loader.load('public/europa_elevation.jpg', () => {
    loadingManager.itemEnd('europaBumpTexture');
  });
  ganymedeTexture = loader.load('public/ganymede_texture.png', () => {
    loadingManager.itemEnd('ganymedeTexture');
  });
  ganymedeBumpTexture = loader.load('public/ganymede_elevation.jpg', () => {
    loadingManager.itemEnd('ganymedeBumpTexture');
  });
  callistoTexture = loader.load('public/callisto_texture.jpg', () => {
    loadingManager.itemEnd('callistoTexture');
  });
  callistoBumpTexture = loader.load('public/callisto_elevation.jpg', () => {
    loadingManager.itemEnd('callistoBumpTexture');
  });
  saturnTexture = loader.load('public/2k_saturn.jpg', () => {
    loadingManager.itemEnd('saturnTexture');
  });
  saturnRingTexture = loader.load('public/saturn_rings.png', () => {
    loadingManager.itemEnd('saturnRingTexture');
  });
  titanTexture = loader.load('public/titan_texture.png', () => {
    loadingManager.itemEnd('titanTexture');
  });
  titanBumpTexture = loader.load('public/titan_elevation.png', () => {
    loadingManager.itemEnd('titanBumpTexture');
  });
  enceladusTexture = loader.load('public/enceladus_texture.jpg', () => {
    loadingManager.itemEnd('enceladusTexture');
  });
  enceladusBumpTexture = loader.load('public/enceladus_elevation.png', () => {
    loadingManager.itemEnd('enceladusBumpTexture');
  });
  iapetusTexture = loader.load('public/iapetus_texture.png', () => {
    loadingManager.itemEnd('iapetusTexture');
  });
  iapetusBumpTexture = loader.load('public/iapetus_elevation.png', () => {
    loadingManager.itemEnd('iapetusBumpTexture');
  });
  uranusTexture = loader.load('public/2k_uranus.jpg', () => {
    loadingManager.itemEnd('uranusTexture');
  });
  neptuneTexture = loader.load('public/2k_neptune.jpg', () => {
    loadingManager.itemEnd('neptuneTexture');
  });
  tritonTexture = loader.load('public/triton_texture.png', () => {
    loadingManager.itemEnd('tritonTexture');
  });
  tritonBumpTexture = loader.load('public/triton_elevation.jpg', () => {
    loadingManager.itemEnd('tritonBumpTexture');
  });
  plutoTexture = loader.load('public/2k_pluto.webp', () => {
    loadingManager.itemEnd('plutoTexture');
  });
  plutoBumpTexture = loader.load('public/pluto_elevation.png', () => {
    loadingManager.itemEnd('plutoBumpTexture');
  });
  plutoSpecular = loader.load('public/pluto_spec.png', () => {
    loadingManager.itemEnd('plutoSpecular');
  });
  makemakeTexture = loader.load('public/2k_makemake.jpg', () => {
    loadingManager.itemEnd('makemakeTexture');
  });
  erisTexture = loader.load('public/2k_eris.jpg', () => {
    loadingManager.itemEnd('erisTexture');
  });
  erisBumpTexture = loader.load('public/eris_elevation.jpg', () => {
    loadingManager.itemEnd('erisBumpTexture');
  });
  loadingManager.itemStart('starTexture');
  loadingManager.itemStart('sunTexture');
  loadingManager.itemStart('mercuryTexture');
  loadingManager.itemStart('mercuryBumpTexture');
  loadingManager.itemStart('venusTexture');
  loadingManager.itemStart('venusBumpTexture');
  loadingManager.itemStart('venusAtmo');
  loadingManager.itemStart('earthTexture');
  loadingManager.itemStart('earthBumpTexture');
  loadingManager.itemStart('earthSpecular');
  loadingManager.itemStart('earthEmissive');
  loadingManager.itemStart('earthCloud');
  loadingManager.itemStart('moonTexture');
  loadingManager.itemStart('moonBumpTexture');
  loadingManager.itemStart('marsTexture');
  loadingManager.itemStart('marsBumpTexture');
  loadingManager.itemStart('ceresTexture');
  loadingManager.itemStart('ceresBumpTexture');
  loadingManager.itemStart('jupiterTexture');
  loadingManager.itemStart('ioTexture');
  loadingManager.itemStart('ioBumpTexture');
  loadingManager.itemStart('europaTexture');
  loadingManager.itemStart('europaBumpTexture');
  loadingManager.itemStart('ganymedeTexture');
  loadingManager.itemStart('ganymedeBumpTexture');
  loadingManager.itemStart('callistoTexture');
  loadingManager.itemStart('callistoBumpTexture');
  loadingManager.itemStart('saturnTexture');
  loadingManager.itemStart('saturnRingTexture');
  loadingManager.itemStart('titanTexture');
  loadingManager.itemStart('titanBumpTexture');
  loadingManager.itemStart('enceladusTexture');
  loadingManager.itemStart('enceladusBumpTexture');
  loadingManager.itemStart('iapetusTexture');
  loadingManager.itemStart('iapetusBumpTexture');
  loadingManager.itemStart('uranusTexture');
  loadingManager.itemStart('neptuneTexture');
  loadingManager.itemStart('tritonTexture');
  loadingManager.itemStart('tritonBumpTexture');
  loadingManager.itemStart('plutoTexture');
  loadingManager.itemStart('plutoBumpTexture');
  loadingManager.itemStart('plutoSpecular');
  loadingManager.itemStart('makemakeTexture');
  loadingManager.itemStart('erisTexture');
  loadingManager.itemStart('erisBumpTexture');
}
loadAllTextures();

loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
  console.log(`Started loading file: ${url}. Loaded ${itemsLoaded} of ${itemsTotal} files.`);
};

loadingManager.onLoad = () => {
  console.log('Loading complete!');
};

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  console.log(`Loading file: ${url}. Loaded ${itemsLoaded} of ${itemsTotal} files.`);
  if (itemsLoaded === itemsTotal - 1) {
    console.log("HI")
    render()
  }
};

loadingManager.onError = (url) => {
  console.log(`Error loading file: ${url}`);
};

var mercuryDistance
var venusDistance 

var earthDistance
var moonDistance 

var marsDistance
var deimosDistance
var phobosDistance 

var ceresDistance

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
var tritonDistance

var plutoDistance
var plutoTilt
var plutoAngle

var makemakeDistance
var erisDistance

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
var sun;
var mercury;
var venus;
var venusAtmo;
var earth;
var cloudMesh;
var moon;
var mars;
var deimos;
var phobos;
var ceres;
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
var triton;
var pluto;
var makemake;
var eris;

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
var ceresOrbit;
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
var tritonOrbit;
var plutoOrbit;
var makemakeOrbit;
var erisOrbit;

var sunLight;

function createSky() {
  // add star background to scene
  const starGeometry = new THREE.SphereGeometry(300000 * scale, 32, 32);
  const starMaterial = new THREE.MeshBasicMaterial({ map: starTexture, side: THREE.BackSide, depthWrite: false });
  const starMesh = new THREE.Mesh(starGeometry, starMaterial);
  // darken a bit
  starMesh.material.color.setRGB(0.5, 0.5, 0.5);
  scene.add(starMesh);
}

function createPlanets(){

  mercuryDistance = 1200 * scale * 1.2
  venusDistance = 1500 * scale * 1.2
  earthDistance = 2100 * scale * 1.2
  moonDistance = 200 * scale
  marsDistance = 2700 * scale * 1.2
  deimosDistance = 150 * scale
  phobosDistance = 250 * scale
  ceresDistance = 3500 * scale * 1.2
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
  tritonDistance = 250 * scale
  plutoDistance = 8000 * scale * 1.2
  erisDistance = 9000 * scale * 1.2
  makemakeDistance = 10000 * scale * 1.2

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
  const sunMaterial = new THREE.MeshPhongMaterial({ map: sunTexture, emissive: 0xffff00, emissiveIntensity: 1, emissiveMap: sunTexture });
  sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(0, 0, 0);
  scene.add(sun);

  // mercury
  const mercuryGeometry = new THREE.SphereGeometry(10 * scale, 64, 64);
  const mercuryMaterial = new THREE.MeshPhongMaterial({ map: mercuryTexture, bumpMap: mercuryBumpTexture, bumpScale: 0.07 * scale, shininess: 4 });
  mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
  mercury.castShadow = true;
  mercury.receiveShadow = true;
  mercury.position.set(mercuryDistance, 0, 0);
  scene.add(mercury);

  //venus
  const venusGeometry = new THREE.SphereGeometry(20 * scale, 128, 128);
  const venusMaterial = new THREE.MeshPhongMaterial({ map: venusTexture, bumpMap: venusBumpTexture, bumpScale: 0.2 * scale, shininess: 4 });
  venus = new THREE.Mesh(venusGeometry, venusMaterial);
  venus.castShadow = true;
  venus.receiveShadow = true;
  venus.position.set(-venusDistance, 0, 0);
  scene.add(venus);

  const venusAtmoGeometry = new THREE.SphereGeometry(20.1 * scale, 128, 128);
  const venusAtmoMaterial = new THREE.MeshPhongMaterial({ map: venusAtmo, transparent: true, opacity: 0.75, shininess: 4  });
  venusAtmo = new THREE.Mesh(venusAtmoGeometry, venusAtmoMaterial);
  venusAtmo.position.set(0, 0, 0);
  venus.add(venusAtmo);

  // earth
  const earthGeometry = new THREE.SphereGeometry(20 * scale, 128, 128);
  const earthMaterial = new THREE.MeshPhongMaterial({ map: earthTexture, bumpMap: earthBumpTexture, bumpScale: 0.2 * scale, 
  specularMap: earthSpecular, specular: new THREE.Color('grey'), 
  emissiveMap: earthEmissive, emissive: 0xffffff, emissiveIntensity: 0.2 });
  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.castShadow = true;
  earth.receiveShadow = true;
  earth.position.set(0, 0, earthDistance);
  scene.add(earth);

  // add sphere for cloud layer just barely bigger than earth
  const cloudGeometry = new THREE.SphereGeometry(20.1 * scale, 128, 128);
  const cloudMaterial = new THREE.MeshPhongMaterial({ map: earthCloud, transparent: true, opacity: 0.6 });
  cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
  cloudMesh.position.set(0, 0, 0);
  earth.add(cloudMesh);

  //moon
  const moonGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const moonMaterial = new THREE.MeshPhongMaterial({ map: moonTexture, bumpMap: moonBumpTexture, bumpScale: 0.05 * scale, shininess: 4 });
  moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.castShadow = true;
  moon.receiveShadow = true;
  moon.position.set(0, 0, moonDistance);
  moon.rotation.y = Math.PI;
  earth.add(moon);

  // mars
  const marsGeometry = new THREE.SphereGeometry(14 * scale, 64, 64);
  const marsMaterial = new THREE.MeshPhongMaterial({ map: marsTexture, bumpMap: marsBumpTexture, bumpScale: 0.2 * scale, shininess: 4 });
  mars = new THREE.Mesh(marsGeometry, marsMaterial);
  mars.castShadow = true;
  mars.receiveShadow = true;
  mars.position.set(0, 0, marsDistance);
  scene.add(mars);

  // jupiter
  const jupiterGeometry = new THREE.SphereGeometry(100 * scale, 128, 128);
  const jupiterMaterial = new THREE.MeshPhongMaterial({ map: jupiterTexture });
  jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial);
  jupiter.castShadow = true;
  jupiter.receiveShadow = true;
  jupiter.position.set(0, 0, jupiterDistance);
  scene.add(jupiter);

  // saturn
  const saturnGeometry = new THREE.SphereGeometry(80 * scale, 128, 128);
  const saturnMaterial = new THREE.MeshPhongMaterial({ map: saturnTexture, wireframe: false  });
  saturn = new THREE.Mesh(saturnGeometry, saturnMaterial);
  saturn.castShadow = true;
  saturn.receiveShadow = true;
  saturn.position.set(0, 0, saturnDistance);
  scene.add(saturn);

  // saturn ring
  const saturnRingGeometry = new THREE.RingGeometry(100 * scale, 180 * scale, 256);
  const saturnRingMaterial = new THREE.MeshBasicMaterial({ map: saturnRingTexture, side: THREE.DoubleSide, transparent: true});
  saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
  saturnRing.rotation.x = Math.PI / 2;
  saturnRing.receiveShadow = true;
  saturnRing.castShadow = true;
  saturn.add(saturnRing);

  // uranus
  const uranusGeometry = new THREE.SphereGeometry(60 * scale, 128, 128);
  const uranusMaterial = new THREE.MeshPhongMaterial({ map: uranusTexture });
  uranus = new THREE.Mesh(uranusGeometry, uranusMaterial);
  uranus.castShadow = true;
  uranus.receiveShadow = true;
  uranus.position.set(0, 0, uranusDistance);
  scene.add(uranus);

  // neptune
  const neptuneGeometry = new THREE.SphereGeometry(60 * scale, 128, 128);
  const neptuneMaterial = new THREE.MeshPhongMaterial({ map: neptuneTexture });
  neptune = new THREE.Mesh(neptuneGeometry, neptuneMaterial);
  neptune.castShadow = true;
  neptune.receiveShadow = true;
  neptune.position.set(0, 0, neptuneDistance);
  scene.add(neptune);
}

function createMoons(){
  //mars
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

  //jupiter
  // io
  const ioGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const ioMaterial = new THREE.MeshPhongMaterial({ map: ioTexture, bumpMap: ioBumpTexture, bumpScale: 0.05 * scale, shininess: 4 });
  io = new THREE.Mesh(ioGeometry, ioMaterial);
  io.castShadow = true;
  io.receiveShadow = true;
  io.position.set(0, 0, ioDistance);
  jupiter.add(io); 

  // europa
  const europaGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const europaMaterial = new THREE.MeshPhongMaterial({ map: europaTexture, bumpMap: europaBumpTexture, bumpScale: 0.025 * scale, shininess: 4 });
  europa = new THREE.Mesh(europaGeometry, europaMaterial);
  europa.castShadow = true;
  europa.receiveShadow = true;
  europa.position.set(0, 0, europaDistance);
  jupiter.add(europa);

  // ganymede
  const ganymedeGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const ganymedeMaterial = new THREE.MeshPhongMaterial({ map: ganymedeTexture, bumpMap: ganymedeBumpTexture, bumpScale: 0.05 * scale, shininess: 4 });
  ganymede = new THREE.Mesh(ganymedeGeometry, ganymedeMaterial);
  ganymede.castShadow = true;
  ganymede.receiveShadow = true;
  ganymede.position.set(0, 0, ganymedeDistance);
  jupiter.add(ganymede);

  // callisto
  const callistoGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const callistoMaterial = new THREE.MeshPhongMaterial({ map: callistoTexture, bumpMap: callistoBumpTexture, bumpScale: 0.05 * scale, shininess: 4 });
  callisto = new THREE.Mesh(callistoGeometry, callistoMaterial);
  callisto.castShadow = true;
  callisto.receiveShadow = true;
  callisto.position.set(0, 0, callistoDistance);
  jupiter.add(callisto);

  //saturn
  // titan
  const titanGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const titanMaterial = new THREE.MeshPhongMaterial({ map: titanTexture, bumpMap: titanBumpTexture, bumpScale: 0.05 * scale, shininess: 4 });
  titan = new THREE.Mesh(titanGeometry, titanMaterial);
  titan.castShadow = true;
  titan.receiveShadow = true;
  titan.position.set(0, 0, titanDistance);
  saturn.add(titan);

  // enceladus
  const enceladusGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const enceladusMaterial = new THREE.MeshPhongMaterial({ map: enceladusTexture, bumpMap: enceladusBumpTexture, bumpScale: 0.05 * scale, shininess: 4 });
  enceladus = new THREE.Mesh(enceladusGeometry, enceladusMaterial);
  enceladus.castShadow = true;
  enceladus.receiveShadow = true;
  enceladus.position.set(0, 0, enceladusDistance);
  enceladus.rotation.y = Math.PI / 2;
  saturn.add(enceladus);

  // iapetus
  const iapetusGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const iapetusMaterial = new THREE.MeshPhongMaterial({ map: iapetusTexture, bumpMap: iapetusBumpTexture, bumpScale: 0.05 * scale, shininess: 4 });
  iapetus = new THREE.Mesh(iapetusGeometry, iapetusMaterial);
  iapetus.castShadow = true;
  iapetus.receiveShadow = true;
  iapetus.position.set(0, 0, iapetusDistance);
  saturn.add(iapetus);

  // neptune

  // triton
  const tritonGeometry = new THREE.SphereGeometry(4 * scale, 64, 64);
  const tritonMaterial = new THREE.MeshPhongMaterial({ map: tritonTexture, bumpMap: tritonBumpTexture, bumpScale: 0.05 * scale, shininess: 4 });
  triton = new THREE.Mesh(tritonGeometry, tritonMaterial);
  triton.castShadow = true;
  triton.receiveShadow = true;
  triton.position.set(0, 0, tritonDistance);
  triton.rotation.y = Math.PI / 2;
  neptune.add(triton);
}

function createDwarfs(){
  // ceres
  const ceresGeometry = new THREE.SphereGeometry(3 * scale, 64, 64);
  const ceresMaterial = new THREE.MeshPhongMaterial({ map: ceresTexture, bumpMap: ceresBumpTexture, bumpScale: 0.05 * scale, shininess: 4 });
  ceres = new THREE.Mesh(ceresGeometry, ceresMaterial);
  ceres.castShadow = true;
  ceres.receiveShadow = true;
  ceres.position.set(0, 0, ceresDistance);
  scene.add(ceres);

  // pluto
  const plutoGeometry = new THREE.SphereGeometry(5 * scale, 64, 64);
  const plutoMaterial = new THREE.MeshPhongMaterial({ map: plutoTexture, bumpMap: plutoBumpTexture, bumpScale: 0.05 * scale, specularMap: plutoSpecular, specular: new THREE.Color('grey'), shininess: 2 });
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

  // eris
  const erisGeometry = new THREE.SphereGeometry(5 * scale, 64, 64);
  const erisMaterial = new THREE.MeshPhongMaterial({ map: erisTexture, bumpMap: erisBumpTexture, bumpScale: 0.05 * scale, shininess: 4 });
  eris = new THREE.Mesh(erisGeometry, erisMaterial);
  eris.castShadow = true;
  eris.receiveShadow = true;
  eris.position.set(0, 0, erisDistance);
  scene.add(eris);

  // makemake
  const makemakeGeometry = new THREE.SphereGeometry(5 * scale, 64, 64);
  const makemakeMaterial = new THREE.MeshPhongMaterial({ map: makemakeTexture, shininess: 4 });
  makemake = new THREE.Mesh(makemakeGeometry, makemakeMaterial);
  makemake.castShadow = true;
  makemake.receiveShadow = true;
  makemake.position.set(0, 0, makemakeDistance);
  scene.add(makemake);
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

  // jupiter orbit
  const jupiterOrbitGeometry = new THREE.RingGeometry(jupiterDistance - (.2 * (scale/2) * orbitWidth), jupiterDistance + (.2 * (scale/2) * orbitWidth), 1024);
  const jupiterOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  jupiterOrbit = new THREE.Mesh(jupiterOrbitGeometry, jupiterOrbitMaterial);
  jupiterOrbit.rotation.x = Math.PI / 2;
  scene.add(jupiterOrbit);
  
  // saturn orbit
  const saturnOrbitGeometry = new THREE.RingGeometry(saturnDistance - (.2 * (scale/2) * orbitWidth), saturnDistance + (.2 * (scale/2) * orbitWidth), 1024);
  const saturnOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  saturnOrbit = new THREE.Mesh(saturnOrbitGeometry, saturnOrbitMaterial);
  saturnOrbit.rotation.x = Math.PI / 2;
  scene.add(saturnOrbit);

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
}

function createMoonOrbits(){

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
  const callistoOrbitGeometry = new THREE.RingGeometry(callistoDistance - (.1 * (scale/2) * orbitWidth), callistoDistance + (.1 * (scale/2) * orbitWidth), 512);
  const callistoOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  callistoOrbit = new THREE.Mesh(callistoOrbitGeometry, callistoOrbitMaterial);
  callistoOrbit.rotation.x = Math.PI / 2;
  jupiter.add(callistoOrbit); // add callisto orbit to the jupiter so that it orbits around the sun along with the jupiter

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
  const iapetusOrbitGeometry = new THREE.RingGeometry(iapetusDistance - (.1 * (scale/2) * orbitWidth), iapetusDistance + (.1 * (scale/2) * orbitWidth), 512);
  const iapetusOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  iapetusOrbit = new THREE.Mesh(iapetusOrbitGeometry, iapetusOrbitMaterial);
  iapetusOrbit.rotation.x = Math.PI / 2;
  saturn.add(iapetusOrbit); // add iapetus orbit to the saturn so that it orbits around the sun along with the saturn
  // triton orbit
  const tritonOrbitGeometry = new THREE.RingGeometry(tritonDistance - (.1 * (scale/2) * orbitWidth), tritonDistance + (.1 * (scale/2) * orbitWidth), 256);
  const tritonOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  tritonOrbit = new THREE.Mesh(tritonOrbitGeometry, tritonOrbitMaterial);
  tritonOrbit.rotation.x = Math.PI / 2;
  neptune.add(tritonOrbit); // add triton orbit to the neptune so that it orbits around the sun along with the neptune
}

function createDwarfOrbits(){

  // ceres orbit
  const ceresOrbitGeometry = new THREE.RingGeometry(ceresDistance - (.1 * (scale/2) * orbitWidth), ceresDistance + (.1 * (scale/2) * orbitWidth), 1024);
  const ceresOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  ceresOrbit = new THREE.Mesh(ceresOrbitGeometry, ceresOrbitMaterial);
  ceresOrbit.rotation.x = Math.PI / 2;
  scene.add(ceresOrbit);

  // pluto orbit
  const plutoOrbitGeometry = new THREE.RingGeometry(plutoDistance - (0.2 * (scale / 2) * orbitWidth), plutoDistance + (0.2 * (scale / 2) * orbitWidth), 1024);
  const plutoOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  plutoOrbit = new THREE.Mesh(plutoOrbitGeometry, plutoOrbitMaterial);

  // tilt pluto orbit
  plutoOrbit.rotation.x = Math.PI / 2 - plutoTilt;
  scene.add(plutoOrbit);

  // eris orbit
  const erisOrbitGeometry = new THREE.RingGeometry(erisDistance - (.1 * (scale/2) * orbitWidth), erisDistance + (.1 * (scale/2) * orbitWidth), 1024);
  const erisOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  erisOrbit = new THREE.Mesh(erisOrbitGeometry, erisOrbitMaterial);
  erisOrbit.rotation.x = Math.PI / 2;
  scene.add(erisOrbit);

  // makemake orbit
  const makemakeOrbitGeometry = new THREE.RingGeometry(makemakeDistance - (.1 * (scale/2) * orbitWidth), makemakeDistance + (.1 * (scale/2) * orbitWidth), 1024);
  const makemakeOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true, side: THREE.DoubleSide });
  makemakeOrbit = new THREE.Mesh(makemakeOrbitGeometry, makemakeOrbitMaterial);
  makemakeOrbit.rotation.x = Math.PI / 2;
  scene.add(makemakeOrbit);

} 

// create everything
createPlanets();
createMoons();
createDwarfs();
createAsteroidBelts();
createSky();
createOrbits();
createMoonOrbits();
createDwarfOrbits();


function removeMoons(){
  // remove moons from planets
  mars.remove(phobos);
  mars.remove(deimos);
  jupiter.remove(io);
  jupiter.remove(europa);
  jupiter.remove(ganymede);
  jupiter.remove(callisto);
  saturn.remove(titan);
  saturn.remove(enceladus);
  saturn.remove(iapetus);
  neptune.remove(triton);
}

function removeDwarfs(){
  scene.remove(ceres)
  scene.remove(pluto)
  scene.remove(eris)
  scene.remove(makemake)
}

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

// fly controls
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
// ceres is 7/8
let ceresAngle = 7 * (Math.PI / 4);
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
let tritonAngle = 0;
// pluto is 0
let plutoRotation = 0;
// eris is 1/4
let erisAngle = Math.PI * 0.5;
// makemake is 1/2
let makemakeAngle = Math.PI;

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
  scene.remove(ceres)
  scene.remove(jupiter);
  scene.remove(saturn);
  scene.remove(uranus);
  scene.remove(neptune);
  scene.remove(pluto);
  scene.remove(eris);
  scene.remove(makemake);
  scene.remove(sun);
  scene.remove(asteroidRing);
  scene.remove(kuiperRing);

  // remove all orbits from scene
  removeOrbits();
  removeMoonOrbits();
  removeDwarfOrbits();

  camera.position.set(400 * scale, 250 * scale, -1600 * scale);

  //reset light
  scene.remove(sunLight);

  flyControls.enabled = false;
  controls.enabled = true;

  // recreate all planets
  createPlanets();
  if (enableMoons){
    createMoons();
    createMoonOrbits();
  }
  if (enableDwarfs){
    createDwarfs();
    createDwarfOrbits();
  }
  createAsteroidBelts();
  console.log(enableOrbits)
  if (enableOrbits) {
    createOrbits();
  }
  createSky();
  camera.far = 400000 * scale;
  focusedPlanet = sun;
  dropdown.value = "sun";
}

const defaultSettings = () => {
  // reset all values to default
  scale = 3;
  flightSensitivity = 10;
  enableOrbits = true;
  rotationSpeed = 0.5;
  flightRotationSpeed = 1;
  flightFov = 50;
  numAsteroids = 1;
  orbitWidth = 1;
  enableMoons = true;
  enableDwarfs = true;
  // reset controls
  guicontrols.scale = scale;
  guicontrols.flightSensitivity = flightSensitivity;
  guicontrols.enableOrbits = enableOrbits;
  guicontrols.rotationSpeed = rotationSpeed;
  guicontrols.flightRotationSpeed = flightRotationSpeed;
  guicontrols.flightFov = flightFov;
  guicontrols.numAsteroids = numAsteroids;
  guicontrols.orbitWidth = orbitWidth;
  guicontrols.enableMoons = enableMoons;
  guicontrols.enableDwarfs = enableDwarfs;
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
  if (vrMode) {
    return;
  }

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
  sun.rotation.y -= 0.0005 * rotationSpeed * 0.15;
  mercury.rotation.y -= 0.002 * rotationSpeed * 0.15;

  venus.rotation.y -= 0.002 * rotationSpeed * 0.15;
  venusAtmo.rotation.y += 0.0005 * rotationSpeed * 0.15;

  earth.rotation.y -= 0.002 * rotationSpeed * 0.15;
  cloudMesh.rotation.y += 0.0003 * rotationSpeed * 0.15;
  moon.rotation.y -= 0.002 * rotationSpeed * 0.15;

  mars.rotation.y -= 0.002 * rotationSpeed * 0.15;
  phobos.rotation.y -= 0.002 * rotationSpeed * 0.15;
  deimos.rotation.y -= 0.002 * rotationSpeed * 0.15;

  ceres.rotation.y -= 0.006 * rotationSpeed * 0.15;

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
  triton.rotation.y -= 0.001 * rotationSpeed * 0.15;

  eris.rotation.y -= 0.005 * rotationSpeed * 0.15;
  makemake.rotation.y -= 0.005 * rotationSpeed * 0.15;

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
    { distance: ceresDistance, angle: ceresAngle, object: ceres},
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
    { distance: neptuneDistance, angle: neptuneAngle, object: neptune },
    { distance: tritonDistance, angle: tritonAngle, object: triton },
    { distance: erisDistance, angle: erisAngle, object: eris },
    { distance: makemakeDistance, angle: makemakeAngle, object: makemake },
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
  ceresAngle += 0.000125 * rotationSpeed * 0.15;
  jupiterAngle += 0.0000625 * rotationSpeed * 0.15;
  saturnAngle += 0.00003125 * rotationSpeed * 0.15;
  uranusAngle += 0.000015625 * rotationSpeed * 0.15;
  neptuneAngle += 0.000015625 * rotationSpeed * 0.15;
  plutoAngle += 0.000015625 * rotationSpeed * 0.15;
  plutoRotation += 0.002 * rotationSpeed * 0.15;
  erisAngle += 0.000015625 * rotationSpeed * 0.15;
  makemakeAngle += 0.000015625 * rotationSpeed * 0.15;

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
    } else if (focusedPlanet == triton){
      setMoonPosition(triton, 0);
    } else if (focusedPlanet == null){
      disableFlight();
      controls.target.x = lerp(controls.target.x, focusedPlanet.position.x, lerpSpeed);
      controls.target.y = lerp(controls.target.y, focusedPlanet.position.y, lerpSpeed);
      controls.target.z = lerp(controls.target.z, focusedPlanet.position.z, lerpSpeed);
      // move to sun
      spaceship.position.x = lerp(spaceship.position.x, sun.position.x, lerpSpeed + 0.01);
      spaceship.position.y = lerp(spaceship.position.y, sun.position.y + sun.geometry.parameters.radius + 240, lerpSpeed + 0.01);
      spaceship.position.z = lerp(spaceship.position.z, sun.position.z, lerpSpeed + 0.01);
    } else { // Flight disabled
      disableFlight();
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
  }
  // Update the camera position
  
  // Update the controls and render the scene
  if (flyControls.enabled) {
    flyControls.update(clock.getDelta()); // update position using fly controls
    // move spaceship inside sun to hide
    spaceship.position.x = sun.position.x;
    spaceship.position.y = sun.position.y + 400000 * scale;
    spaceship.position.z = sun.position.z;
  } else {
    controls.update(clock.getDelta()); // update position using orbit controls
  }
  requestAnimationFrame(render);
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
  if (moon == ceres){
    spaceship.position.y = lerp(spaceship.position.y, 320, lerpSpeed + 0.01);
  } else if (moon != deimos && moon != phobos){
    spaceship.position.y = lerp(spaceship.position.y, focusedPlanet.geometry.parameters.radius + 240 + offsetY, lerpSpeed + 0.01);
  } else {
    spaceship.position.y = lerp(spaceship.position.y, 240, lerpSpeed + 0.01);
    // get height of model

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
  } else if (planet == "sun" || planet == sun) {
    focusedPlanet = sun;
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
  } else if (planet == "ceres" || planet == ceres) {
    focusedPlanet = ceres;
    dropdown.value = "ceres";
    window.history.pushState(null, null, '?planet=ceres');
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
  } else if (planet == "triton" || planet == triton) {
    focusedPlanet = triton;
    dropdown.value = "triton";
    window.history.pushState(null, null, '?planet=triton');
  } else if (planet == "pluto" || planet == pluto) {
    focusedPlanet = pluto;
    dropdown.value = "pluto";
    window.history.pushState(null, null, '?planet=pluto');
  } else if (planet == "eris" || planet == eris) {
    focusedPlanet = eris;
    dropdown.value = "eris";
    window.history.pushState(null, null, '?planet=eris');
  } else if (planet == "makemake" || planet == makemake) {
    focusedPlanet = makemake;
    dropdown.value = "makemake";
    window.history.pushState(null, null, '?planet=makemake');
  } else if (planet == "spaceship" || planet == spaceship) {
    camera.position.copy(spaceship.position);
    // enable flight reticule
    reticule.style.display = "block";
    focusedPlanet = spaceship;
    dropdown.value = "spaceship";
    window.history.pushState(null, null, '?planet=spaceship');
  } else if (planet == "null" || planet == null) {
    focusedPlanet = null;
    dropdown.value = "free";
    // remove all url params
    window.history.pushState(null, null, '?');
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
      if (intersects[0].object.name.includes("mesh_0")) { // UFO model
        changeFocusedPlanet("spaceship");
      }
      if (intersects[0].object.name.includes("deimos")){ // Deimos model
        changeFocusedPlanet("deimos");
      }
      if (intersects[0].object.name.includes("phobos")){ // Phobos model
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
  const planets = [sun, mercury, venus, earth, mars, ceres, jupiter, saturn, uranus, neptune, pluto, eris, makemake];
  if (event.code === 'Escape') {
    // if flight enabled
    if(focusedPlanet == spaceship){// calculate closest planet to camera
    let closestPlanet = sun;
    let closestDistance = camera.position.distanceTo(sun.position);
    for (let planet of planets) { 
      console.log(planet.position)
      let distance = camera.position.distanceTo(planet.position);
      if (distance < closestDistance) {
        closestPlanet = planet;
        closestDistance = distance;
      }
    }
    changeFocusedPlanet(closestPlanet);
    } else {
      changeFocusedPlanet(null);
    }
  }
});

// add event listener for "title" select element on change
dropdown.addEventListener("change", function() {
  changeFocusedPlanet(dropdown.value);
});

// event listener for toggle-flight-button
document.getElementById('toggle-flight-button').addEventListener('click', function() {
  if (focusedPlanet != spaceship){
    focusedPlanet = spaceship;
    dropdown.value = "spaceship";
  } else {
    focusedPlanet = sun;
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

//vr-button event listener
document.getElementById('vr-button').addEventListener('click', function() {
  if (vrMode) {
    renderer.xr.getSession().end();
  } else {
    vrMode = true;
    startVR();
  }
});

let frameOfRef;
let xrSession;
let leftEyeCamera, rightEyeCamera;
let stereoCamera;
let vrRenderer;
function startVR() {
  navigator.xr.requestSession('immersive-vr', {requiredFeatures: ['local-floor']}).then((session) => {
    xrSession = session;
    session.requestReferenceSpace('viewer').then((refSpace) => {
      frameOfRef = refSpace;
      // create vrRenderer
      vrRenderer = new THREE.WebGLRenderer({antialias: true});
      vrRenderer.setPixelRatio(window.devicePixelRatio);
      vrRenderer.setSize(window.innerWidth, window.innerHeight);
      vrRenderer.xr.enabled = true;
      vrRenderer.setAnimationLoop(animate);
      vrRenderer.xr.setReferenceSpaceType('local-floor');
      vrRenderer.xr.setSession(xrSession);

      session.addEventListener('end', function() {
        renderer.vr.enabled = false;
        vrMode = false;
      });

      // Create a stereo camera
      stereoCamera = new THREE.StereoCamera(0.1, 1000);

      // Create two cameras for the left and right eyes
      leftEyeCamera = new THREE.PerspectiveCamera();
      rightEyeCamera = new THREE.PerspectiveCamera();

      // Set the stereoEnabled property of each camera to true
      leftEyeCamera.stereoEnabled = true;
      rightEyeCamera.stereoEnabled = true;

      // Set the eye property of each camera
      leftEyeCamera.eye = 'left';
      rightEyeCamera.eye = 'right';

      // Request the first animation frame
      //xrSession.requestAnimationFrame(animate);
    });
  });
}

    function animate(time, frame) {
      // Request the next animation frame
      xrSession.requestAnimationFrame(animate);

      // Set the VR mode flag
      vrMode = true;
      
      // rotate in place
      sun.rotation.y -= 0.0005 * rotationSpeed * 0.15;
      mercury.rotation.y -= 0.002 * rotationSpeed * 0.15;

      venus.rotation.y -= 0.002 * rotationSpeed * 0.15;
      venusAtmo.rotation.y += 0.0005 * rotationSpeed * 0.15;

      earth.rotation.y -= 0.002 * rotationSpeed * 0.15;
      cloudMesh.rotation.y += 0.0003 * rotationSpeed * 0.15;
      moon.rotation.y -= 0.002 * rotationSpeed * 0.15;

      mars.rotation.y -= 0.002 * rotationSpeed * 0.15;
      phobos.rotation.y -= 0.002 * rotationSpeed * 0.15;
      deimos.rotation.y -= 0.002 * rotationSpeed * 0.15;

      ceres.rotation.y -= 0.006 * rotationSpeed * 0.15;

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
      triton.rotation.y -= 0.001 * rotationSpeed * 0.15;

      eris.rotation.y -= 0.005 * rotationSpeed * 0.15;
      makemake.rotation.y -= 0.005 * rotationSpeed * 0.15;

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
        { distance: ceresDistance, angle: ceresAngle, object: ceres},
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
        { distance: neptuneDistance, angle: neptuneAngle, object: neptune },
        { distance: tritonDistance, angle: tritonAngle, object: triton },
        { distance: erisDistance, angle: erisAngle, object: eris },
        { distance: makemakeDistance, angle: makemakeAngle, object: makemake },
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
      ceresAngle += 0.000125 * rotationSpeed * 0.15;
      jupiterAngle += 0.0000625 * rotationSpeed * 0.15;
      saturnAngle += 0.00003125 * rotationSpeed * 0.15;
      uranusAngle += 0.000015625 * rotationSpeed * 0.15;
      neptuneAngle += 0.000015625 * rotationSpeed * 0.15;
      plutoAngle += 0.000015625 * rotationSpeed * 0.15;
      plutoRotation += 0.002 * rotationSpeed * 0.15;
      erisAngle += 0.000015625 * rotationSpeed * 0.15;
      makemakeAngle += 0.000015625 * rotationSpeed * 0.15;

      
      // Get the XRViewerPose
      const xrViewerPose = frame.getViewerPose(frameOfRef);

      // Get the XRView
      const xrView = xrViewerPose.views[0];

      // Get the pose of the XRView relative to the reference space
      const pose = xrView.transform;

      // Get the position and orientation
      const position = pose.position;
      const orientation = pose.orientation;

      // use leftEyeCamera, rightEyeCamera, and stereoCamera to render the scene
      leftEyeCamera.position.set(position.x, position.y, position.z);
      leftEyeCamera.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
      leftEyeCamera.updateMatrixWorld();

      rightEyeCamera.position.set(position.x, position.y, position.z);
      rightEyeCamera.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
      rightEyeCamera.updateMatrixWorld();


      // render the scene
      renderer.render(scene, leftEyeCamera);
      renderer.render(scene, rightEyeCamera);

    }
