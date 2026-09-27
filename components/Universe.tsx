"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
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

type TexturePair = {
  color: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
};

function hashSeed(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hash2(x: number, y: number, seed: number) {
  let h = Math.imul(x ^ seed, 374761393) + Math.imul(y, 668265263);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number, seed: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothstep(x - x0);
  const ty = smoothstep(y - y0);
  const a = hash2(x0, y0, seed);
  const b = hash2(x0 + 1, y0, seed);
  const c = hash2(x0, y0 + 1, seed);
  const d = hash2(x0 + 1, y0 + 1, seed);
  const ab = a + (b - a) * tx;
  const cd = c + (d - c) * tx;
  return ab + (cd - ab) * ty;
}

function fbm(x: number, y: number, seed: number) {
  let value = 0;
  let amplitude = 0.55;
  let frequency = 1;
  for (let octave = 0; octave < 5; octave += 1) {
    value += valueNoise(x * frequency, y * frequency, seed + octave * 97) * amplitude;
    frequency *= 2.04;
    amplitude *= 0.48;
  }
  return value / 1.04;
}

function mix(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
}

function createPlanetMaps(name: string): TexturePair {
  const width = 512;
  const height = 256;
  const colorCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  colorCanvas.width = bumpCanvas.width = width;
  colorCanvas.height = bumpCanvas.height = height;

  const ctx = colorCanvas.getContext("2d")!;
  const bumpCtx = bumpCanvas.getContext("2d")!;
  const image = ctx.createImageData(width, height);
  const bumpImage = bumpCtx.createImageData(width, height);
  const seed = hashSeed(name);

  for (let y = 0; y < height; y += 1) {
    const v = y / (height - 1);
    const lat = (v - 0.5) * Math.PI;
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      const n1 = fbm(u * 7.5, v * 5.5, seed);
      const n2 = fbm(u * 18 + 4.3, v * 13 + 2.2, seed + 311);
      const band = Math.sin(v * Math.PI * 34 + n1 * 3.5);
      let r = 120;
      let g = 120;
      let b = 120;
      let relief = n2;

      if (name === "Mercury") {
        const tone = 92 + n1 * 82 + n2 * 24;
        r = tone * 1.03;
        g = tone;
        b = tone * 0.94;
        relief = n1 * 0.72 + n2 * 0.28;
      } else if (name === "Venus") {
        const swirl = Math.sin(u * 22 + v * 13 + n1 * 7);
        r = 192 + n1 * 38 + swirl * 10;
        g = 145 + n1 * 44 + swirl * 9;
        b = 77 + n2 * 26;
        relief = n1 * 0.35 + 0.45;
      } else if (name === "Earth") {
        const land = n1 + Math.sin(u * 17 + v * 9) * 0.035;
        const ice = Math.max(0, Math.abs(Math.sin(lat)) - 0.83) / 0.17;
        if (ice > 0.22) {
          r = mix(154, 238, ice);
          g = mix(188, 246, ice);
          b = mix(211, 250, ice);
          relief = 0.55;
        } else if (land > 0.53) {
          const mountain = Math.max(0, (land - 0.53) * 4.2);
          r = mix(50, 151, mountain);
          g = mix(99, 119, mountain);
          b = mix(55, 73, mountain);
          relief = 0.48 + mountain * 0.45;
        } else {
          const ocean = Math.max(0, Math.min(1, (0.53 - land) * 5));
          r = mix(30, 10, ocean);
          g = mix(102, 43, ocean);
          b = mix(151, 104, ocean);
          relief = 0.18 + n2 * 0.08;
        }
      } else if (name === "Mars") {
        const dark = Math.max(0, Math.min(1, n1 * 1.45 - 0.34));
        const polar = Math.max(0, Math.abs(Math.sin(lat)) - 0.91) * 11;
        r = mix(111, 201, dark);
        g = mix(48, 94, dark);
        b = mix(32, 52, dark);
        r = mix(r, 228, polar);
        g = mix(g, 219, polar);
        b = mix(b, 201, polar);
        relief = n1 * 0.65 + n2 * 0.35;
      } else if (name === "Jupiter") {
        const belts = 0.5 + band * 0.5;
        const turbulence = (n1 - 0.5) * 32;
        r = 176 + belts * 49 + turbulence;
        g = 132 + belts * 51 + turbulence * 0.6;
        b = 93 + belts * 49 + turbulence * 0.35;
        const dx = Math.min(Math.abs(u - 0.72), 1 - Math.abs(u - 0.72)) / 0.075;
        const dy = (v - 0.62) / 0.047;
        const spot = Math.max(0, 1 - dx * dx - dy * dy);
        r = mix(r, 182, spot);
        g = mix(g, 73, spot);
        b = mix(b, 47, spot);
        relief = 0.46 + Math.abs(band) * 0.06;
      } else if (name === "Saturn") {
        const belts = 0.5 + Math.sin(v * Math.PI * 44 + n1 * 1.5) * 0.5;
        r = 198 + belts * 35;
        g = 176 + belts * 32;
        b = 126 + belts * 32;
        relief = 0.48 + belts * 0.035;
      } else if (name === "Uranus") {
        const haze = n1 * 10 + Math.sin(v * Math.PI * 16) * 3;
        r = 126 + haze;
        g = 190 + haze;
        b = 199 + haze;
        relief = 0.48;
      } else if (name === "Neptune") {
        const belts = Math.sin(v * Math.PI * 28 + n1 * 2.4);
        r = 42 + n1 * 24 + belts * 5;
        g = 75 + n1 * 34 + belts * 7;
        b = 154 + n1 * 57 + belts * 11;
        relief = 0.48 + Math.abs(belts) * 0.045;
      }

      const index = (y * width + x) * 4;
      image.data[index] = Math.max(0, Math.min(255, r));
      image.data[index + 1] = Math.max(0, Math.min(255, g));
      image.data[index + 2] = Math.max(0, Math.min(255, b));
      image.data[index + 3] = 255;

      const bump = Math.round(Math.max(0, Math.min(1, relief)) * 255);
      bumpImage.data[index] = bump;
      bumpImage.data[index + 1] = bump;
      bumpImage.data[index + 2] = bump;
      bumpImage.data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  bumpCtx.putImageData(bumpImage, 0, 0);

  const color = new THREE.CanvasTexture(colorCanvas);
  const bump = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  color.wrapS = THREE.RepeatWrapping;
  bump.wrapS = THREE.RepeatWrapping;
  color.needsUpdate = true;
  bump.needsUpdate = true;
  return { color, bump };
}

function createCloudTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(width, height);
  const seed = 9871;

  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const noise = fbm(u * 11, v * 8, seed);
      const wisps = Math.max(0, (noise - 0.55) * 3.4);
      const i = (y * width + x) * 4;
      image.data[i] = 244;
      image.data[i + 1] = 248;
      image.data[i + 2] = 255;
      image.data[i + 3] = Math.round(Math.min(1, wisps) * 150);
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function OrbitRing({ radius }: { radius: number }) {
  const points = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let i = 0; i <= 220; i += 1) {
      const a = (i / 220) * Math.PI * 2;
      list.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return list;
  }, [radius]);

  return (
    <Line
      points={points}
      color="#748096"
      transparent
      opacity={0.12}
      lineWidth={0.52}
    />
  );
}

