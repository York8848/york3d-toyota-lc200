import * as T from "three";
import { TessellateModifier } from "three/addons/modifiers/TessellateModifier.js";
import {
  mergeVertices,
  mergeGeometries,
} from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export const rounded = (x: number, y: number, z: number, r = 0.04) =>
  new RoundedBoxGeometry(x, y, z, 3, Math.min(r, x / 3, y / 3, z / 3));
/** Closed bevelled outline extruded in Z. All exterior side panels have their own outline. */
export function panel(
  points: number[][],
  depth = 0.045,
  bevel = 0.012,
  holes: number[][][] = [],
) {
  const shape = new T.Shape(points.map((p) => new T.Vector2(p[0], p[1])));
  for (const hole of holes)
    shape.holes.push(new T.Path(hole.map((p) => new T.Vector2(p[0], p[1]))));
  const g = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
    steps: 1,
    curveSegments: 24,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}
/** Thin curved top panel from transverse sections. */
export function loft(
  sections: { x: number; y: number; w: number }[],
  crown = 0.035,
  thickness = 0.045,
) {
  const positions: number[] = [];
  const indices: number[] = [];
  const n = 40;
  for (let layer = 0; layer < 2; layer++)
    for (const s of sections)
      for (let j = 0; j <= n; j++) {
        const t = (j / n) * 2 - 1;
        positions.push(
          s.x,
          s.y + crown * (1 - t * t) - layer * thickness,
          t * s.w,
        );
      }
  const stride = n + 1,
    count = sections.length * stride;
  for (let layer = 0; layer < 2; layer++)
    for (let i = 0; i < sections.length - 1; i++)
      for (let j = 0; j < n; j++) {
        const a = layer * count + i * stride + j,
          b = a + stride;
        if (layer === 0) indices.push(a, a + 1, b, b, a + 1, b + 1);
        else indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
  const edge = (a: number, b: number) =>
    indices.push(a, b, a + count, b, b + count, a + count);
  for (let j = 0; j < n; j++) {
    edge(j + 1, j);
    edge(count - stride + j, count - stride + j + 1);
  }
  for (let i = 0; i < sections.length - 1; i++) {
    edge(i * stride, (i + 1) * stride);
    edge((i + 1) * stride + n, i * stride + n);
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
export function tube(points: number[][], radius: number) {
  return new T.TubeGeometry(
    new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(...(p as [number, number, number]))),
    ),
    Math.max(12, points.length * 5),
    radius,
    8,
    false,
  );
}
export function arch(cx: number, cy: number, r: number, thickness: number) {
  const shape = new T.Shape();
  shape.absarc(cx, cy, r, 0, Math.PI, false);
  shape.absarc(cx, cy, r - thickness, Math.PI, 0, true);
  shape.closePath();
  const g = new T.ExtrudeGeometry(shape, {
    depth: 0.075,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 2,
    curveSegments: 28,
  });
  g.translate(0, 0, -0.0375);
  return g;
}
export function fender(
  x0: number,
  x1: number,
  cx: number,
  cy: number,
  r: number,
  top: number,
) {
  const points: number[][] = [
    [x0, top],
    [x1, top],
    [x1, cy],
    [cx + r, cy],
  ];
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * Math.PI;
    points.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  points.push([x0, cy]);
  return panel(points, 0.065, 0.012);
}

/** Densely sampled panel, shaped in vehicle coordinates before registration. */
export function sculptedPanel(
  points: number[][],
  map: (u: number, v: number, d: number) => number[],
  depth = 0.025,
  holes: number[][][] = [],
) {
  const source = panel(points, depth, 0.003, holes);
  let g: T.BufferGeometry = new TessellateModifier(0.095, 7).modify(source);
  source.dispose();
  const a = g.getAttribute("position"),
    normals = g.getAttribute("normal");
  const jacobian = new T.Matrix3(),
    normal = new T.Vector3(),
    e = 0.0001;
  let reflected = false;
  // Transform the original surface normals by the local inverse transpose.
  // Re-averaging tessellation edges produced rippled chrome and triangular highlights.
  for (let i = 0; i < a.count; i++) {
    const u = a.getX(i),
      v = a.getY(i),
      d = a.getZ(i),
      q = map(u, v, d);
    const du = map(u + e, v, d),
      dv = map(u, v + e, d),
      dd = map(u, v, d + e);
    jacobian.set(
      (du[0] - q[0]) / e,
      (dv[0] - q[0]) / e,
      (dd[0] - q[0]) / e,
      (du[1] - q[1]) / e,
      (dv[1] - q[1]) / e,
      (dd[1] - q[1]) / e,
      (du[2] - q[2]) / e,
      (dv[2] - q[2]) / e,
      (dd[2] - q[2]) / e,
    );
    if (i === 0) reflected = jacobian.determinant() < 0;
    jacobian.invert().transpose();
    normal.fromBufferAttribute(normals, i).applyMatrix3(jacobian).normalize();
    normals.setXYZ(i, normal.x, normal.y, normal.z);
    a.setXYZ(i, q[0], q[1], q[2]);
  }
  g.deleteAttribute("uv");
  const merged = mergeVertices(g, 0.00001);
  // Reflections reverse triangle winding, but inverse-transpose normals remain
  // outward. Keep both consistent so double-sided glass is lit from outside.
  if (reflected && merged.index) {
    const index = merged.index;
    for (let i = 0; i < index.count; i += 3) {
      const b = index.getX(i + 1);
      index.setX(i + 1, index.getX(i + 2));
      index.setX(i + 2, b);
    }
  }
  g.dispose();
  return merged;
}
/** LC200 shoulder, tucked sill and broad wheel-arch shoulders. */
export function sideWidth(x: number, y: number) {
  const belt = 0.956 + 0.035 * Math.exp(-Math.pow((y - 1.25) / 0.16, 2));
  const belly = 0.029 * Math.exp(-Math.pow((y - 0.92) / 0.28, 2));
  const sill = 0.055 * Math.exp(-Math.pow((y - 0.52) / 0.15, 2));
  const flare =
    0.047 *
    Math.exp(-Math.pow((Math.abs(x) - 1.425) / 0.5, 4)) *
    Math.exp(-Math.pow((y - 0.84) / 0.4, 2));
  const ends = 0.065 * Math.pow(Math.max(0, (Math.abs(x) - 2.04) / 0.4), 2);
  return belt + belly - sill + flare - ends;
}
/** Front surfaces roll back at the corners instead of ending in a flat slab. */
export const noseX = (z: number, y: number) =>
  2.435 -
  0.27 * Math.pow(Math.abs(z), 4) -
  0.11 * Math.pow((y - 0.98) / 0.65, 2);
export function frontPanel(points: number[][], offset = 0, depth = 0.025) {
  return sculptedPanel(
    points,
    (u, y, d) => [noseX(u, y) + offset + d, y, u],
    depth,
  );
}

/** Straight gasket segments follow the window edge without spline overshoot. */
export function outlineTube(points: number[][], radius: number) {
  const path = new T.CurvePath<T.Vector3>();
  for (let i = 1; i < points.length; i++)
    path.add(
      new T.LineCurve3(
        new T.Vector3(...(points[i - 1] as [number, number, number])),
        new T.Vector3(...(points[i] as [number, number, number])),
      ),
    );
  return new T.TubeGeometry(path, points.length * 12, radius, 8, false);
}

/** Closed sheet surface with separate edge normals. u/v are shared seam coordinates. */
export function gridShell(
  sample: (u: number, v: number) => number[],
  nu = 32,
  nv = 32,
  thickness = 0.018,
) {
  const pos: number[] = [],
    idx: number[] = [];
  const stride = nv + 1,
    count = (nu + 1) * stride;
  for (let layer = 0; layer < 2; layer++)
    for (let i = 0; i <= nu; i++)
      for (let j = 0; j <= nv; j++) {
        const p = sample(i / nu, j / nv);
        pos.push(p[0], p[1] - layer * thickness, p[2]);
      }
  for (let layer = 0; layer < 2; layer++)
    for (let i = 0; i < nu; i++)
      for (let j = 0; j < nv; j++) {
        const a = layer * count + i * stride + j,
          b = a + stride;
        if (layer === 0) idx.push(a, a + 1, b, b, a + 1, b + 1);
        else idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
  const edge = (a: number, b: number) => {
    const n = pos.length / 3;
    for (const k of [a, b, b + count, a + count])
      pos.push(pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  };
  for (let i = 0; i < nu; i++) {
    edge(i * stride, (i + 1) * stride);
    edge((i + 1) * stride + nv, i * stride + nv);
  }
  for (let j = 0; j < nv; j++) {
    edge(j + 1, j);
    edge(nu * stride + j, nu * stride + j + 1);
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
/** Several connected surfaces remain a single physical catalog assembly. */
export function joinGeometry(...parts: T.BufferGeometry[]) {
  const flat = parts.map((g) => {
    const a = g.index ? g.toNonIndexed() : g.clone();
    a.deleteAttribute("uv");
    return a;
  });
  const result = mergeGeometries(flat);
  flat.forEach((g) => g.dispose());
  parts.forEach((g) => g.dispose());
  return result;
}
export function hoodPoint(t: number, v: number) {
  const q = v * 2 - 1,
    z = q * (0.918 - 0.038 * Math.pow(t, 4));
  const frontY = 1.378 + 0.006 * (1 - Math.pow(z / 0.98, 2));
  const y =
    1.434 * (1 - t) +
    frontY * t +
    0.015 * Math.sin(Math.PI * t) +
    0.03 *
      Math.exp(-Math.pow((Math.abs(z) - 0.65) / 0.15, 2)) *
      Math.sin(Math.PI * t);
  const frontX = noseX(z, frontY) + 0.086;
  return [0.84 + (frontX - 0.84) * t, y, z];
}
export function fenderEdge(t: number, side: number) {
  const y = 1.414 - 0.054 * t + 0.006 * Math.sin(Math.PI * t),
    x = 0.835 + (2.254 - 0.835) * t;
  return [x, y, side * (sideWidth(x, y) + 0.014)];
}
