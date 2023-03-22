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

var scale = 3;
var enableOrbits = true;
var flightSensitivity = 12;

// add gui controls
const gui = new GUI();
const guicontrols = {
  scale: 3,
  flightSensitivity: 12,
  enableOrbits: true,
};

gui.add(guicontrols, "scale", 0.1, 10, 0.1).onChange((value) => {
  scale = value;
}).name("System Scale");

// add control for flightSenstivity
gui.add(guicontrols, "flightSensitivity", 1, 20, 1).onChange((value) => {
  flightSensitivity = value;
  flyControls.rollSpeed = Math.PI / value;
}).name("Flight Sensitivity");

gui.add(guicontrols, "enableOrbits").onChange((value) => {
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
    scene.remove(moonOrbit);
    scene.remove(marsOrbit);
    scene.remove(jupiterOrbit);
    scene.remove(saturnOrbit);
    scene.remove(uranusOrbit);
    scene.remove(neptuneOrbit);
  }
}).name("Enable Orbits");

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
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

//define all meshes
var sunMesh;
var mercury;
var venus;
var earth;
var moon;
var mars;
var jupiter;
var saturn;
var uranus;
var neptune;

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

  mercuryDistance = 800 * scale;
  venusDistance = 1000 * scale;
  earthDistance = 1400 * scale;
  moonDistance = 200 * scale;
  marsDistance = 1800 * scale;
  jupiterDistance = 2600 * scale;
  saturnDistance = 3200 * scale;
  uranusDistance = 3800 * scale;
  neptuneDistance = 4400 * scale;

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
  const mercuryGeometry = new THREE.SphereGeometry(10 * scale, 128, 128);
  const mercuryMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_mercury.jpg') });
  mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
  mercury.castShadow = true;
  mercury.receiveShadow = true;
  mercury.position.set(mercuryDistance, 0, 0);
  scene.add(mercury);

  //venus
  const venusGeometry = new THREE.SphereGeometry(20 * scale, 128, 128);
  const venusMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_venus_atmosphere.jpg') });
  venus = new THREE.Mesh(venusGeometry, venusMaterial);
  venus.castShadow = true;
  venus.receiveShadow = true;
  venus.position.set(-venusDistance, 0, 0);
  scene.add(venus);

  // earth
  const earthGeometry = new THREE.SphereGeometry(20 * scale, 128, 128);
  const earthMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_earth.jpg') });
  earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.castShadow = true;
  earth.receiveShadow = true;
  earth.position.set(0, 0, earthDistance);
  scene.add(earth);

  //moon
  const moonGeometry = new THREE.SphereGeometry(4 * scale, 32, 32);
  const moonMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_moon.jpg') });
  moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.castShadow = true;
  moon.receiveShadow = true;
  moon.position.set(0, 0, moonDistance);
  earth.add(moon);

  // mars
  const marsGeometry = new THREE.SphereGeometry(14 * scale, 32, 32);
  const marsMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_mars.jpg') });
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
  const saturnRingGeometry = new THREE.RingGeometry(100 * scale, 170 * scale, 256);
  const saturnRingMaterial = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('public/2k_saturn_ring_alpha.png'), side: THREE.DoubleSide, transparent: true, repeat: 2 });
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

// load spaceship from UFO_Empty.glb but declare it outside callback so I can uypdate position from animate function
// spaceship from UFO_Empty.glb
const loader = new GLTFLoader();
const spaceship = new THREE.Object3D(); // create empty Object3D

loader.load('public/UFO_Empty_2.glb', function (gltf) {
  // use the loaded model to replace the empty Object3D
  const model = gltf.scene.children[0];
  model.scale.set(18.1, 18.1, 18.1);
  model.position.set(0, -200, 0);
  model.rotation.set(0, 0, 0);
  spaceship.add(model);
});

// add the spaceship to the scene outside of the callback function
scene.add(spaceship);

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
  scene.remove(earth);
  scene.remove(moon);
  scene.remove(mars);
  scene.remove(jupiter);
  scene.remove(saturn);
  scene.remove(uranus);
  scene.remove(neptune);
  scene.remove(sunMesh);

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
  console.log(enableOrbits)
  if (enableOrbits) {
    createOrbits();
  }
}

// add regenerate button to gui
gui.add({ regenerate }, 'regenerate');