function Sun() {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 1.1) * 0.014;
    glowRef.current.scale.setScalar(pulse);
  });

  return (
    <group>
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.45, 96, 96]} />
        <meshBasicMaterial color="#fff0b8" />
      </mesh>
      <mesh scale={1.1}>
        <sphereGeometry args={[2.45, 64, 64]} />
        <meshBasicMaterial
          color="#ffad47"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh scale={1.32}>
        <sphereGeometry args={[2.45, 48, 48]} />
        <meshBasicMaterial
          color="#ff842e"
          transparent
          opacity={0.035}
          side={THREE.BackSide}
        />
      </mesh>
      <pointLight color="#fff0c5" intensity={1900} distance={115} decay={1.62} />
    </group>
  );
}

const atmosphereColors: Record<string, string> = {
  Venus: "#f1b765",
  Earth: "#61bfff",
  Mars: "#d06f46",
  Jupiter: "#caa582",
  Saturn: "#d7c99c",
  Uranus: "#a5e6ea",
  Neptune: "#4b7ee8",
};


const planetTextureUrls: Partial<Record<string, string>> = {
  Venus:
    "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/image/venus/preview.webp?w=2048",
  Earth:
    "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/image/earth-a/preview.webp?w=2048",
  Mars:
    "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/image/mars/preview.webp?w=2048",
  Jupiter:
    "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/image/jupiter/preview.webp?w=2048",
  Saturn:
    "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/image/saturn/preview.webp?w=2048",
  Neptune:
    "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/3d/resources/image/neptune/preview.webp?w=2048",
};

