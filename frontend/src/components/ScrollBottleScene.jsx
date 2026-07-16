import { Environment, Sparkles, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

import labelImg from "@/assets/torriden-label.jpg";
import {
  createCapGeometry,
  createNozzleHoleGeometry,
  createSpoutGeometry,
  createTubeBodyGeometry,
  TUBE_NECK_TOP_Y,
} from "@/components/scene/tubeGeometry";

// Scroll progress (0-1) is a framer-motion MotionValue updating outside React's
// render cycle. Mirror it into a plain ref so R3F's useFrame can read it every
// frame without ever pushing scroll state through React.
function useProgressRef(scrollYProgress) {
  const progressRef = useRef(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progressRef.current = v;
  });
  return progressRef;
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const localProgress = (p, start, end) => clamp01((p - start) / (end - start));
const damp = (current, target, lambda, delta) => THREE.MathUtils.damp(current, target, lambda, delta);

function hat(p, start, end, blend) {
  if (p < start - blend) return 0;
  if (p < start) return (p - (start - blend)) / blend;
  if (p <= end) return 1;
  if (p < end + blend) return 1 - (p - end) / blend;
  return 0;
}

// GLSL shared by the water material's position + normal patches: a crater
// that punches down and rebounds, an expanding/decaying rim (the splash
// crown), and short-lived ripples -- all a function of local (x,y) distance
// from the impact point and seconds-since-impact ("age").
const WAVE_GLSL = `
  float waveHeight(vec2 p, float age) {
    float dist = length(p);
    float crater = -0.16 * exp(-dist * dist / 0.3) * exp(-age * 4.0);
    float rimR = age * 1.6;
    float rim = 0.1 * exp(-pow(dist - rimR, 2.0) / 0.06) * exp(-age * 1.4);
    float ripple = 0.035 * sin(dist * 10.0 - age * 7.0) * exp(-dist * 1.1) * exp(-age * 0.5);
    return crater + rim + ripple;
  }
`;

function createWaterMaterial() {
  const water = new THREE.MeshPhysicalMaterial({
    color: "#bfe4ea",
    transmission: 0.88,
    roughness: 0.1,
    thickness: 0.6,
    ior: 1.33,
    transparent: true,
    side: THREE.DoubleSide,
  });
  water.onBeforeCompile = (shader) => {
    shader.uniforms.uAge = { value: -1 };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nuniform float uAge;\n${WAVE_GLSL}`)
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
        if (uAge >= 0.0) {
          float wEps = 0.02;
          float wH0 = waveHeight(position.xy, uAge);
          float wHx = waveHeight(position.xy + vec2(wEps, 0.0), uAge);
          float wHy = waveHeight(position.xy + vec2(0.0, wEps), uAge);
          vec3 wTx = normalize(vec3(wEps, 0.0, wHx - wH0));
          vec3 wTy = normalize(vec3(0.0, wEps, wHy - wH0));
          objectNormal = normalize(cross(wTx, wTy));
        }`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        if (uAge >= 0.0) {
          transformed.z += waveHeight(position.xy, uAge);
        }`
      );
    water.userData.shader = shader;
  };
  return water;
}

function createFoamRingGeometry() {
  const geo = new THREE.TorusGeometry(0.58, 0.055, 10, 48);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    const jitter = 1 + (n - 0.5) * 0.3;
    pos.setXYZ(i, x * jitter, y, z * jitter);
  }
  geo.computeVertexNormals();
  return geo;
}

const BURST_COUNT = 14;
// The tube settles at world position.y = -0.3 once descended (see descendY
// below); the nozzle/droplet/camera targets live in world space as scene-root
// siblings of the tube group, so that offset has to be baked in here too.
const TUBE_REST_Y = -0.3;
const NOZZLE_POS = new THREE.Vector3(0, TUBE_REST_Y + TUBE_NECK_TOP_Y + 0.14, 0.22);
const CONTROL_POS = new THREE.Vector3(0.8, 1.35, 0.45);
const HOVER_POS = new THREE.Vector3(1.3, 1.05, 0.45);
const UP = new THREE.Vector3(0, 1, 0);

function Scene({ progressRef }) {
  const tubeGroup = useRef();
  const capGroup = useRef();
  const labelTexture = useTexture(labelImg);

  const poolRef = useRef();
  const foamRef = useRef();
  const burstRef = useRef();
  const dropletRef = useRef();
  const bridgeRef = useRef();

  const impactTime = useRef(null);
  const dropletPos = useRef(NOZZLE_POS.clone());

  const camPos = useRef(new THREE.Vector3(0, 0.4, 4.2));
  const camLook = useRef(new THREE.Vector3(0, 0.2, 0));

  const burstVelocities = useMemo(() => Array.from({ length: BURST_COUNT }, () => new THREE.Vector3()), []);
  const burstDummy = useMemo(() => new THREE.Object3D(), []);
  const bridgeQuat = useMemo(() => new THREE.Quaternion(), []);
  const bridgeDir = useMemo(() => new THREE.Vector3(), []);

  const geometries = useMemo(
    () => ({
      body: createTubeBodyGeometry(),
      cap: createCapGeometry(),
      spout: createSpoutGeometry(),
      nozzleHole: createNozzleHoleGeometry(),
      label: new THREE.PlaneGeometry(0.72, 1.0),
      pool: new THREE.CircleGeometry(1.5, 96),
      foam: createFoamRingGeometry(),
      droplet: new THREE.SphereGeometry(0.1, 24, 24),
      burst: new THREE.ConeGeometry(0.025, 0.09, 8),
      bridge: new THREE.CylinderGeometry(1, 1, 1, 12, 1, true),
      ground: new THREE.PlaneGeometry(10, 10),
    }),
    []
  );

  const materials = useMemo(() => {
    const tube = new THREE.MeshPhysicalMaterial({ color: "#cfe9ee", roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.25 });
    tube.onBeforeCompile = (shader) => {
      shader.uniforms.uSqueeze = { value: 0 };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>\nuniform float uSqueeze;`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float squeezeFalloff = clamp((-position.y - 0.2) / 0.8, 0.0, 1.0);
          float squeezeFactor = 1.0 - uSqueeze * squeezeFalloff * 0.45;
          transformed.x *= squeezeFactor;
          transformed.z *= squeezeFactor;`
        );
      tube.userData.shader = shader;
    };
    return {
      tube,
      cap: new THREE.MeshPhysicalMaterial({ color: "#fbfbf9", roughness: 0.16, transmission: 0.35, thickness: 0.35, ior: 1.45 }),
      spout: new THREE.MeshPhysicalMaterial({ color: "#fbfbf9", roughness: 0.2, transmission: 0.3, thickness: 0.3 }),
      nozzleHole: new THREE.MeshStandardMaterial({ color: "#20302c", roughness: 0.6 }),
      label: new THREE.MeshStandardMaterial({ map: labelTexture, bumpMap: labelTexture, bumpScale: -0.0035, roughness: 0.5 }),
      water: createWaterMaterial(),
      droplet: new THREE.MeshPhysicalMaterial({ color: "#fdfdf8", roughness: 0.1, clearcoat: 0.6, transmission: 0.05 }),
      bridge: new THREE.MeshPhysicalMaterial({ color: "#fdfdf8", roughness: 0.15, transmission: 0.1 }),
      burst: new THREE.MeshStandardMaterial({ color: "#e6f2ee", roughness: 0.15, transparent: true, opacity: 0.9 }),
      foam: new THREE.MeshStandardMaterial({ color: "#f2f8f5", roughness: 0.55, transparent: true, opacity: 0 }),
      shadow: new THREE.ShadowMaterial({ opacity: 0.25 }),
    };
  }, [labelTexture]);

  useFrame((state, delta) => {
    const p = progressRef.current;
    const elapsed = state.clock.elapsedTime;

    // ---- Phase 1: intro (0-0.22) tilted + spinning ----
    const introTilt = 0.78;
    const spinSpeed = 1.4;

    // ---- Phase 2: upright + descend (0.22-0.40) ----
    const uprightP = localProgress(p, 0.22, 0.4);
    const tiltTarget = introTilt * (1 - uprightP);
    const spinFade = 1 - uprightP;
    const descendY = THREE.MathUtils.lerp(0.4, -0.3, uprightP);

    // ---- Phase 3: splash (0.38-0.48) ----
    const splashThreshold = 0.4;
    if (p > splashThreshold && impactTime.current === null) impactTime.current = elapsed;
    if (p <= splashThreshold) impactTime.current = null;
    const age = impactTime.current === null ? null : elapsed - impactTime.current;
    const hasSplashed = impactTime.current !== null;

    // ---- Phase 4: cap unscrew (0.48-0.68) ----
    const capP = localProgress(p, 0.48, 0.68);
    const capRotation = capP * Math.PI * 4;
    const capRise = capP * 0.5 + Math.max(0, capP - 0.7) * 1.6;

    // ---- Phase 5: squeeze (0.6-0.74) ----
    const squeezeP = localProgress(p, 0.6, 0.74);

    // ---- Phase 6: droplet grows at the nozzle, pinches off, then flies ----
    const dropGrowP = localProgress(p, 0.64, 0.74);
    const dropPinchP = localProgress(p, 0.72, 0.8);
    const dropFlightP = localProgress(p, 0.78, 1.0);

    let dropletTargetPos;
    if (dropFlightP <= 0) {
      const bulge = clamp01(dropGrowP) * 0.05 + clamp01(dropPinchP) * 0.14;
      dropletTargetPos = NOZZLE_POS.clone().add(new THREE.Vector3(0, -bulge * 0.6, bulge));
    } else {
      const a = NOZZLE_POS.clone().lerp(CONTROL_POS, dropFlightP);
      const b = CONTROL_POS.clone().lerp(HOVER_POS, dropFlightP);
      dropletTargetPos = a.lerp(b, dropFlightP);
      dropletTargetPos.y += Math.sin(elapsed * 2) * 0.02 * dropFlightP;
    }

    // ---- Apply: tube ----
    if (tubeGroup.current) {
      tubeGroup.current.rotation.z = damp(tubeGroup.current.rotation.z, tiltTarget, 4, delta);
      tubeGroup.current.rotation.y += delta * spinSpeed * spinFade;
      tubeGroup.current.position.y = damp(tubeGroup.current.position.y, descendY, 4, delta);
    }
    if (materials.tube.userData.shader) {
      materials.tube.userData.shader.uniforms.uSqueeze.value = damp(
        materials.tube.userData.shader.uniforms.uSqueeze.value,
        squeezeP,
        5,
        delta
      );
    }

    // ---- Apply: cap ----
    if (capGroup.current) {
      capGroup.current.rotation.y = damp(capGroup.current.rotation.y, capRotation, 6, delta);
      capGroup.current.position.y = damp(capGroup.current.position.y, TUBE_NECK_TOP_Y + capRise, 5, delta);
    }

    // ---- Apply: splash pool / foam / burst ----
    const shader = poolRef.current?.material?.userData?.shader;
    if (shader) {
      shader.uniforms.uAge.value = age === null ? -1 : age;
    }
    if (poolRef.current) {
      poolRef.current.visible = hasSplashed;
    }
    if (foamRef.current) {
      const targetScale = hasSplashed ? 1 : 0.3;
      const s = damp(foamRef.current.scale.x, targetScale, 3, delta);
      foamRef.current.scale.set(s, s, 1);
      foamRef.current.material.opacity = damp(foamRef.current.material.opacity, hasSplashed ? 0.4 : 0, 3, delta);
    }
    if (burstRef.current) {
      for (let i = 0; i < BURST_COUNT; i++) {
        const vel = burstVelocities[i];
        if (age !== null && age < 0.05 && vel.lengthSq() === 0) {
          const angle = (i / BURST_COUNT) * Math.PI * 2 + Math.random() * 0.3;
          vel.set(Math.cos(angle) * (1.2 + Math.random()), 3 + Math.random() * 2, Math.sin(angle) * (1.2 + Math.random()));
        }
        if (age === null || age > 0.9) {
          burstDummy.position.set(0, -100, 0);
        } else {
          const vy = vel.y - 9.8 * age;
          burstDummy.position.set(vel.x * age * 0.35, -1.29 + vy * age * 0.35, vel.z * age * 0.35);
        }
        burstDummy.scale.setScalar(age !== null && age < 0.9 ? 1 : 0.001);
        burstDummy.updateMatrix();
        burstRef.current.setMatrixAt(i, burstDummy.matrix);
      }
      if (age === null) burstVelocities.forEach((v) => v.set(0, 0, 0));
      burstRef.current.instanceMatrix.needsUpdate = true;
    }

    // ---- Apply: droplet growth / pinch-off / flight ----
    if (dropletRef.current) {
      const visible = p > 0.63;
      dropletRef.current.visible = visible;
      if (visible) {
        dropletPos.current.lerp(dropletTargetPos, 1 - Math.exp(-8 * delta));
        dropletRef.current.position.copy(dropletPos.current);
        const growScale = THREE.MathUtils.lerp(0.15, 1, clamp01(dropGrowP * 1.4));
        const stretch =
          dropFlightP > 0
            ? THREE.MathUtils.lerp(1.6, 1, clamp01(dropFlightP * 2))
            : THREE.MathUtils.lerp(0.8, 1.6, clamp01(dropPinchP));
        dropletRef.current.scale.set(growScale / Math.sqrt(stretch), growScale * stretch, growScale / Math.sqrt(stretch));
      }
    }
    if (bridgeRef.current) {
      const bridgeAlpha = clamp01(dropGrowP) * (1 - clamp01(dropPinchP));
      bridgeRef.current.visible = bridgeAlpha > 0.02;
      if (bridgeRef.current.visible) {
        bridgeDir.subVectors(dropletPos.current, NOZZLE_POS);
        const len = Math.max(bridgeDir.length(), 0.001);
        bridgeRef.current.position.copy(NOZZLE_POS).addScaledVector(bridgeDir, 0.5);
        bridgeQuat.setFromUnitVectors(UP, bridgeDir.clone().normalize());
        bridgeRef.current.quaternion.copy(bridgeQuat);
        const radius = THREE.MathUtils.lerp(0.05, 0.005, clamp01(dropPinchP)) * clamp01(dropGrowP * 3);
        bridgeRef.current.scale.set(radius, len, radius);
      }
    }

    // ---- Camera rig: blend named targets ----
    const wideW = hat(p, 0, 0.44, 0.08);
    const capW = hat(p, 0.44, 0.7, 0.06);
    const dropW = hat(p, 0.62, 1.0, 0.06);
    const total = Math.max(0.0001, wideW + capW + dropW);

    const wide = {
      pos: new THREE.Vector3(0, 0.4, 4.2),
      look: new THREE.Vector3(0, THREE.MathUtils.lerp(0.2, -1.1, uprightP), 0),
    };
    const capDolly = { pos: new THREE.Vector3(0.4, 1.5, 1.15), look: new THREE.Vector3(0, 1.2, 0.1) };
    const dropletFollow = {
      pos: dropletTargetPos.clone().add(new THREE.Vector3(0.3, 0.35, 2.0)),
      look: dropletTargetPos.clone(),
    };

    const targetPos = new THREE.Vector3()
      .addScaledVector(wide.pos, wideW / total)
      .addScaledVector(capDolly.pos, capW / total)
      .addScaledVector(dropletFollow.pos, dropW / total);
    const targetLook = new THREE.Vector3()
      .addScaledVector(wide.look, wideW / total)
      .addScaledVector(capDolly.look, capW / total)
      .addScaledVector(dropletFollow.look, dropW / total);

    camPos.current.lerp(targetPos, 1 - Math.exp(-3 * delta));
    camLook.current.lerp(targetLook, 1 - Math.exp(-3 * delta));
    state.camera.position.copy(camPos.current);
    state.camera.lookAt(camLook.current);
  });

  return (
    <>
      <group ref={tubeGroup} rotation-z={0.78}>
        <mesh geometry={geometries.body} material={materials.tube} castShadow />
        <mesh geometry={geometries.label} material={materials.label} position={[0, -0.05, 0.38]} />
        <mesh geometry={geometries.spout} material={materials.spout} position={[0, TUBE_NECK_TOP_Y + 0.06, 0]} />
        <mesh
          geometry={geometries.nozzleHole}
          material={materials.nozzleHole}
          position={[0, TUBE_NECK_TOP_Y + 0.121, 0]}
          rotation-x={-Math.PI / 2}
        />
        <group ref={capGroup} position={[0, TUBE_NECK_TOP_Y, 0]}>
          <mesh geometry={geometries.cap} material={materials.cap} castShadow />
        </group>
      </group>

      <mesh ref={bridgeRef} geometry={geometries.bridge} material={materials.bridge} visible={false} />
      <mesh ref={dropletRef} geometry={geometries.droplet} material={materials.droplet} visible={false} />

      <mesh ref={poolRef} geometry={geometries.pool} material={materials.water} rotation-x={-Math.PI / 2} position={[0, -1.4, 0]} visible={false} />
      <mesh ref={foamRef} geometry={geometries.foam} material={materials.foam} rotation-x={-Math.PI / 2} position={[0, -1.38, 0]} scale={0.3} />
      <instancedMesh ref={burstRef} args={[geometries.burst, materials.burst, BURST_COUNT]} />
      <Sparkles count={40} scale={[1.4, 0.5, 1.4]} size={2} speed={0.5} color="#cfe0d6" position={[0, -1.2, 0]} />

      <mesh geometry={geometries.ground} material={materials.shadow} rotation-x={-Math.PI / 2} position-y={-1.6} receiveShadow />
    </>
  );
}

const PHASE_TEXT = [
  {
    range: [0, 0.22],
    side: "left",
    eyebrow: "Introducing",
    title: "Dive-In Soothing Cream.",
    body: "Low molecular hyaluronic acid, formulated to sink in deep instead of sitting on top.",
  },
  {
    range: [0.22, 0.46],
    side: "right",
    eyebrow: "Texture",
    title: "Water-light, never heavy.",
    body: "A gel-cream that melts into skin like it's absorbed by water itself.",
  },
  {
    range: [0.46, 0.7],
    side: "left",
    eyebrow: "Open it up",
    title: "One twist, ready to go.",
    body: "No wasted product, no mess. Just what your skin needs, when it needs it.",
  },
  {
    range: [0.7, 1],
    side: "right",
    eyebrow: "In use",
    title: "One drop, deep hydration.",
    body: "A single dose is all it takes. Low molecular weight means it actually gets there.",
  },
];

function PhaseText({ scrollYProgress, range, side, eyebrow, title, body }) {
  const [start, end] = range;
  const opacity = useTransform(scrollYProgress, [start, start + 0.03, end - 0.03, end], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [start, start + 0.05], [16, 0]);

  return (
    <motion.div
      style={{ opacity, y }}
      className={
        "pointer-events-none absolute top-1/2 max-w-sm -translate-y-1/2 px-10 " +
        (side === "left" ? "left-0 text-left" : "right-0 text-right")
      }
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">{eyebrow}</div>
      <h2 className="mt-3 font-serif-display text-3xl leading-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{body}</p>
    </motion.div>
  );
}

export default function ScrollBottleScene() {
  const wrapperRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: wrapperRef, offset: ["start start", "end end"] });
  const progressRef = useProgressRef(scrollYProgress);

  return (
    <div ref={wrapperRef} className="relative h-[500vh] bg-background">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <Canvas shadows camera={{ position: [0, 0.4, 4.2], fov: 35 }} className="absolute inset-0">
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 5, 2]} intensity={0.7} castShadow shadow-mapSize={[1024, 1024]} />
          <Suspense fallback={null}>
            <Environment preset="studio" background={false} environmentIntensity={0.35} />
            <Scene progressRef={progressRef} />
          </Suspense>
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.25} luminanceThreshold={0.9} luminanceSmoothing={0.15} mipmapBlur />
            <Vignette eskil={false} offset={0.3} darkness={0.6} />
          </EffectComposer>
        </Canvas>

        <div className="pointer-events-none absolute inset-0">
          {PHASE_TEXT.map((phase) => (
            <PhaseText key={phase.title} scrollYProgress={scrollYProgress} {...phase} />
          ))}
        </div>
      </div>
    </div>
  );
}
