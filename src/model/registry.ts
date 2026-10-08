import * as T from "three";
import type { Category } from "./parameters";
export interface Component {
  id: string;
  category: Category;
  nameZh: string;
  nameEn: string;
  mesh: T.Mesh<T.BufferGeometry, T.MeshStandardMaterial>;
  representation: "simplified-exterior" | "schematic-structure";
  originalPosition: T.Vector3;
  originalRotation: T.Euler;
  originalScale: T.Vector3;
  parent: string;
  boundingBox: T.Box3;
  center: T.Vector3;
  dimensions: T.Vector3;
  explosionDirection: T.Vector3;
  explosionWeight: number;
}
export const finishes = {
  paint: { color: 0xe4e5e2, metalness: 0.38, roughness: 0.24 },
  optics: { color: 0x34414c, metalness: 0.62, roughness: 0.22 },
  alloy: { color: 0x919ba3, metalness: 0.8, roughness: 0.28 },
  chrome: { color: 0xd3dce5, metalness: 0.92, roughness: 0.2 },
  spare: {
    color: 0xffffff,
    metalness: 0.15,
    roughness: 0.66,
    vertexColors: true,
  },
  rubber: { color: 0x20252b, metalness: 0.0, roughness: 0.88 },
  dark: { color: 0x293038, metalness: 0.15, roughness: 0.58 },
  lens: {
    color: 0xeaf5ff,
    metalness: 0.1,
    roughness: 0.12,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  },
  clearOptics: { color: 0xb6c0c7, metalness: 0.45, roughness: 0.2 },
  rearReflector: { color: 0x39090e, metalness: 0.45, roughness: 0.26 },
  redLens: {
    color: 0xb21b24,
    metalness: 0.1,
    roughness: 0.14,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  },
  glass: {
    color: 0x192b36,
    metalness: 0.05,
    roughness: 0.28,
    envMapIntensity: 0.35,
    transparent: true,
    opacity: 0.89,
    depthWrite: false,
  },
  seatUpholstery: {
    color: 0x806d5e,
    metalness: 0,
    roughness: 0.92,
    vertexColors: true,
  },
  seatInsert: { color: 0x796654, metalness: 0, roughness: 0.96 },
  leather: { color: 0x806d5e, metalness: 0, roughness: 0.92 },
  fabric: { color: 0x424852, metalness: 0, roughness: 1 },
  projector: { color: 0x172a38, metalness: 0.3, roughness: 0.08 },
  light: {
    color: 0xe6f7ff,
    emissive: 0xc6e4ff,
    emissiveIntensity: 0.55,
    metalness: 0.2,
    roughness: 0.15,
  },
  red: {
    color: 0x9c1725,
    emissive: 0xff2638,
    emissiveIntensity: 0.08,
    metalness: 0.15,
    roughness: 0.2,
  },
  amber: {
    color: 0xe9ac47,
    emissive: 0xd57e18,
    emissiveIntensity: 0.2,
    roughness: 0.3,
  },
  exhaust: {
    color: 0x8b939b,
    metalness: 0.75,
    roughness: 0.46,
    vertexColors: true,
  },
  steel: { color: 0x687785, metalness: 0.78, roughness: 0.43 },
  brake: { color: 0x394454, metalness: 0.55, roughness: 0.55 },
};
export type Finish = keyof typeof finishes;
export class Registry {
  group = new T.Group();
  parts: Component[] = [];
  add(
    category: Category,
    zh: string,
    en: string,
    g: T.BufferGeometry,
    finish: Finish,
    position: number[] = [0, 0, 0],
    rotation: number[] = [0, 0, 0],
  ) {
    const mesh = new T.Mesh(
      g,
      new T.MeshStandardMaterial({ ...finishes[finish], side: T.DoubleSide }),
    );
    mesh.position.set(...(position as [number, number, number]));
    mesh.rotation.set(...(rotation as [number, number, number]));
    // Bake all transforms into geometry and recenter. Every registered mesh has an identity parent.
    mesh.updateMatrix();
    g.applyMatrix4(mesh.matrix);
    g.computeBoundingBox();
    const center = g.boundingBox!.getCenter(new T.Vector3());
    g.translate(-center.x, -center.y, -center.z);
    mesh.position.copy(center);
    mesh.rotation.set(0, 0, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    mesh.updateMatrixWorld(true);
    const boundingBox = new T.Box3().setFromObject(mesh),
      dimensions = boundingBox.getSize(new T.Vector3());
    const direction = new T.Vector3(
      center.x * 0.3,
      category === "structure" ? -0.6 : category === "glass" ? 1.25 : 0.45,
      center.z * 1.3,
    );
    if (category === "wheels")
      direction.set(center.x * 0.15, 0.15, Math.sign(center.z) * 1.5);
    if (direction.lengthSq() < 0.01) direction.y = 1;
    const id = `GEN-${String(this.parts.length + 1).padStart(3, "0")}`;
    mesh.name = id;
    mesh.userData.componentId = id;
    const part: Component = {
      id,
      category,
      nameZh: zh,
      nameEn: en,
      mesh,
      representation:
        category === "structure" || category === "cabin"
          ? "schematic-structure"
          : "simplified-exterior",
      originalPosition: center.clone(),
      originalRotation: mesh.rotation.clone(),
      originalScale: mesh.scale.clone(),
      parent: "vehicle",
      boundingBox,
      center: center.clone(),
      dimensions,
      explosionDirection: direction.normalize(),
      explosionWeight: category === "glass" ? 1.8 : 1.2,
    };
    mesh.userData.base = {
      color: mesh.material.color.clone(),
      opacity: mesh.material.opacity,
      transparent: mesh.material.transparent,
      depthWrite: mesh.material.depthWrite,
      emissive: mesh.material.emissive.clone(),
      emissiveIntensity: mesh.material.emissiveIntensity,
    };
    this.parts.push(part);
    return mesh;
  }
}
