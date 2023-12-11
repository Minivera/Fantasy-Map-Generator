import { useState, useEffect } from 'react';

import { PackedGrid } from './types/grid.ts';
import { Generator } from './map/generator.ts';
import { randomRange } from './utils/probability.ts';
import { Map } from './components/Map.tsx';

export const App = () => {
  const [physicalMap, setPhyisicalMap] = useState<PackedGrid | null>(null);
  const [physicalMapLoaded, setPhysicalMapLoaded] = useState(false);

  useEffect(() => {
    const generator = new Generator();

    // temperature extremes
    const temperatureMax = 30;
    const temperatureMin = -30;

    const temperatureEquator = randomRange(
      generator.randomizer,
      temperatureMax - 10,
      temperatureMax
    );
    const temperaturePole = randomRange(
      generator.randomizer,
      temperatureMin,
      temperatureMin + 30
    );

    setPhyisicalMap(
      generator.generatePhysicalMap({
        // pointsInput
        cellsToGenerate: 10000,
        graphHeight: window.innerHeight,
        graphWidth: window.innerWidth,
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
  }, []);

  return physicalMapLoaded ? (
    <Map
      physicalMap={physicalMap}
      graphHeight={window.innerHeight}
      graphWidth={window.innerWidth}
    />
  ) : (
    <h1>Loading...</h1>
  );
};
