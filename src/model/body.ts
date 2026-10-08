import { Registry } from "./registry";
import { roofRail } from "./roofRails";
import {
  grilleOutline,
  lampOutline,
  fasciaOutline,
  fasciaOffset,
} from "./frontFascia";
import {
  loft,
  gridShell,
  joinGeometry,
  hoodPoint,
  fenderEdge,
  arch,
  rounded,
  tube,
  outlineTube,
  sculptedPanel,
  sideWidth,
  frontPanel,
  noseX,
} from "./geometry";
import { parameters as p } from "./parameters";
import {
  sideWindows,
  sideGlassZ,
  windshieldOutline,
  windshieldSurround,
  windshieldMap,
  offsetOutline,
  rearWindow,
  rearUpperMap,
} from "./glazing";

export function buildBody(r: Registry) {
  const axle = p.wheelbase / 2,
    wy = p.wheelRadius + 0.055;
  const hood = gridShell(hoodPoint, 40, 48, 0.018);
  r.add("body", "发动机盖", "Hood", hood, "paint");
  r.add(
    "body",
    "车顶",
    "Roof",
    joinGeometry(
      loft(
        Array.from({ length: 24 }, (_, i) => {
          const t = i / 23;
          return {
            x: -2.21 + 2.645 * t,
            y: 1.856 + 0.04 * Math.sin(Math.PI * t),
            w: 0.795 + 0.035 * Math.sin(Math.PI * t),
          };
        }),
        0.052,
        0.045,
      ),
      sculptedPanel(windshieldSurround, windshieldMap, 0.023, [
        offsetOutline(windshieldOutline, -0.004),
      ]),
      // The header closes the crown of the roof down to the windshield frame.
      gridShell(
        (u, v) => {
          const q = u * 2 - 1;
          const frame = windshieldMap(q * 0.842, 1.874, 0.0115);
          const roof = [0.435, 1.856 + 0.052 * (1 - q * q), q * 0.795];
          return frame.map((n, i) => n * (1 - v) + roof[i] * v);
        },
        48,
        8,
        0.016,
      ),
    ),
    "paint",
  );

  for (const s of [-1, 1]) {
    const zh = s > 0 ? "左" : "右",
      en = s > 0 ? "Left" : "Right";
    const side = (pts: number[][]) =>
      sculptedPanel(pts, (x, y, d) => [x, y, s * (sideWidth(x, y) + d)], 0.028);
    const glass = (pts: number[][], depth = 0.015) =>
      sculptedPanel(pts, (x, y, d) => [x, y, s * (sideGlassZ(y) + d)], depth);
    const windowFrame = (index: number) =>
      sculptedPanel(
        offsetOutline(sideWindows[index], 0.026),
        (x, y, d) => [x, y, s * (sideGlassZ(y) + 0.01 + d)],
        0.018,
        [offsetOutline(sideWindows[index], -0.004)],
      );
    const beltShoulder = (x0: number, y0: number, x1: number, y1: number) =>
      gridShell(
        (t, v) => {
          const x = x0 + (x1 - x0) * t,
            y = y0 + (y1 - y0) * t;
          return [
            x,
            y - 0.018 * v,
            s *
              ((sideGlassZ(y) + 0.009) * (1 - v) +
                (sideWidth(x, y - 0.018) + 0.014) * v),
          ];
        },
        24,
        6,
        0.018,
      );
    const radius = 0.469;
    const front = Array.from({ length: 25 }, (_, i) =>
      fenderEdge(i / 24, s).slice(0, 2),
    );
    front.push([2.255, 1.13], [2.29, 0.59], [1.94, 0.51]);
    for (let i = 0; i <= 36; i++) {
      const a = (i * Math.PI) / 36;
      front.push([axle + radius * Math.cos(a), wy + radius * Math.sin(a)]);
    }
    front.push([0.835, 0.515]);
    const shoulder = gridShell(
      (t, v) => {
        const inner = hoodPoint(t, s > 0 ? 1 : 0),
          outer = fenderEdge(t, s);
        inner[2] += s * 0.005;
        inner[1] -= 0.001;
        return inner.map((n, i) => n * (1 - v) + outer[i] * v);
      },
      40,
      10,
      0.02,
    );
    r.add(
      "body",
      zh + "前翼子板",
      en + " front fender",
      joinGeometry(
        side(front),
        shoulder,
        gridShell(
          (t, v) => {
            const y = 1.16 + 0.198 * t;
            const lampZ =
              y < 1.292
                ? 1.012 + ((y - 1.172) / 0.12) * -0.011
                : 1.001 + ((y - 1.292) / 0.065) * -0.061;
            const u = s * (lampZ + 0.022);
            const inner = [2.255, y, s * (sideWidth(2.255, y) + 0.014)];
            const outer = [noseX(u, y) + fasciaOffset + 0.009, y, u];
            return inner.map((n, i) => n * (1 - v) + outer[i] * v);
          },
          24,
          8,
          0.012,
        ),
      ),
      "paint",
    );
    const rear = [
      [-2.33, 1.35],
      [-1.19, 1.365],
    ];
    const start = Math.acos((axle - 1.19) / radius);
    for (let i = 0; i <= 30; i++) {
      const a = start + ((Math.PI - start) * i) / 30;
      rear.push([-axle + radius * Math.cos(a), wy + radius * Math.sin(a)]);
    }
    rear.push([-2.31, 0.53], [-2.36, 0.85]);
    r.add(
      "body",
      zh + "后翼子板",
      en + " rear quarter",
      joinGeometry(
        side(rear),
        windowFrame(2),
        beltShoulder(-2.19, 1.398, -1.19, 1.392),
        gridShell(
          (t, v) => {
            const y = 0.74 + t * 0.61,
              u = s * 0.946;
            const inner = [-2.374 + 0.065 * Math.abs(u) ** 4, y, u];
            const outer = [-2.337, y, s * (sideWidth(-2.337, y) + 0.014)];
            return inner.map((n, i) => n * (1 - v) + outer[i] * v);
          },
          24,
          6,
          0.014,
        ),
        side([
          [-2.34, 1.33],
          [-1.19, 1.35],
          [-1.19, 1.399],
          [-2.2, 1.399],
          [-2.34, 1.355],
        ]),
      ),
      "paint",
    );
    r.add(
      "body",
      zh + "前车门",
      en + " front door",
      joinGeometry(
        side([
          [-0.32, 0.54],
          [0.827, 0.54],
          [0.827, 1.411],
          [-0.32, 1.39],
        ]),
        windowFrame(0),
        beltShoulder(-0.32, 1.411, 0.827, 1.432),
      ),
      "paint",
    );
    const door = [
      [-1.182, 1.365],
      [-0.328, 1.39],
      [-0.328, 0.54],
    ];
    const a0 = Math.asin((0.54 - wy) / 0.488),
      a1 = Math.acos((axle - 1.167) / 0.488);
    for (let i = 0; i <= 24; i++) {
      const a = a0 + ((a1 - a0) * i) / 24;
      door.push([-axle + 0.488 * Math.cos(a), wy + 0.488 * Math.sin(a)]);
    }
    r.add(
      "body",
      zh + "后车门",
      en + " rear door",
      joinGeometry(
        side(door),
        windowFrame(1),
        beltShoulder(-1.182, 1.392, -0.328, 1.41),
      ),
      "paint",
    );
    // Rounded flares blend back into the surrounding sheet metal.
    for (const cx of [-axle, axle]) {
      const pts: number[][] = [];
      for (let i = 0; i <= 40; i++) {
        const a = (i * Math.PI) / 40;
        pts.push([cx + 0.522 * Math.cos(a), wy + 0.522 * Math.sin(a)]);
      }
      for (let i = 40; i >= 0; i--) {
        const a = (i * Math.PI) / 40;
        pts.push([cx + 0.466 * Math.cos(a), wy + 0.466 * Math.sin(a)]);
      }
      r.add(
        "body",
        zh + (cx > 0 ? "前" : "后") + "轮眉",
        en + (cx > 0 ? " front" : " rear") + " wheel arch",
        sculptedPanel(
          pts,
          (x, y, d) => {
            const rr = Math.hypot(x - cx, y - wy),
              f = (rr - 0.466) / 0.056;
            return [
              x,
              y,
              s * (sideWidth(x, y) + 0.018 + 0.013 * Math.sin(Math.PI * f) + d),
            ];
          },
          0.018,
        ),
        "paint",
      );
      const liner = arch(cx, wy, 0.476, 0.074);
      liner.scale(1, 1, 3);
      r.add(
        "body",
        zh + (cx > 0 ? "前" : "后") + "轮罩内衬",
        en + (cx > 0 ? " front" : " rear") + " wheelhouse liner",
        liner,
        "rubber",
        [0, 0, s * 0.85],
      );
    }
    r.add(
      "body",
      zh + "踏板",
      en + " running board",
      rounded(1.86, 0.075, 0.21, 0.027),
      "dark",
      [0, 0.45, s * 1.008],
    );
    r.add(
      "body",
      zh + "踏板外沿",
      en + " step edge",
      rounded(1.84, 0.032, 0.028, 0.01),
      "chrome",
      [0, 0.45, s * 1.116],
    );
    r.add(
      "body",
      zh + "车门下饰条",
      en + " lower door moulding",
      side([
        [-0.95, 0.61],
        [0.76, 0.61],
        [0.76, 0.659],
        [-0.95, 0.659],
      ]),
      "chrome",
      [0, 0, s * 0.026],
    );
    for (const x of [-0.08, -0.95])
      r.add(
        "body",
        zh + "车门把手",
        en + " door handle",
        rounded(0.17, 0.042, 0.043, 0.018),
        "chrome",
        [x, 1.278, s * 1.004],
      );
    sideWindows.forEach((pts, i) => {
      r.add(
        "glass",
        zh + ["前侧窗", "后侧窗", "第三排侧窗"][i],
        en + [" front window", " rear window", " quarter window"][i],
        glass(pts),
        "glass",
      );
      const path = [...pts, pts[0]].map(([x, y]) => [
        x,
        y,
        s * (sideGlassZ(y) + 0.012),
      ]);
      r.add(
        "body",
        zh + ["前窗胶条", "后窗胶条", "后角窗胶条"][i],
        en + " window seal " + (i + 1),
        outlineTube(path, 0.0055),
        "dark",
      );
    });
    const pillars = [
      [
        [0.82, 1.415],
        [0.495, 1.841],
        [0.408, 1.88],
        [0.354, 1.847],
        [0.765, 1.415],
      ],
      [
        [-0.353, 1.396],
        [-0.268, 1.396],
        [-0.268, 1.873],
        [-0.353, 1.873],
      ],
      [
        [-1.293, 1.38],
        [-1.21, 1.38],
        [-1.18, 1.864],
        [-1.265, 1.864],
      ],
      [
        [-2.34, 1.34],
        [-2.176, 1.38],
        [-2.095, 1.742],
        [-1.988, 1.837],
        [-2.177, 1.86],
        [-2.28, 1.75],
      ],
    ];
    pillars.forEach((pts, i) =>
      r.add(
        "body",
        zh + "ABCD"[i] + "柱",
        en + " " + "ABCD"[i] + " pillar",
        i === 3
          ? joinGeometry(
              glass(pts, 0.045),
              gridShell(
                (t, v) => {
                  const y = 1.35 + t * 0.487;
                  const width =
                    y <= 1.57
                      ? 0.94 + ((y - 1.365) / 0.205) * -0.025
                      : 0.915 + ((y - 1.57) / 0.267) * -0.089;
                  const u = s * (width + 0.007),
                    q = Math.max(0, Math.min(1, (y - 1.39) / 0.44));
                  const inner = [
                    -2.374 +
                      0.165 * q +
                      0.065 * Math.abs(u) ** 4 * (1 - 0.7 * q),
                    y,
                    u,
                  ];
                  const x =
                    y < 1.75
                      ? -2.34 + ((y - 1.34) / 0.41) * 0.06
                      : -2.28 + ((y - 1.75) / 0.11) * 0.103;
                  const outer = [x, y, s * (sideGlassZ(y) + 0.0225)];
                  return inner.map((n, j) => n * (1 - v) + outer[j] * v);
                },
                32,
                6,
                0.016,
              ),
            )
          : glass(pts, 0.045),
        i === 1 || i === 2 ? "dark" : "paint",
      ),
    );
    r.add(
      "body",
      zh + "车顶侧围",
      en + " roof side frame",
      joinGeometry(
        glass(
          [
            [-2.16, 1.781],
            [-1.96, 1.831],
            [-1.27, 1.843],
            [-0.36, 1.86],
            [0.28, 1.86],
            [0.467, 1.822],
            [0.375, 1.902],
            [-1.98, 1.904],
            [-2.2, 1.868],
          ],
          0.045,
        ),
        gridShell(
          (t, v) => {
            const x = -2.19 + t * 2.59,
              q = (x + 2.21) / 2.645;
            const w = 0.795 + 0.035 * Math.sin(Math.PI * q);
            const roofY = 1.856 + 0.04 * Math.sin(Math.PI * q);
            return [
              x,
              roofY * (1 - v) + 1.889 * v,
              s * (w * (1 - v) + (sideGlassZ(1.889) + 0.014) * v),
            ];
          },
          40,
          5,
          0.018,
        ),
      ),
      "paint",
    );
    r.add(
      "body",
      zh + "窗下饰条",
      en + " beltline trim",
      tube(
        [
          [-2.2, 1.383, s * 0.958],
          [-1.2, 1.383, s * 0.958],
          [-0.3, 1.402, s * 0.954],
          [0.81, 1.416, s * 0.953],
        ],
        0.01,
      ),
      "chrome",
    );
    r.add(
      "body",
      zh + "后视镜支架",
      en + " mirror mount",
      rounded(0.14, 0.073, 0.18, 0.025),
      "dark",
      [0.66, 1.445, s * 0.992],
    );
    r.add(
      "body",
      zh + "后视镜壳",
      en + " mirror housing",
      rounded(0.225, 0.151, 0.215, 0.066),
      "paint",
      [0.652, 1.501, s * 1.103],
    );
    r.add(
      "glass",
      zh + "后视镜镜面",
      en + " mirror glass",
      rounded(0.015, 0.105, 0.175, 0.007),
      "chrome",
      [0.535, 1.508, s * 1.104],
    );
    r.add("body", zh + "车顶行李架", en + " roof rail", roofRail(s), "dark");
  }
  r.add(
    "glass",
    "前风挡",
    "Windshield",
    sculptedPanel(
      windshieldOutline,
      (u, y, d) => windshieldMap(u, y, d + 0.0055),
      0.012,
    ),
    "glass",
  );
  r.add(
    "glass",
    "后风挡",
    "Rear windshield",
    sculptedPanel(rearWindow, rearUpperMap, 0.012),
    "glass",
  );
  r.add(
    "glass",
    "天窗",
    "Sunroof",
    gridShell(
      (u, v) => {
        const x = -0.635 + 0.73 * u,
          z = (v * 2 - 1) * 0.52,
          t = (x + 2.21) / 2.645;
        const w = 0.795 + 0.035 * Math.sin(Math.PI * t);
        return [
          x,
          1.856 +
            0.04 * Math.sin(Math.PI * t) +
            0.052 * (1 - (z / w) ** 2) +
            0.002,
          z,
        ];
      },
      20,
      24,
      0.004,
    ),
    "glass",
  );
  const rearMap = (u: number, y: number, d: number) => [
    -2.374 +
      0.065 * Math.pow(Math.abs(u), 4) +
      0.032 *
        Math.exp(-Math.pow(u / 0.34, 6) - Math.pow((y - 1.015) / 0.135, 6)) -
      d,
    y,
    u,
  ];
  r.add(
    "body",
    "尾门",
    "Tailgate",
    joinGeometry(
      sculptedPanel(
        [
          [-0.92, 0.745],
          [0.92, 0.745],
          [0.937, 1.337],
          [0.856, 1.394],
          [-0.856, 1.394],
          [-0.937, 1.337],
        ],
        rearMap,
        0.045,
      ),
      sculptedPanel(
        [
          [-0.94, 1.365],
          [0.94, 1.365],
          [0.915, 1.57],
          [0.826, 1.837],
          [-0.826, 1.837],
          [-0.915, 1.57],
        ],
        rearUpperMap,
        0.029,
        [rearWindow.map(([u, y]) => [u * 0.995, 1.606 + (y - 1.606) * 0.986])],
      ),
    ),
    "paint",
  );
  r.add(
    "body",
    "尾门饰条",
    "Tailgate garnish",
    rounded(0.022, 0.058, 1.21, 0.009),
    "chrome",
    [-2.405, 1.215, 0],
  );
  r.add(
    "body",
    "尾门牌照底座",
    "Rear plate bracket",
    rounded(0.018, 0.173, 0.43, 0.009),
    "dark",
    [-2.378, 1.011, 0],
  );
  r.add(
    "body",
    "后保险杠",
    "Rear bumper",
    sculptedPanel(
      [
        [-0.98, 0.74],
        [0.98, 0.74],
        [0.974, 0.55],
        [0.86, 0.49],
        [-0.86, 0.49],
        [-0.974, 0.55],
      ],
      (u, y, d) => [
        -2.43 +
          0.085 * Math.pow(Math.abs(u), 4) +
          0.042 * ((y - 0.67) / 0.18) ** 2 -
          d,
        y,
        u,
      ],
      0.06,
    ),
    "paint",
  );
  r.add(
    "body",
    "后保险杠踏面",
    "Rear bumper step pad",
    rounded(0.075, 0.012, 1.34, 0.005),
    "dark",
    [-2.43, 0.746, 0],
  );
  // One fitted fascia surrounds all three openings. Their boundaries are also
  // used by the lamps and grille, retaining only a narrow assembly seam.
  r.add(
    "body",
    "前保险杠",
    "Front bumper",
    joinGeometry(
      sculptedPanel(
        fasciaOutline,
        (u, y, d) => [noseX(u, y) + fasciaOffset + d, y, u],
        0.018,
        [
          offsetOutline(grilleOutline, 0.004),
          ...[-1, 1].map((side) => offsetOutline(lampOutline(side), 0.004)),
        ],
      ),
      ...[-1, 1].map((side) =>
        gridShell(
          (t, v) => {
            const y = 0.518 + t * 0.646;
            const width =
              y < 0.52
                ? 0.83 + ((y - 0.478) / 0.042) * 0.1
                : y < 0.69
                  ? 0.93 + ((y - 0.52) / 0.17) * 0.091
                  : 1.021 + ((y - 0.69) / 0.478) * 0.015;
            const u = side * width;
            const front = [noseX(u, y) + fasciaOffset + 0.009, y, u];
            const x =
              (y < 0.59
                ? 1.94 + ((y - 0.51) / 0.08) * 0.35
                : 2.29 - ((y - 0.59) / 0.54) * 0.035) + 0.004;
            const back = [x, y, side * (sideWidth(x, y) + 0.014)];
            return front.map((n, i) => n * (1 - v) + back[i] * v);
          },
          32,
          8,
          0.018,
        ),
      ),
    ),
    "paint",
  );
  r.add(
    "body",
    "前格栅底板",
    "Grille backing",
    frontPanel(
      [
        [-0.56, 1.34],
        [0.56, 1.34],
        [0.604, 1.24],
        [0.51, 0.962],
        [-0.51, 0.962],
        [-0.604, 1.24],
      ],
      0.035,
    ),
    "dark",
  );
  const outer = grilleOutline;
  const inner = [
    [-0.546, 1.338],
    [0.546, 1.338],
    [0.598, 1.252],
    [0.516, 0.975],
    [-0.516, 0.975],
    [-0.598, 1.252],
  ];
  r.add(
    "body",
    "格栅镀铬外框",
    "Grille surround",
    sculptedPanel(outer, (u, y, d) => [noseX(u, y) + 0.079 + d, y, u], 0.022, [
      inner,
    ]),
    "chrome",
  );
  for (let i = 0; i < 4; i++) {
    const y = 1.001 + i * 0.101,
      w = 0.52 + i * 0.015;
    r.add(
      "body",
      "前格栅横条 " + (i + 1),
      "Grille bar " + (i + 1),
      frontPanel(
        [
          [-w, y],
          [w, y],
          [w + 0.014, y + 0.043],
          [-w - 0.014, y + 0.043],
        ],
        0.081,
        0.025,
      ),
      "chrome",
    );
  }
  // Bevelled ribbons reproduce the broad, varying strokes of the three ovals.
  // The reference is Toyota's own emblem page; all geometry is built locally.
  const ellipse = (rz: number, ry: number, cy = 0) =>
    Array.from({ length: 96 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2;
      return [Math.cos(a) * rz, cy + Math.sin(a) * ry];
    });
  const badgeRings = [
    { outer: ellipse(0.112, 0.075), inner: ellipse(0.101, 0.066) },
    { outer: ellipse(0.03, 0.068), inner: ellipse(0.016, 0.049, -0.002) },
    {
      outer: ellipse(0.092, 0.035, 0.033),
      inner: ellipse(0.079, 0.022, 0.039),
    },
  ];
  const badge = (index: number, rear = false) => {
    const ring = badgeRings[index],
      scale = rear ? 0.7 : 1;
    return sculptedPanel(
      ring.outer,
      (u, y, d) => [
        rear
          ? -2.41 - d * 0.55
          : 2.549 + d * 0.55 + 0.003 * (1 - (u / 0.112) ** 2),
        (rear ? 1.327 : 1.185) + y * scale,
        u * scale,
      ],
      0.005,
      [ring.inner],
    );
  };
  r.add(
    "body",
    "前徽标底座",
    "Front emblem base",
    sculptedPanel(
      ellipse(0.114, 0.077),
      (u, y, d) => [2.541 + d, y + 1.185, u],
      0.009,
    ),
    "dark",
  );
  for (let i = 0; i < 3; i++)
    r.add(
      "body",
      ["椭圆徽标外环", "椭圆徽标竖环", "椭圆徽标横环"][i],
      ["Oval emblem outer", "Oval emblem vertical", "Oval emblem cross"][i],
      badge(i),
      "chrome",
    );
  r.add(
    "body",
    "后徽标底座",
    "Rear emblem base",
    sculptedPanel(
      ellipse(0.08, 0.054),
      (u, y, d) => [-2.401 - d, y + 1.327, u],
      0.009,
    ),
    "dark",
  );
  r.add(
    "body",
    "后尾门徽标",
    "Rear tailgate emblem",
    joinGeometry(badge(0, true), badge(1, true), badge(2, true)),
    "chrome",
  );
  r.add(
    "body",
    "前下部进气口",
    "Lower air intake",
    frontPanel(
      [
        [-0.71, 0.721],
        [0.71, 0.721],
        [0.759, 0.842],
        [-0.759, 0.842],
      ],
      0.094,
    ),
    "dark",
  );
  r.add(
    "body",
    "前保险杠下沿",
    "Front bumper lower lip",
    frontPanel(
      [
        [-0.7, 0.523],
        [0.7, 0.523],
        [0.78, 0.602],
        [-0.78, 0.602],
      ],
      0.078,
    ),
    "paint",
  );
  r.add(
    "body",
    "前牌照底座",
    "Front plate bracket",
    rounded(0.035, 0.174, 0.4, 0.01),
    "dark",
    [2.551, 0.795, 0],
  );
  r.add(
    "body",
    "后扰流板",
    "Rear roof spoiler",
    rounded(0.2, 0.055, 1.65, 0.022),
    "paint",
    [-2.215, 1.864, 0],
  );
  r.add(
    "body",
    "后窗雨刷",
    "Rear windshield wiper",
    outlineTube(
      [
        rearUpperMap(0.1, 1.448, 0.032),
        rearUpperMap(0.17, 1.479, 0.032),
        rearUpperMap(0.62, 1.49, 0.032),
      ],
      0.009,
    ),
    "dark",
  );
  for (const s of [-1, 1])
    r.add(
      "body",
      "雨刷",
      "Windshield wiper",
      tube(
        [
          windshieldMap(s * 0.06, 1.467, 0.018),
          windshieldMap(s * 0.58, 1.491, 0.018),
        ],
        0.009,
      ),
      "dark",
    );
}
