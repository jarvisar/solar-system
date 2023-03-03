import GUI from "https://cdn.skypack.dev/lil-gui@0.18.0";
import { MathUtils, Clock } from "https://cdn.skypack.dev/three@0.149.0";
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/controls/OrbitControls'
import * as THREE from "https://cdn.skypack.dev/three@0.149.0";
import  { Perlin, FBM } from "https://cdn.skypack.dev/three-noise@1.1.2";
import * as CANNON from 'https://cdn.skypack.dev/cannon-es';

// set up world for physics
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // set gravity

// create new gui (closed by default)
const gui = new GUI()
gui.close()
const scene = new THREE.Scene()

// sphere controls
const sphereParameters = {
  radius: 4,
  widthSegments: 30,
  heightSegments: 15,
  phiStart: 0,
  phiLength: (Math.PI * 2),
  thetaStart: 0,
  thetaLength: Math.PI,
  color: '#b3b3b3'
}

// box controls
const boxParameters = {
    width: 4,
    height: 4,
    depth: 4,
    color: '#ff0000'  
}

// define sphere
let sphereGeometry = null
let sphereMaterial = null
let sphere = null

// defined box
let boxGeometry = null
let boxMaterial = null
let box = null

let light;
// Set up the light to cast shadows
light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 0);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500;
light.shadow.bias = 0.001;
scene.add(light);

// ambient light
const ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( ambientLight );

// Set up box as Cannon.js body
const boxShape = new CANNON.Box(new CANNON.Vec3(boxParameters.width / 2, boxParameters.height / 2, boxParameters.depth / 2));
const boxBody = new CANNON.Body({ mass: 1, shape: boxShape });
world.addBody(boxBody);

// Load earth texture for sphere
const earthTextureLoader = new THREE.TextureLoader();
const earthTexture = earthTextureLoader.load('./public/earth_daymap.jpg')

const generateSphere = () => {
    if (sphereGeometry != null && sphereMaterial != null){
        sphereGeometry.dispose() // Remove old sphere
        sphereMaterial.dispose()
        scene.remove(sphere)
    }

    let radius = sphereParameters.radius; // Load parameters from gui
    let widthSegments = sphereParameters.widthSegments;
    let heightSegments = sphereParameters.heightSegments;
    let phiStart = sphereParameters.phiStart;
    let phiLength = sphereParameters.phiLength;
    let thetaStart = sphereParameters.thetaStart;
    let thetaLength = sphereParameters.thetaLength;

    sphereGeometry = new THREE.SphereGeometry( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength );

    // Set up the sphere to receive shadows
    sphereMaterial = new THREE.MeshStandardMaterial({ color: sphereParameters.color, wireframe: false, map: earthTexture });
    sphereMaterial.roughness = 1;
    sphereMaterial.metalness = 0;
    sphereMaterial.receiveShadow = false;
    sphereMaterial.castShadow = true;

    const newSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    if(sphere != null){
        newSphere.position.copy(sphere.position); // set position to match old sphere
        newSphere.rotation.copy(sphere.rotation); // set rotation to match old sphere
    }

    // Use below code to avoid having new sphere's position
    scene.remove(sphere); // remove old sphere
    sphere = newSphere; // update sphere variable to point to new sphere
    scene.add(sphere); // add new sphere to scene
}


const generateBox = () => {
  if (boxGeometry != null && boxMaterial != null){
      boxGeometry.dispose()
      boxMaterial.dispose()
      scene.remove(box)
  }

  let width = boxParameters.width;
  let height = boxParameters.height;
  let depth = boxParameters.depth;

  boxGeometry = new THREE.BoxGeometry( width, height, depth );

  // Set up the sphere to receive shadows
  boxMaterial = new THREE.MeshStandardMaterial({ color: boxParameters.color });
  boxMaterial.roughness = 0.5;
  boxMaterial.metalness = 0.5;
  boxMaterial.receiveShadow = true;
  boxMaterial.castShadow = true;
  box = new THREE.Mesh(boxGeometry, boxMaterial);

  // Set the initial position and rotation of the box based on the rigid body in the Cannon.js world
  box.position.copy(boxBody.position);
  box.quaternion.copy(boxBody.quaternion);

  scene.add(box);
}

