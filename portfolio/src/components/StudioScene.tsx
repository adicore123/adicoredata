"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { MathUtils, type Group, type Mesh, type ShaderMaterial } from "three";
import { createStudioContour, createStudioSculpture } from "@/lib/studioSculpture";

export type StudioInput = { x: number; y: number; scroll: number; dragging: boolean };

const atmosphereVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const atmosphereFragment = `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vec2 p = (vUv - .5) * 2.;
    float r = length(p);
    float angle = atan(p.y, p.x);
    float wave = .72 + .025 * sin(angle * 3. + uTime * .24);
    float halo = exp(-pow((r - wave) * 26., 2.));
    float wash = exp(-r * r * 3.5);
    float light = .5 + .5 * sin(angle * 2. - uTime * .15);
    vec3 color = mix(vec3(.56, .42, .88), vec3(.86, .79, 1.), light);
    gl_FragColor = vec4(color, (halo * .23 + wash * .12) * (1. - smoothstep(.8, 1., r)));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const shadowFragment = `
  varying vec2 vUv;
  void main() {
    float r = length((vUv - .5) * 2.);
    gl_FragColor = vec4(.22, .12, .4, exp(-r * r * 4.) * .25 * (1. - smoothstep(.6, 1., r)));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function StudioLights({ compact }: { compact: boolean }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[-3, 5, 5]} intensity={2.6} color="#fff7ef" />
      <directionalLight position={[4, 1, -3]} intensity={1.8} color="#b7a0ff" />
      <Environment frames={1} resolution={compact ? 256 : 512} environmentIntensity={1.05}>
        <Lightformer form="rect" intensity={4} position={[-4, 4, 4]} target={[0, 0, 0]} scale={[4, 2.5, 1]} color="#fff9f2" />
        <Lightformer form="rect" intensity={3} position={[4, 1, 3]} target={[0, 0, 0]} scale={[0.65, 5, 1]} />
        <Lightformer form="rect" intensity={5} position={[0, 3, -4]} target={[0, 0, 0]} scale={[4, 1, 1]} color="#b3a0ff" />
        <Lightformer form="rect" intensity={1.5} position={[-3, -3, 2]} target={[0, 0, 0]} scale={[3, 2, 1]} color="#d7ccfa" />
      </Environment>
    </>
  );
}

// Lower resolution only after sustained slow frames; never below 1.5x.
// No React state updates or new allocations in the animation loop.
function RenderQuality({ active }: { active: boolean }) {
  const sample = useRef({ seconds: 0, frames: 0, warmup: 0 });
  useEffect(() => { sample.current = { seconds: 0, frames: 0, warmup: 0 }; }, [active]);
  useFrame(({ viewport, setDpr }, delta) => {
    if (!active || viewport.dpr <= 1.5) return;
    const s = sample.current;
    s.warmup += delta;
    if (s.warmup < 3 || delta > 0.25) return;
    s.seconds += delta;
    s.frames++;
    if (s.seconds < 3) return;
    if (s.frames / s.seconds < 36) setDpr(Math.max(1.5, viewport.dpr - 0.25));
    s.seconds = 0;
    s.frames = 0;
  });
  return null;
}

