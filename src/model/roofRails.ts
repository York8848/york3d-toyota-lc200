import { gridShell, joinGeometry } from "./geometry";

// Follow the same crown as the roof skin; feet sink 3 mm into that skin.
export function roofSkinHeight(x: number, z: number) {
  const curve = Math.sin((Math.PI * (x + 2.21)) / 2.645);
  const width = 0.795 + 0.035 * curve;
  return 1.856 + 0.04 * curve + 0.052 * (1 - (z / width) ** 2);
}
export const railFootCenters = [-1.88, -0.88, 0.035];
export function roofRail(side: number) {
  const z = side * 0.716;
  const spine = gridShell(
    (u, v) => {
      const x = -2.015 + 2.2 * u;
      const across = v * 2 - 1;
      return [
        x,
        1.97 + 0.015 * Math.sin(Math.PI * u) + 0.007 * (1 - across * across),
        z + across * (0.024 + 0.008 * Math.sin(Math.PI * u)),
      ];
    },
    40,
    10,
    0.027,
  );
  const feet = railFootCenters.map((center, index) => {
    const length = index === 1 ? 0.19 : 0.31;
    // A broad sculpted pedestal, including a thin conforming mounting pad.
    const pad = gridShell(
      (u, v) => {
        const x = center + (u - 0.5) * length;
        const zz = z + (v - 0.5) * 0.105;
        return [x, roofSkinHeight(x, zz) + 0.007, zz];
      },
      12,
      8,
      0.01,
    );
    const pedestal = gridShell(
      (u, v) => {
        const x = center + (u - 0.5) * (length - 0.025);
        const zz = z + (v - 0.5) * 0.078;
        const rise = Math.pow(Math.sin(Math.PI * u), 0.55);
        return [x, roofSkinHeight(x, zz) + 0.012 + 0.088 * rise, zz];
      },
      18,
      8,
      0.095,
    );
    return joinGeometry(pad, pedestal);
  });
  return joinGeometry(spine, ...feet);
}
