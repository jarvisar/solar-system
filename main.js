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
gui.open()
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

const light2 = new THREE.SpotLight()
light2.position.set(-2.5, 5, 5)
light2.angle = Math.PI / 4
light2.penumbra = 0.5
light2.castShadow = true
light2.shadow.mapSize.width = 1024
light2.shadow.mapSize.height = 1024
light2.shadow.camera.near = 0.5
light2.shadow.camera.far = 20
scene.add(light2)

const light3 = new THREE.DirectionalLight()
light3.position.set(1, 1, 0)
light3.angle = Math.PI / 4
light3.penumbra = 0.5
light3.castShadow = true
light3.shadow.mapSize.width = 1024
light3.shadow.mapSize.height = 1024
light3.shadow.camera.near = 0.5
light3.shadow.camera.far = 20
scene.add(light3)

const normalMaterial = new THREE.MeshNormalMaterial()

// ambient light
const ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( ambientLight );


const torusKnotGeometry = new THREE.TorusKnotGeometry()
const torusKnotMesh = new THREE.Mesh(torusKnotGeometry, normalMaterial)
torusKnotMesh.position.x = 4
torusKnotMesh.position.y = 3
torusKnotMesh.castShadow = true
torusKnotMesh.receiveShadow = true
scene.add(torusKnotMesh)
const torusKnotShape = CreateTrimesh(torusKnotMesh.geometry)
const torusKnotBody = new CANNON.Body({ mass: 1 })
torusKnotBody.addShape(torusKnotShape)
torusKnotBody.position.x = torusKnotMesh.position.x
torusKnotBody.position.y = torusKnotMesh.position.y
torusKnotBody.position.z = torusKnotMesh.position.z
world.addBody(torusKnotBody)

function CreateTrimesh(geometry) {
  const vertices = geometry.attributes.position.array
  const indices = Object.keys(vertices).map(Number)
  return new CANNON.Trimesh(vertices, indices)
}

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
    sphere.castShadow = true;
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
  box.castShadow = true;

  // Set the initial position and rotation of the box based on the rigid body in the Cannon.js world
  box.position.copy(boxBody.position);
  box.quaternion.copy(boxBody.quaternion);

  scene.add(box);
}

generateSphere()
generateBox()

box.position.y = 3;
sphere.position.y = 8;
const phongMaterial = new THREE.MeshPhongMaterial()
// Set up the ground plane to cast shadows
const planeGeometry = new THREE.PlaneGeometry(25, 25)
const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial)
planeMesh.rotateX(-Math.PI / 2)
planeMesh.position.y = -5;
planeMesh.receiveShadow = true
scene.add(planeMesh)
const planeShape = new CANNON.Plane()
const planeBody = new CANNON.Body({ mass: 0 })
planeBody.addShape(planeShape)
planeBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
planeBody.position.y = -5;
world.addBody(planeBody)

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
  sphere.rotation.y += 0.005;

  box.position.copy(boxBody.position);

  torusKnotMesh.position.set(
    torusKnotBody.position.x,
    torusKnotBody.position.y,
    torusKnotBody.position.z
)
torusKnotMesh.quaternion.set(
    torusKnotBody.quaternion.x,
    torusKnotBody.quaternion.y,
    torusKnotBody.quaternion.z,
    torusKnotBody.quaternion.w
)

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