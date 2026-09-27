export type PlanetData = {
  name: string;
  type: string;
  color: string;
  emissive: string;
  radiusKm: number;
  massE24: number;
  rotationDays: number;
  orbitalYears: number;
  distanceAu: number;
  sceneRadius: number;
  sceneDistance: number;
  angle: number;
  ring?: {
    inner: number;
    outer: number;
    color: string;
  };
};

export const planets: PlanetData[] = [
  {
    name: "Mercury",
    type: "Terrestrial planet",
    color: "#9a9388",
    emissive: "#3b3833",
    radiusKm: 2439.4,
    massE24: 0.330103,
    rotationDays: 58.6462,
    orbitalYears: 0.2408467,
    distanceAu: 0.387,
    sceneRadius: 0.3,
    sceneDistance: 5.2,
    angle: 0.25
  },
  {
    name: "Venus",
    type: "Terrestrial planet",
    color: "#d7aa6a",
    emissive: "#5b3d1b",
    radiusKm: 6051.8,
    massE24: 4.86731,
    rotationDays: -243.018,
    orbitalYears: 0.615197,
    distanceAu: 0.723,
    sceneRadius: 0.48,
    sceneDistance: 7.2,
    angle: 1.7
  },
  {
    name: "Earth",
    type: "Terrestrial planet",
    color: "#4f78a8",
    emissive: "#10233a",
    radiusKm: 6371.0,
    massE24: 5.97217,
    rotationDays: 0.99727,
    orbitalYears: 1.00002,
    distanceAu: 1.0,
    sceneRadius: 0.5,
    sceneDistance: 9.2,
    angle: 3.2
  },
  {
    name: "Mars",
    type: "Terrestrial planet",
    color: "#b85f3b",
    emissive: "#4b1f13",
    radiusKm: 3389.5,
    massE24: 0.641691,
    rotationDays: 1.02596,
    orbitalYears: 1.88085,
    distanceAu: 1.524,
    sceneRadius: 0.38,
    sceneDistance: 11.3,
    angle: 4.5
  },
  {
    name: "Jupiter",
    type: "Gas giant",
    color: "#c8aa88",
    emissive: "#4d3a2b",
    radiusKm: 69911,
    massE24: 1898.125,
    rotationDays: 0.41354,
    orbitalYears: 11.8626,
    distanceAu: 5.203,
    sceneRadius: 1.35,
    sceneDistance: 15.4,
    angle: 0.95
  },
  {
    name: "Saturn",
    type: "Gas giant",
    color: "#d6c18d",
    emissive: "#514628",
    radiusKm: 58232,
    massE24: 568.317,
    rotationDays: 0.444,
    orbitalYears: 29.4475,
    distanceAu: 9.537,
    sceneRadius: 1.15,
    sceneDistance: 19.5,
    angle: 2.6,
    ring: {
      inner: 1.45,
      outer: 2.15,
      color: "#c9b78e"
    }
  },
  {
    name: "Uranus",
    type: "Ice giant",
    color: "#9fd3d7",
    emissive: "#23464b",
    radiusKm: 25362,
    massE24: 86.8099,
    rotationDays: -0.7183,
    orbitalYears: 84.0168,
    distanceAu: 19.191,
    sceneRadius: 0.8,
    sceneDistance: 23.6,
    angle: 4.1
  },
  {
    name: "Neptune",
    type: "Ice giant",
    color: "#416bc0",
    emissive: "#152b62",
    radiusKm: 24622,
    massE24: 102.409,
    rotationDays: 0.6713,
    orbitalYears: 164.79,
    distanceAu: 30.069,
    sceneRadius: 0.78,
    sceneDistance: 27.8,
    angle: 5.45
  }
];

export function scenePosition(planet: PlanetData): [number, number, number] {
  return [
    Math.cos(planet.angle) * planet.sceneDistance,
    0,
    Math.sin(planet.angle) * planet.sceneDistance
  ];
}
