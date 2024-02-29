import { useState, useEffect, useMemo } from 'react';
import Alea from 'alea';

import { PackedGrid } from './types/grid.ts';
import { generate as generatePhysicalMap } from './map/physical';
import { randomRange } from './utils/probability.ts';
import { Map } from './components/Map.tsx';
import { AreaMap } from './types/areas.ts';
import { generateAreaMap } from './map/areas';

export const App = () => {
  const randomizer = useMemo(
    () => Alea(String(Math.floor(Math.random() * 1e9))),
    []
  );

  const [physicalMap, setPhyisicalMap] = useState<PackedGrid | null>(null);
  const [physicalMapLoaded, setPhysicalMapLoaded] = useState(false);

  const [areaMap, setAreaMap] = useState<AreaMap | null>(null);
  const [areaMapLoaded, setAreaMaoLoaded] = useState(false);

  useEffect(() => {
    if (!randomizer) {
      return;
    }

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

    setPhyisicalMap(
      generatePhysicalMap(randomizer, {
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
  }, [randomizer]);

  useEffect(() => {
    if (!randomizer || !physicalMapLoaded || !physicalMap) {
      return;
    }

    setAreaMap(
      generateAreaMap(randomizer, physicalMap, {
        graphHeight: window.innerHeight,
        graphWidth: window.innerWidth,
        minAreaSize: 2,
        maxAreaSize: 7,
        cellsToDrop: 2,
        minRegionSize: 10,
      })
    );
    setAreaMaoLoaded(true);
  }, [randomizer, physicalMap, physicalMapLoaded]);

  return physicalMapLoaded && areaMapLoaded ? (
    <Map
      physicalMap={physicalMap}
      areaMap={areaMap}
      graphHeight={window.innerHeight}
      graphWidth={window.innerWidth}
    />
  ) : (
    <h1>Loading...</h1>
  );
};
