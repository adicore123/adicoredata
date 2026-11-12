"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { ACESFilmicToneMapping, MathUtils, type Group } from "three";
import { createStudioSculpture } from "@/lib/studioSculpture";

type StudioInput = { x: number; y: number; scroll: number; dragging: boolean };

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[-4, 6, 5]} intensity={2.4} color="#f9f7ff" />
      <directionalLight position={[5, 2, -3]} intensity={1.55} color="#b6b5ff" />
      <Environment frames={1} resolution={256} environmentIntensity={1.1}>
        <Lightformer form="rect" intensity={5} position={[-4, 4, 4]} target={[0, 0, 0]} scale={[5, 1.55, 1]} />
        <Lightformer form="rect" intensity={4} position={[3, 1, -4]} target={[0, 0, 0]} scale={[1.25, 5, 1]} color="#d1ccff" />
        <Lightformer form="rect" intensity={2} position={[0, 5, 0]} target={[0, 0, 0]} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[3, -3, 4]} target={[0, 0, 0]} scale={[4, 3, 1]} color="#a9a6ff" />
      </Environment>
    </>
  );
}

function Sculpture({ input, animate, compact, reduced }: { input: StudioInput; animate: boolean; compact: boolean; reduced: boolean }) {
  const sculpture = useRef<Group>(null);
  const orbit = useRef<Group>(null);
  const time = useRef(0);
  const aspect = useThree((state) => state.size.width / Math.max(state.size.height, 1));
  const fit = Math.min(1, aspect / 1.08);
  const ribbon = useMemo(() => createStudioSculpture(compact ? 256 : 320, 48), [compact]);
  useEffect(() => () => ribbon.dispose(), [ribbon]);

  useFrame((_, dt) => {
    if (!animate || !sculpture.current || !orbit.current) return;
    const delta = Math.min(dt, 0.05);
    time.current += delta;
    const t = time.current;
    const { x, y, scroll } = input;
    const damp = (from: number, to: number) => MathUtils.damp(from, to, 3.7, delta);
    const group = sculpture.current;
    const entrance = 1 - MathUtils.smoothstep(t, 0, 1.65);
    group.rotation.x = damp(group.rotation.x, 0.18 - y * 0.28 + scroll * 0.24);
    group.rotation.y = damp(group.rotation.y, -0.2 + entrance * 0.84 + x * 0.4 + scroll * 0.65 + Math.sin(t * 0.44) * 0.22);
    group.rotation.z = damp(group.rotation.z, 0.34 + x * 0.1);
    group.position.y = 0.1 + Math.sin(t * 0.82) * 0.1 - scroll * 0.22 - entrance * 0.18;
    group.scale.setScalar(1 - entrance * 0.12);
    orbit.current.rotation.z = t * 0.24;
  });

  return (
    <group scale={fit}>
      <group ref={sculpture} rotation={[0.18, reduced ? -0.2 : 0.64, 0.34]} position={[0, reduced ? 0.1 : -0.08, 0]} scale={reduced ? 1 : 0.88}>
        <mesh geometry={ribbon}>
          <meshPhysicalMaterial
            vertexColors
            roughness={0.26}
            metalness={compact ? 0.3 : 0.09}
            transmission={compact ? 0 : 0.36}
            thickness={0.45}
            ior={1.46}
            attenuationColor="#9690f8"
            attenuationDistance={1.5}
            iridescence={0.28}
            clearcoat={1}
            clearcoatRoughness={0.19}
          />
        </mesh>
        <group rotation={[-0.94, 0.22, -0.35]} scale={[1.13, 1, 1]}>
          <mesh>
            <torusGeometry args={[2.04, 0.035, 24, 192]} />
            <meshStandardMaterial color="#b5a7e5" metalness={0.65} roughness={0.32} />
          </mesh>
          <group ref={orbit}>
            <mesh position={[1.73, 1.08, 0]}>
              <sphereGeometry args={[0.17, 40, 32]} />
              <meshPhysicalMaterial color="#f2edff" metalness={0.48} roughness={0.19} clearcoat={0.8} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function CanvasStatus({ onReady }: { onReady: (ready: boolean) => void }) {
  const canvas = useThree((state) => state.gl.domElement);

  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onReady(false);
    };
    const restored = () => onReady(true);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    onReady(true);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      onReady(false);
    };
  }, [canvas, onReady]);

  return null;
}

