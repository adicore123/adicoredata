"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* ═══════════════ Rig — מצב משותף לכל האינטראקציות (בלי re-render) ═══════════════ */

interface Rig {
  pointer: { x: number; y: number };
  gyro: { x: number; y: number };
  dragVel: { x: number; y: number };
  zoom: number;
  scroll: number;
  idleEase: number;
  lastInteract: number;
  pulse: number;
  ripple: number;
  assemble: number;
  quality: number;
  sparkles: { pos: THREE.Vector3; vel: THREE.Vector3; life: number }[];
  motion: boolean;
}

const makeRig = (motion: boolean): Rig => ({
  pointer: { x: 0, y: 0 },
  gyro: { x: 0, y: 0 },
  dragVel: { x: 0, y: 0 },
  zoom: 1,
  scroll: 0,
  idleEase: 0,
  lastInteract: 0,
  pulse: 0,
  ripple: 0,
  assemble: motion ? 0 : 1,
  quality: 2,
  sparkles: [],
  motion,
});

/* ═══════════════ סביבת סטודיו פרוצדורלית ═══════════════ */

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

/* ═══════════════ Aurora — רקע GLSL חי ═══════════════ */

const AURORA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AURORA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uDetail;
  uniform float uAlpha;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float t = uTime * 0.05;
    float n = fbm(uv * uDetail + vec2(t, -t * 0.6) + fbm(uv * uDetail * 0.5 - t * 0.4));
    vec3 mint = vec3(0.68, 0.93, 0.83);
    vec3 emerald = vec3(0.02, 0.59, 0.41);
    vec3 col = mix(mint, emerald, smoothstep(0.35, 0.85, n));
    float a = uAlpha * smoothstep(0.25, 0.9, n);
    gl_FragColor = vec4(col, a);
  }
