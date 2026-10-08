/** Design proportions in metres, NOT Toyota specifications. +X forward, +Y up, +Z left. */
export const parameters = Object.freeze({
  length: 4.95,
  width: 1.98,
  height: 1.92,
  wheelbase: 2.85,
  frontTrack: 1.68,
  rearTrack: 1.68,
  wheelRadius: 0.405,
  tireWidth: 0.285,
  clearance: 0.23,
  engineBay: [1.0, 2.35],
  cabin: [-2.28, 0.98],
  pillars: { a: 0.48, b: -0.32, c: -1.25, d: -2.22 },
  windshieldAngle: 32,
  roofCurve: 0.045,
  hoodHeight: 1.38,
  rearHeight: 1.85,
  frontOverhang: 1.05,
  rearOverhang: 1.05,
  radialSegments: 40,
});
export type Category =
  | "body"
  | "glass"
  | "lights"
  | "wheels"
  | "cabin"
  | "structure";
export const categories: Category[] = [
  "body",
  "glass",
  "lights",
  "wheels",
  "cabin",
  "structure",
];
export const categoryLabels: Record<Category, [string, string]> = {
  body: ["车身与外观", "Body & exterior"],
  glass: ["玻璃与车窗", "Glass & windows"],
  lights: ["灯组与照明", "Lights & optics"],
  wheels: ["车轮与制动", "Wheels & brakes"],
  cabin: ["座舱与内饰", "Cabin & interior"],
  structure: ["结构示意", "Schematic structure"],
};
