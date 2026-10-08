import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import * as T from "three";
import {
  sideWindows,
  sideGlassZ,
  windshieldOutline,
  windshieldMap,
  offsetOutline,
  rearWindow,
  rearUpperMap,
} from "../src/model/glazing";
import {
  grilleOutline,
  lampOutline,
  fasciaOffset,
} from "../src/model/frontFascia";
import { noseX, hoodPoint } from "../src/model/geometry";
import { buildVehicle } from "../src/model/buildVehicle";
import {
  applyExplosion,
  arrayDirection,
  buildArray,
  corners,
  fitDistance,
} from "../src/scene/explosion";
import { categories } from "../src/model/parameters";
const a = buildVehicle(),
  b = buildVehicle();
const hash = (v: typeof a) =>
  createHash("sha256")
    .update(
      JSON.stringify(
        v.parts.map((p) => [
          p.id,
          p.category,
          p.nameZh,
          p.nameEn,
          p.originalPosition.toArray(),
          p.originalRotation.toArray(),
          p.originalScale.toArray(),
          Array.from(p.mesh.geometry.getAttribute("position").array),
          p.mesh.geometry.index
            ? Array.from(p.mesh.geometry.index.array)
            : null,
        ]),
      ),
    )
    .digest("hex");
assert.equal(
  hash(a),
  hash(b),
  "Deterministic geometry, order, transforms, metadata",
);
assert.equal(new Set(a.parts.map((p) => p.id)).size, a.parts.length);
let actual = 0;
a.group.traverse((o) => {
  if (o instanceof T.Mesh) actual++;
});
assert.equal(actual, a.parts.length);
const fingerprints = new Set<string>();
for (const p of a.parts) {
  const g = p.mesh.geometry,
    positions = g.getAttribute("position");
  assert(positions.count > 0);
  g.computeBoundingBox();
  assert(!g.boundingBox!.isEmpty());
  for (const list of [
    Array.from(positions.array),
    g.getAttribute("normal") ? Array.from(g.getAttribute("normal").array) : [],
    p.originalPosition.toArray(),
    p.originalRotation.toArray().slice(0, 3),
    p.originalScale.toArray(),
    p.boundingBox.min.toArray(),
    p.boundingBox.max.toArray(),
    p.center.toArray(),
    p.dimensions.toArray(),
    p.explosionDirection.toArray(),
  ])
    assert(
      list.every((v) => Number.isFinite(v)),
      `finite ${p.id}`,
    );
  assert(p.dimensions.x > 0 && p.dimensions.y > 0 && p.dimensions.z > 0);
  assert(p.mesh.visible);
  assert(p.mesh.material.opacity > 0);
  assert.equal(p.mesh.parent, a.group);
  assert.equal(p.mesh.userData.componentId, p.id);
  const fingerprint = JSON.stringify([
    p.originalPosition.toArray(),
    Array.from(positions.array),
  ]);
  assert(!fingerprints.has(fingerprint), `duplicate ${p.id}`);
  fingerprints.add(fingerprint);
  // Each mesh can be raycast in isolation from all six primary directions.
  let hit = false;
  const box = p.boundingBox,
    center = box.getCenter(new T.Vector3()),
    radius = box.getSize(new T.Vector3()).length() + 1;
  for (const dir of [
    new T.Vector3(1, 0, 0),
    new T.Vector3(-1, 0, 0),
    new T.Vector3(0, 1, 0),
    new T.Vector3(0, -1, 0),
    new T.Vector3(0, 0, 1),
    new T.Vector3(0, 0, -1),
  ]) {
    const ray = new T.Raycaster(
      center.clone().addScaledVector(dir, radius),
      dir.clone().negate(),
    );
    if (ray.intersectObject(p.mesh, false).length) hit = true;
  }
  // Annular meshes can have a center hole; raycast toward one real triangle centroid.
  if (!hit) {
    const idx = g.index;
    for (let i = 0; i < Math.min(idx?.count ?? positions.count, 300); i += 3) {
      const point = new T.Vector3();
      for (let k = 0; k < 3; k++)
        point.add(
          new T.Vector3().fromBufferAttribute(
            positions,
            idx ? idx.getX(i + k) : i + k,
          ),
        );
      point.multiplyScalar(1 / 3).add(p.mesh.position);
      const ray = new T.Raycaster(
        point.clone().add(new T.Vector3(radius, radius, radius)),
        new T.Vector3(-1, -1, -1).normalize(),
      );
      if (ray.intersectObject(p.mesh, false).length) {
        hit = true;
        break;
      }
    }
  }
  assert(hit, `pickable ${p.id}`);
  const f = fitDistance(box, arrayDirection, 36, 1.3);
  assert(Number.isFinite(f.distance) && f.distance > 0);
}
// Per-component material isolation.
assert.equal(
  new Set(a.parts.map((p) => p.mesh.material.uuid)).size,
  a.parts.length,
);
// Measure assembled geometry at the hood seam; this catches missing shoulder surfaces.
const hood = a.parts.find((p) => p.nameEn === "Hood")!;
const worldVertices = (part: typeof hood) => {
  const points = part.mesh.geometry.getAttribute("position");
  return Array.from({ length: points.count }, (_, i) =>
    new T.Vector3().fromBufferAttribute(points, i).add(part.originalPosition),
  );
};
const hoodVertices = worldVertices(hood),
  key = (p: T.Vector3) =>
    [p.x, p.y, p.z].map((v) => Math.round(v * 10000)).join(",");
