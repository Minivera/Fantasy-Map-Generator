import Alea from 'alea';
import * as d3Ease from 'd3-ease';
import * as d3Array from 'd3-array';

import { Grid } from '../../types/grid.ts';
import { clamp, roundNumber } from '../../utils/math.ts';
import { randomRange } from '../../utils/probability.ts';
import { Coordinates } from '../../types/map.ts';
import { FeaturesMap } from '../../types/featuresMap.ts';
import { Heightmap } from '../../types/heightmap.ts';

const MAX_PASSABLE_ELEVATION = 85;

/**
 * Converts the temperature by decreasing it based on height, temperature decreases by 6.5 degree C per 1km
 */
const convertForHeight = (height: number, heightExponent: number) => {
  if (height < 20) {
    return 0;
  }
  const calculatedHeight = Math.pow(height - 18, heightExponent);
  return roundNumber((calculatedHeight / 1000) * 6.5);
};

export const getWindDirections = (
  tier: number,
  winds: [number, number, number, number, number, number]
) => {
  const angle = winds[tier];

  const isWest = angle > 40 && angle < 140;
  const isEast = angle > 220 && angle < 320;
  const isNorth = angle > 100 && angle < 260;
  const isSouth = angle > 280 || angle < 80;

  return { isWest, isEast, isNorth, isSouth };
};

const getPrecipitation = (
  heightmap: Heightmap,
  modifier: number,
  humidity: number,
  i: number,
  n: number
) => {
  const { heights } = heightmap;

  // precipitation in normal conditions
  const normalLoss = Math.max(humidity / (10 * modifier), 1);
  // difference in height
  const diff = Math.max(heights[i + n].height - heights[i].height, 0);
  // 50 stands for hills, 70 for mountains
  const mod = (heights[i + n].height / 70) ** 2;
  return Math.floor(clamp(normalLoss + diff * mod, 1, humidity));
};

const passWind = (
  randomizer: ReturnType<typeof Alea>,
  featuresMap: FeaturesMap,
  heightmap: Heightmap,
  modifier: number,
  source: ([number, number, number] | number)[],
  maxPrec: number,
  next: number,
  steps: number
) => {
  const { features } = featuresMap;
  const { heights } = heightmap;

  const maxPrecInit = maxPrec;

  for (const first of source) {
    let firstIndex: number = 0;
    if (Array.isArray(first) && typeof first[0] !== 'undefined') {
      maxPrec = Math.min(maxPrecInit * first[1], 255);
      firstIndex = first[0];
    } else if (typeof first === 'number') {
      firstIndex = first;
    }

    // initial water amount
    let humidity = maxPrec - heights[firstIndex].height;
    // if first cell in row is too elevated consider wind dry
    if (humidity <= 0) {
      continue;
    }

    for (let s = 0, current = firstIndex; s < steps - 1; s++, current += next) {
      // no flux in permafrost
      if (features[current].temperature < -5) {
        continue;
      }

      if (heights[current].height < 20) {
        // water cell
        if (heights[current + next].height >= 20) {
          // coastal precipitation
          features[current + next].precipitation += Math.floor(
            Math.max(humidity / randomRange(randomizer, 10, 20), 1)
          );
        } else {
          // wind gets more humidity passing water cell
          humidity = Math.min(humidity + 5 * modifier, maxPrec);
          // water cells precipitation (need to correctly pour water through lakes)
          features[current].precipitation += Math.floor(5 * modifier);
        }
        continue;
      }

      // land cell
      const isPassable =
        heights[current + next].height <= MAX_PASSABLE_ELEVATION;
      const precipitation = isPassable
        ? getPrecipitation(heightmap, modifier, humidity, current, next)
        : humidity;
      features[current].precipitation += Math.floor(precipitation);
      const evaporation = precipitation > 1.5 ? 1 : 0; // some humidity evaporates back to the atmosphere
      humidity = isPassable
        ? clamp(humidity - precipitation + evaporation, 0, maxPrec)
        : 0;
    }
  }
};

const calculateTemperatures = (
  grid: Grid,
  featuresMap: FeaturesMap,
  heightMap: Heightmap,
  mapCoordinates: Coordinates,
  {
    graphHeight,
    temperatureEquator,
    temperaturePole,
    heightExponent,
  }: {
    graphWidth: number;
    graphHeight: number;
    temperatureEquator: number;
    temperaturePole: number;
    heightExponent: number;
  }
) => {
  const { cells } = grid;
  const { features } = featuresMap;
  const { heights } = heightMap;

  const tDelta = temperatureEquator - temperaturePole;
  // interpolation function
  const int = d3Ease.easePolyInOut.exponent(0.5);

  d3Array.range(0, cells.length, grid.cellsX).forEach(r => {
    const y = grid.points[r][1];
    const lat = Math.abs(
      mapCoordinates.latitudeN - (y / graphHeight) * mapCoordinates.latitudeT
    ); // [0; 90]
    const initTemp = temperatureEquator - int(lat / 90) * tDelta;
    for (let i = r; i < r + grid.cellsX; i++) {
      features[i].temperature = clamp(
        initTemp - convertForHeight(heights[i].height, heightExponent),
        -128,
        127
      );
    }
  });
};

