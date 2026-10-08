import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { Vehicle } from "../model/buildVehicle";
import type { Category } from "../model/parameters";
import {
  applyExplosion,
  arrayDirection,
  buildArray,
  corners,
  fitDistance,
} from "./explosion";
export type View = "perspective" | "front" | "side" | "top";
export interface SceneState {
  explosion: number;
  category: Category | "all";
  categoryMode: "highlight" | "isolate";
  selected: string | null;
  isolated: string | null;
  wireframe: boolean;
  autoRotate: boolean;
}
export const initialSceneState: SceneState = {
  explosion: 0,
  category: "all",
  categoryMode: "highlight",
  selected: null,
  isolated: null,
  wireframe: false,
  autoRotate: false,
};
export class SceneController {
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(36, 1, 0.005, 500);
  renderer: T.WebGLRenderer;
  controls: OrbitControls;
  state: SceneState = { ...initialSceneState };
  layout: ReturnType<typeof buildArray>;
  platform: T.Mesh;
  frame = 0;
  dirty = true;
  disposed = false;
  userOrbit = false;
  lastTime = 0;
  observer: ResizeObserver;
  environment: T.WebGLRenderTarget;
  raycaster = new T.Raycaster();
  pointers = new Map<number, { x: number; y: number }>();
  dragged = false;
  constructor(
    public host: HTMLElement,
    public vehicle: Vehicle,
    public select: (id: string | null) => void,
    public fail: (message: string) => void,
  ) {
    this.renderer = new T.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.setClearColor(0xf1f3f6, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.host.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute("aria-label", "3D vehicle viewport");
    this.scene.add(vehicle.group);
    this.layout = buildArray(vehicle.parts);
    const envScene = new RoomEnvironment(),
      pmrem = new T.PMREMGenerator(this.renderer);
    this.environment = pmrem.fromScene(envScene, 0.02);
    this.scene.environment = this.environment.texture;
    envScene.dispose();
    pmrem.dispose();
    this.scene.add(new T.HemisphereLight(0xf4f8ff, 0x9299a4, 1.25));
    const key = new T.DirectionalLight(0xffffff, 2.1);
    key.position.set(4, 7, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.normalBias = 0.025;
    key.shadow.bias = -0.0003;
    key.shadow.radius = 3;
    this.scene.add(key);
    const fill = new T.DirectionalLight(0xcbdcfa, 1.1);
    fill.position.set(-5, 3, -4);
    this.scene.add(fill);
    this.platform = new T.Mesh(
      new T.CylinderGeometry(3.38, 3.42, 0.075, 96),
      new T.MeshStandardMaterial({
        color: 0xe3e7ed,
        metalness: 0.18,
        roughness: 0.58,
      }),
    );
    this.platform.position.y = 0.016;
    this.platform.receiveShadow = true;
    this.scene.add(this.platform);
    const rim = new T.Mesh(
      new T.TorusGeometry(3.39, 0.01, 6, 96),
      new T.MeshStandardMaterial({
        color: 0xbac4d0,
        metalness: 0.5,
        roughness: 0.45,
      }),
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.04;
    this.scene.add(rim);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;
    this.controls.minDistance = 0.035;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI * 0.94;
    this.controls.autoRotateSpeed = 0.5;
    this.controls.addEventListener("change", this.invalidate);
    this.controls.addEventListener("start", this.onOrbit);
    this.renderer.domElement.addEventListener("pointerdown", this.down);
    this.renderer.domElement.addEventListener("pointermove", this.move);
    this.renderer.domElement.addEventListener("pointerup", this.up);
    this.renderer.domElement.addEventListener("pointercancel", this.cancel);
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      this.contextLost,
    );
    document.addEventListener("visibilitychange", this.visibility);
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(host);
    this.resize();
    this.setView("perspective");
  }
  invalidate = () => {
    this.dirty = true;
    if (!this.frame && !this.disposed && !document.hidden)
      this.frame = requestAnimationFrame(this.render);
  };
  render = (time: number) => {
    this.frame = 0;
    if (this.disposed || document.hidden) return;
    const dt = Math.min(0.05, (time - this.lastTime) / 1000 || 0.016);
    this.lastTime = time;
    const moving = this.controls.update(dt);
    if (this.dirty || moving || this.controls.autoRotate) {
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
    if ((moving || this.controls.autoRotate) && !this.frame)
      this.frame = requestAnimationFrame(this.render);
  };
  visibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    } else {
      this.lastTime = 0;
      this.invalidate();
    }
  };
  resize = () => {
    const { width, height } = this.host.getBoundingClientRect();
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.fit();
  };
  onOrbit = () => {
    this.userOrbit = true;
    this.invalidate();
  };
  contextLost = (e: Event) => {
    e.preventDefault();
    this.fail("context");
  };
  down = (e: PointerEvent) => {
    if (this.pointers.size === 0) this.dragged = false;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size > 1) this.dragged = true;
    this.invalidate();
  };
  move = (e: PointerEvent) => {
    const p = this.pointers.get(e.pointerId);
    if (p && Math.hypot(p.x - e.clientX, p.y - e.clientY) > 5)
      this.dragged = true;
  };
  cancel = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
    this.dragged = true;
  };
  up = (e: PointerEvent) => {
    const start = this.pointers.get(e.pointerId);
    this.pointers.delete(e.pointerId);
    if (!start || this.dragged || this.pointers.size || e.button !== 0) return;
    const b = this.renderer.domElement.getBoundingClientRect();
    this.raycaster.setFromCamera(
      new T.Vector2(
        ((e.clientX - b.left) / b.width) * 2 - 1,
        (-(e.clientY - b.top) / b.height) * 2 + 1,
      ),
      this.camera,
    );
    const hit = this.raycaster.intersectObjects(
      this.vehicle.parts
        .filter((p) => p.mesh.visible && p.mesh.material.opacity > 0.15)
        .map((p) => p.mesh),
      false,
    )[0];
    this.select(hit?.object.userData.componentId ?? null);
  };
  visibleBox(id?: string) {
    const box = new T.Box3();
    for (const p of this.vehicle.parts)
      if (id ? p.id === id : p.mesh.visible)
        box.union(new T.Box3().setFromObject(p.mesh));
    return box;
  }
  fit(id?: string, direction?: T.Vector3) {
    const box = this.visibleBox(id);
    if (box.isEmpty()) return;
    const dir =
      direction ??
      this.camera.position.clone().sub(this.controls.target).normalize();
    if (dir.lengthSq() < 0.01) dir.copy(arrayDirection);
    const points = this.vehicle.parts
      .filter((p) => (id ? p.id === id : p.mesh.visible))
      .flatMap((p) => corners(new T.Box3().setFromObject(p.mesh)));
    const f = fitDistance(
      box,
      dir,
      this.camera.fov,
      this.camera.aspect,
      id ? 1.45 : this.camera.aspect < 1.15 ? 1.45 : 1.18,
      points,
    );
    this.controls.target.copy(f.target);
    this.camera.position.copy(f.target).addScaledVector(dir, f.distance);
    this.camera.near = Math.max(0.002, f.distance / 2000);
    this.camera.far = Math.max(100, f.distance * 10);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(f.target);
    this.controls.update();
    this.invalidate();
  }
  setView(view: View) {
    this.userOrbit = false;
    const dir = {
      perspective: new T.Vector3(1, 0.37, 1.3),
      front: new T.Vector3(1, 0.015, 0),
      side: new T.Vector3(0, 0.015, 1),
      top: new T.Vector3(0, 1, 0.0001),
    }[view].normalize();
    this.fit(undefined, dir);
  }
  zoom(amount: number) {
    const d = this.camera.position.clone().sub(this.controls.target);
    d.multiplyScalar(amount);
    d.clampLength(this.controls.minDistance, this.controls.maxDistance);
    this.camera.position.copy(this.controls.target).add(d);
    this.controls.update();
    this.invalidate();
  }
  update(next: SceneState) {
    const explosionChanged = next.explosion !== this.state.explosion,
      visibilityChanged =
        next.isolated !== this.state.isolated ||
        next.category !== this.state.category ||
        next.categoryMode !== this.state.categoryMode;
    this.state = { ...next };
    applyExplosion(this.vehicle.parts, this.layout, next.explosion);
    this.platform.visible = next.explosion < 65 && !next.isolated;
    this.scene.children
      .filter((o) => o.type === "Mesh" && o !== this.platform)
      .forEach((o) => (o.visible = next.explosion < 65 && !next.isolated));
    for (const p of this.vehicle.parts) {
      const m = p.mesh.material,
        b = p.mesh.userData.base;
      const match = next.category === "all" || next.category === p.category;
      p.mesh.visible = next.isolated
        ? p.id === next.isolated
        : next.categoryMode === "isolate"
          ? match
          : true;
      m.color.copy(b.color);
      m.emissive.copy(b.emissive);
      m.emissiveIntensity = b.emissiveIntensity;
      m.opacity = b.opacity;
      m.transparent = b.transparent;
      m.depthWrite = b.depthWrite;
      m.wireframe = next.wireframe;
      if (!match && !next.isolated && next.categoryMode === "highlight") {
        m.opacity = 0.09;
        m.transparent = true;
        m.depthWrite = false;
      }
      if (p.id === next.selected) {
        m.color.set(0x4269ed);
        m.emissive.set(0x183aa7);
        m.emissiveIntensity = 0.45;
        m.opacity = 1;
        m.transparent = false;
        m.depthWrite = true;
      }
      m.needsUpdate = true;
    }
    this.controls.autoRotate = next.autoRotate;
    if (explosionChanged) {
      if (!this.userOrbit)
        this.fit(
          undefined,
          next.explosion === 100 ? arrayDirection : undefined,
        );
      else this.invalidate();
    }
    if (visibilityChanged) this.fit();
    this.invalidate();
  }
  reset() {
    this.userOrbit = false;
    this.update({ ...initialSceneState });
    this.setView("perspective");
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    document.removeEventListener("visibilitychange", this.visibility);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.down);
    canvas.removeEventListener("pointermove", this.move);
    canvas.removeEventListener("pointerup", this.up);
    canvas.removeEventListener("pointercancel", this.cancel);
    canvas.removeEventListener("webglcontextlost", this.contextLost);
    this.controls.removeEventListener("change", this.invalidate);
    this.controls.removeEventListener("start", this.onOrbit);
    this.controls.dispose();
    this.vehicle.dispose();
    this.scene.traverse((o) => {
      if (o instanceof T.Mesh && !o.userData.componentId) {
        o.geometry.dispose();
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        materials.forEach((m) => m.dispose());
      }
      if (o instanceof T.DirectionalLight) o.shadow.dispose();
    });
    this.environment.dispose();
    this.renderer.dispose();
    canvas.remove();
  }
}
