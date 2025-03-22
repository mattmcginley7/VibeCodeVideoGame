import * as THREE from 'three';

// ===== Scene, Camera, Renderer =====
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

// ===== Ground Plane =====
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ===== Create Two Cars =====
const car1 = createCar(0, 0, 0xff0000);  // Player-controlled car
const car2 = createCar(10, 0, 0x0000ff); // Static car (blue)

scene.add(car1);
scene.add(car2);

// Position camera so we can see both cars
camera.position.set(0, 10, 20);
camera.lookAt(0, 0, 0);

// ===== Keyboard Input =====
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (key in keys) {
        keys[key] = true;
    }
});

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key in keys) {
        keys[key] = false;
    }
});

// Movement settings
const speed = 0.2;
const rotationSpeed = 0.04;

// ===== Animation Loop =====
function animate() {
    // Move car1 based on input
    if (keys.w) {
        car1.position.x -= Math.sin(car1.rotation.y) * speed;
        car1.position.z -= Math.cos(car1.rotation.y) * speed;
    }
    if (keys.s) {
        car1.position.x += Math.sin(car1.rotation.y) * speed;
        car1.position.z += Math.cos(car1.rotation.y) * speed;
    }
    if (keys.a) {
        car1.rotation.y += rotationSpeed;
    }
    if (keys.d) {
        car1.rotation.y -= rotationSpeed;
    }

    // ===== Simple Bounding Box Collision Check =====
    // 1. Update each car's bounding box
    const car1Box = new THREE.Box3().setFromObject(car1);
    const car2Box = new THREE.Box3().setFromObject(car2);

    // 2. Check if the boxes intersect
    if (car1Box.intersectsBox(car2Box)) {
        console.log("Collision detected!");

        // Example: push car1 back a bit
        // We'll reverse the movement we just did by 1 step
        if (keys.w) {
            car1.position.x += Math.sin(car1.rotation.y) * speed;
            car1.position.z += Math.cos(car1.rotation.y) * speed;
        }
        if (keys.s) {
            car1.position.x -= Math.sin(car1.rotation.y) * speed;
            car1.position.z -= Math.cos(car1.rotation.y) * speed;
        }
    }

    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

// ===== Helper: Create a Simple Car as a Group =====
function createCar(x, z, color) {
    const carGroup = new THREE.Group();

    // Car body
    const bodyGeom = new THREE.BoxGeometry(2, 0.5, 4);
    const bodyMat = new THREE.MeshBasicMaterial({ color });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = 0.5;
    carGroup.add(body);

    // Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    function addWheel(offsetX, offsetZ) {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(offsetX, 0.4, offsetZ);
        carGroup.add(wheel);
    }
    addWheel(-0.8, -1.5);
    addWheel(0.8, -1.5);
    addWheel(-0.8, 1.5);
    addWheel(0.8, 1.5);

    // Set initial position
    carGroup.position.set(x, 0, z);
    return carGroup;
}
