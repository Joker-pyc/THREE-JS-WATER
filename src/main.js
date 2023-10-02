console.log("hello world");

import * as THREE from '../build/three.module.js';
import { OrbitControls } from '../jsm/controls/OrbitControls.js';



 // Initialize Three.js
 const scene = new THREE.Scene();
 scene.background =new THREE.Color(0x87ceeb);
 const camera = new THREE.PerspectiveCamera(
   75, // Field of view (FOV)
   window.innerWidth / window.innerHeight, // Aspect ratio
   0.1, // Near clipping plane
   1000 // Far clipping plane
 );

 const renderer = new THREE.WebGLRenderer({antilias:true});
 renderer.setSize(window.innerWidth, window.innerHeight);
 document.body.appendChild(renderer.domElement);

 const controls = new OrbitControls(camera, renderer.domElement);




 // Create a cube
 const geometry = new THREE.BoxGeometry();
 const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
 const cube = new THREE.Mesh(geometry, material);
 scene.add(cube);;

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
       precision mediump float;
       varying vec2 vUv;
       varying vec3 vPos;
       uniform float time;

       void main() {
           float waveHeight = 0.2 * sin(vPos.x * 10.0 + time) * sin(vPos.y * 10.0 + time);
           vec3 waterColor = vec3(0.0, 0.4, 0.8);
           vec3 finalPos = vPos + vec3(0.0, waveHeight, 0.0);
           vec3 finalColor = mix(waterColor, waterColor * 0.8, smoothstep(-0.2, 0.2, waveHeight));
           gl_FragColor = vec4(finalColor, 1.0);
       }
   `;

   // Create shader material with embedded shaders
   const waterMaterial = new THREE.ShaderMaterial({
       vertexShader: vertexShader,
       fragmentShader: fragmentShader,
       uniforms: {
           time: { value: 0 }, // Time uniform for animation
           resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }, // Screen resolution
       },
   });

   // Create the water surface mesh
   const waterSurface = new THREE.Mesh(waterGeometry, waterMaterial);
   scene.add(waterSurface);

 // Position the camera
 camera.position.z = 5;

 // Create an animation loop
 const animate = () => {
   requestAnimationFrame(animate);

   // Rotate the cube
   cube.rotation.x += 0.01;
   cube.rotation.y += 0.01;

   // Render the scene
   renderer.render(scene, camera);
 };

 // Start the animation loop
 animate();