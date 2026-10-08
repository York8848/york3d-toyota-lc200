import * as T from "three";
import type { Component } from "../model/registry";
export const arrayDirection = new T.Vector3(1, 1.05, 1.5).normalize();
export const arrayRight = new T.Vector3()
  .crossVectors(new T.Vector3(0, 1, 0), arrayDirection)
  .normalize();
export const arrayUp = new T.Vector3()
  .crossVectors(arrayDirection, arrayRight)
  .normalize();
export function corners(b: T.Box3) {
  const a: T.Vector3[] = [];
  for (const x of [b.min.x, b.max.x])
    for (const y of [b.min.y, b.max.y])
      for (const z of [b.min.z, b.max.z]) a.push(new T.Vector3(x, y, z));
  return a;
}
export function projectionSize(p: Component) {
  const c = corners(p.boundingBox);
  return new T.Vector2(
    Math.max(...c.map((v) => v.dot(arrayRight))) -
      Math.min(...c.map((v) => v.dot(arrayRight))),
    Math.max(...c.map((v) => v.dot(arrayUp))) -
      Math.min(...c.map((v) => v.dot(arrayUp))),
  );
}
/** Shelf packing in the default camera plane. Perspective spacing conservatively accounts for depth. */
export function buildArray(parts: Component[]) {
  const cells = parts.map((p) => ({
    p,
    size: projectionSize(p).multiplyScalar(1.5).addScalar(0.22),
  }));
  const area = cells.reduce((a, c) => a + c.size.x * c.size.y, 0),
    rowWidth = Math.sqrt(area * 1.5);
  const map = new Map<string, T.Vector3>();
  let x = 0,
    y = 0,
    h = 0,
    maxWidth = 0;
  for (const { p, size } of cells) {
    if (x + size.x > rowWidth && x > 0) {
      y += h;
      x = 0;
      h = 0;
    }
    map.set(p.id, new T.Vector3(x + size.x / 2, y + size.y / 2, 0));
    x += size.x;
    h = Math.max(h, size.y);
    maxWidth = Math.max(maxWidth, x);
  }
  const height = y + h;
  for (const [id, v] of map)
    map.set(
      id,
      arrayRight
        .clone()
        .multiplyScalar(v.x - maxWidth / 2)
        .addScaledVector(arrayUp, height / 2 - v.y)
        .add(new T.Vector3(0, 1, 0)),
    );
  return map;
}
const smooth = (t: number) => t * t * (3 - 2 * t);
export function applyExplosion(
  parts: Component[],
  layout: Map<string, T.Vector3>,
  percent: number,
) {
  const t = Math.max(0, Math.min(100, percent)) / 100;
  for (const p of parts) {
    const exploded = p.originalPosition
      .clone()
      .addScaledVector(
        p.explosionDirection,
        p.explosionWeight * smooth(Math.min(t * 2, 1)),
      );
    p.mesh.position.copy(
      t <= 0.5
        ? exploded
        : exploded.lerp(layout.get(p.id)!, smooth((t - 0.5) * 2)),
    );
    p.mesh.rotation.copy(p.originalRotation);
    p.mesh.scale.copy(p.originalScale);
    p.mesh.updateMatrixWorld(true);
  }
}
export function fitDistance(
  box: T.Box3,
  direction: T.Vector3,
  fov: number,
  aspect: number,
  padding = 1.14,
  points: T.Vector3[] = corners(box),
) {
  const target = box.getCenter(new T.Vector3()),
    right = new T.Vector3()
      .crossVectors(new T.Vector3(0, 1, 0), direction)
      .normalize();
  if (right.lengthSq() < 0.01) right.set(1, 0, 0);
  const up = new T.Vector3().crossVectors(direction, right).normalize(),
    tanY = Math.tan(T.MathUtils.degToRad(fov) / 2),
    tanX = tanY * aspect;
  let distance = 0.12;
  for (const c of points) {
    const v = c.clone().sub(target),
      z = v.dot(direction);
    distance = Math.max(
      distance,
      z + (Math.abs(v.dot(right)) * padding) / tanX,
      z + (Math.abs(v.dot(up)) * padding) / tanY,
    );
  }
  return { target, distance: distance + 0.05 };
}
