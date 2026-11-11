"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** סביבת סטודיו פרוצדורלית — RoomEnvironment + PMREM, אפס הורדות */
function StudioEnvironment() {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;
    return () => {
      env.dispose();
      pmrem.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);
  return null;
}

interface Pointer {
  x: number;
  y: number;
}

/** הפסל הקינטי — 4 שכבות: ליבת אמרלד, קליפת זכוכית, טבעות ג'ירוסקופיות, מיקרו-לוויינים */
function Sculpture({ pointer, mobile }: { pointer: React.RefObject<Pointer>; mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const current = useRef({ x: 0, y: 0 });

  // לוויינים — מיקומי מסלול + מהירויות bobbing אינדיבידואליות
  const satelliteCount = mobile ? 6 : 9;
  const satellites = useMemo(
    () =>
      Array.from({ length: satelliteCount }, (_, i) => {
        const angle = (i / satelliteCount) * Math.PI * 2;
        const radius = 2.05 + (i % 3) * 0.28;
        return {
          angle,
          radius,
          y: ((i % 4) - 1.5) * 0.55,
          speed: 0.6 + (i % 5) * 0.22,
          offset: i * 1.3,
          isSphere: i % 2 === 0,
        };
      }),
    [satelliteCount],
  );
  const satRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // פרלקסה מרוסנת — lerp ×0.05 לעבר הסמן
    const target = pointer.current ?? { x: 0, y: 0 };
    current.current.x += (target.x - current.current.x) * 0.05;
    current.current.y += (target.y - current.current.y) * 0.05;
    const { x: mx, y: my } = current.current;

    // גלילה → הטיה וסקייל חינניים
    const scroll = Math.min(window.scrollY, 800);

    if (group.current) {
      group.current.rotation.y = mx * 0.35;
      group.current.rotation.x = -my * 0.22 + scroll * 0.00045;
      const s = (mobile ? 0.72 : 1) * (1 - scroll * 0.00018);
      group.current.scale.setScalar(Math.max(0.62, s));
    }
    // ליבה — סיבוב איטי עדין
    if (core.current) {
      core.current.rotation.y += delta * 0.16;
      core.current.rotation.x += delta * 0.06;
    }
    // קליפת הזכוכית — נגד כיוון, עדין יותר
    if (shell.current) {
      shell.current.rotation.y -= delta * 0.07;
      shell.current.rotation.z += delta * 0.03;
    }
    // טבעות ג'ירוסקופיות — צירים שונים, מהירויות שונות
    if (ringA.current) {
      ringA.current.rotation.z += delta * 0.28;
      ringA.current.rotation.x = Math.PI / 3 + mx * 0.12;
    }
    if (ringB.current) {
      ringB.current.rotation.y -= delta * 0.36;
      ringB.current.rotation.x = -Math.PI / 4 - mx * 0.1;
    }
    // לוויינים — bobbing סינוסי אישי
    satellites.forEach((sat, i) => {
      const m = satRefs.current[i];
      if (!m) return;
      const orbit = sat.angle + t * 0.1;
      m.position.set(Math.cos(orbit) * sat.radius, sat.y + Math.sin(t * sat.speed + sat.offset) * 0.22, Math.sin(orbit) * sat.radius * 0.55);
      m.rotation.y = t * 0.8 + sat.offset;
    });
  });

  return (
    <group ref={group}>
      {/* A — הליבה האמרלד הזוהרת */}
      <mesh ref={core}>
        <icosahedronGeometry args={[1.15, 0]} />
        <meshPhysicalMaterial
          color="#059669"
          emissive="#047857"
          emissiveIntensity={0.25}
          metalness={0.2}
          roughness={0.15}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* B — קליפת הזכוכית האמיתית: שבירה + אירידסנציה */}
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.65, 1]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.92}
          transparent
          opacity={1}
          roughness={0.08}
          ior={1.45}
          thickness={2.0}
          iridescence={0.6}
          iridescenceIOR={1.3}
          envMapIntensity={1.8}
        />
      </mesh>

      {/* C — טבעות ג'ירוסקופיות ממתכת שמפנייה */}
      <mesh ref={ringA} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.4, 0.035, 32, 200]} />
        <meshPhysicalMaterial color="#f8fafc" metalness={0.85} roughness={0.2} clearcoat={1.0} envMapIntensity={1.4} />
      </mesh>
      <mesh ref={ringB} rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.4, 0.035, 32, 200]} />
        <meshPhysicalMaterial color="#f8fafc" metalness={0.85} roughness={0.2} clearcoat={1.0} envMapIntensity={1.4} />
      </mesh>

      {/* D — מיקרו-לוויינים */}
      {satellites.map((sat, i) => (
        <mesh
          key={i}
          ref={(el) => {
            satRefs.current[i] = el;
          }}
        >
          {sat.isSphere ? <sphereGeometry args={[0.08, 32, 32]} /> : <octahedronGeometry args={[0.1, 0]} />}
          <meshPhysicalMaterial
            color={sat.isSphere ? "#a7f3d0" : "#34d399"}
            metalness={0.4}
            roughness={0.18}
            clearcoat={0.8}
            envMapIntensity={1.2}
          />
        </mesh>
      ))}
    </group>
  );
}

/** סצנת ה-3D — ריאליזם פוטוגרפי: ACES + RoomEnvironment + יחס פיקסלים עד 2 */
export default function Hero3D() {
  const [visible, setVisible] = useState(true);
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);

  useMemo(() => {
    if (typeof window === "undefined") return;
    setMobile(window.matchMedia("(pointer: coarse)").matches);

    // סמן גלובלי — הפסל נוטה גם כשהסמן מחוץ לקנבס
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // רינדור חסכוני — עוצרים כשהקנבס מחוץ למסך
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.02 });
    if (wrapRef.current) io.observe(wrapRef.current);
    return () => {
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="h-full w-full" aria-hidden>
      {visible && (
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0, 5.4], fov: 42 }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
            powerPreference: "high-performance",
          }}
        >
          <ambientLight intensity={0.3} />
          {/* rim-light אמרלד */}
          <directionalLight position={[-5, 2, -3]} intensity={0.5} color="#34d399" />
          <directionalLight position={[4, 4, 4]} intensity={0.55} color="#ffffff" />
          <StudioEnvironment />
          <Sculpture pointer={pointer} mobile={mobile} />
        </Canvas>
      )}
    </div>
  );
}
