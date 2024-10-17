import * as d3 from 'd3-array';

import { Cell, Grid } from '../../types/grid.ts';
import {
  BiomeType,
  ClimateType,
  FeaturesMap,
  LandType,
  VegetationType,
  WetnessType,
} from '../../types/featuresMap.ts';
import { Heightmap } from '../../types/heightmap.ts';

import { HeightmapTemplate } from './heightmapTemplates.ts';

/**
 * Calculate cell-distance to coast for every cell given.
 */
const markupCoastDistance = (
  cells: Cell[],
  features: FeaturesMap,
  start: number,
  increment: number,
  limit: number
) => {
  for (
    let t = start, count = Infinity;
    count > 0 && t > limit;
    t += increment
  ) {
    count = 0;
    const prevT = t - increment;
    for (let i = 0; i < cells.length; i++) {
      if (features.features[i].distanceToCoast !== prevT) {
        continue;
      }

      for (const c of cells[i].adjacentCells) {
        if (features.features[c].distanceToCoast) {
          continue;
        }

        features.features[c].distanceToCoast = t;
        count++;
      }
    }
  }
};

/**
 * Looks at every cell to find deep depressions in the map at a specific elevation limit, then generates lakes there to
 * "fill holes" in the map.
 */
const addLakesInDeepDepressions = (
  grid: Grid,
  heightmap: Heightmap,
  featuresMap: FeaturesMap,
  lakeElevationLimit: number
) => {
  const { cells } = grid;
  const { features } = featuresMap;
  const { heights } = heightmap;

  if (lakeElevationLimit >= 80) {
    return;
  }

  cells.forEach((cell, i) => {
    // cells at lower than 20 are likely underwater already
    if (cell.isNearBorder || heights[i].height < 20) {
      return;
    }

    const minHeight = d3.min(
      cell.adjacentCells.map(c => heights[c].height)
    ) as number;
    if (heights[i].height > minHeight) {
      return;
    }

    let deep = true;
    const threshold = heights[i].height + lakeElevationLimit;
    const queue = [i];
    const checked = [];
    checked[i] = true;

    // check if elevated cell can potentially pour to water
    while (deep && queue.length) {
      const q = queue.pop() as number;

      for (const n of cells[q].adjacentCells) {
        if (checked[n]) {
          continue;
        }
        if (heights[n].height >= threshold) {
          continue;
        }

        if (heights[n].height < 20) {
          deep = false;
          break;
        }

        checked[n] = true;
        queue.push(n);
      }
    }

    // if not, add a lake
    if (deep) {
      const lakeCells = [i].concat(
        cell.adjacentCells.filter(n => heights[n].height === heights[i].height)
      );

      lakeCells.forEach(i => {
        heights[i].height = 19;
        features[i].type = LandType.LAKE;
        cell.adjacentCells.forEach(n => {
          if (!lakeCells.includes(n)) {
            features[n].type = LandType.LAND;
          }
        });
      });
    }
  });
};

/**
 * Near sea lakes usually get a lot of water inflow, most of them should break the threshold and flow out to sea (see
 * Ancylus Lake). This opens up those lakes, so they flow into the ocean rather than stay as lakes.
 */
const openNearSeaLakes = (
  grid: Grid,
  heightmap: Heightmap,
  featureMap: FeaturesMap,
  template: HeightmapTemplate
) => {
  // no need for Atolls, the point is they have a lake that's not opened to the sea
  if (template.name === 'Atoll') {
    return;
  }

  const { cells } = grid;
  const { features } = featureMap;
  const { heights } = heightmap;

  // no lakes
  if (!features.find(f => f.type === LandType.LAKE)) {
    return;
  }

  // max height that can be breached by water
  const LIMIT = 22;

  for (const i in cells) {
    const feature = features[i];

    // not a lake cell
    if (feature.type !== LandType.LAKE) {
      continue;
    }

    for (const c of cells[i].adjacentCells) {
      let shouldBreak = false;
      // water cannot break this
      if (features[c].distanceToCoast !== 1 || heights[c].height > LIMIT) {
        continue;
      }

      // Find nearest ocean from the adjacent cells
      for (const n of cells[c].adjacentCells) {
        const ocean = features[n];
        // not an ocean
        if (ocean.type !== LandType.OCEAN) {
          continue;
        }

        heights[c].height = 19;
        features[c].type = LandType.OCEAN;
        cells[c].adjacentCells.forEach(c => {
          // mark as coastline
          if (heights[c].height >= 20) {
            features[c].type = LandType.LAND;
          }
        });

        // mark former lake as ocean
        feature.type = LandType.OCEAN;

        shouldBreak = true;
      }

      if (shouldBreak) {
        break;
      }
    }
  }
};

/**
 * Mark features (ocean, lakes, landmasses) based on the cells data, and calculate distance field between
 * features like the land and ocean. This marks the landmasses and lake properly, so they can be rendered later.
 */
export const markFeatures = (
  grid: Grid,
  heightmap: Heightmap,
  template: HeightmapTemplate,
  options: {
    lakeElevationLimit: number;
  }
): FeaturesMap => {
  const { cells } = grid;
  const { heights } = heightmap;

  const features: FeaturesMap = {
    features: Array.from({ length: cells.length }, () => ({
      type: LandType.OCEAN,
      distanceToCoast: 0,

      temperature: 0,
      waterLevel: 0,
      precipitation: 0,

      climate: ClimateType.DRY,
      wetness: WetnessType.DRY,
      vegetation: VegetationType.DESERT,
      biome: BiomeType.COLD_DESERT,
    })),
  };

  cells.forEach((cell, index) => {
    const isLand = heights[index].height >= 20;
    // true if feature touches map border
    const isBorder = cell.isNearBorder;

    let type = LandType.LAND;
    if (!isLand) {
      type = isBorder ? LandType.OCEAN : LandType.LAKE;
    }

    features.features[index].type = type;
  });

  markupCoastDistance(grid.cells, features, -2, -1, -10);
  addLakesInDeepDepressions(
    grid,
    heightmap,
    features,
    options.lakeElevationLimit
  );
  openNearSeaLakes(grid, heightmap, features, template);

  return features;
};
