/** Shared aperture geometry keeps glazing, seals and painted surrounds fitted together. */
export const sideWindows = [
  [
    [0.77, 1.432],
    [0.402, 1.808],
    [0.28, 1.844],
    [-0.255, 1.844],
    [-0.255, 1.421],
  ],
  [
    [-0.366, 1.42],
    [-0.366, 1.844],
    [-1.168, 1.835],
    [-1.2, 1.402],
  ],
  [
    [-1.302, 1.401],
    [-1.27, 1.823],
    [-1.96, 1.81],
    [-2.075, 1.735],
    [-2.163, 1.402],
  ],
];
export const sideGlassZ = (y: number) => 0.96 - (y - 1.36) * 0.275;
export const windshieldOutline = [
  [-0.93, 1.442],
  [0.93, 1.442],
  [0.818, 1.853],
  [-0.818, 1.853],
];
export const windshieldSurround = [
  [-0.961, 1.424],
  [0.961, 1.424],
  [0.842, 1.874],
  [-0.842, 1.874],
];
export const windshieldMap = (u: number, y: number, d: number) => {
  const w = sideGlassZ(y) + 0.017;
  return [0.825 - 0.88 * (y - 1.43) + 0.03 * (1 - (u / w) ** 2) + d, y, u];
};
/** Offset each straight edge, retaining mitred corners and the original winding. */
export function offsetOutline(points: number[][], amount: number) {
  const area = points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + p[0] * q[1] - p[1] * q[0];
  }, 0);
  const sign = Math.sign(area);
  const edges = points.map((p, i) => {
    const q = points[(i + 1) % points.length],
      dx = q[0] - p[0],
      dy = q[1] - p[1],
      length = Math.hypot(dx, dy);
    return {
      p: [
        p[0] + ((sign * dy) / length) * amount,
        p[1] - ((sign * dx) / length) * amount,
      ],
      d: [dx, dy],
    };
  });
  return edges.map((b, i) => {
    const a = edges[(i + edges.length - 1) % edges.length];
    const cross = a.d[0] * b.d[1] - a.d[1] * b.d[0];
    const t = ((b.p[0] - a.p[0]) * b.d[1] - (b.p[1] - a.p[1]) * b.d[0]) / cross;
    return [a.p[0] + t * a.d[0], a.p[1] + t * a.d[1]];
  });
}

export const rearWindow = [
  [-0.848, 1.407],
  [0.848, 1.407],
  [0.829, 1.6],
  [0.782, 1.775],
  [0.749, 1.805],
  [-0.749, 1.805],
  [-0.782, 1.775],
  [-0.829, 1.6],
];
export const rearUpperMap = (u: number, y: number, d: number) => {
  const t = Math.max(0, Math.min(1, (y - 1.39) / 0.44));
  return [
    -2.374 + 0.165 * t + 0.065 * Math.pow(Math.abs(u), 4) * (1 - 0.7 * t) - d,
    y,
    u,
  ];
};
