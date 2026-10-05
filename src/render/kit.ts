import * as THREE from 'three';
import { CAMERA, LIGHTS, NEON_SURFACE, RENDERER, STRIP, SURFACE, type RGB } from '../config/render.ts';

/* Velocity's visual kit: the Impact night-city look, rebuilt for Velocity. */

export function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, RENDERER.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = RENDERER.exposure;
  container.appendChild(renderer.domElement);
  return renderer;
}

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(RENDERER.background);
  scene.fog = new THREE.Fog(RENDERER.fogColor, RENDERER.fogNear, RENDERER.fogFar);
  addLighting(scene);
  return scene;
}

export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(CAMERA.fov, window.innerWidth / window.innerHeight, CAMERA.near, CAMERA.far);
  camera.rotation.order = 'YXZ';
  return camera;
}

export function fitToWindow(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera): void {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function addLighting(scene: THREE.Scene): void {
  scene.add(new THREE.AmbientLight(LIGHTS.ambient.color, LIGHTS.ambient.intensity));
  const h = LIGHTS.hemisphere;
  scene.add(new THREE.HemisphereLight(h.sky, h.ground, h.intensity));
  const m = LIGHTS.moon;
  const moon = new THREE.DirectionalLight(m.color, m.intensity);
  moon.position.set(...m.position);
  moon.castShadow = true;
  moon.shadow.mapSize.set(m.shadowMapSize, m.shadowMapSize);
  moon.shadow.camera.left = -m.shadowExtent;
  moon.shadow.camera.right = m.shadowExtent;
  moon.shadow.camera.top = m.shadowExtent;
  moon.shadow.camera.bottom = -m.shadowExtent;
  moon.shadow.camera.near = m.shadowNear;
  moon.shadow.camera.far = m.shadowFar;
  moon.shadow.bias = m.shadowBias;
  scene.add(moon);
}

export function surfaceMaterial(shade: RGB): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(...shade),
    roughness: SURFACE.roughness,
    metalness: SURFACE.metalness,
  });
}

export function neonMaterial(color: RGB, intensity: number = NEON_SURFACE.intensity): THREE.MeshStandardMaterial {
  const k = NEON_SURFACE.baseScale;
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color[0] * k, color[1] * k, color[2] * k),
    emissive: new THREE.Color(...color),
    emissiveIntensity: intensity,
    roughness: NEON_SURFACE.roughness,
    metalness: 0,
  });
}

/* A shadowed box with an optional neon strip along each long top edge. */
export function greyboxBlock(
  center: readonly [number, number, number],
  size: readonly [number, number, number],
  shade: RGB,
  trim?: RGB,
): THREE.Group {
  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(...size), surfaceMaterial(shade));
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);
  if (trim) {
    const [w, h, d] = size;
    const alongX = w >= d;
    const stripSize: [number, number, number] = alongX ? [w, STRIP.thickness, STRIP.width] : [STRIP.width, STRIP.thickness, d];
    const material = neonMaterial(trim);
    for (const side of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(...stripSize), material);
      const offset = side * ((alongX ? d : w) / 2 - STRIP.width / 2);
      strip.position.set(alongX ? 0 : offset, h / 2 + STRIP.lift, alongX ? offset : 0);
      group.add(strip);
    }
  }
  group.position.set(...center);
  return group;
}
