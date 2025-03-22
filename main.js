import * as THREE from 'three';

// 1. Create Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Create Ground Plane
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// 3. Create Car as a Group
const car = new THREE.Group();

// Car body
const carBodyGeometry = new THREE.BoxGeometry(2, 0.5, 4);
const carBodyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
carBody.position.y = 0.5;
car.add(carBody);

// Wheels
const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

function createWheel(x, z) {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.4, z);
    car.add(wheel);
}

createWheel(-0.8, -1.5);
createWheel(0.8, -1.5);
createWheel(-0.8, 1.5);
createWheel(0.8, 1.5);

scene.add(car);

// 4. Position Camera
camera.position.set(0, 10, 15);
camera.lookAt(0, 0, 0);

// 5. Keyboard Tracking
const keys = { w: false, a: false, s: false, d: false };

document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

// 6. Movement Settings
const speed = 0.2;
const rotationSpeed = 0.04;

// 7. Animation Loop
function animate() {
    // Move forward/backward
    if (keys.w) {
        car.position.x -= Math.sin(car.rotation.y) * speed;
        car.position.z -= Math.cos(car.rotation.y) * speed;
    }
    if (keys.s) {
        car.position.x += Math.sin(car.rotation.y) * speed;
        car.position.z += Math.cos(car.rotation.y) * speed;
    }

    // Turn left/right
    if (keys.a) {
        car.rotation.y += rotationSpeed;
    }
    if (keys.d) {
        car.rotation.y -= rotationSpeed;
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