export default function StudioScene({ input, animate, compact, reduced }: {
  input: StudioInput; animate: boolean; compact: boolean; reduced: boolean;
}) {
  const sculpture = useRef<Group>(null);
  const orbit = useRef<Group>(null);
  const satellites = useRef<Group>(null);
  const core = useRef<Mesh>(null);
  const shadow = useRef<Mesh>(null);
  const atmosphere = useRef<ShaderMaterial>(null);
  const time = useRef(0);
  const aspect = useThree((state) => state.size.width / Math.max(state.size.height, 1));
  const fit = Math.min(1, aspect / 1.05);
  const geometries = useMemo(() => {
    const segments = compact ? 256 : 320;
    return [createStudioSculpture(segments, 40), createStudioContour(0, segments), createStudioContour(Math.PI, segments)];
  }, [compact]);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);

  useFrame(({ camera }, dt) => {
    if (!animate || !sculpture.current || !orbit.current || !satellites.current) return;
    const delta = Math.min(dt, 0.05);
    time.current += delta;
    const t = time.current;
    const { x, y, scroll } = input;
    const entrance = 1 - MathUtils.smoothstep(t, 0, 2.2);
    const group = sculpture.current;
    group.rotation.x = MathUtils.damp(group.rotation.x, 0.15 - y * 0.23 + scroll * 0.2, 4, delta);
    group.rotation.y = MathUtils.damp(group.rotation.y, -0.22 + entrance * 0.75 + x * 0.5 + scroll * 0.6 + Math.sin(t * 0.22) * 0.3, 4, delta);
    group.rotation.z = MathUtils.damp(group.rotation.z, 0.32 + Math.sin(t * 0.18) * 0.06 + x * 0.06, 4, delta);
    group.position.y = 0.17 + Math.sin(t * 0.7) * 0.085 - scroll * 0.14 - entrance * 0.22;
    group.scale.setScalar(1 - entrance * 0.1);
    orbit.current.rotation.z = t * 0.18;
    satellites.current.rotation.y = Math.sin(t * 0.2) * 0.25;
    satellites.current.position.y = Math.sin(t * 0.5) * 0.08;
    if (core.current) core.current.scale.setScalar(1 + Math.sin(t * 0.9) * 0.045);
    if (shadow.current) shadow.current.scale.x = 3.6 + Math.sin(t * 0.7) * 0.13;
    if (atmosphere.current) atmosphere.current.uniforms.uTime.value = t;
    camera.position.x = MathUtils.damp(camera.position.x, x * 0.14, 2.5, delta);
    camera.position.y = MathUtils.damp(camera.position.y, 0.1 + y * 0.1, 2.5, delta);
    camera.lookAt(0, 0.05, 0);
  });

  return (
    <>
      <StudioLights compact={compact} />
      <RenderQuality active={animate} />
      <group scale={fit}>
        <mesh position={[0, 0.15, -1.5]} scale={6}>
          <planeGeometry />
          <shaderMaterial ref={atmosphere} uniforms={uniforms} vertexShader={atmosphereVertex} fragmentShader={atmosphereFragment} transparent depthWrite={false} />
        </mesh>
        <mesh ref={shadow} position={[0, -1.95, -0.8]} scale={[3.6, 0.6, 1]}>
          <planeGeometry />
          <shaderMaterial vertexShader={atmosphereVertex} fragmentShader={shadowFragment} transparent depthWrite={false} />
        </mesh>
        <group ref={sculpture} rotation={[0.15, reduced ? -0.22 : 0.53, 0.32]} position={[0, reduced ? 0.17 : -0.05, 0]} scale={reduced ? 1 : 0.9}>
          <mesh geometry={geometries[0]}>
            <meshPhysicalMaterial vertexColors roughness={0.22} metalness={0.38} clearcoat={1} clearcoatRoughness={0.15} iridescence={0.22} iridescenceIOR={1.35} />
          </mesh>
          {geometries.slice(1).map((geometry, index) => (
            <mesh key={index} geometry={geometry}>
              <meshStandardMaterial color="#e8dcff" metalness={0.82} roughness={0.24} />
            </mesh>
          ))}
          <mesh ref={core} position={[0, 0, -0.08]}>
            <sphereGeometry args={[0.34, 48, 32]} />
            <meshPhysicalMaterial color="#f6efff" metalness={0.12} roughness={0.16} clearcoat={1} iridescence={0.5} emissive="#a790f0" emissiveIntensity={0.12} />
          </mesh>
          <group rotation={[-0.9, 0.15, -0.3]} scale={[1.08, 1, 1]}>
            <mesh>
              <torusGeometry args={[2.08, 0.018, 12, 192]} />
              <meshStandardMaterial color="#c0afd9" metalness={0.8} roughness={0.26} />
            </mesh>
            <group ref={orbit}>
              <mesh position={[2.08, 0, 0]}>
                <sphereGeometry args={[0.115, 32, 24]} />
                <meshPhysicalMaterial color="#f7f3ff" metalness={0.5} roughness={0.13} clearcoat={1} />
              </mesh>
              <mesh rotation={[0, 0, 0.2]}>
                <torusGeometry args={[2.08, 0.027, 10, 64, 0.65]} />
                <meshStandardMaterial color="#f0eaff" metalness={0.75} roughness={0.2} />
              </mesh>
            </group>
          </group>
        </group>
        <group ref={satellites}>
          <mesh position={[-1.7, 1.65, -0.1]} rotation={[0.2, 0.4, 0.2]}>
            <octahedronGeometry args={[0.12, 0]} />
            <meshPhysicalMaterial color="#b6a0ee" metalness={0.5} roughness={0.2} clearcoat={1} />
          </mesh>
          <mesh position={[1.6, -1.45, 0.4]}>
            <sphereGeometry args={[0.07, 24, 16]} />
            <meshStandardMaterial color="#7865ac" metalness={0.7} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </>
  );
}