const hoodKeys = new Set(hoodVertices.map(key));
for (const v of hoodVertices)
  assert(
    hoodKeys.has(key(new T.Vector3(v.x, v.y, -v.z))),
    "Hood mirror symmetry",
  );
let minHoodSeam = Infinity,
  maxHoodSeam = 0;
for (const side of [-1, 1]) {
  const fender = a.parts.find(
    (p) => p.nameEn === (side > 0 ? "Left" : "Right") + " front fender",
  )!;
  const vertices = worldVertices(fender);
  for (let i = 0; i <= 40; i++) {
    const q = new T.Vector3(
      ...(hoodPoint(i / 40, side > 0 ? 1 : 0) as [number, number, number]),
    );
    const distance = Math.sqrt(
      Math.min(...vertices.map((v) => q.distanceToSquared(v))),
    );
    minHoodSeam = Math.min(minHoodSeam, distance);
    maxHoodSeam = Math.max(maxHoodSeam, distance);
    assert(
      distance >= 0.003 && distance <= 0.007,
      `Hood/fender seam must stay within 3–7 design mm: ${distance}`,
    );
  }
}
// Sample the actual assembled body just outside every window edge. Rays must
// hit a fitted surround near the glass, not pass through to the opposite side.
const bodyMeshes = a.parts
  .filter((p) => p.category === "body")
  .map((p) => p.mesh);
let glazingEdgeSamples = 0;
function checkPerimeter(
  points: number[][],
  check: (u: number, y: number) => void,
) {
  points.forEach((p, i) => {
    const q = points[(i + 1) % points.length];
    for (let j = 0; j <= 12; j++) {
      check(p[0] + ((q[0] - p[0]) * j) / 12, p[1] + ((q[1] - p[1]) * j) / 12);
      glazingEdgeSamples++;
    }
  });
}
for (const side of [-1, 1])
  for (const outline of sideWindows) {
    checkPerimeter(offsetOutline(outline, 0.014), (x, y) => {
      const hits = new T.Raycaster(
        new T.Vector3(x, y, side * 2),
        new T.Vector3(0, 0, -side),
      ).intersectObjects(bodyMeshes, false);
      assert(
        hits.some((hit) => Math.abs(hit.point.z - side * sideGlassZ(y)) < 0.04),
        `Unsealed side window at ${x}, ${y}`,
      );
    });
  }
