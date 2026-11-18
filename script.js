// Configuración de la escena, cámara y renderizador
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03030c, 0.002);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Grupo principal para rotación interactiva
const mainGroup = new THREE.Group();
scene.add(mainGroup);

// 1. Creación de la Galaxia de partículas en espiral
const particleCount = 1500;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const colorInside = new THREE.Color('#ff3399');
const colorOutside = new THREE.Color('#66b3ff');

for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = Math.random() * 35;
    const spinAngle = radius * 0.5;
    const branchAngle = ((i % 3) * Math.PI * 2) / 3;

    const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 3;
    const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 3;
    const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 3;

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    // Gradiente de color en la galaxia
    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, radius / 35);

    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// Crear textura circular suave para las partículas
const canvasTex = document.createElement('canvas');
canvasTex.width = 64;
canvasTex.height = 64;
const ctx = canvasTex.getContext('2d');
const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
gradient.addColorStop(0, 'rgba(255,255,255,1)');
gradient.addColorStop(0.5, 'rgba(255,100,150,0.5)');
gradient.addColorStop(1, 'rgba(0,0,0,0)');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 64, 64);

const particleTexture = new THREE.CanvasTexture(canvasTex);

const material = new THREE.PointsMaterial({
    size: 0.8,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    map: particleTexture,
    transparent: true
});

const galaxyParticles = new THREE.Points(geometry, material);
mainGroup.add(galaxyParticles);

// 2. Creación del Corazón 3D Central
const heartShape = new THREE.Shape();
heartShape.moveTo(25, 25);
heartShape.bezierCurveTo(25, 25, 20, 0, 0, 0);
heartShape.bezierCurveTo(-30, 0, -30, 35, -30, 35);
heartShape.bezierCurveTo(-30, 55, -10, 77, 25, 95);
heartShape.bezierCurveTo(60, 77, 80, 55, 80, 35);
heartShape.bezierCurveTo(80, 35, 80, 0, 50, 0);
heartShape.bezierCurveTo(30, 0, 25, 25, 25, 25);

const extrudeSettings = {
    depth: 8,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 2,
    bevelSize: 4,
    bevelThickness: 4
};

const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
heartGeo.center();

const heartMat = new THREE.MeshStandardMaterial({
    color: 0xff1493,
    roughness: 0.3,
    metalness: 0.8,
    emissive: 0xff0055,
    emissiveIntensity: 0.5
});

const heartMesh = new THREE.Mesh(heartGeo, heartMat);
heartMesh.scale.set(0.12, 0.12, 0.12);
heartMesh.rotation.x = Math.PI; // Invertir para que la punta quede abajo
mainGroup.add(heartMesh);

// Luz para resaltar el corazón
const pointLight = new THREE.PointLight(0xff69b4, 3, 50);
pointLight.position.set(0, 0, 5);
scene.add(pointLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// 3. Frases flotantes orbitando
const phrases = [
    "Te amo Nahiara",
    "Eres mi universos",
    "Siempre tú",
    "Mi lugar favorito",
    "Amor eterno"
];

const spriteGroup = new THREE.Group();
mainGroup.add(spriteGroup);

phrases.forEach((text, index) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'Bold 36px Arial';
    const metrics = context.measureText(text);
    canvas.width = metrics.width + 20;
    canvas.height = 60;

    // Redibujar con fuentes limpias
    context.font = 'Bold 36px Arial';
    context.fillStyle = '#ffc0cb';
    context.shadowColor = '#ff1493';
    context.shadowBlur = 10;
    context.fillText(text, 10, 45);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);

    const angle = (index / phrases.length) * Math.PI * 2;
    const radius = 18;
    sprite.position.x = Math.cos(angle) * radius;
    sprite.position.z = Math.sin(angle) * radius;
    sprite.position.y = (Math.random() - 0.5) * 6;
    sprite.scale.set(6, 3, 1);

    spriteGroup.add(sprite);
});

// Control interactivo con mouse y táctil (sin botones)
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let targetRotationX = 0;
let targetRotationY = 0;

window.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    targetRotationY += deltaX * 0.005;
    targetRotationX += deltaY * 0.005;

    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => { isDragging = false; });

// Soporte táctil para celulares
window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
});

window.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - previousMousePosition.x;
    const deltaY = e.touches[0].clientY - previousMousePosition.y;

    targetRotationY += deltaX * 0.005;
    targetRotationX += deltaY * 0.005;

    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});

window.addEventListener('touchend', () => { isDragging = false; });

// Animación fluida (Bucle principal)
let clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Rotación suave inercial o automática
    galaxyParticles.rotation.y = elapsedTime * 0.05;
    spriteGroup.rotation.y = elapsedTime * -0.03;

    // Latido del corazón
    const scaleFactor = 0.12 + Math.sin(elapsedTime * 4) * 0.015;
    heartMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Aplicar rotación por arrastre de usuario con suavizado (lerp)
    mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.05;
    mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.05;

    // Si no se arrastra, rotar levemente solo
    if (!isDragging) {
        targetRotationY += 0.001;
    }

    renderer.render(scene, camera);
}

animate();

// Ajuste automático al cambiar tamaño de ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});