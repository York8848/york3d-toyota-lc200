import * as T from "three";
import { rounded, joinGeometry, tube } from "./geometry";

// +X points forward. Positive Z rotation puts the top of a seat toward -X.
export const seatRecline = (x: number) =>
  x < -1.3 ? 0.14 : x < -0.3 ? 0.17 : 0.2;
export const seatLift = (x: number) => (x < -1.3 ? 0.06 : 0);
export function seatBackPoint(
  x: number,
  z: number,
  localX: number,
  height: number,
) {
  const a = seatRecline(x);
  return new T.Vector3(
    x - 0.21 + localX * Math.cos(a) - height * Math.sin(a),
    0.86 + seatLift(x) + localX * Math.sin(a) + height * Math.cos(a),
    z,
  );
}
function shape(
  g: T.BufferGeometry,
  map: (x: number, y: number, z: number) => number[],
) {
  const p = g.getAttribute("position"),
    n = g.getAttribute("normal");
  const m = new T.Matrix3(),
    normal = new T.Vector3(),
    e = 0.0001;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      q = map(x, y, z);
    const a = map(x + e, y, z),
      b = map(x, y + e, z),
      c = map(x, y, z + e);
    m.set(
      (a[0] - q[0]) / e,
      (b[0] - q[0]) / e,
      (c[0] - q[0]) / e,
      (a[1] - q[1]) / e,
      (b[1] - q[1]) / e,
      (c[1] - q[1]) / e,
      (a[2] - q[2]) / e,
      (b[2] - q[2]) / e,
      (c[2] - q[2]) / e,
    )
      .invert()
      .transpose();
    normal.fromBufferAttribute(n, i).applyMatrix3(m).normalize();
    p.setXYZ(i, q[0], q[1], q[2]);
    n.setXYZ(i, normal.x, normal.y, normal.z);
  }
  return g;
}
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
const padCenters = (w: number) => (w > 0.8 ? [-w / 4, w / 4] : [0]);
const backCup = (z: number, w: number) => {
  const pw = w > 0.8 ? w / 2 : w,
    center = w > 0.8 ? (z < 0 ? -w / 4 : w / 4) : 0;
  return 0.026 * Math.pow((z - center) / (pw / 2), 2);
};
const lumbar = (h: number) =>
  0.024 * Math.exp(-Math.pow((h - 0.16) / 0.105, 2));
export function seatCushion(x: number, w: number) {
  const pads = padCenters(w).map((z) => {
    const pw = w > 0.8 ? w / 2 : w;
    return tint(
      shape(rounded(0.49, 0.13, pw - 0.006, 0.05), (xx, y, zz) => [
        xx,
        y +
          0.018 * (xx / 0.49) +
          0.026 * Math.pow(Math.abs(zz) / (pw / 2), 3) -
          0.011 *
            Math.exp(-Math.pow(xx / 0.18, 2)) *
            Math.exp(-Math.pow(zz / (pw * 0.32), 2)),
        zz * (0.94 + (0.06 * (xx + 0.245)) / 0.49) + z,
      ]),
      1,
    );
  });
  const floor = x < -1.3 ? 0.792 : 0.615,
    center = 0.81 + seatLift(x);
  const height = Math.max(0.009, center - 0.06 - floor);
  const base = padCenters(w).flatMap((z) =>
    [-1, 1].map((s) =>
      tint(
        rounded(0.35, height, 0.045, 0.008).translate(
          -0.018,
          floor + height / 2 - center,
          z + s * (w > 0.8 ? w / 2 : w) * 0.32,
        ),
        0.19,
      ),
    ),
  );
  return joinGeometry(...pads, ...base);
}
export function cushionInsert(w: number) {
  return joinGeometry(
    ...padCenters(w).map((z) => {
      const pw = w > 0.8 ? w / 2 : w;
      return shape(rounded(0.342, 0.013, pw * 0.66, 0.004), (x, y, zz) => [
        x + 0.016,
        y +
          0.06 +
          0.018 * (x / 0.49) -
          0.011 *
            Math.exp(-Math.pow(x / 0.18, 2)) *
            Math.exp(-Math.pow(zz / (pw * 0.32), 2)),
        zz + z,
      ]);
    }),
  );
}
export function seatBack(w: number) {
  return shape(rounded(0.137, 0.5, w - 0.006, 0.053), (x, y, z) => {
    const h = y + 0.25;
    return [x + lumbar(h) + backCup(z, w), h, z * (1 - 0.13 * (h / 0.5) ** 2)];
  });
}
export function backInsert(w: number) {
  return joinGeometry(
    ...padCenters(w).map((z) => {
      const pw = w > 0.8 ? w / 2 : w;
      return shape(rounded(0.014, 0.366, pw * 0.64, 0.004), (x, y, zz) => {
        const h = y + 0.26;
        return [
          x + 0.071 + lumbar(h) + backCup(zz + z, w),
          h,
          (zz + z) * (1 - 0.13 * (h / 0.5) ** 2),
        ];
      });
    }),
  );
}
export function seatBolster(w: number, side: number) {
  return shape(rounded(0.118, 0.432, 0.072, 0.03), (x, y, z) => {
    const h = y + 0.245;
    return [
      x + 0.036 + lumbar(h),
      h,
      (z + side * (w / 2 - 0.045)) * (1 - 0.13 * (h / 0.5) ** 2),
    ];
  });
}
export function headrest(w: number) {
  return shape(rounded(0.123, 0.164, w, 0.039), (x, y, z) => [
    x + 0.008 * (1 - (z / (w / 2)) ** 2),
    y,
    z * (1 - 0.07 * (y / 0.082)),
  ]);
}
export function headrestPosts(x: number, z: number) {
  return joinGeometry(
    ...[-1, 1].map((side) =>
      tube(
        [
          seatBackPoint(x, z + side * 0.065, -0.009, 0.465).toArray(),
          seatBackPoint(x, z + side * 0.065, -0.009, 0.58).toArray(),
        ],
        0.006,
      ),
    ),
  );
}
