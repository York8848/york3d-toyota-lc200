import * as T from "three";
import { Registry } from "./registry";
import { rounded, tube } from "./geometry";
import {
  seatRecline,
  seatLift,
  seatBackPoint,
  seatCushion,
  cushionInsert,
  seatBack,
  backInsert,
  seatBolster,
  headrest,
  headrestPosts,
} from "./seats";
export function buildCabin(r: Registry) {
  const add = (
    zh: string,
    en: string,
    g: T.BufferGeometry,
    finish: Parameters<Registry["add"]>[4],
    pos: number[],
    rot: number[] = [0, 0, 0],
  ) => r.add("cabin", zh, en, g, finish, pos, rot);
  // User-selected seven-seat configuration: two front seats, a three-place second row, two third-row seats.
  const seat = (
    zh: string,
    en: string,
    x: number,
    z: number,
    w: number,
    front = false,
  ) => {
    const lift = seatLift(x),
      angle = seatRecline(x);
    const pivot = [x - 0.21, 0.86 + lift, z];
    add(zh + "坐垫", en + " cushion", seatCushion(x, w), "seatUpholstery", [
      x,
      0.81 + lift,
      z,
    ]);
    add(zh + "靠背", en + " backrest", seatBack(w), "leather", pivot, [
      0,
      0,
      angle,
    ]);
    add(
      zh + "坐垫中央衬片",
      en + " cushion insert",
      cushionInsert(w),
      "seatInsert",
      [x, 0.81 + lift, z],
    );
    add(
      zh + "靠背中央衬片",
      en + " backrest insert",
      backInsert(w),
      "seatInsert",
      pivot,
      [0, 0, angle],
    );
    if (front)
      for (const side of [-1, 1])
        add(
          zh + "侧向支撑",
          en + " side bolster",
          seatBolster(w, side),
          "leather",
          pivot,
          [0, 0, angle],
        );
  };
  for (const side of [-1, 1])
    seat(
      side > 0 ? "驾驶座" : "副驾驶座",
      side > 0 ? "Driver seat" : "Passenger seat",
      0.1,
      side * 0.465,
      0.47,
      true,
    );
  seat("第二排左侧双人座", "Second row two-place bench", -0.83, 0.238, 0.94);
  seat("第二排右侧单人座", "Second row one-place bench", -0.83, -0.48, 0.46);
  for (const side of [-1, 1])
    seat(
      "第三排" + (side > 0 ? "左" : "右") + "半幅座椅",
      "Third row split bench",
      -1.68,
      side * 0.36,
      0.54,
    );
  for (const [row, x, zs] of [
    [1, 0.1, [-0.465, 0.465]],
    [2, -0.83, [-0.48, 0, 0.48]],
    [3, -1.68, [-0.36, 0.36]],
  ] as [number, number, number[]][]) {
    for (const z of zs) {
      add(
        "第" + row + "排头枕",
        "Row " + row + " headrest",
        headrest(row === 1 ? 0.265 : 0.23),
        "leather",
        seatBackPoint(x, z, 0.005, 0.587).toArray(),
        [0, 0, seatRecline(x)],
      );
      add(
        "第" + row + "排头枕支架",
        "Row " + row + " headrest support",
        headrestPosts(x, z),
        "chrome",
        [0, 0, 0],
      );
    }
  }
  add(
    "仪表台",
    "Dashboard",
    rounded(0.36, 0.21, 1.62, 0.07),
    "dark",
    [0.66, 1.185, 0],
  );
  add(
    "仪表台饰板",
    "Dashboard trim",
    rounded(0.015, 0.055, 1.47, 0.004),
    "leather",
    [0.467, 1.21, 0],
  );
  add(
    "中控台",
    "Center console",
    rounded(0.79, 0.25, 0.25, 0.035),
    "dark",
    [0.17, 0.88, 0],
  );
  add(
    "中央扶手",
    "Center armrest",
    rounded(0.3, 0.085, 0.235, 0.03),
    "leather",
    [-0.17, 1.025, 0],
  );
  add(
    "中央信息屏",
    "Center display",
    rounded(0.018, 0.147, 0.255, 0.005),
    "glass",
    [0.401, 1.237, 0],
  );
  add(
    "仪表罩",
    "Instrument binnacle",
    rounded(0.16, 0.115, 0.39, 0.035),
    "dark",
    [0.46, 1.329, 0.44],
  );
  for (const z of [0.34, 0.54]) {
    const g = new T.CylinderGeometry(0.068, 0.068, 0.015, 24);
    g.rotateZ(Math.PI / 2);
    add("简化仪表", "Instrument dial", g, "glass", [0.368, 1.323, z]);
  }
  const steering = new T.TorusGeometry(0.15, 0.017, 8, 32);
  steering.rotateY(Math.PI / 2);
  add(
    "方向盘轮圈",
    "Steering wheel",
    steering,
    "dark",
    [0.26, 1.22, 0.46],
    [0, 0, -0.35],
  );
  add(
    "方向盘轮毂",
    "Steering hub",
    rounded(0.065, 0.068, 0.086, 0.02),
    "dark",
    [0.26, 1.22, 0.46],
  );
  for (const a of [0.12, Math.PI - 0.12, Math.PI * 1.32, Math.PI * 1.68]) {
    add(
      "方向盘辐条",
      "Steering spoke",
      tube(
        [
          [0.26, 1.22, 0.46],
          [
            0.26 + Math.sin(a) * 0.13 * Math.sin(0.35),
            1.22 + Math.sin(a) * 0.13 * Math.cos(0.35),
            0.46 + Math.cos(a) * 0.13,
          ],
        ],
        0.015,
      ),
      "chrome",
      [0, 0, 0],
    );
  }
  add(
    "换挡杆",
    "Gear selector",
    rounded(0.06, 0.14, 0.045, 0.016),
    "chrome",
    [0.24, 1.047, 0],
  );
  add(
    "中控台立面",
    "Center stack fascia",
    rounded(0.065, 0.33, 0.39, 0.025),
    "dark",
    [0.456, 1.117, 0],
  );
  add(
    "空调控制面板",
    "Climate control panel",
    rounded(0.018, 0.095, 0.305, 0.006),
    "steel",
    [0.417, 1.082, 0],
  );
  for (const z of [-0.215, 0.215, -0.675, 0.675])
    add(
      "仪表台出风口",
      "Dashboard air vent",
      rounded(0.022, 0.135, 0.076, 0.01),
      "dark",
      [0.394, 1.248, z],
    );
  for (const z of [-0.108, 0.108])
    add(
      "空调旋钮",
      "Climate control dial",
      new T.CylinderGeometry(0.023, 0.023, 0.02, 20).rotateZ(Math.PI / 2),
      "chrome",
      [0.398, 1.089, z],
    );
  add(
    "换挡面板",
    "Selector surround",
    rounded(0.22, 0.02, 0.21, 0.01),
    "steel",
    [0.22, 0.994, 0],
  );
  add(
    "杯架组件",
    "Cupholder assembly",
    tube(
      [
        [0.06, 1.015, -0.07],
        [-0.04, 1.015, -0.07],
        [-0.04, 1.015, 0.07],
        [0.06, 1.015, 0.07],
        [0.06, 1.015, -0.07],
      ],
      0.013,
    ),
    "dark",
    [0, 0, 0],
  );
  for (const s of [-1, 1])
    for (const x of [0.18, -0.74]) {
      const zh = (s > 0 ? "左" : "右") + (x > 0 ? "前" : "后"),
        en = (s > 0 ? "Left" : "Right") + (x > 0 ? " front" : " rear");
      add(
        zh + "门内饰",
        en + " door card",
        rounded(0.78, 0.41, 0.048, 0.025),
        "leather",
        [x, 0.973, s * 0.876],
      );
      add(
        zh + "门扶手",
        en + " door armrest",
        rounded(0.39, 0.06, 0.1, 0.02),
        "dark",
        [x, 1.03, s * 0.808],
      );
    }
}