checkPerimeter(offsetOutline(windshieldOutline, 0.014), (u, y) => {
  const surface = windshieldMap(u, y, 0);
  const hits = new T.Raycaster(
    new T.Vector3(3, y, u),
    new T.Vector3(-1, 0, 0),
  ).intersectObjects(bodyMeshes, false);
  assert(
    hits.some((hit) => Math.abs(hit.point.x - surface[0]) < 0.025),
    `Unsealed windshield at ${u}, ${y}`,
  );
});
checkPerimeter(offsetOutline(rearWindow, 0.014), (u, y) => {
  const surface = rearUpperMap(u, y, 0);
  const hits = new T.Raycaster(
    new T.Vector3(-3, y, u),
    new T.Vector3(1, 0, 0),
  ).intersectObjects(bodyMeshes, false);
  assert(
    hits.some((hit) => Math.abs(hit.point.x - surface[0]) < 0.035),
    `Unsealed rear windshield at ${u}, ${y}`,
  );
});
const windshield = a.parts.find((p) => p.nameEn === "Windshield")!;
const faceHit = new T.Raycaster(
  new T.Vector3(3, 1.65, 0),
  new T.Vector3(-1, 0, 0),
).intersectObject(windshield.mesh, false)[0];
assert(
  faceHit.face!.normal.x > 0,
  "Windshield front winding must face outward",
);
// Compare actual glass/frame depths relative to the same curved datum.
const windInner = offsetOutline(windshieldOutline, -0.012);
const windOuter = offsetOutline(windshieldOutline, 0.012);
const roofFrame = a.parts.find((p) => p.nameEn === "Roof")!.mesh;
let maxWindshieldFlushError = 0;
for (let edge = 0; edge < windInner.length; edge++)
  for (let sample = 1; sample < 12; sample++) {
    const depth = (outline: number[][], mesh: T.Object3D) => {
      const p = outline[edge],
        q = outline[(edge + 1) % outline.length],
        t = sample / 12;
      const u = p[0] + (q[0] - p[0]) * t,
        y = p[1] + (q[1] - p[1]) * t;
      const base = windshieldMap(u, y, 0)[0];
      const hits = new T.Raycaster(
        new T.Vector3(3, y, u),
        new T.Vector3(-1, 0, 0),
      ).intersectObject(mesh, false);
      const hit = hits.find((h) => Math.abs(h.point.x - base) < 0.025);
      assert(hit, "Windshield flush sample must meet its assembly surface");
      return hit.point.x - base;
    };
    maxWindshieldFlushError = Math.max(
      maxWindshieldFlushError,
      Math.abs(depth(windInner, windshield.mesh) - depth(windOuter, roofFrame)),
    );
  }
