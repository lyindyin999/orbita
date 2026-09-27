"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PlanetData, planets, scenePosition } from "@/data/planets";

export type FocusTarget = {
  name: string;
  position: [number, number, number];
  distance: number;
} | null;

type UniverseProps = {
  focus: FocusTarget;
  constellationMode: boolean;
  onSelect: (planet: PlanetData) => void;
};

function OrbitRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let i = 0; i <= 180; i += 1) {
      const a = (i / 180) * Math.PI * 2;
      list.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return list;
  }, [radius]);

  return (
    <Line
      points={points}
      color="#7b8498"
      transparent
      opacity={0.14}
      lineWidth={0.55}
    />
  );
}

function Sun() {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 1.2) * 0.018;
    glowRef.current.scale.setScalar(pulse);
  });

  return (
    <group>
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.45, 64, 64]} />
        <meshBasicMaterial color="#fff2c2" />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.72, 48, 48]} />
        <meshBasicMaterial
          color="#ffb24b"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
      <pointLight color="#fff0c5" intensity={1700} distance={100} decay={1.65} />
    </group>
  );
}

function Planet({
  planet,
  onSelect,
}: {
  planet: PlanetData;
  onSelect: (planet: PlanetData) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const position = scenePosition(planet);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * (planet.rotationDays < 0 ? -0.12 : 0.12);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(planet);
        }}
        onPointerEnter={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          document.body.style.cursor = "default";
        }}
      >
        <sphereGeometry args={[planet.sceneRadius, 48, 48]} />
        <meshStandardMaterial
          color={planet.color}
          emissive={planet.emissive}
          emissiveIntensity={0.18}
          roughness={0.78}
          metalness={0.02}
        />
      </mesh>

      {planet.name === "Earth" && (
        <mesh scale={1.045}>
          <sphereGeometry args={[planet.sceneRadius, 48, 48]} />
          <meshBasicMaterial
            color="#7cc5ff"
            transparent
            opacity={0.08}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {planet.ring && (
        <mesh rotation={[-Math.PI / 2.15, 0, 0.12]}>
          <ringGeometry args={[planet.ring.inner, planet.ring.outer, 96]} />
          <meshBasicMaterial
            color={planet.ring.color}
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

const constellationSets = [
  {
    name: "ORION",
    offset: [-34, 18, -55] as [number, number, number],
    points: [
      [-4, 4, 0], [-1, 2, 0], [1, 0, 0], [3, 2, 0], [5, 5, 0],
      [1, 0, 0], [0, -3, 0], [-1, -6, 0], [1, 0, 0], [4, -5, 0]
    ] as [number, number, number][]
  },
  {
    name: "CASSIOPEIA",
    offset: [30, 16, -62] as [number, number, number],
    points: [
      [-6, 1, 0], [-3, 4, 0], [0, 0, 0], [3, 4, 0], [6, 1, 0]
    ] as [number, number, number][]
  },
  {
    name: "URSA MAJOR",
    offset: [-8, 30, -70] as [number, number, number],
    points: [
      [-7, 1, 0], [-4, 2, 0], [-1, 1, 0], [2, -1, 0],
      [5, 0, 0], [7, 3, 0], [4, 4, 0], [2, -1, 0]
    ] as [number, number, number][]
  }
];

function Constellations({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      {constellationSets.map((set) => (
        <group key={set.name} position={set.offset}>
          <Line
            points={set.points}
            color="#dce5ff"
            transparent
            opacity={0.32}
            lineWidth={0.75}
          />
          {set.points.map((point, index) => (
            <mesh key={index} position={point}>
              <sphereGeometry args={[0.09, 10, 10]} />
              <meshBasicMaterial color="#eef5ff" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function CameraController({ focus }: { focus: FocusTarget }) {
  const { camera } = useThree();
  const controls = useRef<any>(null);
  const keys = useRef<Set<string>>(new Set());
  const desired = useRef(new THREE.Vector3());
  const target = useRef(new THREE.Vector3());

  useEffect(() => {
    const down = (event: KeyboardEvent) => keys.current.add(event.code);
    const up = (event: KeyboardEvent) => keys.current.delete(event.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (!focus) return;
    target.current.set(...focus.position);
    desired.current
      .set(...focus.position)
      .add(new THREE.Vector3(focus.distance * 0.8, focus.distance * 0.42, focus.distance));
  }, [focus]);

  useFrame((_, delta) => {
    if (focus) {
      camera.position.lerp(desired.current, 1 - Math.pow(0.015, delta));
      if (controls.current) {
        controls.current.target.lerp(
          target.current,
          1 - Math.pow(0.012, delta)
        );
        controls.current.update();
      }
    }

    const speed = keys.current.has("ShiftLeft") ? 8 : 3.2;
    const move = new THREE.Vector3();

    if (keys.current.has("KeyW")) move.z -= 1;
    if (keys.current.has("KeyS")) move.z += 1;
    if (keys.current.has("KeyA")) move.x -= 1;
    if (keys.current.has("KeyD")) move.x += 1;
    if (keys.current.has("KeyE")) move.y += 1;
    if (keys.current.has("KeyQ")) move.y -= 1;

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * delta);
      move.applyQuaternion(camera.quaternion);
      camera.position.add(move);

      if (controls.current) {
        controls.current.target.add(move);
      }
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enableDamping
      dampingFactor={0.055}
      rotateSpeed={0.38}
      zoomSpeed={0.6}
      panSpeed={0.5}
      minDistance={3.5}
      maxDistance={95}
      target={[0, 0, 0]}
    />
  );
}

function SpaceDust() {
  const geometry = useMemo(() => {
    const count = 1300;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 7 + Math.random() * 28;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 1.7;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#9ca4b7"
        size={0.018}
        transparent
        opacity={0.42}
        sizeAttenuation
      />
    </points>
  );
}

function Scene({
  focus,
  constellationMode,
  onSelect,
}: UniverseProps) {
  return (
    <>
      <color attach="background" args={["#030407"]} />
      <fog attach="fog" args={["#030407", 52, 105]} />
      <ambientLight intensity={0.08} />
      <Stars
        radius={150}
        depth={65}
        count={7200}
        factor={2.3}
        saturation={0}
        fade
        speed={0.16}
      />
      <SpaceDust />
      <Sun />

      {planets.map((planet) => (
        <OrbitRing key={`orbit-${planet.name}`} radius={planet.sceneDistance} />
      ))}

      {planets.map((planet) => (
        <Planet key={planet.name} planet={planet} onSelect={onSelect} />
      ))}

      <Constellations visible={constellationMode} />
      <CameraController focus={focus} />
    </>
  );
}

export default function Universe(props: UniverseProps) {
  return (
    <Canvas
      camera={{ position: [0, 13, 34], fov: 45, near: 0.1, far: 300 }}
      dpr={[1, 1.7]}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={() => undefined}
    >
      <Scene {...props} />
    </Canvas>
  );
}