`;

function AuroraBackground({ rig }: { rig: Rig }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame((state) => {
    if (!mat.current) return;
    if (rig.motion) mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    mat.current.uniforms.uDetail.value = rig.quality >= 2 ? 2.2 : 1.4;
  });
  return (
    <mesh position={[0, 0, -4.5]} renderOrder={-1}>
      <planeGeometry args={[16, 12]} />
      <shaderMaterial
        ref={mat}
        vertexShader={AURORA_VERT}
        fragmentShader={AURORA_FRAG}
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uDetail: { value: 2.2 },
          uAlpha: { value: 0.45 },
        }}
      />
    </mesh>
  );
}

/* ═══════════════ שובל ניצוצות מנטה ═══════════════ */

const SPARK_COUNT = 60;

function SparkleTrail({ rig }: { rig: Rig }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pool = useMemo(
    () =>
      Array.from({ length: SPARK_COUNT }, () => ({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
      })),
    [],
  );
  const cursor = useRef(0);

  useFrame((_, dt) => {
    if (!mesh.current || !rig.motion) return;
    // קליטת ניצוצות חדשים מה-queue
    while (rig.sparkles.length) {
      const s = rig.sparkles.shift()!;
      const p = pool[cursor.current];
      cursor.current = (cursor.current + 1) % SPARK_COUNT;
      p.pos.copy(s.pos);
      p.vel.copy(s.vel);
      p.life = 1;
    }
    for (let i = 0; i < SPARK_COUNT; i++) {
      const p = pool[i];
      if (p.life > 0) {
        p.life = Math.max(0, p.life - dt * 1.8);
        p.pos.addScaledVector(p.vel, dt);
        p.vel.multiplyScalar(0.96);
      }
      const scale = p.life * 0.055;
      dummy.position.copy(p.pos);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SPARK_COUNT]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#6ee7b7" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

/* ═══════════════ הפסל — 4 שכבות + הרכבה + מבט מפוצל בגלילה ═══════════════ */

function Sculpture({ rig, mobile }: { rig: Rig; mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ripple = useRef<THREE.Mesh>(null);
  const current = useRef({ x: 0, y: 0, orbit: 0 });

  const satelliteCount = mobile ? 6 : 9;
  const satellites = useMemo(
    () =>
      Array.from({ length: satelliteCount }, (_, i) => {
        const angle = (i / satelliteCount) * Math.PI * 2;
        const radius = 2.05 + (i % 3) * 0.28;
        return { angle, radius, y: ((i % 4) - 1.5) * 0.55, speed: 0.6 + (i % 5) * 0.22, offset: i * 1.3, isSphere: i % 2 === 0 };
      }),
    [satelliteCount],
  );
  const satRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // כניסת הרכבה — 0→1 ב-easing קובי
    if (rig.assemble < 1) rig.assemble = Math.min(1, rig.assemble + delta / 1.3);
    const asm = 1 - Math.pow(1 - rig.assemble, 3);
    const scatter = 1 - asm; // מפוזר→מורכב
    const explode = rig.scroll; // מורכב→מפוצל בגלילה

    // פרלקסה מרוסנת — עכבר + ג'ירוסקופ מתמזגים
    const tx = rig.pointer.x * 0.6 + rig.gyro.x * 0.5;
    const ty = rig.pointer.y * 0.6 + rig.gyro.y * 0.5;
    current.current.x += (tx - current.current.x) * 0.05;
    current.current.y += (ty - current.current.y) * 0.05;

    // idle — אורביט קינמטי בחוסר פעילות
    const idleFor = t - rig.lastInteract;
    const idleTarget = idleFor > 4 ? 1 : 0;
    rig.idleEase += (idleTarget - rig.idleEase) * 0.03;

    if (group.current) {
      group.current.rotation.y = current.current.x * 0.35 + rig.idleEase * t * 0.04;
      group.current.rotation.x = -current.current.y * 0.22 + rig.scroll * 0.28;

      // פעימת הקשה + סקייל בסיס + התכנסות גלילה
      rig.pulse = Math.max(0, rig.pulse - delta * 2.2);
      const pulseScale = 1 + Math.sin(rig.pulse * Math.PI) * 0.14;
      const base = (mobile ? 0.72 : 1) * (1 - rig.scroll * 0.1) * pulseScale;
      group.current.scale.setScalar(base);
    }

    // גרירה — אינרציה עם חיכוך מזינה את הקליפה והטבעות
    if (shell.current) {
      shell.current.rotation.y -= delta * 0.07 + rig.dragVel.x;
      shell.current.rotation.z += delta * 0.03 + rig.dragVel.y;
      shell.current.position.y = scatter * -1.3 + explode * -0.4;
    }
    if (rig.dragVel.x !== 0) rig.dragVel.x *= 0.94;
    if (rig.dragVel.y !== 0) rig.dragVel.y *= 0.94;

    if (core.current) {
      core.current.rotation.y += delta * 0.16 + rig.dragVel.x * 0.5;
      core.current.rotation.x += delta * 0.06;
      core.current.position.y = scatter * 1.7 + explode * 0.55;
    }
    if (ringA.current) {
      ringA.current.rotation.z += delta * 0.28 + rig.dragVel.x * 0.4;
      ringA.current.rotation.x = Math.PI / 3 + current.current.x * 0.12 + scatter * 0.9 + explode * 0.45;
    }
    if (ringB.current) {
      ringB.current.rotation.y -= delta * 0.36 - rig.dragVel.y * 0.4;
      ringB.current.rotation.x = -Math.PI / 4 - current.current.x * 0.1 - scatter * 0.7 - explode * 0.35;
    }

    // לוויינים — bobbing + התרחקות בפיצוץ
    satellites.forEach((sat, i) => {
      const m = satRefs.current[i];
      if (!m) return;
      const orbit = sat.angle + t * 0.1;
      const r = sat.radius + scatter * 2.2 + explode * 0.7;
      m.position.set(Math.cos(orbit) * r, sat.y + Math.sin(t * sat.speed + sat.offset) * 0.22, Math.sin(orbit) * r * 0.55);
      m.rotation.y = t * 0.8 + sat.offset;
    });

    // ripple — טבעת ההקשה שמתרחבת ודוהה
    if (ripple.current) {
      rig.ripple = Math.max(0, rig.ripple - delta * 1.4);
      const rp = 1 - rig.ripple; // 0→1
      ripple.current.scale.setScalar(1 + rp * 3.4);
      (ripple.current.material as THREE.MeshBasicMaterial).opacity = rig.ripple * 0.7;
      ripple.current.visible = rig.ripple > 0.01;
    }
  });

  return (
    <group ref={group}>
      {/* A — ליבת האמרלד */}
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

      {/* B — קליפת הזכוכית */}
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

      {/* C — טבעות ג'ירוסקופיות */}
      <mesh ref={ringA} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.4, 0.035, 32, 200]} />
        <meshPhysicalMaterial color="#f8fafc" metalness={0.85} roughness={0.2} clearcoat={1.0} envMapIntensity={1.4} />
      </mesh>
      <mesh ref={ringB} rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.4, 0.035, 32, 200]} />
        <meshPhysicalMaterial color="#f8fafc" metalness={0.85} roughness={0.2} clearcoat={1.0} envMapIntensity={1.4} />
      </mesh>

      {/* D — לוויינים */}
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
            emissive="#10b981"
            emissiveIntensity={0.12}
          />
        </mesh>
      ))}

      {/* טבעת ripple של ההקשה */}
      <mesh ref={ripple} rotation={[Math.PI / 2.6, 0, 0]} visible={false}>
        <torusGeometry args={[1.9, 0.02, 8, 80]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ═══════════════ במאי — מצלמה קינמטית (גלילה+זום) ═══════════════ */

function Director({ rig }: { rig: Rig }) {
  const { camera } = useThree();
  useFrame((_, dt) => {
    // מסלול מצלמה: הקפה בגלילה + זום צביצה
    const angle = rig.scroll * 0.61;
    const dist = 5.4 * rig.zoom - rig.scroll * 0.9;
    const tx = Math.sin(angle) * dist;
    const tz = Math.cos(angle) * dist;
    camera.position.x += (tx - camera.position.x) * 0.06;
    camera.position.z += (tz - camera.position.z) * 0.06;
    camera.position.y += (0.2 + rig.scroll * 0.5 - camera.position.y) * 0.06;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ═══════════════ מנוע ביצועים אדפטיבי ═══════════════ */

function PerfRig({ rig, onQuality }: { rig: Rig; onQuality: (q: number) => void }) {
  const setDpr = useThree((s) => s.setDpr);
  const ema = useRef(60);
  const lowSince = useRef(0);
  const highSince = useRef(0);
  const applied = useRef(2);

  useFrame((state, dt) => {
    const fps = 1 / Math.max(dt, 1e-4);
    ema.current += (fps - ema.current) * 0.05;

    if (ema.current < 50) {
      lowSince.current += dt;
      highSince.current = 0;
    } else if (ema.current > 58) {
      highSince.current += dt;
      lowSince.current = 0;
    } else {
      lowSince.current = 0;
      highSince.current = 0;
    }

    if (lowSince.current > 2 && applied.current > 0) {
      applied.current -= 1;
      apply();
    } else if (highSince.current > 5 && applied.current < rig.quality) {
      applied.current = Math.min(rig.quality, applied.current + 1);
      apply();
    }
  });

  function apply() {
    const q = applied.current;
    setDpr(q >= 2 ? 2 : q === 1 ? 1.5 : 1.2);
    rig.quality = q;
    onQuality(q);
  }

  return null;
}

/* ═══════════════ הסצנה ═══════════════ */

export default function Hero3D() {
  const [visible, setVisible] = useState(true);
  const [quality, setQuality] = useState(2);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rigRef = useRef<Rig | null>(null);
  const [mobile, setMobile] = useState(false);
  const [motion, setMotion] = useState(true);

  // יצירת ה-rig פעם אחת
  if (!rigRef.current) rigRef.current = makeRig(true);
  const rig = rigRef.current;

  // קלטים: מגע/גרירה/צביצה/הקשה + ג'ירוסקופ + גלילה
  const cameraRef = useRef<THREE.Camera | null>(null);
  const drag = useRef<{ active: boolean; x: number; y: number; moved: number }>({ active: false, x: 0, y: 0, moved: 0 });
  const pinch = useRef<{ active: boolean; dist: number }>({ active: false, dist: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const raycaster = useRef(new THREE.Raycaster());
  const ndc = useRef(new THREE.Vector2());

  useMemo(() => {
    if (typeof window === "undefined") return;
    setMobile(window.matchMedia("(pointer: coarse)").matches);
    const noMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotion(!noMotion);
    if (noMotion) {
      rig.motion = false;
      rig.assemble = 1;
    }
    rig.lastInteract = performance.now() / 1000;

    const nowSec = () => performance.now() / 1000;
    const markInteract = () => (rig.lastInteract = nowSec());

    const onMove = (e: PointerEvent) => {
      rig.pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      rig.pointer.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    // ג'ירוסקופ — הטיית המכשיר מזינה את אותה מערכת lerp
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      markInteract();
      rig.gyro.x = THREE.MathUtils.clamp(e.gamma / 45, -1, 1);
      rig.gyro.y = THREE.MathUtils.clamp((e.beta - 45) / 45, -1, 1);
    };

    const onScroll = () => {
      markInteract();
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // 0 כשההיירו במסןף, 1 כשיצא לגמרי
      rig.scroll = THREE.MathUtils.clamp(-rect.top / Math.max(rect.height, 1), 0, 1);
    };

    // ── מגע על הבמה ──
    const wrap = () => wrapRef.current;

    const toNdc = (e: PointerEvent) => {
      const el = wrap();
      if (!el) return;
      const r = el.getBoundingClientRect();
      ndc.current.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
    };

    const spawnSpark = () => {
      if (!rig.motion || !cameraRef.current) return;
      raycaster.current.setFromCamera(ndc.current, cameraRef.current);
      const pos = new THREE.Vector3();
      raycaster.current.ray.at(4.6, pos);
      const vel = new THREE.Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.5 + 0.2, (Math.random() - 0.5) * 0.6);
      rig.sparkles.push({ pos, vel, life: 1 });
    };

    const onPointerDown = (e: PointerEvent) => {
      markInteract();
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 1) {
        drag.current = { active: true, x: e.clientX, y: e.clientY, moved: 0 };
      } else if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinch.current = { active: true, dist: Math.hypot(a.x - b.x, a.y - b.y) };
        drag.current.active = false;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      markInteract();
      onMove(e);
      if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pinch.current.active && pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        rig.zoom = THREE.MathUtils.clamp(rig.zoom * (pinch.current.dist / Math.max(d, 1)), 0.8, 1.45);
        pinch.current.dist = d;
        return;
      }
      if (drag.current.active) {
        const dx = e.clientX - drag.current.x;
        const dy = e.clientY - drag.current.y;
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
        drag.current.moved += Math.abs(dx) + Math.abs(dy);
        if (rig.motion) {
          rig.dragVel.x += dx * 0.00045;
          rig.dragVel.y += dy * 0.0004;
          toNdc(e);
          if (drag.current.moved % 3 === 0) spawnSpark();
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current.active = false;
      // הקשה נקייה = פעימה
      if (drag.current.active && drag.current.moved < 8 && rig.motion && cameraRef.current) {
        toNdc(e);
        raycaster.current.setFromCamera(ndc.current, cameraRef.current);
        if (raycaster.current.ray.distanceToPoint(new THREE.Vector3(0, 0, 0)) < 2.4) {
          rig.pulse = 1;
          rig.ripple = 1;
          navigator.vibrate?.(8);
        }
      }
      drag.current.active = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("deviceorientation", onOrient);
    window.addEventListener("scroll", onScroll, { passive: true });

    const el = wrap();
    if (el) {
      el.addEventListener("pointerdown", onPointerDown);
      el.addEventListener("pointermove", onPointerMove);
      el.addEventListener("pointerup", onPointerUp);
      el.addEventListener("pointercancel", onPointerUp);
    }

    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.02 });
    if (wrapRef.current) io.observe(wrapRef.current);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onOrient);
      window.removeEventListener("scroll", onScroll);
      if (el) {
        el.removeEventListener("pointerdown", onPointerDown);
        el.removeEventListener("pointermove", onPointerMove);
        el.removeEventListener("pointerup", onPointerUp);
        el.removeEventListener("pointercancel", onPointerUp);
      }
      io.disconnect();
    };
  }, [rig]);

  return (
    <div ref={wrapRef} className="h-full w-full touch-pan-y" aria-hidden>
      {visible && (
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0.2, 5.4], fov: 42 }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
            powerPreference: "high-performance",
          }}
          onCreated={({ camera }) => {
            cameraRef.current = camera;
          }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[-5, 2, -3]} intensity={0.5} color="#34d399" />
          <directionalLight position={[4, 4, 4]} intensity={0.55} color="#ffffff" />
          <StudioEnvironment />
          <AuroraBackground rig={rig} />
          <Sculpture rig={rig} mobile={mobile} />
          <SparkleTrail rig={rig} />
          <ContactShadows position={[0, -2.15, 0]} opacity={0.45} scale={9} blur={2.6} far={3.2} color="#065f46" />
          <Director rig={rig} />
          <PerfRig rig={rig} onQuality={setQuality} />
          {quality >= 1 && (
            <EffectComposer>
              <Bloom luminanceThreshold={0.55} intensity={0.55} mipmapBlur />
              <Vignette darkness={0.25} />
            </EffectComposer>
          )}
        </Canvas>
      )}
    </div>
  );
}
