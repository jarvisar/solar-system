import GUI from "https://cdn.skypack.dev/lil-gui@0.18.0";
import { MathUtils, Clock } from "https://cdn.skypack.dev/three@0.149.0";
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/controls/OrbitControls'
import { DragControls } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/controls/DragControls'
import * as THREE from "https://cdn.skypack.dev/three@0.149.0";
import  { Perlin, FBM } from "https://cdn.skypack.dev/three-noise@1.1.2";
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';

// Create a Three.js scene
const scene = new THREE.Scene();

// Create a camera and position it so it's looking at the scene center
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(250, 250, 500);

const mercuryDistance = 150;
const venusDistance = 200;
const earthDistance = 300;
const moonDistance = 50;
const marsDistance = 400;


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

// Create a sphere for the Sun and add it to the scene as a light source
const sunLight = new THREE.PointLight(0xffffff, 1, 100000);
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 1000;
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true;
scene.add(sunLight);

const sunGeometry = new THREE.SphereGeometry(50, 32, 32);
const sunMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_sun.jpg'), emissive: 0xffff00, emissiveIntensity: 1, emissiveMap: new THREE.TextureLoader().load('public/2k_sun.jpg') });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.set(0, 0, 0);
scene.add(sunMesh);


// mercury
const mercuryGeometry = new THREE.SphereGeometry(5, 32, 32);
const mercuryMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_mercury.jpg') });
const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
mercury.castShadow = true;
mercury.receiveShadow = true;
mercury.position.set(mercuryDistance, 0, 0);
scene.add(mercury);

// mercury orbit
const mercuryOrbitGeometry = new THREE.RingGeometry(mercuryDistance - .15, mercuryDistance + .15, 256);
const mercuryOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true, side: THREE.DoubleSide });
const mercuryOrbit = new THREE.Mesh(mercuryOrbitGeometry, mercuryOrbitMaterial);
mercuryOrbit.rotation.x = Math.PI / 2;
scene.add(mercuryOrbit);

//venus
const venusGeometry = new THREE.SphereGeometry(10, 32, 32);
const venusMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_venus_atmosphere.jpg') });
const venus = new THREE.Mesh(venusGeometry, venusMaterial);
venus.castShadow = true;
venus.receiveShadow = true;
venus.position.set(-venusDistance, 0, 0);
scene.add(venus);

// venus orbit
const venusOrbitGeometry = new THREE.RingGeometry(venusDistance - .15, venusDistance + .15, 256);
const venusOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true, side: THREE.DoubleSide });
const venusOrbit = new THREE.Mesh(venusOrbitGeometry, venusOrbitMaterial);
venusOrbit.rotation.x = Math.PI / 2;
scene.add(venusOrbit);

// earth
const earthGeometry = new THREE.SphereGeometry(10, 32, 32);
const earthMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_earth.jpg') });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.castShadow = true;
earth.receiveShadow = true;
earth.position.set(0, 0, earthDistance);
scene.add(earth);

// earth orbit
const earthOrbitGeometry = new THREE.RingGeometry(earthDistance - .15, earthDistance + .15, 256);
const earthOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true, side: THREE.DoubleSide });
const earthOrbit = new THREE.Mesh(earthOrbitGeometry, earthOrbitMaterial);
earthOrbit.rotation.x = Math.PI / 2;
scene.add(earthOrbit);

//moon
const moonGeometry = new THREE.SphereGeometry(2, 32, 32);
const moonMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_moon.jpg') });
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.castShadow = true;
moon.receiveShadow = true;
moon.position.set(0, 0, moonDistance);
earth.add(moon);

// moon orbit
const moonOrbitGeometry = new THREE.RingGeometry(moonDistance - 0.1, moonDistance + 0.1, 256);
const moonOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true, side: THREE.DoubleSide });
const moonOrbit = new THREE.Mesh(moonOrbitGeometry, moonOrbitMaterial);
moonOrbit.rotation.x = Math.PI / 2;
earth.add(moonOrbit); // add moon orbit to the earth so that it orbits around the sun along with the earth


// mars
const marsGeometry = new THREE.SphereGeometry(5, 32, 32);
const marsMaterial = new THREE.MeshPhongMaterial({ map: new THREE.TextureLoader().load('public/2k_mars.jpg') });
const mars = new THREE.Mesh(marsGeometry, marsMaterial);
mars.castShadow = true;
mars.receiveShadow = true;
mars.position.set(0, 0, marsDistance);
scene.add(mars);

// mars orbit
const marsOrbitGeometry = new THREE.RingGeometry(marsDistance - .15, marsDistance + .15, 256);
const marsOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true, side: THREE.DoubleSide });
const marsOrbit = new THREE.Mesh(marsOrbitGeometry, marsOrbitMaterial);
marsOrbit.rotation.x = Math.PI / 2;
scene.add(marsOrbit);

// Add orbit controls to let the user rotate the camera around the scene
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// seperate angle for each planet
let mercuryAngle = 0;
// venus is haflway
let venusAngle = Math.PI;
// earth is 3/4
let earthAngle = Math.PI * 1.5;
let moonAngle = 0;
// mars is 1/4
let marsAngle = Math.PI * 0.5;


let focusedPlanet = null;
let cameraTarget = new THREE.Vector3();
let lerpSpeed = 0.05; // Adjust this value to control the speed of the animation

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
  
  // Increase the angle for the next frame
  mercuryAngle += 0.00075;
  venusAngle += 0.0005;
  earthAngle += 0.00025;
  marsAngle += 0.000125;
  moonAngle += 0.0025; // or any other value that gives you the desired speed of the moon orbiting the earth

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
    if (focusedPlanet == moon) {
      controls.target = new THREE.Vector3(earth.position.x, earth.position.y, earth.position.z);
    } else {
      controls.target = focusedPlanet.position;
    }
    camera.position.copy(controls.object.position);
    camera.rotation.copy(controls.object.rotation);
  }
  // Update the camera position
  updateCameraPosition();

  // Update the controls and render the scene
  controls.update();
  renderer.render(scene, camera);
}

const keyboardState = {
  w: false,
  a: false,
  s: false,
  d: false,
  space: false,
  shift: false,
};

function updateCameraPosition() {
  const speed = 10;
  if (keyboardState.w) {
    camera.position.z -= speed;
  }
  if (keyboardState.a) {
    camera.position.x -= speed;
  }
  if (keyboardState.s) {
    camera.position.z += speed;
  }
  if (keyboardState.d) {
    camera.position.x += speed;
  }
  if (keyboardState.space) {
    console.log('space')
    camera.position.y += speed;
  }
  if (keyboardState.shift) {
    camera.position.y -= speed;
  }
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (keyboardState.hasOwnProperty(key)) {
    keyboardState[key] = true;
  }
});

document.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (keyboardState.hasOwnProperty(key)) {
    keyboardState[key] = false;
  }
});

renderer.domElement.addEventListener('click', function(event) {
  // Calculate mouse position in normalized device coordinates
  const mouse = new THREE.Vector2();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  // Raycast from camera to mouse position
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera( mouse, camera );
  const intersects = raycaster.intersectObjects( scene.children );

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
      focusedPlanet = moon;
    }
  }
});


render();