/**
 * Simple precipitation generation model to generate how much precipitation each cells receives, which might impact
 * its biome.
 */
const generatePrecipitation = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  featuresMap: FeaturesMap,
  heightmap: Heightmap,
  mapCoordinates: Coordinates,
  {
    cellsToGenerate,
    precipitationModifier,
    winds = [225, 45, 225, 315, 135, 315],
  }: {
    cellsToGenerate: number;
    precipitationModifier: number;
    winds?: [number, number, number, number, number, number];
  }
) => {
  const { cells, cellsX, cellsY } = grid;

  const cellsNumberModifier = (cellsToGenerate / 10000) ** 0.25;
  const precInputModifier = precipitationModifier / 100;
  const modifier = cellsNumberModifier * precInputModifier;

  const westerly: [number, number, number][] = [];
  const easterly: [number, number, number][] = [];
  let southerly = 0;
  let northerly = 0;

  // precipitation modifier per latitude band
  // x4 = 0-5 latitude: wet through the year (rising zone)
  // x2 = 5-20 latitude: wet summer (rising zone), dry winter (sinking zone)
  // x1 = 20-30 latitude: dry all year (sinking zone)
  // x2 = 30-50 latitude: wet winter (rising zone), dry summer (sinking zone)
  // x3 = 50-60 latitude: wet all year (rising zone)
  // x2 = 60-70 latitude: wet summer (rising zone), dry winter (sinking zone)
  // x1 = 70-85 latitude: dry all year (sinking zone)
  // x0.5 = 85-90 latitude: dry all year (sinking zone)
  const latitudeModifier = [
    4, 2, 2, 2, 1, 1, 2, 2, 2, 2, 3, 3, 2, 2, 1, 1, 1, 0.5,
  ];

  // define wind directions based on cells latitude and prevailing winds there
  d3Array.range(0, cells.length, cellsX).forEach((c, i) => {
    const lat =
      mapCoordinates.latitudeN - (i / cellsY) * mapCoordinates.latitudeT;
    const latBand = ((Math.abs(lat) - 1) / 5) | 0;
    const latMod = latitudeModifier[latBand];
    const windTier = (Math.abs(lat - 89) / 30) | 0; // 30d tiers from 0 to 5 from N to S
    const { isWest, isEast, isNorth, isSouth } = getWindDirections(
      windTier,
      winds
    );

    if (isWest) {
      westerly.push([c, latMod, windTier]);
    }
    if (isEast) {
      easterly.push([c + cellsX - 1, latMod, windTier]);
    }
    if (isNorth) {
      northerly++;
    }
    if (isSouth) {
      southerly++;
    }
  });

  // distribute winds by direction
  if (westerly.length) {
    passWind(
      randomizer,
      featuresMap,
      heightmap,
      modifier,
      westerly,
      120 * modifier,
      1,
      cellsX
    );
  }
  if (easterly.length) {
    passWind(
      randomizer,
      featuresMap,
      heightmap,
      modifier,
      easterly,
      120 * modifier,
      -1,
      cellsX
    );
  }

  const vertT = southerly + northerly;
  if (northerly) {
    const bandN = ((Math.abs(mapCoordinates.latitudeN) - 1) / 5) | 0;
    const latModN =
      mapCoordinates.latitudeT > 60
        ? (d3Array.mean(latitudeModifier) as number)
        : latitudeModifier[bandN];
    const maxPrecN = (northerly / vertT) * 60 * modifier * latModN;
    passWind(
      randomizer,
      featuresMap,
      heightmap,
      modifier,
      d3Array.range(0, cellsX, 1),
      maxPrecN,
      cellsX,
      cellsY
    );
  }

  if (southerly) {
    const bandS = ((Math.abs(mapCoordinates.latitudeS) - 1) / 5) | 0;
    const latModS =
      mapCoordinates.latitudeT > 60
        ? (d3Array.mean(latitudeModifier) as number)
        : latitudeModifier[bandS];
    const maxPrecS = (southerly / vertT) * 60 * modifier * latModS;
    passWind(
      randomizer,
      featuresMap,
      heightmap,
      modifier,
      d3Array.range(cells.length - cellsX, cells.length, 1),
      maxPrecS,
      -cellsX,
      cellsY
    );
  }
};

/**
 * Generates the cells climates by calculating their temperature given their elevation, then generates all the
 * precipitations for the cells using a simple wind based precipitation model. Necessary to get the biomes going as it
 * mutates the `temperatures` and `precipitations` arrays of the grid cells.
 */
export const generateClimate = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  featuresMap: FeaturesMap,
  heightMap: Heightmap,
  mapCoordinates: Coordinates,
  options: {
    graphWidth: number;
    graphHeight: number;
    temperatureEquator: number;
    temperaturePole: number;
    heightExponent: number;
    cellsToGenerate: number;
    precipitationModifier: number;
    winds?: [number, number, number, number, number, number];
  }
) => {
  calculateTemperatures(grid, featuresMap, heightMap, mapCoordinates, options);
  generatePrecipitation(
    randomizer,
    grid,
    featuresMap,
    heightMap,
    mapCoordinates,
    options
  );
};
