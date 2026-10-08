import * as T from "three";
import { Registry } from "./registry";
import { lampOutline } from "./frontFascia";
import {
  rounded,
  frontPanel,
  noseX,
  tube,
  sculptedPanel,
  joinGeometry,
} from "./geometry";
// The front fascia curves sharply at the corners. Shape the optical inserts
// to that surface so their outer rims cannot cut through the clear cover.
function conformOptic(g: T.BufferGeometry, z: number, y: number) {
  const positions = g.getAttribute("position");
  const normals = g.getAttribute("normal");
  const normal = new T.Vector3();
  for (let i = 0; i < positions.count; i++) {
    const yy = y + positions.getY(i),
      zz = z + positions.getZ(i);
    positions.setX(i, positions.getX(i) + noseX(zz, yy) - noseX(z, y));
    const dy = (-0.22 * (yy - 0.98)) / (0.65 * 0.65);
    const dz = -1.08 * zz ** 3;
    normal.fromBufferAttribute(normals, i);
    normal
      .set(normal.x, normal.y - dy * normal.x, normal.z - dz * normal.x)
      .normalize();
    normals.setXYZ(i, normal.x, normal.y, normal.z);
  }
  return g;
}
export function buildLights(r: Registry) {
  for (const s of [-1, 1]) {
    const zh = s > 0 ? "左" : "右",
      en = s > 0 ? "Left" : "Right";
    const pts = lampOutline(s);
    r.add(
      "lights",
      zh + "前灯底座",
      en + " headlamp housing",
      sculptedPanel(
        pts,
        (u, y, d) => [
          noseX(u, y) + 0.035 + d,
          y,
          u * (1 - Math.max(0, (0.0125 - d) / 0.025) * 0.045),
        ],
        0.025,
      ),
      "optics",
    );
    r.add(
      "lights",
      zh + "前灯反光框",
      en + " headlamp reflector",
      joinGeometry(
        sculptedPanel(
          pts,
          (u, y, d) => [noseX(u, y) + 0.082 + d, y, u],
          0.008,
          [
            pts.map(([u, y]) => [
              s * 0.8 + (u - s * 0.8) * 0.94,
              1.252 + (y - 1.252) * 0.86,
            ]),
          ],
        ),
        ...[1.198, 1.32].map((y) =>
          frontPanel(
            [
              [s * 0.67, y],
              [s * 0.939, y + 0.011],
              [s * 0.948, y + 0.021],
              [s * 0.666, y + 0.011],
            ],
            0.073,
            0.004,
          ),
        ),
      ),
      "chrome",
    );
    for (let i = 0; i < 2; i++) {
      const z = s * (0.712 + i * 0.175),
        y = 1.262;
      // Recessed faceted reflector cups surround the convex projector lens.
      const bowl = new T.LatheGeometry(
        [
          new T.Vector2(0.028, -0.028),
          new T.Vector2(0.035, -0.024),
          new T.Vector2(0.048, -0.01),
          new T.Vector2(0.058, 0),
          new T.Vector2(0.06, 0.004),
          new T.Vector2(0.057, 0.007),
        ],
        24,
      )
        .rotateZ(-Math.PI / 2)
        .scale(1, 0.88, 1);
      const bezel = joinGeometry(
        bowl,
        new T.TorusGeometry(0.034, 0.0025, 8, 32)
          .rotateY(Math.PI / 2)
          .translate(0.002, 0, 0),
      );
      r.add(
        "lights",
        zh + "前灯透镜边框 " + i,
        en + " projector bezel " + i,
        conformOptic(bezel, z, y),
        "chrome",
        [noseX(z, y) + 0.079, y, z],
      );
      r.add(
        "lights",
        zh + "前灯透镜 " + i,
        en + " projector " + i,
        conformOptic(
          new T.SphereGeometry(0.032, 32, 20).scale(0.28, 1, 1),
          z,
          y,
        ),
        "projector",
        [noseX(z, y) + 0.079, y, z],
      );
    }
    r.add(
      "lights",
      zh + "前灯罩",
      en + " headlamp cover",
      frontPanel(pts, 0.089, 0.007),
      "lens",
    );
    r.add(
      "lights",
      zh + "日间行车灯",
      en + " daytime running light",
      frontPanel(
        [
          [s * 0.661, 1.16],
          [s * 0.968, 1.185],
          [s * 0.994, 1.212],
          [s * 0.987, 1.22],
          [s * 0.961, 1.197],
          [s * 0.663, 1.174],
        ],
        0.086,
        0.004,
      ),
      "light",
    );
    r.add(
      "lights",
      zh + "转向灯",
      en + " turn signal",
      frontPanel(
        [
          [s * 0.973, 1.21],
          [s * 0.992, 1.215],
          [s * 0.986, 1.28],
          [s * 0.967, 1.276],
        ],
        0.087,
        0.005,
      ),
      "amber",
    );
    const fog = [
      [0.756, 0.716],
      [0.966, 0.744],
      [0.957, 0.905],
      [0.817, 0.907],
    ];
    r.add(
      "lights",
      zh + "雾灯底座",
      en + " fog lamp bezel",
      frontPanel(
        fog.map(([z, y]) => [s * z, y]),
        0.078,
        0.025,
      ),
      "dark",
    );
    r.add(
      "lights",
      zh + "雾灯饰框",
      en + " fog lamp trim",
      joinGeometry(
        tube(
          [
            [0.767, 0.727],
            [0.953, 0.75],
            [0.947, 0.891],
            [0.829, 0.893],
          ].map(([z, y]) => [noseX(z, y) + 0.11, y, s * z]),
          0.008,
        ),
        conformOptic(
          new T.TorusGeometry(0.035, 0.005, 8, 32).rotateY(Math.PI / 2),
          s * 0.872,
          0.811,
        ).translate(noseX(s * 0.872, 0.811) + 0.108, 0.811, s * 0.872),
      ),
      "chrome",
    );
    const z = s * 0.872,
      y = 0.811;
    r.add(
      "lights",
      zh + "雾灯",
      en + " fog lamp",
      conformOptic(new T.SphereGeometry(0.03, 24, 16).scale(0.3, 1, 1), z, y),
      "projector",
      [noseX(z, y) + 0.108, y, z],
    );
    const rearMap = (offset: number) => (u: number, y: number, d: number) => [
      -2.396 + 0.065 * Math.pow(Math.abs(u), 4) - offset - d,
      y,
      u,
    ];
    const rearOutline = [
      [s * 0.53, 1.103],
      [s * 0.95, 1.115],
      [s * 0.969, 1.316],
      [s * 0.938, 1.343],
      [s * 0.55, 1.351],
    ];
    // The upper red chambers and lower clear strip share the curved tailgate skin.
    r.add(
      "lights",
      zh + "尾灯底座",
      en + " rear lamp housing",
      sculptedPanel(rearOutline, rearMap(0), 0.012),
      "rearReflector",
    );
    r.add(
      "lights",
      zh + "尾灯罩",
      en + " rear lamp cover",
      sculptedPanel(
        [
          [s * 0.54, 1.176],
          [s * 0.958, 1.183],
          [s * 0.969, 1.316],
          [s * 0.938, 1.343],
          [s * 0.55, 1.351],
        ],
        rearMap(0.021),
        0.005,
      ),
      "redLens",
    );
    for (let i = 0; i < 2; i++) {
      const y = 1.203 + i * 0.079;
      const outline = [
        [0.569, y],
        [0.924, y + 0.007],
        [0.941, y + 0.025],
        [0.921, y + 0.048],
        [0.576, y + 0.045],
      ];
      const hole = [
        [0.59, y + 0.013],
        [0.917, y + 0.02],
        [0.924, y + 0.026],
        [0.911, y + 0.034],
        [0.594, y + 0.031],
      ];
      r.add(
        "lights",
        zh + "尾灯光导 " + i,
        en + " rear light guide " + i,
        sculptedPanel(
          outline.map(([u, v]) => [s * u, v]),
          rearMap(0.019),
          0.005,
          [hole.map(([u, v]) => [s * u, v])],
        ),
        "red",
      );
    }
    const clearStrip = sculptedPanel(
      [
        [s * 0.544, 1.112],
        [s * 0.946, 1.124],
        [s * 0.95, 1.17],
        [s * 0.549, 1.161],
      ],
      rearMap(0.017),
      0.005,
    );
    const prisms = Array.from({ length: 18 }, (_, i) => {
      const u = s * (0.562 + i * 0.021);
      return rounded(0.008, 0.033, 0.004, 0.001).translate(
        rearMap(0.025)(u, 1.139, 0)[0],
        1.139 + i * 0.00055,
        u,
      );
    });
    r.add(
      "lights",
      zh + "倒车灯",
      en + " reversing lamp",
      joinGeometry(clearStrip, ...prisms),
      "clearOptics",
    );
  }
  r.add(
    "lights",
    "高位制动灯",
    "High mounted brake light",
    rounded(0.018, 0.022, 0.5, 0.006),
    "red",
    [-2.343, 1.874, 0],
  );
}
