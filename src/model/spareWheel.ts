import * as T from "three";
import { joinGeometry, panel, rounded } from "./geometry";
import { tireGeometry } from "./tire";
const colorize = (g: T.BufferGeometry, hex: number) => {
  const c = new T.Color(hex),
    colors = [];
  for (let i = 0; i < g.getAttribute("position").count; i++)
    colors.push(c.r, c.g, c.b);
  g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  return g;
};
export function spareWheel() {
  const rubber = colorize(tireGeometry().rotateX(-Math.PI / 2), 0x20252b);
  const steel: T.BufferGeometry[] = [];
  const profile = [
    [0.252, -0.123],
    [0.274, -0.123],
    [0.279, -0.114],
    [0.263, -0.101],
    [0.25, -0.084],
    [0.25, 0.085],
    [0.268, 0.114],
    [0.278, 0.114],
    [0.278, 0.123],
    [0.255, 0.123],
    [0.24, 0.091],
    [0.24, -0.084],
    [0.252, -0.123],
  ];
  steel.push(
    new T.LatheGeometry(
      profile.map((p) => new T.Vector2(p[0], p[1])),
      64,
    ),
  );
  const circle = (r: number, n = 48, cx = 0, cy = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    });
  const holes = [circle(0.055)];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    holes.push(circle(0.039, 18, Math.cos(a) * 0.176, Math.sin(a) * 0.176));
    holes.push(circle(0.011, 12, Math.cos(a) * 0.084, Math.sin(a) * 0.084));
  }
  const dish = panel(circle(0.249), 0.012, 0.003, holes).rotateX(Math.PI / 2);
  const pos = dish.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const radius = Math.hypot(pos.getX(i), pos.getZ(i));
    pos.setY(i, pos.getY(i) - 0.084 + 0.045 * Math.pow(1 - radius / 0.25, 2));
  }
  dish.computeVertexNormals();
  steel.push(dish);
  // Retaining plate and shaft remain part of the spare assembly in the catalog.
  steel.push(rounded(0.14, 0.018, 0.038, 0.006).translate(0, -0.063, 0));
  steel.push(
    new T.CylinderGeometry(0.013, 0.013, 0.30, 16).translate(0, 0.088, 0),
  );
  steel.push(rounded(0.16, 0.018, 0.07, 0.005).translate(-0.045, 0.244, 0));
  return joinGeometry(rubber, ...steel.map((g) => colorize(g, 0x7e858c)));
}
