import GUI from "https://cdn.skypack.dev/lil-gui@0.18.0";
import { MathUtils, Clock } from "https://cdn.skypack.dev/three@0.149.0";
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/controls/OrbitControls'
import * as THREE from "https://cdn.skypack.dev/three@0.149.0";
import  { Perlin, FBM } from "https://cdn.skypack.dev/three-noise@1.1.2";

const gui = new GUI()
gui.close()
const scene = new THREE.Scene()

/**
 * Galaxy
 */

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

const boxParameters = {
    width: 4,
    height: 4,
    depth: 4,
    color: '#ff0000'  
}

let sphereGeometry = null
let sphereMaterial = null
let sphere = null

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

const ambientLight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( ambientLight );

const earthTextureLoader = new THREE.TextureLoader();
const earthTexture = earthTextureLoader.load('./public/earth_daymap.jpg')

const generateSphere = () => {
    if (sphereGeometry != null && sphereMaterial != null){
        sphereGeometry.dispose()
        sphereMaterial.dispose()
        scene.remove(sphere)
    }

    let radius = sphereParameters.radius;
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
    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.y = 6;
    scene.add(sphere);

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
    box.position.y = -2;
    scene.add(box);

}

generateSphere()
generateBox()

// Set up the ground plane to cast shadows
const groundGeometry = new THREE.PlaneGeometry(200, 200);
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

  sphere.rotation.y = elapsedTime * 0.2

  box.rotation.y = -(elapsedTime * 0.2)

  controls.update()
  renderer.render(scene, camera)

  window.requestAnimationFrame(tick)

}

window.onload = () => {
  tick()
}
let movement = { x: 0, y: 0, z: 0 };
let speed = 0.1;

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