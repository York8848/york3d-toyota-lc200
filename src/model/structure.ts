import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Registry } from "./registry";
import { rearExhaust } from "./exhaust";
import { spareWheel } from "./spareWheel";
import { rounded, tube, loft } from "./geometry";
import { parameters as p } from "./parameters";
/** Architecture follows the LC200 ladder frame, front IFS and four-link live rear axle.
 * Component castings and mounting dimensions remain illustrative, not service CAD. */
export function buildStructure(r: Registry) {
  const add = (
    zh: string,
    en: string,
    g: T.BufferGeometry,
    pos: number[] = [0, 0, 0],
    finish: Parameters<Registry["add"]>[4] = "steel",
  ) => r.add("structure", zh + "（示意）", en + " (schematic)", g, finish, pos);
  const shaft = (a: number[], b: number[], radius = 0.035) =>
    tube([a, b], radius);
  const cylinder = (radius: number, length: number, axis: "x" | "z" = "x") => {
    const g = new T.CylinderGeometry(radius, radius, length, 24);
    if (axis === "x") g.rotateZ(Math.PI / 2);
    else g.rotateX(Math.PI / 2);
    return g;
  };
  const f = p.wheelbase / 2,
    b = -f;
  for (const s of [-1, 1]) {
    const section = new T.Shape([
      new T.Vector2(-0.066, -0.078),
      new T.Vector2(0.066, -0.078),
      new T.Vector2(0.066, 0.078),
      new T.Vector2(-0.066, 0.078),
    ]);
    const path = new T.CatmullRomCurve3([
      new T.Vector3(-2.18, 0.43, s * 0.52),
      new T.Vector3(-1.45, 0.56, s * 0.53),
      new T.Vector3(-0.7, 0.39, s * 0.55),
      new T.Vector3(0.56, 0.39, s * 0.52),
      new T.Vector3(1.43, 0.46, s * 0.44),
      new T.Vector3(2.17, 0.45, s * 0.44),
    ]);
    add(
      "梯形车架纵梁",
      "Ladder frame rail",
      new T.ExtrudeGeometry(section, {
        steps: 40,
        bevelEnabled: false,
        extrudePath: path,
      }),
    );
  }
  for (const [x, y, w] of [
    [-2.05, 0.45, 1.05],
    [-0.95, 0.43, 1.1],
    [0.0, 0.39, 1.05],
    [0.92, 0.43, 0.94],
    [2.07, 0.45, 0.92],
  ])
    if (x === -2.05) {
      // Rise over the full-size spare, with the ends attached to the frame rails.
      const section = new T.Shape([
        new T.Vector2(-0.05, -0.03),
        new T.Vector2(0.05, -0.03),
        new T.Vector2(0.05, 0.03),
        new T.Vector2(-0.05, 0.03),
      ]);
      const path = new T.CatmullRomCurve3(
        [
          [-0.525, 0.45],
          [-0.46, 0.54],
          [-0.34, 0.6],
          [0.34, 0.6],
          [0.46, 0.54],
          [0.525, 0.45],
        ].map(([z, yy]) => new T.Vector3(x, yy, z)),
      );
      add(
        "车架横梁",
        "Frame crossmember",
        new T.ExtrudeGeometry(section, {
          steps: 40,
          bevelEnabled: false,
          extrudePath: path,
        }),
      );
    } else
      add("车架横梁", "Frame crossmember", rounded(0.12, 0.11, w, 0.01), [
        x,
        y,
        0,
      ]);
  r.add(
    "cabin",
    "座舱阶梯底板",
    "Stepped cabin floor",
    loft(
      [
        { x: -2.24, y: 0.792, w: 0.825 },
        { x: -1.32, y: 0.792, w: 0.825 },
        { x: -1.05, y: 0.615, w: 0.825 },
        { x: 0.77, y: 0.615, w: 0.825 },
      ],
      0,
      0.035,
    ),
    "dark",
  );
  add(
    "发动机下护板",
    "Engine skid plate",
    rounded(1.02, 0.04, 0.88, 0.014),
    [1.44, 0.325, 0],
    "dark",
  );
  // Longitudinal V8: two angled banks, central plenum, front radiator and rear gearbox.
  add(
    "V8 缸体",
    "V8 crankcase",
    rounded(0.68, 0.27, 0.38, 0.035),
    [1.32, 0.76, 0],
  );
  for (const s of [-1, 1]) {
    const bank = rounded(0.68, 0.24, 0.245, 0.035);
    bank.rotateX((s * Math.PI) / 4);
    add(s > 0 ? "V8 左缸列" : "V8 右缸列", "V8 cylinder bank", bank, [
      1.32,
      0.954,
      s * 0.212,
    ]);
  }
  add(
    "V8 发动机上盖",
    "V8 engine cover",
    rounded(0.56, 0.065, 0.54, 0.032),
    [1.3, 1.151, 0],
    "dark",
  );
  const runners: T.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++)
    for (const s of [-1, 1])
      runners.push(
        tube(
          [
            [1.1 + i * 0.135, 1.12, 0],
            [1.1 + i * 0.135, 1.15, s * 0.12],
            [1.1 + i * 0.135, 1.045, s * 0.25],
          ],
          0.027,
        ),
      );
  const manifold = mergeGeometries(runners);
  runners.forEach((g) => g.dispose());
  add("V8 进气歧管", "V8 intake manifold", manifold);
  add(
    "空气滤清器壳",
    "Air filter housing",
    rounded(0.34, 0.23, 0.28, 0.04),
    [1.68, 1.007, -0.59],
    "dark",
  );
  add(
    "进气软管",
    "Intake duct",
    tube(
      [
        [1.68, 1.05, -0.47],
        [1.69, 1.18, -0.28],
        [1.53, 1.18, 0],
      ],
      0.057,
    ),
    [0, 0, 0],
    "dark",
  );
  const radParts: T.BufferGeometry[] = [rounded(0.075, 0.48, 1.15, 0.015)];
  for (let i = 0; i < 30; i++) {
    const fin = new T.BoxGeometry(0.007, 0.424, 0.009);
    fin.translate(-0.043, 0, -0.53 + i * 0.0365);
    radParts.push(fin.toNonIndexed());
    fin.dispose();
  }
  const radiator = mergeGeometries(radParts);
  radParts.forEach((g) => g.dispose());
  add("散热器总成", "Radiator", radiator, [2.085, 0.962, 0], "dark");
  add(
    "风扇护圈",
    "Fan shroud",
    new T.TorusGeometry(0.208, 0.027, 8, 32).rotateY(Math.PI / 2),
    [2.009, 0.927, 0],
    "dark",
  );
  add(
    "蓄电池",
    "Battery",
    rounded(0.285, 0.21, 0.22, 0.012),
    [1.87, 0.99, 0.584],
    "dark",
  );
  add(
    "冷却液储罐",
    "Coolant reservoir",
    rounded(0.19, 0.2, 0.14, 0.03),
    [1.88, 0.95, -0.73],
    "fabric",
  );
  r.add(
    "cabin",
    "前围防火墙",
    "Firewall",
    rounded(0.05, 0.62, 1.59, 0.025),
    "dark",
    [0.81, 0.955, 0],
  );
  add(
    "油底壳",
    "Oil sump",
    rounded(0.45, 0.125, 0.35, 0.035),
    [1.34, 0.566, 0],
  );
  add(
    "变速箱钟形壳",
    "Transmission bell housing",
    new T.CylinderGeometry(0.18, 0.225, 0.21, 24).rotateZ(Math.PI / 2),
    [0.858, 0.65, 0],
  );
  add(
    "纵置自动变速箱",
    "Longitudinal automatic transmission",
    new T.CylinderGeometry(0.11, 0.17, 0.58, 12).rotateZ(Math.PI / 2),
    [0.485, 0.6, 0],
  );
  add(
    "四驱分动箱",
    "Four wheel drive transfer case",
    rounded(0.27, 0.26, 0.34, 0.045),
    [0.045, 0.534, 0.066],
  );
  add(
    "燃油箱",
    "Fuel tank",
    rounded(0.83, 0.205, 0.6, 0.035),
    [-0.73, 0.464, -0.17],
    "dark",
  );
  add(
    "前传动轴",
    "Front propeller shaft",
    shaft([0.04, 0.49, 0.19], [1.37, 0.44, 0.1], 0.03),
  );
  add(
    "后传动轴",
    "Rear propeller shaft",
    shaft([-0.09, 0.49, 0.0], [b, 0.46, 0], 0.039),
  );
  const frontDiff = new T.SphereGeometry(0.122, 24, 16);
  frontDiff.scale(1, 0.9, 1.15);
  add("前差速器壳", "Front differential", frontDiff, [f, 0.46, 0.08]);
  for (const s of [-1, 1])
    add(
      "前半轴",
      "Front CV half shaft",
      shaft([f, 0.46, s * 0.19], [f, 0.46, s * 0.805], 0.026),
    );
  add("后整体桥壳", "Rear live axle housing", cylinder(0.052, 1.58, "z"), [
    b,
    0.455,
    0,
  ]);
  const rearDiff = new T.SphereGeometry(0.15, 24, 16);
  rearDiff.scale(1.1, 1, 0.85);
  add("后差速器壳", "Rear differential", rearDiff, [b, 0.455, 0]);
  for (const s of [-1, 1]) {
    const label = s > 0 ? "左" : "右";
    for (const upper of [false, true]) {
      const y = upper ? 0.672 : 0.386,
        zi = upper ? 0.48 : 0.39,
        zo = upper ? 0.757 : 0.784,
        span = upper ? 0.185 : 0.28;
      add(
        label + "前" + (upper ? "上" : "下") + "叉臂",
        "Front " + (upper ? "upper" : "lower") + " wishbone",
        tube(
          [
            [f - span, y, s * zi],
            [f, y - 0.015, s * zo],
            [f + span, y, s * zi],
          ],
          upper ? 0.026 : 0.037,
        ),
      );
    }
    add(
      label + "前转向节",
      "Front steering knuckle",
      shaft([f, 0.36, s * 0.793], [f, 0.685, s * 0.77], 0.04),
    );
    add(
      label + "前减振器",
      "Front damper",
      shaft([f, 0.412, s * 0.65], [f, 0.84, s * 0.59], 0.026),
    );
    const coil = Array.from({ length: 100 }, (_, i) => {
      const t = i / 99,
        a = t * 12 * Math.PI;
      return [
        f + Math.sin(a) * 0.074,
        0.465 + t * 0.32,
        s * (0.64 - 0.047 * t) + Math.cos(a) * 0.074,
      ];
    });
    add(
      label + "前螺旋弹簧",
      "Front coil spring",
      tube(coil, 0.011),
      [0, 0, 0],
      "dark",
    );
    // Rear axle is located by two upper and two lower longitudinal links, plus a lateral rod.
    add(
      label + "后下纵臂",
      "Rear lower trailing link",
      shaft([-0.53, 0.37, s * 0.52], [b - 0.08, 0.4, s * 0.64], 0.03),
    );
    add(
      label + "后上纵臂",
      "Rear upper trailing link",
      shaft([-0.78, 0.53, s * 0.32], [b + 0.06, 0.56, s * 0.37], 0.025),
    );
    add(
      label + "后减振器",
      "Rear damper",
      shaft([b - 0.16, 0.38, s * 0.68], [b + 0.15, 0.785, s * 0.57], 0.028),
    );
    const rearCoil = Array.from({ length: 100 }, (_, i) => {
      const t = i / 99,
        a = t * 12 * Math.PI;
      return [
        b + Math.sin(a) * 0.092,
        0.51 + t * 0.25,
        s * 0.53 + Math.cos(a) * 0.092,
      ];
    });
    add(
      label + "后螺旋弹簧",
      "Rear coil spring",
      tube(rearCoil, 0.014),
      [0, 0, 0],
      "dark",
    );
  }
  add("前转向齿条", "Steering rack", cylinder(0.035, 1.22, "z"), [
    f - 0.22,
    0.46,
    0,
  ]);
  add(
    "后横向定位杆",
    "Rear lateral locating rod",
    shaft([b + 0.1, 0.62, -0.52], [b + 0.1, 0.455, 0.68], 0.025),
  );
  for (const x of [f, b])
    add(
      x > 0 ? "前防倾杆" : "后防倾杆",
      x > 0 ? "Front stabilizer bar" : "Rear stabilizer bar",
      tube(
        [
          [x - 0.17, 0.42, -0.75],
          [x + 0.19, 0.37, -0.5],
          [x + 0.19, 0.37, 0.5],
          [x - 0.17, 0.42, 0.75],
        ],
        0.02,
      ),
      [0, 0, 0],
      "dark",
    );
  for (const s of [-1, 1])
    add(
      "V8 排气前管",
      "V8 exhaust downpipe",
      tube(
        [
          [1.5, 0.83, s * 0.37],
          [0.95, 0.54, s * 0.35],
          [0.42, 0.3, s * 0.38],
          [-0.24, 0.32, s * 0.4],
        ],
        0.025,
      ),
    );
  add("排气后管", "Rear exhaust pipe", rearExhaust(), [0, 0, 0], "exhaust");
  add(
    "消声器",
    "Muffler",
    rounded(0.51, 0.14, 0.22, 0.045),
    [-0.66, 0.317, 0.67],
  );
  add(
    "车底备胎",
    "Underfloor spare wheel",
    spareWheel(),
    [-1.99, 0.355, 0],
    "spare",
  );
}
