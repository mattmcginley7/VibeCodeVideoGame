import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// ===================
// 1) Basic Three.js Setup
// ===================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 5, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(light);

// ===================
// 2) Set Up Cannon.js World
// ===================
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
});

const defaultMaterial = new CANNON.Material('default');
world.defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.2,
        restitution: 0.1,
    }
);
world.defaultContactMaterial.contactEquationStiffness = 1e7;

// ===================
// 3) Ground Plane
// ===================
const groundShape = new CANNON.Plane();
const groundBody = new CANNON.Body({
    mass: 0,
    shape: groundShape,
    material: defaultMaterial,
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

const groundGeo = new THREE.PlaneGeometry(200, 200);
const groundMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

// =====================================
// 4) Player Car (Box with Lowered CoM)
// =====================================
const playerCarBody = new CANNON.Body({
    mass: 5,
    material: defaultMaterial,
    position: new CANNON.Vec3(0, 5, 0), // start above ground to fall
});

const carShape = new CANNON.Box(new CANNON.Vec3(1, 0.25, 2));
playerCarBody.addShape(carShape, new CANNON.Vec3(0, -0.25, 0));

playerCarBody.linearDamping = 0.2;
playerCarBody.angularDamping = 0.5;

// Rotate so that local -Z is "forward" (rotate 90° around Y)
playerCarBody.quaternion.setFromEuler(0, Math.PI / 2, 0);
world.addBody(playerCarBody);

const playerCarMesh = createCarMesh(0xff0000);
scene.add(playerCarMesh);

// ==========================
// 5) Enemy Car (for Testing)
// ==========================
const enemyCarBody = new CANNON.Body({
    mass: 5,
    material: defaultMaterial,
    position: new CANNON.Vec3(10, 5, 0),
});
enemyCarBody.addShape(carShape, new CANNON.Vec3(0, -0.25, 0));
enemyCarBody.linearDamping = 0.2;
enemyCarBody.angularDamping = 0.5;
world.addBody(enemyCarBody);

const enemyCarMesh = createCarMesh(0x0000ff);
scene.add(enemyCarMesh);

// ===================
// 6) Game Arena & Obstacles
// ===================

// Create boundary walls for a square arena
function createWall(x, y, z, width, height, depth, angleY = 0) {
    const wallShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const wallBody = new CANNON.Body({
        mass: 0,
        shape: wallShape,
        material: defaultMaterial,
    });
    wallBody.position.set(x, y, z);
    wallBody.quaternion.setFromEuler(0, angleY, 0);
    world.addBody(wallBody);

    const wallGeo = new THREE.BoxGeometry(width, height, depth);
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x555555 });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(x, y, z);
    wallMesh.quaternion.copy(wallBody.quaternion);
    scene.add(wallMesh);
}

// Create walls (arena boundaries)
createWall(-100, 5, 0, 1, 10, 200); // left wall
createWall(100, 5, 0, 1, 10, 200);  // right wall
createWall(0, 5, -100, 200, 10, 1); // back wall
createWall(0, 5, 100, 200, 10, 1);  // front wall

// Create a ramp obstacle
function createRamp(x, y, z, width, height, depth, angleX) {
    const rampShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const rampBody = new CANNON.Body({
        mass: 0,
        shape: rampShape,
        material: defaultMaterial,
    });
    rampBody.position.set(x, y, z);
    rampBody.quaternion.setFromEuler(angleX, 0, 0);
    world.addBody(rampBody);

    const rampGeo = new THREE.BoxGeometry(width, height, depth);
    const rampMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const rampMesh = new THREE.Mesh(rampGeo, rampMat);
    rampMesh.position.set(x, y, z);
    rampMesh.quaternion.copy(rampBody.quaternion);
    scene.add(rampMesh);
}

// Place a ramp near the back of the arena
createRamp(0, 1, -70, 20, 2, 40, -Math.PI / 8);

// ===================
// 7) Keyboard Input
// ===================
const keys = { w: false, s: false, a: false, d: false };

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
});

// ===================
// 8) Arcade-Style Movement Settings
// ===================
const desiredSpeed = 5; // desired car speed (units per second)
const turnSpeed = 2.0;  // angular velocity for turning
// 9) Chase Camera Settings
// ===================
// Define a local offset for the camera relative to the car (e.g. 3 units above and 8 units behind)
const chaseOffset = new THREE.Vector3(0, 3, -8);

// ===================
// 9) Animation Loop
// ===================
function animate() {
    // Lock pitch & roll during driving input
    if (keys.w || keys.s || keys.a || keys.d) {
        playerCarBody.angularFactor.set(0, 1, 0);
    } else {
        playerCarBody.angularFactor.set(1, 1, 1);
    }

    // Arcade-style movement: set horizontal velocity directly based on input
    if (keys.w) {
        const forward = new CANNON.Vec3(0, 0, -1);
        playerCarBody.quaternion.vmult(forward, forward);
        playerCarBody.velocity.x = forward.x * desiredSpeed;
        playerCarBody.velocity.z = forward.z * desiredSpeed;
    } else if (keys.s) {
        const backward = new CANNON.Vec3(0, 0, 1);
        playerCarBody.quaternion.vmult(backward, backward);
        playerCarBody.velocity.x = backward.x * desiredSpeed;
        playerCarBody.velocity.z = backward.z * desiredSpeed;
    } else {
        playerCarBody.velocity.x *= 0.95;
        playerCarBody.velocity.z *= 0.95;
    }

    // Turning: set angular velocity around Y
    if (keys.a) {
        playerCarBody.angularVelocity.y = turnSpeed;
    } else if (keys.d) {
        playerCarBody.angularVelocity.y = -turnSpeed;
    } else {
        playerCarBody.angularVelocity.y = 0;
    }

    // Step the physics world
    world.step(1 / 60);

    // Sync Three.js meshes with Cannon bodies
    playerCarMesh.position.copy(playerCarBody.position);
    playerCarMesh.quaternion.copy(playerCarBody.quaternion);

    enemyCarMesh.position.copy(enemyCarBody.position);
    enemyCarMesh.quaternion.copy(enemyCarBody.quaternion);

    // ----- Chase Camera Logic -----
    // Compute the desired camera position by applying the car's rotation to chaseOffset
    // and adding the result to the car's position.
    const carPos = new THREE.Vector3().copy(playerCarMesh.position);
    const carQuat = new THREE.Quaternion().copy(playerCarMesh.quaternion);
    const offset = chaseOffset.clone().applyQuaternion(carQuat);
    const desiredCameraPos = carPos.clone().add(offset);

    // Smoothly interpolate the camera position toward desiredCameraPos
    camera.position.lerp(desiredCameraPos, 0.1);
    // Make the camera look at the car's position
    camera.lookAt(carPos);
    // ----- End Chase Camera Logic -----

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// ===========================
// Helper: Create Car Mesh
// ===========================
function createCarMesh(color) {
    const group = new THREE.Group();

    // Car body geometry (2 x 0.5 x 4)
    const bodyGeom = new THREE.BoxGeometry(2, 0.5, 4);
    const bodyMat = new THREE.MeshBasicMaterial({ color });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.position.y = 0.25;
    group.add(bodyMesh);

    // Wheels (simple cylinders)
    const wheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    function addWheel(x, z) {
        const w = new THREE.Mesh(wheelGeom, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(x, 0.1, z);
        group.add(w);
    }
    addWheel(-0.8, -1.5);
    addWheel(0.8, -1.5);
    addWheel(-0.8, 1.5);
    addWheel(0.8, 1.5);
    return group;
}
