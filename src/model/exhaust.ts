import * as T from "three";
import { joinGeometry } from "./geometry";

/** Illustrative routed exhaust with a real annular outlet and dark inner wall. */
export function rearExhaust() {
  const path = new T.CatmullRomCurve3(
    [
      [-0.24, 0.32, 0.4],
      [-0.44, 0.317, 0.67],
      [-0.84, 0.317, 0.67],
      [-0.99, 0.28, 0.30],
      [-1.18, 0.69, 0.27],
      [-1.44, 0.72, 0.27],
      [-1.66, 0.71, 0.5],
      [-1.87, 0.56, 0.65],
      [-2.12, 0.455, 0.65],
      [-2.3, 0.44, 0.59],
      [-2.45, 0.408, 0.55],
    ].map((p) => new T.Vector3(...(p as [number, number, number]))),
  );
  const tint = (g: T.BufferGeometry, value: number) => {
    g.setAttribute(
      "color",
      new T.Float32BufferAttribute(
        Array(g.getAttribute("position").count * 3).fill(value),
        3,
      ),
    );
    return g;
  };
  const outer = tint(new T.TubeGeometry(path, 100, 0.028, 24, false), 1);
  const inner = tint(new T.TubeGeometry(path, 100, 0.024, 24, false), 0.13);
  const normals = inner.getAttribute("normal");
  for (let i = 0; i < normals.count; i++)
    normals.setXYZ(i, -normals.getX(i), -normals.getY(i), -normals.getZ(i));
  const index = inner.index!;
  for (let i = 0; i < index.count; i += 3) {
    const b = index.getX(i + 1);
    index.setX(i + 1, index.getX(i + 2));
    index.setX(i + 2, b);
  }
  const lip = tint(new T.RingGeometry(0.024, 0.028, 32), 0.9);
  lip.applyQuaternion(
    new T.Quaternion().setFromUnitVectors(
      new T.Vector3(0, 0, 1),
      path.getTangent(1).normalize(),
    ),
  );
  const end = path.getPoint(1);
  lip.translate(end.x, end.y, end.z);
  return joinGeometry(outer, inner, lip);
}