generateSphere()
generateBox()

box.position.y = -2;
sphere.position.y = 6;

// Set up the ground plane to cast shadows
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
groundMaterial.roughness = 1.0;
groundMaterial.metalness = 0.0;
groundMaterial.side = THREE.DoubleSide;
groundMaterial.receiveShadow = true;
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -5;
ground.receiveShadow = true;
scene.add(ground);

const sphereFolder = gui.addFolder('Sphere')
sphereFolder.add(sphereParameters, 'radius').min(1).max(10).step(1)
sphereFolder.add(sphereParameters, 'widthSegments').min(3).max(64).step(1)
sphereFolder.add(sphereParameters, 'heightSegments').min(2).max(32).step(1)
sphereFolder.add(sphereParameters, 'phiStart').min(0.0).max(Math.PI * 2.0).step(0.01)
sphereFolder.add(sphereParameters, 'phiLength').min(0.0).max(Math.PI * 2.0).step(0.01)
sphereFolder.add(sphereParameters, 'thetaStart').min(0).max(Math.PI * 2.0).step(0.01)
sphereFolder.add(sphereParameters, 'thetaLength').min(0).max(2).step(0.001)
sphereFolder.addColor(sphereParameters, 'color')
sphereFolder.add({ generate: () => generateSphere()}, 'generate')

sphereFolder.onFinishChange(() => generateSphere())

const boxFolder = gui.addFolder('Box')
boxFolder.add(boxParameters, 'width').min(1).max(10).step(1)
boxFolder.add(boxParameters, 'height').min(1).max(10).step(1)
boxFolder.add(boxParameters, 'depth').min(1).max(10).step(1)
boxFolder.addColor(boxParameters, 'color')
boxFolder.add({ generate: () => generateBox()}, 'generate')

boxFolder.onFinishChange(() => generateBox())

/**
 * Camera
 */

const camera = new THREE.PerspectiveCamera(75)
camera.position.z = 18
camera.position.y = 8
camera.near = 0.01
camera.far = 5000
scene.add(camera)

const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.render(scene, camera);


/**
* Config
*/
 camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  window.addEventListener('dblclick', () => {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  })

const clock = new Clock
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // Step the Cannon.js world forward in time
  world.step(1 / 60);

  // Update the positions and rotations of the objects in the scene based on their rigid bodies in the Cannon.js world
  sphere.position.copy(sphere.position);

  box.position.copy(boxBody.position);
  box.quaternion.copy(boxBody.quaternion);

  controls.update()
  renderer.render(scene, camera)

  window.requestAnimationFrame(tick)
}

window.onload = () => {
  tick()
}
let movement = { x: 0, y: 0, z: 0 };
let speed = 0.5;

function handleKeyDown(event) {
  if (event.key === 'w' || event.key === 'W') {
    movement.x = speed;
  }
  if (event.key === 'a' || event.key === 'A') {
    movement.z = -speed;
  }
  if (event.key === 's' || event.key === 'S') {
    movement.x = -speed;
  }
  if (event.key === 'd' || event.key === 'D') {
    movement.z = speed;
  }
  if (event.key === ' ') {
    movement.y = speed;
  }
  if (event.key === 'Shift') {
    movement.y = -speed;
  }
}

function handleKeyUp(event) {
  if (event.key === 'w' || event.key === 'W' || event.key === 's' || event.key === 'S') {
    movement.x = 0;
  }
  if (event.key === 'a' || event.key === 'A' || event.key === 'd' || event.key === 'D') {
    movement.z = 0;
  }
  if (event.key === ' ' || event.key === 'Shift') {
    movement.y = 0;
  }
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

function update() {
  sphere.position.x += movement.x;
  sphere.position.y += movement.y;
  sphere.position.z += movement.z;
  requestAnimationFrame(update);
}

requestAnimationFrame(update);