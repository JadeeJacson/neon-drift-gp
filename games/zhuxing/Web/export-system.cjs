// Developer-only export: seed content and orbital parameters, not a live save.
const fs = require("fs"),
  vm = require("vm"),
  path = require("path");
const r = __dirname,
  source = ["system.js", "orbits.js"]
    .map((n) => fs.readFileSync(path.join(r, n), "utf8"))
    .join("\n");
const d = vm.runInNewContext(source + ";({system:SYSTEM,layout:ORBIT_LAYOUT})");
const add = (a, b) => a.map((v, i) => v + b[i]),
  sub = (a, b) => a.map((v, i) => v - b[i]),
  scale = (a, s) => a.map((v) => v * s),
  norm = (a) => scale(a, 1 / Math.hypot(...a)),
  cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
const out = {
  version: "0.7",
  model:
    "Hierarchical prescribed Kepler orbits with independent fixed-axis spin; not N-body. SI units; game-scaled.",
  epoch: 0,
  star: d.system.star,
  bodies: [],
};
for (const [i, p] of d.system.bodies.entries()) {
  const [parent, a, e, spin, tilt] = d.layout[i],
    ax = norm(
      sub(p.pos, parent === null ? out.star.pos : d.system.bodies[parent].pos),
    ),
    az = norm(cross([0, 1, 0], ax)),
    mu =
      parent === null
        ? out.star.mu
        : d.system.bodies[parent].g * d.system.bodies[parent].r ** 2,
    n = Math.sqrt(mu / a ** 3);
  out.bodies.push({
    ...p,
    legacySeedPosition: p.pos,
    pos: undefined,
    mu: p.g * p.r ** 2,
    orbit: {
      parent,
      a,
      e,
      axisX: ax,
      axisZ: az,
      meanMotion: n,
      period: (2 * Math.PI) / n,
    },
    spin: {
      period: spin,
      axis: [
        Math.sin((tilt * Math.PI) / 180),
        Math.cos((tilt * Math.PI) / 180),
        0,
      ],
    },
  });
}
const positions = [],
  velocities = [];
function state(i) {
  if (positions[i]) return;
  const b = out.bodies[i],
    o = b.orbit;
  if (o.parent !== null) state(o.parent);
  positions[i] = add(
    o.parent === null ? out.star.pos : positions[o.parent],
    scale(o.axisX, o.a * (1 - o.e)),
  );
  velocities[i] = add(
    o.parent === null ? [0, 0, 0] : velocities[o.parent],
    scale(o.axisZ, (o.a * Math.sqrt(1 - o.e ** 2) * o.meanMotion) / (1 - o.e)),
  );
  b.positionAtEpoch = positions[i];
  b.velocityAtEpoch = velocities[i];
}
out.bodies.forEach((_, i) => state(i));
fs.writeFileSync(
  path.join(r, "system.json"),
  JSON.stringify(out, null, 2) + "\n",
);
console.log("Exported 11 epoch states and orbital parameters.");

const riftSource = fs.readFileSync(path.join(r, "singularities.js"), "utf8");
const riftData = vm.runInNewContext(
  riftSource.match(/const RIFT_DEFS = (\[[\s\S]*?\n\]);/)[1],
);
out.anomalies = riftData.map((x) => ({
  ...x,
  eventHorizonRadius: 14,
  influenceRadius: 230,
  coordinateFrame: "body-fixed",
  heightAboveReferenceRadius: x.height,
}));
fs.writeFileSync(
  path.join(r, "system.json"),
  JSON.stringify(out, null, 2) + "\n",
);
