import * as THREE from "three";

// A real squeeze tube has a flattened, rounded-rectangle cross-section (flat
// front/back, rounded edges) -- not a smooth ellipse. THREE.LatheGeometry can
// only sweep a perfect circle, so we build the ring cross-section ourselves
// with a superellipse ("squircle") formula, which gives flat faces with
// rounded corners. `sq` (squareness) near 2 reads as a circle/ellipse, higher
// values read as a rounded rectangle.
function buildSquircleExtrusion(profile, radialSegments = 64, { capBottom = true, capTop = true } = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const ringVerts = radialSegments + 1;

  const squirclePoint = (t, w, d, sq) => {
    const c = Math.cos(t);
    const s = Math.sin(t);
    return [Math.sign(c) * Math.pow(Math.abs(c), 2 / sq) * w, Math.sign(s) * Math.pow(Math.abs(s), 2 / sq) * d];
  };

  for (let i = 0; i < profile.length; i++) {
    const { y, w, d, sq } = profile[i];
    for (let j = 0; j <= radialSegments; j++) {
      const t = (j / radialSegments) * Math.PI * 2;
      const [x, z] = squirclePoint(t, w, d, sq);
      positions.push(x, y, z);
      uvs.push(j / radialSegments, i / (profile.length - 1));
    }
  }

  for (let i = 0; i < profile.length - 1; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * ringVerts + j;
      const b = a + 1;
      const c = a + ringVerts;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  // The side-wall loop above never closes the ends -- without an explicit
  // cap disc the bottom/top ring is an open rim, and grazing camera angles
  // look straight through the hollow interior. Fan each cap from its own
  // center point out to that ring.
  const addCap = (ringIndex, flip) => {
    const { y, w, d, sq } = profile[ringIndex];
    const centerIdx = positions.length / 3;
    positions.push(0, y, 0);
    uvs.push(0.5, 0.5);
    const ringStart = ringIndex * ringVerts;
    for (let j = 0; j < radialSegments; j++) {
      const a = ringStart + j;
      const b = ringStart + j + 1;
      if (flip) indices.push(centerIdx, b, a);
      else indices.push(centerIdx, a, b);
    }
  };
  if (capBottom) addCap(0, true);
  if (capTop) addCap(profile.length - 1, false);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Base -> straight flattened body -> shoulder narrows -> neck goes round.
const TUBE_PROFILE = [
  { y: 0.0, w: 0.6, d: 0.26, sq: 5 },
  { y: 0.05, w: 0.66, d: 0.32, sq: 5 },
  { y: 0.4, w: 0.67, d: 0.33, sq: 4.5 },
  { y: 1.5, w: 0.66, d: 0.32, sq: 4.5 },
  { y: 1.66, w: 0.52, d: 0.28, sq: 3.5 },
  { y: 1.8, w: 0.32, d: 0.22, sq: 2.6 },
  { y: 1.92, w: 0.18, d: 0.17, sq: 2.1 },
  { y: 1.98, w: 0.14, d: 0.14, sq: 2 },
];

const CAP_PROFILE = [
  { y: 0.0, w: 0.23, d: 0.23, sq: 2 },
  { y: 0.02, w: 0.245, d: 0.245, sq: 2 },
  { y: 0.3, w: 0.245, d: 0.245, sq: 2 },
  { y: 0.36, w: 0.2, d: 0.2, sq: 2 },
  { y: 0.4, w: 0.1, d: 0.1, sq: 2 },
];

const CENTER_Y = 0.99;

export function createTubeBodyGeometry() {
  const geometry = buildSquircleExtrusion(TUBE_PROFILE, 64);
  geometry.translate(0, -CENTER_Y, 0);
  return geometry;
}

export function createCapGeometry() {
  return buildSquircleExtrusion(CAP_PROFILE, 48);
}

// A small raised spout under the cap, with a visible nozzle opening.
export function createSpoutGeometry() {
  return new THREE.CylinderGeometry(0.1, 0.13, 0.12, 24);
}

export function createNozzleHoleGeometry() {
  return new THREE.CircleGeometry(0.045, 16);
}

export const TUBE_NECK_TOP_Y = 1.98 - CENTER_Y;