const axialTiltDeg: Record<string, number> = {
  Mercury: 0.03,
  Venus: 177.4,
  Earth: 23.44,
  Mars: 25.19,
  Jupiter: 3.13,
  Saturn: 26.73,
  Uranus: 97.77,
  Neptune: 28.32,
};

const flatteningY: Record<string, number> = {
  Mercury: 1,
  Venus: 1,
  Earth: 0.9966,
  Mars: 0.994,
  Jupiter: 0.935,
  Saturn: 0.902,
  Uranus: 0.977,
  Neptune: 0.983,
};

function createRingTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = 32;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, 32);

  for (let x = 0; x < size; x += 1) {
    const t = x / (size - 1);
    const fine = Math.sin(t * Math.PI * 210) * 0.5 + 0.5;
    const broad = Math.sin(t * Math.PI * 19 + 0.6) * 0.5 + 0.5;
    const cassini = Math.exp(-Math.pow((t - 0.58) / 0.018, 2));
    const alpha = Math.max(
      0.035,
      Math.min(0.92, 0.18 + fine * 0.28 + broad * 0.34 - cassini * 0.82)
    );
    const warmth = 188 + broad * 36;

    for (let y = 0; y < 32; y += 1) {
      const i = (y * size + x) * 4;
      image.data[i] = warmth + 18;
      image.data[i + 1] = warmth + 7;
      image.data[i + 2] = warmth - 18;
      image.data[i + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  return texture;
}

function Planet({
  planet,
  onSelect,
}: {
  planet: PlanetData;
  onSelect: (planet: PlanetData) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const position = scenePosition(planet);
  const maps = useMemo(() => createPlanetMaps(planet.name), [planet.name]);
  const cloudTexture = useMemo(
    () => (planet.name === "Earth" ? createCloudTexture() : null),
    [planet.name]
  );
  const ringTexture = useMemo(
    () => (planet.name === "Saturn" ? createRingTexture() : null),
    [planet.name]
  );
  const [photoMap, setPhotoMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const url = planetTextureUrls[planet.name];
    if (!url) return;

    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    let alive = true;

    loader.load(
      url,
      (texture) => {
        if (!alive) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.anisotropy = 8;
        texture.needsUpdate = true;
        setPhotoMap(texture);
      },
      undefined,
      () => {
        setPhotoMap(null);
      }
    );

    return () => {
      alive = false;
    };
  }, [planet.name]);

  useEffect(() => {
    return () => {
      maps.color.dispose();
      maps.bump.dispose();
      cloudTexture?.dispose();
      ringTexture?.dispose();
      photoMap?.dispose();
    };
  }, [maps, cloudTexture, ringTexture, photoMap]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * (planet.rotationDays < 0 ? -0.09 : 0.09);
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.025;
    }
  });

  const bumpScale =
    planet.name === "Jupiter" ||
    planet.name === "Saturn" ||
    planet.name === "Uranus" ||
    planet.name === "Neptune"
      ? 0.008
      : 0.028;

  const tilt = THREE.MathUtils.degToRad(axialTiltDeg[planet.name] ?? 0);
  const yScale = flatteningY[planet.name] ?? 1;

  return (
    <group position={position} rotation={[0, 0, tilt]}>
      <mesh
        scale={[1, yScale, 1]}
        ref={ref}
        castShadow
        receiveShadow
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
        <sphereGeometry args={[planet.sceneRadius, 96, 96]} />
        <meshPhysicalMaterial
          map={photoMap ?? maps.color}
          bumpMap={
            planet.name === "Mercury" ||
            planet.name === "Venus" ||
            planet.name === "Mars"
              ? maps.bump
              : undefined
          }
          bumpScale={
            planet.name === "Mercury" ||
            planet.name === "Venus" ||
            planet.name === "Mars"
              ? bumpScale
              : 0
          }
          roughness={
            planet.name === "Earth"
              ? 0.56
              : planet.name === "Jupiter" ||
                  planet.name === "Saturn" ||
                  planet.name === "Uranus" ||
                  planet.name === "Neptune"
                ? 0.9
                : 0.82
          }
          metalness={0}
          clearcoat={planet.name === "Earth" ? 0.16 : 0}
          clearcoatRoughness={0.72}
        />
      </mesh>

      {cloudTexture && (
        <mesh ref={cloudsRef} scale={[1.018, 1.018 * yScale, 1.018]}>
          <sphereGeometry args={[planet.sceneRadius, 96, 96]} />
          <meshStandardMaterial
            map={cloudTexture}
            transparent
            opacity={0.7}
            depthWrite={false}
            roughness={1}
          />
        </mesh>
      )}

      {atmosphereColors[planet.name] && (
        <>
          <mesh scale={[1.045, 1.045 * yScale, 1.045]}>
            <sphereGeometry args={[planet.sceneRadius, 72, 72]} />
            <meshBasicMaterial
              color={atmosphereColors[planet.name]}
              transparent
              opacity={planet.name === "Earth" ? 0.075 : 0.035}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
          <mesh scale={[1.085, 1.085 * yScale, 1.085]}>
            <sphereGeometry args={[planet.sceneRadius, 64, 64]} />
            <meshBasicMaterial
              color={atmosphereColors[planet.name]}
              transparent
              opacity={planet.name === "Earth" ? 0.025 : 0.014}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        </>
      )}

      {planet.ring && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.ring.inner, planet.ring.outer, 256]} />
          <meshStandardMaterial
            map={ringTexture ?? undefined}
            alphaMap={ringTexture ?? undefined}
            color={planet.ring.color}
            transparent
            opacity={0.78}
            alphaTest={0.035}
            side={THREE.DoubleSide}
            roughness={0.92}
            metalness={0}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

type Constellation = {
  name: string;
  offset: [number, number, number];
  rotation?: [number, number, number];
  points: [number, number, number][];
};

const constellationSets: Constellation[] = [
  {
    name: "ORION",
    offset: [-34, 18, -55],
    points: [
      [-4, 4, 0], [-1, 2, 0], [1, 0, 0], [3, 2, 0], [5, 5, 0],
      [1, 0, 0], [0, -3, 0], [-1, -6, 0], [1, 0, 0], [4, -5, 0]
    ]
  },
  {
    name: "CASSIOPEIA",
    offset: [30, 16, -62],
    rotation: [0.1, -0.25, 0.12],
    points: [[-6, 1, 0], [-3, 4, 0], [0, 0, 0], [3, 4, 0], [6, 1, 0]]
  },
  {
    name: "URSA MAJOR",
    offset: [-8, 30, -70],
    rotation: [0, 0.3, -0.12],
    points: [[-7, 1, 0], [-4, 2, 0], [-1, 1, 0], [2, -1, 0], [5, 0, 0], [7, 3, 0], [4, 4, 0], [2, -1, 0]]
  },
  {
    name: "CYGNUS",
    offset: [20, 29, -58],
    rotation: [0.08, 0.2, 0.6],
    points: [[0, 6, 0], [0, 2, 0], [0, -2, 0], [0, -6, 0], [0, -2, 0], [-4, 0, 0], [0, -2, 0], [4, 0, 0]]
  },
  {
    name: "LYRA",
    offset: [40, 6, -54],
    rotation: [0, -0.3, 0.15],
    points: [[-1, 4, 0], [0, 1, 0], [3, 0, 0], [2, -3, 0], [-1, -2, 0], [0, 1, 0]]
  },
  {
    name: "SCORPIUS",
    offset: [-42, -12, -63],
    rotation: [0.2, 0.1, -0.24],
    points: [[-6, 4, 0], [-3, 3, 0], [-1, 1, 0], [0, -2, 0], [2, -4, 0], [5, -5, 0], [7, -3, 0], [6, -1, 0]]
  },
  {
    name: "LEO",
    offset: [35, -18, -72],
    rotation: [0.1, -0.25, 0],
    points: [[-5, -2, 0], [-2, 0, 0], [0, 3, 0], [3, 4, 0], [5, 2, 0], [3, 0, 0], [0, 0, 0], [-2, 0, 0]]
  },
  {
    name: "TAURUS",
    offset: [-27, 5, -78],
    rotation: [-0.1, 0.45, 0.15],
    points: [[-6, 4, 0], [-2, 1, 0], [0, 0, 0], [3, 2, 0], [6, 5, 0], [0, 0, 0], [2, -3, 0], [5, -5, 0]]
  },
  {
    name: "GEMINI",
    offset: [12, -24, -60],
    rotation: [0.18, 0.2, -0.08],
    points: [[-3, 5, 0], [-2, 1, 0], [-3, -4, 0], [-2, 1, 0], [2, 2, 0], [3, -4, 0], [2, 2, 0], [4, 5, 0]]
  },
  {
    name: "ANDROMEDA",
    offset: [-50, 24, -86],
    rotation: [0.2, 0.5, 0.2],
    points: [[-7, 0, 0], [-4, 1, 0], [-1, 0, 0], [2, 2, 0], [5, 1, 0], [8, 3, 0]]
  },
  {
    name: "PEGASUS",
    offset: [48, 22, -86],
    rotation: [-0.08, -0.45, 0.2],
    points: [[-5, 4, 0], [3, 4, 0], [4, -3, 0], [-4, -4, 0], [-5, 4, 0], [-8, 7, 0]]
  },
  {
    name: "AQUILA",
    offset: [5, 40, -92],
    rotation: [0.1, 0.1, -0.35],
    points: [[-5, 0, 0], [-2, 1, 0], [0, 4, 0], [2, 1, 0], [5, 0, 0], [2, 1, 0], [1, -4, 0]]
  },
  {
    name: "CANIS MAJOR",
    offset: [-18, -34, -76],
    rotation: [0.25, 0.2, 0.25],
    points: [[-5, 2, 0], [-2, 1, 0], [0, 4, 0], [2, 0, 0], [5, -2, 0], [2, 0, 0], [0, -4, 0], [-3, -2, 0]]
  },
  {
    name: "SAGITTARIUS",
    offset: [28, -34, -88],
    rotation: [0.25, -0.35, -0.2],
    points: [[-5, 1, 0], [-2, 3, 0], [1, 2, 0], [4, 4, 0], [3, 0, 0], [6, -2, 0], [2, -3, 0], [1, 2, 0], [-1, -2, 0]]
  },
  {
    name: "DRACO",
    offset: [-6, 48, -102],
    rotation: [0.15, 0.4, 0.05],
    points: [[-7, 0, 0], [-4, 2, 0], [-1, 1, 0], [2, 3, 0], [5, 2, 0], [7, 5, 0], [5, 7, 0], [3, 5, 0]]
  }
];

function Constellations({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      {constellationSets.map((set, setIndex) => (
        <group
          key={set.name}
          position={set.offset}
          rotation={set.rotation ?? [0, 0, 0]}
        >
          <Line
            points={set.points}
            color="#dce5ff"
            transparent
            opacity={0.22 + (setIndex % 3) * 0.035}
            lineWidth={0.7}
          />
          {set.points.map((point, index) => {
            const size = index % 4 === 0 ? 0.13 : 0.085;
            return (
              <mesh key={index} position={point}>
                <sphereGeometry args={[size, 12, 12]} />
                <meshBasicMaterial
                  color={index % 5 === 0 ? "#ffffff" : "#dce8ff"}
                />
              </mesh>
            );
          })}
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
        controls.current.target.lerp(target.current, 1 - Math.pow(0.012, delta));
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
      if (controls.current) controls.current.target.add(move);
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
      maxDistance={110}
      target={[0, 0, 0]}
    />
  );
}

function SpaceDust() {
  const geometry = useMemo(() => {
    const count = 1700;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 7 + Math.random() * 31;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 2.1;
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
        size={0.017}
        transparent
        opacity={0.38}
        sizeAttenuation
      />
    </points>
  );
}

function Scene({ focus, constellationMode, onSelect }: UniverseProps) {
  return (
    <>
      <color attach="background" args={["#030407"]} />
      <fog attach="fog" args={["#030407", 58, 122]} />
      <ambientLight intensity={0.055} />
      <hemisphereLight color="#536485" groundColor="#050608" intensity={0.08} />
      <Stars
        radius={170}
        depth={78}
        count={10000}
        factor={2.25}
        saturation={0}
        fade
        speed={0.12}
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
      camera={{ position: [0, 13, 34], fov: 45, near: 0.1, far: 360 }}
      dpr={[1, 2]}
      shadows
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.08;
      }}
      onPointerMissed={() => undefined}
    >
      <Scene {...props} />
    </Canvas>
  );
}
