import { useState, useEffect, useMemo } from 'react';
import Alea from 'alea';

import { PhysicalMap } from './types/map.ts';
import { generatePhysicalMap } from './generator/physical';
import { randomRange } from './utils/probability.ts';
import { Map } from './components/Map.tsx';

export const App = () => {
  const randomizer = useMemo(
    () => Alea(String(Math.floor(Math.random() * 1e9))),
    []
  );

  const [physicalMap, setPhysicalMap] = useState<PhysicalMap | null>(null);
  const [physicalMapLoaded, setPhysicalMapLoaded] = useState(false);

  const generateMap = () => {
    setPhysicalMapLoaded(false);

    // temperature extremes
    const temperatureMax = 30;
    const temperatureMin = -30;

    const temperatureEquator = randomRange(
      randomizer,
      temperatureMax - 10,
      temperatureMax
    );
    const temperaturePole = randomRange(
      randomizer,
      temperatureMin,
      temperatureMin + 30
    );

    setPhysicalMap(
      generatePhysicalMap(randomizer, {
        // pointsInput
        cellsToGenerate: 10000,
        graphHeight: document.querySelector('#root')!.clientHeight,
        graphWidth: document.querySelector('#root')!.clientWidth,
        // heightExponentInput
        heightExponent: 2,
        // lakeElevationLimitInput
        lakeElevationLimit: 20,
        // precInput
        precipitationModifier: 50,
        // resolveDepressionsStepsInput
        resolveDepressionsSteps: 250,
        // temperatureEquatorInput
        temperatureEquator,
        // temperaturePoleInput
        temperaturePole,
      })
    );
    setPhysicalMapLoaded(true);
  };

  useEffect(() => {
    if (!randomizer) {
      return;
    }

    generateMap();
  }, [randomizer]);

  return physicalMap ? (
    <div>
      {!physicalMapLoaded && <h1>Loading...</h1>}
      <div style={{ visibility: physicalMapLoaded ? 'visible' : 'hidden' }}>
        <Map
          physicalMap={physicalMap}
          graphHeight={window.innerHeight}
          graphWidth={window.innerWidth}
          onRequestGeneration={generateMap}
        />
      </div>
    </div>
  ) : (
    <h1>Loading...</h1>
  );
};
