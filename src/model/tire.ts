import * as T from "three";
import { panel, joinGeometry } from "./geometry";
import { parameters as p } from "./parameters";
/** Shared full-size tyre, axis along Z, including sidewalls and all-terrain tread. */
export function tireGeometry() {
  // Radial tyre section: bead, sidewall, rounded shoulder and grooved tread.
  const profile = [
    [0.278, -0.116],
    [0.285, -0.138],
    [0.321, -0.143],
    [0.365, -0.135],
    [0.394, -0.116],
    [0.403, -0.09],
    [0.405, -0.077],
    [0.4, -0.071],
    [0.4, -0.065],
    [0.405, -0.06],
    [0.405, -0.013],
    [0.4, -0.008],
    [0.4, 0.008],
    [0.405, 0.013],
    [0.405, 0.06],
    [0.4, 0.065],
    [0.4, 0.071],
    [0.405, 0.077],
    [0.403, 0.09],
    [0.394, 0.116],
    [0.365, 0.135],
    [0.321, 0.143],
    [0.285, 0.138],
    [0.278, 0.116],
    [0.278, -0.116],
  ];
  const tire = new T.LatheGeometry(
    profile.map(
      ([r, z]) =>
        new T.Vector2(
          ((r - (Math.max(0, r - 0.365) / 0.04) * 0.0175) * p.wheelRadius) /
            0.405,
          (z * p.tireWidth) / 0.285,
        ),
    ),
    96,
  );
  tire.rotateX(Math.PI / 2);
  // Staggered chevron blocks follow the carcass curvature; tapered shoulder
  // lugs leave open channels rather than forming a solid toothed ring.
  const tread: T.BufferGeometry[] = [tire];
  for (let row = 0; row < 36; row++)
    for (let lane = 0; lane < 4; lane++) {
      const outer = lane === 0 || lane === 3;
      const axial = [-0.105, -0.035, 0.035, 0.105][lane];
      const angle = ((row + (lane % 2) * 0.46) / 36) * Math.PI * 2;
      const slant = lane < 2 ? 1 : -1;
      const block = panel(
        [
          [-0.022, -0.027],
          [0.013, -0.027],
          [0.026, 0.017],
          [0.017, 0.029],
          [-0.017, 0.029],
          [-0.027, -0.016],
        ].map(([a, b]) => [a * slant, b]),
        outer ? 0.017 : 0.014,
        0.003,
      );
      const pos = block.getAttribute("position");
      for (let i = 0; i < pos.count; i++) {
        const a = angle + pos.getX(i) / p.wheelRadius;
        const z = axial + pos.getY(i);
        const radius =
          p.wheelRadius -
          0.0115 +
          pos.getZ(i) -
          (outer ? Math.max(0, Math.abs(z) - 0.1) * 0.45 : 0);
        pos.setXYZ(i, Math.sin(a) * radius, Math.cos(a) * radius, z);
      }
      block.computeVertexNormals();
      tread.push(block);
    }
  // Short shoulder ribs extend down the sidewall, well inside the arch lip.
  for (const face of [-1, 1])
    for (let i = 0; i < 36; i++) {
      const rib = panel(
        [
          [-0.009, 0.353],
          [0.009, 0.353],
          [0.021, 0.39],
          [-0.02, 0.395],
        ],
        0.007,
        0.003,
      );
      rib.translate(0, 0, face * 0.136);
      rib.rotateZ((i / 36) * Math.PI * 2);
      tread.push(rib);
    }
  return joinGeometry(...tread);
}
