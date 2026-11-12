"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping, MathUtils } from "three";
import StudioScene, { type StudioInput } from "./StudioScene";

const PIXEL_RATIO: [number, number] = [1.5, 2];

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
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
      if (event.pointerType === "touch" || input.dragging) return;
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
      className="absolute inset-0 touch-pan-y select-none"
      data-rendering={animate && ready}
      data-ready={ready}
      onPointerDown={(event) => {
        if (reduced || !event.isPrimary || event.button !== 0) return;
        touchOrigin.current = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: input.x, startY: input.y };
        input.dragging = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const origin = touchOrigin.current;
        if (!origin || origin.id !== event.pointerId) return;
        const width = Math.max(event.currentTarget.clientWidth, 1);
        input.x = MathUtils.clamp(origin.startX + (event.clientX - origin.x) / width * 4, -2.4, 2.4);
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
            dpr={PIXEL_RATIO}
            frameloop={!visible ? "never" : reduced ? "demand" : "always"}
            camera={{ position: [0, 0.1, 7.8], fov: 39 }}
            gl={{
              alpha: true,
              antialias: true,
              toneMapping: ACESFilmicToneMapping,
              powerPreference: compact ? "default" : "high-performance",
            }}
            onCreated={({ gl }) => { gl.toneMappingExposure = 1.05; }}
            fallback={null}
          >
            <StudioScene key={String(reduced)} input={input} animate={animate} compact={compact} reduced={reduced} />
            <CanvasStatus onReady={setReady} />
          </Canvas>
        </CanvasBoundary>
      )}
    </div>
  );
}