assert(
  maxWindshieldFlushError < 0.0015,
  "Windshield and frame must be within 1.5 design mm in depth",
);
const normalAttribute = windshield.mesh.geometry.getAttribute("normal");
const surfaceNormal = new T.Vector3().fromBufferAttribute(
  normalAttribute,
  faceHit.face!.a,
);
assert(
  surfaceNormal.dot(faceHit.face!.normal) > 0.9,
  "Reflected surface normals must agree with winding",
);
let maxTireRadius = 0;
const tires = a.parts.filter((p) => p.nameEn.endsWith("all-terrain tire"));
assert.equal(tires.length, 4);
for (const tire of tires) {
  for (const vertex of worldVertices(tire)) {
    maxTireRadius = Math.max(
      maxTireRadius,
      Math.hypot(
        vertex.x - tire.originalPosition.x,
        vertex.y - tire.originalPosition.y,
      ),
    );
  }
}
assert(
  maxTireRadius <= 0.407,
  "Off-road tread must preserve overall tyre diameter and arch clearance",
);
// The fascia must continue around the grille and both lamp openings.
const fascia = a.parts.find((p) => p.nameEn === "Front bumper")!.mesh;
let frontFasciaSamples = 0;
for (const outline of [grilleOutline, lampOutline(-1), lampOutline(1)]) {
  const border = offsetOutline(outline, 0.011);
  border.forEach((p, i) => {
    const q = border[(i + 1) % border.length];
    for (let j = 1; j < 12; j++) {
      const u = p[0] + ((q[0] - p[0]) * j) / 12,
        y = p[1] + ((q[1] - p[1]) * j) / 12;
      const hits = new T.Raycaster(
        new T.Vector3(3, y, u),
        new T.Vector3(-1, 0, 0),
      ).intersectObject(fascia, false);
      assert(
        hits.some(
          (hit) => Math.abs(hit.point.x - (noseX(u, y) + fasciaOffset)) < 0.02,
        ),
        `Fascia opening gap at ${u},${y}`,
      );
      frontFasciaSamples++;
    }
  });
}
// Check the assembled rear exhaust against conservative cylinders enclosing
// both rear tyres. This guards against the former route through the wheel space.
const exhaust = a.parts.find(
  (p) => p.nameEn === "Rear exhaust pipe (schematic)",
)!;
const exhaustVertices = exhaust.mesh.geometry.getAttribute("position");
let minExhaustTireClearance = Infinity;
for (let i = 0; i < exhaustVertices.count; i++) {
  const x = exhaustVertices.getX(i) + exhaust.originalPosition.x;
  const y = exhaustVertices.getY(i) + exhaust.originalPosition.y;
  const z = exhaustVertices.getZ(i) + exhaust.originalPosition.z;
  for (const side of [-1, 1]) {
    const radial = Math.hypot(x + 1.425, y - 0.46) - 0.407;
    const lateral = Math.abs(z - side * 0.84) - 0.145;
    const distance =
      Math.hypot(Math.max(0, radial), Math.max(0, lateral)) +
      Math.min(Math.max(radial, lateral), 0);
    minExhaustTireClearance = Math.min(minExhaustTireClearance, distance);
  }
}
assert(
  minExhaustTireClearance > 0.015,
  "Rear exhaust must stay clear of rear tyre envelopes",
);
assert(
  exhaust.boundingBox.min.x < -2.4,
  "Tailpipe outlet must sit behind the rear wheels",
);
// Check actual assembled mesh direction, not merely the seat angle parameter.
const seatBackrests = a.parts.filter(
  (p) => p.category === "cabin" && p.nameEn.endsWith(" backrest"),
);
assert.equal(
  seatBackrests.length,
  6,
  "Six seat assemblies represent the seven seating places",
);
for (const seat of seatBackrests) {
  const v = seat.mesh.geometry.getAttribute("position");
  let loX = 0,
    hiX = 0,
    loN = 0,
    hiN = 0;
  for (let i = 0; i < v.count; i++) {
    const y = v.getY(i) + seat.originalPosition.y,
      x = v.getX(i) + seat.originalPosition.x;
    if (y < seat.boundingBox.min.y + 0.1) {
      loX += x;
      loN++;
    }
    if (y > seat.boundingBox.max.y - 0.1) {
      hiX += x;
      hiN++;
    }
  }
  assert(
    hiX / hiN < loX / loN - 0.035,
    "Backrest top must lean toward the rear (-X)",
  );
}
assert.equal(
  a.parts.filter((p) => /^Row \d headrest$/.test(p.nameEn)).length,
  7,
);
const spare = a.parts.find(
  (p) => p.nameEn === "Underfloor spare wheel (schematic)",
)!;
assert(
  Math.abs(spare.dimensions.x - 0.81) < 0.005 &&
    Math.abs(spare.dimensions.z - 0.81) < 0.005,
  "Full-size spare must lie horizontally with the same tyre diameter",
);
assert(spare.dimensions.y > 0.28 && spare.dimensions.y < 0.43);
assert(spare.boundingBox.min.y > 0.2, "Spare must not sink toward the ground");
const spareMount = a.parts.find(
  (p) => p.nameEn === "Frame crossmember (schematic)" && p.center.x < -2,
)!.mesh;
let spareMountSamples = 0,
  minSpareMountGap = Infinity;
for (let i = -8; i <= 8; i++) {
  if (Math.abs(i) < 2) continue; // Central retainer intentionally joins the mount.
  const ray = new T.Raycaster(
    new T.Vector3(-2.05, 0.9, i * 0.045),
    new T.Vector3(0, -1, 0),
  );
  const tyreHits = ray.intersectObject(spare.mesh, false),
    mountHits = ray.intersectObject(spareMount, false);
  if (tyreHits.length && mountHits.length) {
    const gap =
      Math.min(...mountHits.map((h) => h.point.y)) -
      Math.max(...tyreHits.map((h) => h.point.y));
    assert(gap > 0.01, "Spare rubber/rim must clear the overhead crossmember");
    minSpareMountGap = Math.min(minSpareMountGap, gap);
    spareMountSamples++;
  }
}
assert(spareMountSamples >= 12);
let minSpareExhaustClearance = Infinity;
for (let i = 0; i < exhaustVertices.count; i++) {
  const x = exhaustVertices.getX(i) + exhaust.originalPosition.x;
  const y = exhaustVertices.getY(i) + exhaust.originalPosition.y;
  const z = exhaustVertices.getZ(i) + exhaust.originalPosition.z;
  const radial = Math.hypot(x + 1.99, z) - 0.407,
    axial = Math.abs(y - 0.355) - 0.145;
  const distance =
    Math.hypot(Math.max(0, radial), Math.max(0, axial)) +
    Math.min(Math.max(radial, axial), 0);
  minSpareExhaustClearance = Math.min(minSpareExhaustClearance, distance);
}
assert(
  minSpareExhaustClearance > 0.015,
  "Existing exhaust route must clear full-size spare envelope",
);
const layout = buildArray(a.parts),
  samples = [0, 25, 50, 75, 100];
