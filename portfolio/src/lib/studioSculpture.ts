import { BufferGeometry, Color, Float32BufferAttribute, Vector3 } from "three";

const TAU = 2 * Math.PI;

function sample(angle: number, point: Vector3) {
  const radius = 1.27 + 0.48 * Math.cos(3 * angle);
  return point.set(
    radius * Math.cos(2 * angle),
    radius * Math.sin(2 * angle),
    0.54 * Math.sin(3 * angle),
  );
}

/** Sweep a softly beveled ribbon around a closed trefoil. Both seams share vertices and normals. */
export function createStudioSculpture(segments: number, sides: number) {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const point = new Vector3();
  const tangent = new Vector3();
  const previous = new Vector3();
  const radial = new Vector3();
  const across = new Vector3();
  const widthAxis = new Vector3();
  const depthAxis = new Vector3();
  const vertex = new Vector3();
  const orchid = new Color("#6555d9");
  const lavender = new Color("#c8c9ff");
  const color = new Color();

  for (let i = 0; i < segments; i++) {
    const angle = TAU * i / segments;
    sample(angle, point);
    sample(angle + 0.001, tangent).sub(sample(angle - 0.001, previous)).normalize();
    radial.set(point.x, point.y, 0).addScaledVector(tangent, -radial.dot(tangent)).normalize();
    across.crossVectors(tangent, radial);
    const twist = angle + 0.64 * Math.sin(3 * angle);
    widthAxis.copy(radial).multiplyScalar(Math.cos(twist)).addScaledVector(across, Math.sin(twist));
    depthAxis.crossVectors(tangent, widthAxis);
    const width = 0.28 + 0.066 * Math.cos(3 * angle - 0.65);
    color.copy(orchid).lerp(lavender, 0.5 + 0.5 * Math.cos(3 * angle + 0.4));

    for (let j = 0; j < sides; j++) {
      const section = TAU * j / sides;
      const x = Math.cos(section);
      const y = Math.sin(section);
      vertex.copy(point)
        .addScaledVector(widthAxis, width * Math.sign(x) * Math.pow(Math.abs(x), 0.62))
        .addScaledVector(depthAxis, 0.122 * Math.sign(y) * Math.pow(Math.abs(y), 0.62));
      positions.push(vertex.x, vertex.y, vertex.z);
      colors.push(color.r, color.g, color.b);

      const a = i * sides + j;
      const b = i * sides + (j + 1) % sides;
      const c = ((i + 1) % segments) * sides + j;
      const d = ((i + 1) % segments) * sides + (j + 1) % sides;
      indices.push(a, b, c, b, d, c);
    }
  }

  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
