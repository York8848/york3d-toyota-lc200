import { Registry } from "./registry";
import { buildBody } from "./body";
import { buildLights } from "./lights";
import { buildWheels } from "./wheels";
import { buildCabin } from "./cabin";
import { buildStructure } from "./structure";
export function buildVehicle() {
  const r = new Registry();
  r.group.name = "vehicle";
  buildBody(r);
  buildLights(r);
  buildWheels(r);
  buildCabin(r);
  buildStructure(r);
  return {
    group: r.group,
    parts: r.parts,
    triangles: r.parts.reduce(
      (n, p) =>
        n +
        (p.mesh.geometry.index?.count ??
          p.mesh.geometry.getAttribute("position").count) /
          3,
      0,
    ),
    dispose() {
      for (const p of r.parts) {
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      }
    },
  };
}
export type Vehicle = ReturnType<typeof buildVehicle>;
