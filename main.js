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
camera.position.set(0, 0, 500);

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

// Create spheres for each planet and add them to the scene
const mercuryGeometry = new THREE.SphereGeometry(5, 32, 32);
const mercuryMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial);
mercury.castShadow = true;
mercury.receiveShadow = true;
mercury.position.set(70, 0, 70);
scene.add(mercury);

const venusGeometry = new THREE.SphereGeometry(10, 32, 32);
const venusMaterial = new THREE.MeshStandardMaterial({ color: 0xff8800 });
const venus = new THREE.Mesh(venusGeometry, venusMaterial);
venus.castShadow = true;
venus.receiveShadow = true;
venus.position.set(100, 0, 20);
scene.add(venus);

const earthGeometry = new THREE.SphereGeometry(10, 32, 32);
const earthMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.castShadow = true;
earth.receiveShadow = true;
earth.position.set(150, 0, 0);
scene.add(earth);

// Add orbit controls to let the user rotate the camera around the scene
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Render the scene
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

render();
