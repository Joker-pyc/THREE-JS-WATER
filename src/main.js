console.log("hello world");

import * as THREE from '../build/three.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Initialize Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Create a cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Create a plane geometry for the water
const waterGeometry = new THREE.PlaneGeometry(10, 10, 16, 16);

// Define the vertex shader as a string
const vertexShader = `
    varying vec2 vUv;
    varying vec3 vPos;

    void main() {
        vUv = uv;
        vPos = position.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Define the fragment shader as a string
const fragmentShader = `
    uniform float time;
    uniform vec2 resolution;
    varying vec2 vUv;
    varying vec3 vPos;
    uniform sampler2D reflectionTexture;
    uniform sampler2D refractionTexture;
    uniform sampler2D normalMap;

    float fresnel(vec3 I, vec3 N, float F0) {
      return F0 + (1.0 - F0) * pow(1.0 - dot(I, N), 5.0);
    }

    void main() {
        float waveHeight = 0.2 * sin(vPos.x * 10.0 + time) * sin(vPos.y * 10.0 + time);
        vec2 reflectionCoords = vUv + vec2(0.0, waveHeight * 0.2);

        // Calculate Fresnel
        float fresnelTerm = fresnel(normalize(vPos - cameraPosition), normalize(vPos), 0.8);
        
        // Apply Fresnel to the reflection and refraction
        vec3 reflectedColor = texture2D(reflectionTexture, reflectionCoords).rgb;
        vec3 refractedColor = texture2D(refractionTexture, vUv).rgb;
        vec3 finalColor = mix(refractedColor, reflectedColor, fresnelTerm);

        // Apply normal mapping
        vec3 normal = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
        normal = normalize(normal);

        // Add distortion to the water based on the normal map
        vec3 distortedPos = vPos + normal * waveHeight * 0.1;

        vec3 waterColor = vec3(0.0, 0.4, 0.8);
        vec3 finalNormal = normalize(vec3(normal.x, normal.y, 1.0)); // Ensure the normal points upward
        float lighting = max(dot(finalNormal, normalize(vec3(0.0, 1.0, 0.5))), 0.0); // Simulate lighting
        vec3 finalColorWithLighting = finalColor * lighting;

        gl_FragColor = vec4(finalColorWithLighting, 1.0);
    }
`;

// Create shader material with embedded shaders
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    reflectionTexture: { value: null },
    refractionTexture: { value: null },
    normalMap: { value: null },
  },
});

// Create the water surface mesh
const waterSurface = new THREE.Mesh(waterGeometry, waterMaterial);
waterSurface.rotation.x = -Math.PI / 2;
scene.add(waterSurface);

// Position the camera
camera.position.z = 5;

// Load the reflection, refraction, and normal maps using THREE.TextureLoader
const textureLoader = new THREE.TextureLoader();
textureLoader.load('water.jpg', (reflectionTexture) => {
  waterMaterial.uniforms.reflectionTexture.value = reflectionTexture;
});

textureLoader.load('water.jpg', (refractionTexture) => {
  waterMaterial.uniforms.refractionTexture.value = refractionTexture;
});

textureLoader.load('water.jpg', (normalMap) => {
  waterMaterial.uniforms.normalMap.value = normalMap;
});

// Create an animation loop
const animate = () => {
  requestAnimationFrame(animate);

  waterMaterial.uniforms.time.value += 0.01;

  // Rotate the cube
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  // Move the water surface vertically (for a simple wave animation)
  waterSurface.position.y = Math.sin(waterMaterial.uniforms.time.value) * 0.1;

  // Render the scene
  renderer.render(scene, camera);
};

// Start the animation loop after the textures are loaded
animate();