function render() {
  requestAnimationFrame(render);
  
  // rotate sun in place
  sunMesh.rotation.y -= 0.0005;
  // rotate all planets in place
  mercury.rotation.y -= 0.002;
  venus.rotation.y -= 0.002;
  earth.rotation.y -= 0.002;
  moon.rotation.y -= 0.002;
  mars.rotation.y -= 0.002;
  jupiter.rotation.y -= 0.001;
  saturn.rotation.y -= 0.001;
  uranus.rotation.y -= 0.001;
  neptune.rotation.y -= 0.001;
  spaceship.rotation.y += 0.001;

  // Update the position of mercury based on its distance from the center and current angle
  const mercuryX = mercuryDistance * Math.cos(mercuryAngle);
  const mercuryZ = mercuryDistance * Math.sin(mercuryAngle);
  mercury.position.set(mercuryX, 0, mercuryZ);

  // Update the position of venus based on its distance from the center and current angle
  const venusX = venusDistance * Math.cos(venusAngle);
  const venusZ = venusDistance * Math.sin(venusAngle);
  venus.position.set(venusX, 0, venusZ);

  // Update the position of earth based on its distance from the center and current angle
  const earthX = earthDistance * Math.cos(earthAngle);
  const earthZ = earthDistance * Math.sin(earthAngle);
  earth.position.set(earthX, 0, earthZ);

  // Update the position of the moon based on the position of the earth
  const moonX = moonDistance * Math.cos(moonAngle);
  const moonZ = moonDistance * Math.sin(moonAngle);
  moon.position.set(moonX, 0, moonZ);

  // Update the position of mars based on its distance from the center and current angle
  const marsX = marsDistance * Math.cos(marsAngle);
  const marsZ = marsDistance * Math.sin(marsAngle);
  mars.position.set(marsX, 0, marsZ);

  // Update the position of jupiter based on its distance from the center and current angle
  const jupiterX = jupiterDistance * Math.cos(jupiterAngle);
  const jupiterZ = jupiterDistance * Math.sin(jupiterAngle);
  jupiter.position.set(jupiterX, 0, jupiterZ);

  // Update the position of saturn based on its distance from the center and current angle
  const saturnX = saturnDistance * Math.cos(saturnAngle);
  const saturnZ = saturnDistance * Math.sin(saturnAngle);
  saturn.position.set(saturnX, 0, saturnZ);

  // Update the position of uranus based on its distance from the center and current angle
  const uranusX = uranusDistance * Math.cos(uranusAngle);
  const uranusZ = uranusDistance * Math.sin(uranusAngle);
  uranus.position.set(uranusX, 0, uranusZ);

  // Update the position of neptune based on its distance from the center and current angle
  const neptuneX = neptuneDistance * Math.cos(neptuneAngle);
  const neptuneZ = neptuneDistance * Math.sin(neptuneAngle);
  neptune.position.set(neptuneX, 0, neptuneZ);
  
  // Increase the angle for the next frame
  mercuryAngle += 0.00025;
  venusAngle += 0.00025;
  earthAngle += 0.0001;
  marsAngle += 0.000125;
  moonAngle += 0.001;
  jupiterAngle += 0.0000625;
  saturnAngle += 0.00003125;
  uranusAngle += 0.000015625;
  neptuneAngle += 0.000015625;

  if (focusedPlanet) {
    // Update the camera target to the position of the focused planet
    // if moon, add moon position to earth position
    if (focusedPlanet === moon) {
      cameraTarget.x = earth.position.x + 100;
      cameraTarget.y = earth.position.y + 100;
      cameraTarget.z = earth.position.z + 100;
    } else {
      cameraTarget.x = focusedPlanet.position.x + 100;
      cameraTarget.y = focusedPlanet.position.y + 100;
      cameraTarget.z = focusedPlanet.position.z + 100;
    }
    // Lerp the camera position to the camera target

    // Update the controls target to the position of the focused planet
    if (focusedPlanet == spaceship) {
      controls.enabled = false;
      flyControls.enabled = true;
      document.body.style.cursor = 'crosshair';
      // increase fov when flying
      camera.fov = 75
    } else {
      controls.enabled = true;
      flyControls.enabled = false;
      document.body.style.cursor = 'default';
      // decrease fov when not flying
      camera.fov = 45
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
    spaceship.position.y = sunMesh.position.y + 200;
    spaceship.position.z = sunMesh.position.z;
  } else {
    controls.update(clock.getDelta()); // update position using orbit controls
  }
  renderer.render(scene, camera);
}
const clock = new THREE.Clock();

function lerp(start, end, alpha) {
  return (1 - alpha) * start + alpha * end;
}

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
      if (intersects[0].object == earth) {
        console.log('earth')
        focusedPlanet = earth;
      } else if (intersects[0].object == venus) {
        console.log('venus')
        focusedPlanet = venus;
      } else if (intersects[0].object == mercury) {
        console.log('mercury')
        focusedPlanet = mercury;
      } else if (intersects[0].object == sunMesh) {
        console.log('sun')
        focusedPlanet = sunMesh;
      } else if (intersects[0].object == mars) {
        console.log('mars')
        focusedPlanet = mars;
      } else if (intersects[0].object == moon) {
        console.log('moon')
        focusedPlanet = earth;
      } else if (intersects[0].object == jupiter) {
        console.log('jupiter')
        focusedPlanet = jupiter;
      } else if (intersects[0].object == saturn) {
        console.log('saturn')
        focusedPlanet = saturn;
      } else if (intersects[0].object == uranus) {
        console.log(intersects[0].object)
        console.log('uranus')
        focusedPlanet = uranus;
      } else if (intersects[0].object == neptune) {
        console.log('neptune')
        focusedPlanet = neptune;
      } else if (intersects[0].object.name.includes("Ufo")) {
        console.log('spaceship')
        camera.position.copy(spaceship.position);
        focusedPlanet = spaceship;
      }
    }
});

// if escape key is pressed, change focused planet to null
document.addEventListener('keydown', function(event) {
  if (event.code === 'Escape') {
    focusedPlanet = sunMesh;
    flyControls.enabled = false;
    flyControls.
    controls.enabled = true;
  }
});


render();

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

