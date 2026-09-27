"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { PlanetData } from "@/data/planets";
import { planets, scenePosition } from "@/data/planets";
import type { FocusTarget } from "@/components/Universe";

const Universe = dynamic(() => import("@/components/Universe"), {
  ssr: false,
});

function formatRotation(days: number) {
  const abs = Math.abs(days);
  if (abs < 2) {
    return `${(abs * 24).toFixed(1)} h${days < 0 ? " · retrograde" : ""}`;
  }
  return `${abs.toFixed(1)} d${days < 0 ? " · retrograde" : ""}`;
}

function formatOrbit(years: number) {
  if (years < 2) return `${(years * 365.25).toFixed(0)} Earth days`;
  return `${years.toFixed(1)} Earth years`;
}

export default function Home() {
  const [selected, setSelected] = useState<PlanetData | null>(null);
  const [started, setStarted] = useState(false);
  const [constellationMode, setConstellationMode] = useState(true);

  const focus: FocusTarget = useMemo(() => {
    if (!selected) return null;
    return {
      name: selected.name,
      position: scenePosition(selected),
      distance: Math.max(3.2, selected.sceneRadius * 5.4),
    };
  }, [selected]);

  function selectPlanet(planet: PlanetData) {
    setStarted(true);
    setSelected(planet);
  }

  return (
    <main className="orbita">
      <div className="canvas-wrap">
        <Universe
          focus={focus}
          constellationMode={constellationMode}
          onSelect={selectPlanet}
        />
      </div>

      <div className="vignette" />
      <div className="grain" />

      <div className="hud">
        <div className="topbar">
          <div className="brand">
            ORBITA <span>/ SOLAR ATLAS</span>
          </div>

          <div className="mode-tabs">
            <button className="active" type="button">
              Solar system
            </button>
            <button
              className={constellationMode ? "active" : ""}
              type="button"
              onClick={() => setConstellationMode((value) => !value)}
            >
              Constellations · 15
            </button>
          </div>
        </div>

        <section className={`intro ${started ? "hidden" : ""}`}>
          <div className="kicker">Interactive 3D archive · 01</div>
          <h1>Enter the dark.</h1>
          <p>
            Fly through a cinematic model of the Solar System. Select a world,
            move freely through space and reveal its real physical parameters.
          </p>
          <button className="explore" type="button" onClick={() => setStarted(true)}>
            Begin exploration
          </button>
        </section>

        <aside className={`info-panel ${selected ? "" : "closed"}`}>
          {selected && (
            <>
              <div className="info-head">
                <div>
                  <div className="info-index">
                    OBJECT {String(planets.indexOf(selected) + 1).padStart(2, "0")}
                  </div>
                  <h2>{selected.name}</h2>
                  <div className="planet-type">{selected.type}</div>
                </div>
                <button
                  className="close"
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close planet details"
                >
                  ×
                </button>
              </div>

              <div className="stats">
                <div className="stat">
                  <span>Mean radius</span>
                  <span>{selected.radiusKm.toLocaleString()} km</span>
                </div>
                <div className="stat">
                  <span>Mass</span>
                  <span>{selected.massE24.toLocaleString()} × 10²⁴ kg</span>
                </div>
                <div className="stat">
                  <span>Distance from Sun</span>
                  <span>{selected.distanceAu.toFixed(3)} AU</span>
                </div>
                <div className="stat">
                  <span>Rotation</span>
                  <span>{formatRotation(selected.rotationDays)}</span>
                </div>
                <div className="stat">
                  <span>Orbital period</span>
                  <span>{formatOrbit(selected.orbitalYears)}</span>
                </div>
              </div>

              <div className="source-note">
                Physical values are based on NASA/JPL planetary parameter tables.
                Visual radii and orbital spacing are intentionally compressed.
              </div>
            </>
          )}
        </aside>

        <nav className="planet-strip" aria-label="Planet quick navigation">
          {planets.map((planet) => (
            <button
              key={planet.name}
              type="button"
              className={selected?.name === planet.name ? "active" : ""}
              onClick={() => selectPlanet(planet)}
            >
              {planet.name}
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}
