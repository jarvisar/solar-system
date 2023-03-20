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
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.position.set(0, 0, 0);
scene.add(sunMesh);

// mercury
const mercuryGeometry = new THREE.SphereGeometry(5, 32, 32);
const mercuryMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
mercury.castShadow = true;
mercury.receiveShadow = true;
mercury.position.set(mercuryDistance, 0, 0);
scene.add(mercury);

// mercury orbit
const mercuryOrbitGeometry = new THREE.RingGeometry(mercuryDistance - .25, mercuryDistance + .25, 128);
const mercuryOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true, side: THREE.DoubleSide });
const mercuryOrbit = new THREE.Mesh(mercuryOrbitGeometry, mercuryOrbitMaterial);
mercuryOrbit.rotation.x = Math.PI / 2;
scene.add(mercuryOrbit);

//venus
const venusGeometry = new THREE.SphereGeometry(10, 32, 32);
const venusMaterial = new THREE.MeshStandardMaterial({ color: 0xff8800 });
const venus = new THREE.Mesh(venusGeometry, venusMaterial);
venus.castShadow = true;
venus.receiveShadow = true;
venus.position.set(-venusDistance, 0, 0);
scene.add(venus);

// venus orbit
const venusOrbitGeometry = new THREE.RingGeometry(venusDistance - .25, venusDistance + .25, 128);
const venusOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true, side: THREE.DoubleSide });
const venusOrbit = new THREE.Mesh(venusOrbitGeometry, venusOrbitMaterial);
venusOrbit.rotation.x = Math.PI / 2;
scene.add(venusOrbit);

// earth
const earthGeometry = new THREE.SphereGeometry(10, 32, 32);
const earthMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.castShadow = true;
earth.receiveShadow = true;
earth.position.set(0, 0, earthDistance);
scene.add(earth);

// earth orbit
const earthOrbitGeometry = new THREE.RingGeometry(earthDistance - .25, earthDistance + .25, 128);
const earthOrbitMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.2, transparent: true, side: THREE.DoubleSide });
const earthOrbit = new THREE.Mesh(earthOrbitGeometry, earthOrbitMaterial);
earthOrbit.rotation.x = Math.PI / 2;
scene.add(earthOrbit);

// Add orbit controls to let the user rotate the camera around the scene
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// seperate angle for each planet
let mercuryAngle = 0;
// venus is haflway
let venusAngle = Math.PI;
// earth is 3/4
let earthAngle = Math.PI * 1.5;

let focusedPlanet = undefined
function render() {
  requestAnimationFrame(render);
  
  // rotate sun in place
  sunMesh.rotation.y -= 0.0005;

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
  
  // Increase the angle for the next frame
  mercuryAngle += 0.0015;
  venusAngle += 0.001;
  earthAngle += 0.0005;


  // Update the camera's target position to the currently focused planet
  const cameraTarget = new THREE.Vector3();
  if (focusedPlanet == undefined) {
    cameraTarget.set(0, 0, 0);
  } else if (focusedPlanet == 'mercury') {
    cameraTarget.copy(mercury.position);
  } else if (focusedPlanet == 'venus') {
    cameraTarget.copy(venus.position);
  } else if (focusedPlanet == 'earth') {
    cameraTarget.copy(earth.position);
  } else if (focusedPlanet == 'sun') {
    cameraTarget.copy(sunMesh.position);
  }

  new TWEEN.Tween(controls.target)
    .to(cameraTarget, 10)
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();

  // Update the controls and render the scene
  controls.update();
  renderer.render(scene, camera);

  // Update the TWEEN library
  TWEEN.update();
}

renderer.domElement.addEventListener('click', function(event) {
  // Calculate mouse position in normalized device coordinates
  const mouse = new THREE.Vector2();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  // Raycast from camera to mouse position
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera( mouse, camera );
  const intersects = raycaster.intersectObjects( scene.children );

  // If the Earth was clicked, log a message to the console
  if ( intersects.length > 0 && intersects[0].object === earth ) {
    console.log('Earth clicked!');
    focusedPlanet = 'earth'
  } else if(intersects.length > 0 && intersects[0].object === venus) {
    console.log('Venus clicked!');
    focusedPlanet = 'venus'
  } else if(intersects.length > 0 && intersects[0].object === mercury) {
    console.log('Mercury clicked!');
    focusedPlanet = 'mercury'
  } else if(intersects.length > 0 && intersects[0].object === sunMesh) {
    console.log('Sun clicked!');
    focusedPlanet = 'sun'
  }
});


render();