for (const sample of [...samples, 0, 100, 0, 100, 0]) {
  applyExplosion(a.parts, layout, sample);
  for (const p of a.parts) {
    assert(p.mesh.position.toArray().every(Number.isFinite));
    assert.equal(
      p.mesh.geometry.getAttribute("position").count,
      b.parts.find((q) => q.id === p.id)!.mesh.geometry.getAttribute("position")
        .count,
    );
  }
}
let maxResetError = 0;
for (const p of a.parts) {
  maxResetError = Math.max(
    maxResetError,
    p.mesh.position.distanceTo(p.originalPosition),
  );
  assert(
    p.mesh.quaternion.angleTo(
      new T.Quaternion().setFromEuler(p.originalRotation),
    ) < 1e-7,
  );
  assert(p.mesh.scale.distanceTo(p.originalScale) < 1e-9);
}
assert(maxResetError < 1e-9);
applyExplosion(a.parts, layout, 100);
const box = new T.Box3().setFromObject(a.group);
const arrayTests = [];
for (const [width, height] of [
  [1048, 686],
  [1122, 818],
  [390, 439],
]) {
  const camera = new T.PerspectiveCamera(36, width / height, 0.005, 1000),
    fit = fitDistance(
      box,
      arrayDirection,
      36,
      width / height,
      1.18,
      a.parts.flatMap((p) => corners(new T.Box3().setFromObject(p.mesh))),
    );
  camera.position
    .copy(fit.target)
    .addScaledVector(arrayDirection, fit.distance);
  camera.lookAt(fit.target);
  camera.updateMatrixWorld();
  const rects = a.parts.map((p) => {
    const points = corners(new T.Box3().setFromObject(p.mesh)).map((v) =>
      v.project(camera),
    );
    const rect = {
      id: p.id,
      minX: Math.min(...points.map((v) => v.x)),
      maxX: Math.max(...points.map((v) => v.x)),
      minY: Math.min(...points.map((v) => v.y)),
      maxY: Math.max(...points.map((v) => v.y)),
    };
    assert(
      rect.minX >= -1 && rect.maxX <= 1 && rect.minY >= -1 && rect.maxY <= 1,
      `within camera ${p.id}`,
    );
    return rect;
  });
  let overlaps = 0;
  for (let i = 0; i < rects.length; i++)
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i],
        b = rects[j];
      if (
        a.minX < b.maxX &&
        a.maxX > b.minX &&
        a.minY < b.maxY &&
        a.maxY > b.minY
      )
        overlaps++;
    }
  assert.equal(overlaps, 0, `Projected array overlap ${width}x${height}`);
  arrayTests.push({ width, height, overlaps, cameraDistance: fit.distance });
}
applyExplosion(a.parts, layout, 0);
// Cast through each mounting footprint in the assembled model. Each pedestal
// must span the actual roof skin and reach the upper rail, without a floating gap.
a.group.updateMatrixWorld(true);
const roofSkin = a.parts.find((p) => p.nameEn === "Roof")!.mesh;
let roofRailMountSamples = 0;
for (const side of [-1, 1]) {
  const rail = a.parts.find(
    (p) => p.nameEn === (side > 0 ? "Left" : "Right") + " roof rail",
  )!.mesh;
  for (const x of [-1.88, -0.88, 0.035]) {
    for (const dx of [-0.025, 0, 0.025]) {
      const origin = new T.Vector3(x + dx, 2.2, side * 0.716);
      const ray = new T.Raycaster(origin, new T.Vector3(0, -1, 0));
      const skin = ray.intersectObject(roofSkin, false)[0];
      const railHits = ray.intersectObject(rail, false);
      assert(
        skin && railHits.length >= 2,
        "Roof mounting footprint has real geometry",
      );
      const y = railHits.map((hit) => hit.point.y);
      assert(
        Math.min(...y) <= skin.point.y + 0.001,
        "Roof pedestal must touch the roof",
      );
      assert(
        Math.max(...y) >= 1.96,
        "Roof pedestal must connect to the upper rail",
      );
      roofRailMountSamples++;
    }
  }
}
const report = {
  generatedAt: new Date().toISOString(),
  meshCount: a.parts.length,
  catalogCount: a.parts.length,
  triangles: a.triangles,
  categories: Object.fromEntries(
    categories.map((c) => [c, a.parts.filter((p) => p.category === c).length]),
  ),
  deterministicHash: hash(a),
  checks: [
    "deterministic geometry + IDs + order",
    "catalog equals actual mesh traversal",
    "unique IDs",
    "hood mirror symmetry and assembled hood/fender seam within 3–7 design mm",
    "all side-window, front and rear windshield perimeter rays hit fitted body surrounds",
    "windshield reflected normals agree with outward triangle winding",
    "44 windshield/frame samples within 1.5 design mm in depth",
    "continuous fascia around grille and both headlamp apertures",
    "all-terrain tread stays within wheel-arch radial clearance",
    "18 actual roof-rail mounting rays span the roof skin and upper rail",
    "rear exhaust clears both conservative rear tyre envelopes by at least 15 design mm",
    "seat backrests lean rearward, with seven headrests and 2+3+2 seating",
    "horizontal full-size spare clears overhead crossmember and exhaust",
    "finite vertices, normals, transforms, bounds",
    "nonempty geometry",
    "no exact duplicate geometry at same location",
    "all components visible, independently raycastable and fit-able",
    "one material per component",
    "0/25/50/75/100 transforms",
    "0 → 100 → 0 repeated without drift",
    "default projected array rectangles do not overlap",
    "camera contains all array bounds",
  ],
  hoodSeamDesignMm: {
    min: minHoodSeam * 1000,
    max: maxHoodSeam * 1000,
    samples: 82,
  },
  glazingEdgeSamples,
  frontFasciaSamples,
  roofRailMountSamples,
  spareMountSamples,
  minSpareMountGapDesignMm: minSpareMountGap * 1000,
  minSpareExhaustClearanceDesignMm: minSpareExhaustClearance * 1000,
  minExhaustTireClearanceDesignMm: minExhaustTireClearance * 1000,
  windshieldFlushMaxDesignMm: maxWindshieldFlushError * 1000,
  tireRadiusDesignMm: maxTireRadius * 1000,
  tireArchRadialClearanceDesignMm: (0.466 - maxTireRadius) * 1000,
  maxResetError,
  arrayTests,
};
mkdirSync("reports", { recursive: true });
writeFileSync("reports/model-validation.json", JSON.stringify(report, null, 2));
writeFileSync(
  "reports/component-catalog.json",
  JSON.stringify(
    a.parts.map(
      ({
        id,
        category,
        nameZh,
        nameEn,
        representation,
        originalPosition,
        originalRotation,
        originalScale,
        parent,
        boundingBox,
        center,
        dimensions,
        explosionDirection,
        explosionWeight,
      }) => ({
        id,
        category,
        nameZh,
        nameEn,
        representation,
        originalPosition: originalPosition.toArray(),
        originalRotation: originalRotation.toArray(),
        originalScale: originalScale.toArray(),
        parent,
        boundingBox: {
          min: boundingBox.min.toArray(),
          max: boundingBox.max.toArray(),
        },
        center: center.toArray(),
        dimensions: dimensions.toArray(),
        explosionDirection: explosionDirection.toArray(),
        explosionWeight,
      }),
    ),
    null,
    2,
  ),
);
console.log(JSON.stringify(report, null, 2));
a.dispose();
b.dispose();