export default function Hero3D() {
  const stage = useRef<HTMLDivElement>(null);
  const input = useRef<StudioInput>({ x: 0, y: 0, scroll: 0, dragging: false }).current;
  const touchOrigin = useRef<{ id: number; x: number; y: number; startX: number; startY: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const [compact, setCompact] = useState(true);
  const [reduced, setReduced] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 879px), (pointer: coarse)");
    const preferences = () => {
      setReduced(motion.matches);
      setCompact(mobile.matches);
    };
    preferences();
    motion.addEventListener("change", preferences);
    mobile.addEventListener("change", preferences);

    let onScreen = false;
    const syncVisibility = () => setVisible(onScreen && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncVisibility();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", syncVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncVisibility);
      motion.removeEventListener("change", preferences);
      mobile.removeEventListener("change", preferences);
    };
  }, []);

  useEffect(() => {
    if (!visible || reduced) {
      input.x = 0;
      input.y = 0;
      input.dragging = false;
      touchOrigin.current = null;
      return;
    }
    const pointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      input.x = (event.clientX / window.innerWidth) * 2 - 1;
      input.y = 1 - (event.clientY / window.innerHeight) * 2;
    };
    const orientation = (event: DeviceOrientationEvent) => {
      if (!compact || input.dragging || event.gamma == null || event.beta == null) return;
      input.x = MathUtils.clamp(event.gamma / 38, -1, 1);
      input.y = MathUtils.clamp((event.beta - 40) / 45, -1, 1);
    };
    const scroll = () => {
      input.scroll = MathUtils.clamp(window.scrollY / Math.max(window.innerHeight, 1), 0, 1);
    };
    scroll();
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("deviceorientation", orientation, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("deviceorientation", orientation);
      window.removeEventListener("scroll", scroll);
    };
  }, [compact, input, reduced, visible]);

  const animate = visible && !reduced;

  return (
    <div
      ref={stage}
      className="absolute inset-0 touch-pan-y"
      data-rendering={animate && ready}
      data-ready={ready}
      onPointerDown={(event) => {
        if (event.pointerType !== "touch" || reduced || !event.isPrimary) return;
        touchOrigin.current = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: input.x, startY: input.y };
        input.dragging = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const origin = touchOrigin.current;
        if (!origin || origin.id !== event.pointerId) return;
        const width = Math.max(event.currentTarget.clientWidth, 1);
        input.x = MathUtils.clamp(origin.startX + (event.clientX - origin.x) / width * 4, -2, 2);
        input.y = MathUtils.clamp(origin.startY - (event.clientY - origin.y) / width * 2, -1, 1);
      }}
      onLostPointerCapture={() => {
        touchOrigin.current = null;
        input.dragging = false;
      }}
    >
      {(visible || ready) && (
        <CanvasBoundary>
          <Canvas
            dpr={[1.5, 2]}
            frameloop={!visible ? "never" : reduced ? "demand" : "always"}
            camera={{ position: [0, 0.06, 7.1], fov: 41 }}
            gl={{
              alpha: true,
              antialias: true,
              toneMapping: ACESFilmicToneMapping,
              powerPreference: compact ? "default" : "high-performance",
            }}
            onCreated={({ gl }) => { gl.transmissionResolutionScale = 1; }}
            fallback={null}
          >
            <StudioLights />
            <Sculpture key={String(reduced)} input={input} animate={animate} compact={compact} reduced={reduced} />
            <CanvasStatus onReady={setReady} />
          </Canvas>
        </CanvasBoundary>
      )}
    </div>
  );
}
