"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

/** עצם הזכוכית-מנטה — מסתובב, מרחף, ונוטה לעבר הסמן */
function GlassGem({ pointer }: { pointer: React.RefObject<{ x: number; y: number }> }) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    m.rotation.y += delta * 0.18;
    m.rotation.x += delta * 0.07;
    // הטיה לעבר הסמן — תנועה חלקה ולא קפוצה
    const p = pointer.current ?? { x: 0, y: 0 };
    m.rotation.z += (p.x * 0.35 - m.rotation.z) * 0.045;
    m.position.y += (p.y * 0.3 - m.position.y + 0.1) * 0.045;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.9}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshPhysicalMaterial
          transmission={0.92}
          thickness={1.4}
          roughness={0.12}
          color="#b0e7d2"
          attenuationColor="#1fa87e"
          attenuationDistance={2.4}
          clearcoat={1}
          clearcoatRoughness={0.1}
          envMapIntensity={1.2}
        />
      </mesh>
      {/* טבעת מסתובבת עדינה סביב העצם */}
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.85, 0.018, 12, 90]} />
        <meshBasicMaterial color="#7ed6b7" transparent opacity={0.5} />
      </mesh>
    </Float>
  );
}

/** שדה חלקיקים פרוצדורלי — מאות נקודות מנטה שרועדות סביב העצם */
function Particles({ count = 320 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 1.9 + Math.random() * 2.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.4;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.03;
      points.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
    }
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial size={0.028} color="#7ed6b7" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

/** מצלמה שמתקרבת כשגוללים — dolly עדין קשור ל-scrollY */
function ScrollDolly() {
  const { camera } = useThree();
  useFrame(() => {
    const targetZ = 4.6 + Math.min(window.scrollY, 700) * 0.0016;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
  });
  return null;
}

/** עוטף את סצנת ה-3D בבדיקות תמיכה ונראות */
export default function Hero3D() {
  const [visible, setVisible] = useState(true);
  const pointer = useRef({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const isMobile = useMemo(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches, []);

  useMemo(() => {
    if (typeof window === "undefined") return;
    // תנועת סמן גלובלית — העצם נוטה גם כשהסמן לא מעליו
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // רינדור חסכוני — עוצרים כשה-Hero מחוץ למסך
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.02,
    });
    if (wrapRef.current) io.observe(wrapRef.current);
    return () => {
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden>
      {visible && (
        <Canvas
          dpr={[1, isMobile ? 1.2 : 1.75]}
          camera={{ position: [0, 0, 4.6], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          className="!absolute inset-0"
        >
          <ambientLight intensity={0.35} />
          <directionalLight position={[4, 5, 3]} intensity={0.7} color="#d7f3e7" />
          <directionalLight position={[-5, -2, -3]} intensity={0.35} color="#1fa87e" />
          <GlassGem pointer={pointer} />
          <Particles count={isMobile ? 130 : 320} />
          <ScrollDolly />
          <Environment resolution={128}>
            <Lightformer intensity={1.6} position={[0, 3, 4]} scale={[6, 1.5, 1]} color="#ffffff" />
            <Lightformer intensity={0.9} position={[-4, 0, 2]} scale={[2, 4, 1]} color="#b0e7d2" />
            <Lightformer intensity={0.7} position={[4, -1, 2]} scale={[2, 3, 1]} color="#45c297" />
          </Environment>
        </Canvas>
      )}
    </div>
  );
}
