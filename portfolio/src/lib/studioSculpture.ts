import { BufferGeometry, Color, Curve, Float32BufferAttribute, TubeGeometry, Vector3 } from "three";

const TAU = 2 * Math.PI;

function sample(angle: number, point: Vector3) {
  const radius = 1.27 + 0.48 * Math.cos(3 * angle);
  return point.set(
    radius * Math.cos(2 * angle),
    radius * Math.sin(2 * angle),
    0.54 * Math.sin(3 * angle),
  );
}

// A continuous rounded section avoids the pinched highlights of a fractional-power superellipse.
function surfaceSampler() {
  const point = new Vector3();
  const tangent = new Vector3();
  const previous = new Vector3();
  const radial = new Vector3();
  const across = new Vector3();
  const widthAxis = new Vector3();
  const depthAxis = new Vector3();
  return (angle: number, section: number, target: Vector3) => {
    sample(angle, point);
    sample(angle + 0.001, tangent).sub(sample(angle - 0.001, previous)).normalize();
    radial.set(point.x, point.y, 0).addScaledVector(tangent, -radial.dot(tangent)).normalize();
    across.crossVectors(tangent, radial);
    const twist = angle + 0.64 * Math.sin(3 * angle);
    widthAxis.copy(radial).multiplyScalar(Math.cos(twist)).addScaledVector(across, Math.sin(twist));
    depthAxis.crossVectors(tangent, widthAxis);
    const width = 0.28 + 0.066 * Math.cos(3 * angle - 0.65);
    const x = Math.cos(section);
    const y = Math.sin(section);
    return target.copy(point)
      .addScaledVector(widthAxis, width * x * (1 + 0.18 * y * y))
      .addScaledVector(depthAxis, 0.145 * y * (1 + 0.3 * x * x));
  };
}

/** Closed, shared-vertex ribbon with normals sampled from its continuous surface. */
export function createStudioSculpture(segments: number, sides: number) {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const surface = surfaceSampler();
  const vertex = new Vector3();
  const along = new Vector3();
  const around = new Vector3();
  const previous = new Vector3();
  const normal = new Vector3();
  const orchid = new Color("#4830b4");
  const lavender = new Color("#e0d6ff");
  const color = new Color();

  for (let i = 0; i < segments; i++) {
    const angle = TAU * i / segments;
    color.copy(orchid).lerp(lavender, 0.5 + 0.5 * Math.cos(3 * angle + 0.4));

    for (let j = 0; j < sides; j++) {
      const section = TAU * j / sides;
      surface(angle, section, vertex);
      surface(angle + 0.0001, section, along).sub(surface(angle - 0.0001, section, previous));
      surface(angle, section + 0.0001, around).sub(surface(angle, section - 0.0001, previous));
      normal.crossVectors(around, along).normalize();
      positions.push(vertex.x, vertex.y, vertex.z);
      normals.push(normal.x, normal.y, normal.z);
      colors.push(color.r, color.g, color.b);

      const a = i * sides + j;
      const b = i * sides + (j + 1) % sides;
      const c = ((i + 1) % segments) * sides + j;
      const d = ((i + 1) % segments) * sides + (j + 1) % sides;
      indices.push(a, b, c, b, d, c);
    }
  }

  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export function createStudioContour(section: number, segments: number) {
  const surface = surfaceSampler();
  class Contour extends Curve<Vector3> {
    constructor() { super(); }

    getPoint(t: number, target = new Vector3()) {
      return surface(t * TAU, section, target);
    }
  }
  return new TubeGeometry(new Contour(), segments, 0.012, 6, true);
}
