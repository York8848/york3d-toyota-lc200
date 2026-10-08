import * as T from "three";
import { Registry } from "./registry";
import { rounded, panel, joinGeometry } from "./geometry";
import { parameters as p } from "./parameters";
import { tireGeometry } from "./tire";
export function buildWheels(r: Registry) {
  for (const x of [p.wheelbase / 2, -p.wheelbase / 2])
    for (const s of [-1, 1]) {
      const z = (s * (x > 0 ? p.frontTrack : p.rearTrack)) / 2,
        y = p.wheelRadius + 0.055;
      const zh = (x > 0 ? "前" : "后") + (s > 0 ? "左" : "右"),
        en = (x > 0 ? "Front" : "Rear") + (s > 0 ? " left" : " right");
      const add = (
        cn: string,
        n: string,
        g: T.BufferGeometry,
        m: Parameters<Registry["add"]>[4],
        dz = 0,
      ) => r.add("wheels", zh + cn, en + " " + n, g, m, [x, y, z + s * dz]);
      add("越野轮胎", "all-terrain tire", tireGeometry(), "rubber");
      const lip = new T.TorusGeometry(0.264, 0.015, 12, 64);
      const barrel = new T.CylinderGeometry(
        0.251,
        0.251,
        0.19,
        64,
        1,
        true,
      ).rotateX(Math.PI / 2);
      barrel.translate(0, 0, -s * 0.084);
      add("轮辋", "rim", joinGeometry(lip, barrel), "alloy", 0.139);
      const disc = new T.CylinderGeometry(0.232, 0.232, 0.025, 40);
      disc.rotateX(Math.PI / 2);
      add("制动盘", "brake disc", disc, "steel", 0.085);
      const hub = new T.CylinderGeometry(0.089, 0.089, 0.1, 24);
      hub.rotateX(Math.PI / 2);
      add("轮毂", "hub", hub, "steel", 0.125);
      for (let i = 0; i < 5; i++)
        for (const branch of [-1, 1]) {
          const a = (i / 5) * Math.PI * 2 + branch * 0.135;
          const g = panel(
            [
              [-0.014, 0.075],
              [0.014, 0.075],
              [0.023, 0.239],
              [0.012, 0.257],
              [-0.011, 0.257],
              [-0.019, 0.239],
            ],
            0.024,
            0.004,
          );
          g.rotateZ(-a);
          add(
            "轮辐 " + (i + 1) + (branch > 0 ? "B" : "A"),
            "spoke " + (i + 1) + (branch > 0 ? "B" : "A"),
            g,
            "alloy",
            0.153,
          );
        }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2,
          g = new T.CylinderGeometry(0.014, 0.014, 0.025, 6);
        g.rotateX(Math.PI / 2);
        g.translate(Math.sin(a) * 0.061, Math.cos(a) * 0.061, 0);
        add("轮毂螺母 " + (i + 1), "lug nut " + (i + 1), g, "chrome", 0.194);
      }
      const cap = new T.CylinderGeometry(0.037, 0.037, 0.014, 24);
      cap.rotateX(Math.PI / 2);
      add("轮毂盖", "center cap", cap, "dark", 0.202);
      const caliper = rounded(0.082, 0.183, 0.075, 0.025);
      caliper.translate(0.19, 0, 0);
      add("制动卡钳", "brake caliper", caliper, "brake", 0.105);
      const valve = new T.CylinderGeometry(0.01, 0.01, 0.045, 8);
      valve.rotateX(Math.PI / 2);
      valve.translate(0, 0.235, 0);
      add("气门嘴", "valve stem", valve, "dark", 0.175);
    }
}
