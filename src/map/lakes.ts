import * as d3 from 'd3-array';

import {
  FeatureType,
  LakeFeature,
  LakeFeatureGroup,
  PackedGrid,
} from '../types/grid.ts';
import { roundNumber } from '../utils/math.ts';

/**
 * Get array of land cells around a lake feature
 */
const getShoreline = (grid: PackedGrid, lake: LakeFeature) => {
  const uniqueCells = new Set<number>();

  lake.vertices.forEach(v =>
    grid.vertices.adjacent[v].forEach(c => {
      if (grid.cells.heights[c] >= 20) {
        uniqueCells.add(c);
      }
    })
  );

  return [...uniqueCells];
};

/**
 * Sets the climate data for all the properly defined lakes on the grid, given the heights array. This function expects
 * all lakes to have been properly generated and cleaned if needed.
 */
export const setClimateData = (
  grid: PackedGrid,
  heights: number[],
  heightExponent: number
) => {
  const cells = grid.cells;
  const lakeOutCells = new Uint16Array(cells.indexes.length);

  grid.features.forEach(f => {
    if (f.type !== FeatureType.LAKE) {
      return;
    }

    const feature = f as unknown as LakeFeature;

    // default flux: sum of precipitation around lake
    feature.flux = feature.shoreline.reduce(
      (acc, c) => acc + grid.cells.precipitation[cells.gridIndex[c]],
      0
    );

    // temperature and evaporation to detect closed lakes
    feature.temperature = roundNumber(
      d3.mean(
        feature.shoreline.map(c => grid.cells.temperatures[cells.gridIndex[c]])
      ) as number,
      1
    );

    // height in meters
    const height = (feature.height - 18) ** heightExponent;
    // based on Penman formula, [1-11]
    feature.evaporation =
      ((700 * (feature.temperature + 0.006 * height)) / 50 + 75) /
      (80 - feature.temperature);

    // no outlet for lakes in depressed areas
    if (feature.closed) {
      return;
    }

    // lake outlet cell
    const outCellIndex = d3.leastIndex(
      feature.shoreline,
      (a, b) => heights[a] - heights[b]
    );
    feature.outCell = outCellIndex
      ? feature.shoreline[outCellIndex]
      : undefined;
    if (feature.outCell) {
      lakeOutCells[feature.outCell] = feature.index;
    }
  });

  return lakeOutCells;
};

/**
 * Prepare a lake feature generated as a generic feature by making it a types lake feature, which should allow
 * us to query and set properties unique to lakes.
 */
export const prepareLakeData = (
  grid: PackedGrid,
  heights: number[],
  lakeElevationLimit: number
) => {
  const cells = grid.cells;

  grid.features.forEach(f => {
    if (f.type !== 'lake') {
      return;
    }

    const feature = f as unknown as LakeFeature;

    feature.flux = 0;
    delete feature.inlets;
    delete feature.outlet;
    feature.height = 0;
    delete feature.closed;

    feature.shoreline = getShoreline(grid, feature);

    // lake surface height is as lowest land cells around
    const min = feature.shoreline.sort((a, b) => heights[a] - heights[b])[0];
    feature.height = heights[min] - 0.1;

    // check if lake can be open (not in deep depression)
    if (lakeElevationLimit === 80) {
      feature.closed = false;
      return;
    }

    let deep = true;
    const threshold = feature.height + lakeElevationLimit;
    const queue = [min];
    const checked = [];
    checked[min] = true;

    // check if elevated lake can potentially pour to another water body
    while (deep && queue.length) {
      const q = queue.pop() as number;

      for (const n of cells.adjacentCells[q]) {
        if (checked[n]) {
          continue;
        }
        if (heights[n] >= threshold) {
          continue;
        }

        if (heights[n] < 20) {
          const nFeature = grid.features[cells.features[n]];
          if (
            nFeature.type === 'ocean' ||
            feature.height > (nFeature as unknown as LakeFeature).height
          ) {
            deep = false;
            break;
          }
        }

        checked[n] = true;
        queue.push(n);
      }
    }

    feature.closed = deep;
  });
};

/**
 * Cleans all lake features in the grid by clearing their flux and river data, then setting it again.
 */
export const cleanupLakeData = (grid: PackedGrid) => {
  for (const f of grid.features) {
    if (f.type !== 'lake') {
      continue;
    }

    const feature = f as unknown as LakeFeature;

    delete feature.river;
    delete feature.enteringFlux;
    delete feature.outCell;
    delete feature.closed;
    feature.height = roundNumber(feature.height, 3);

    const inlets = feature.inlets?.filter(r =>
      grid.rivers.find(river => river.index === r)
    );
    if (!inlets || !inlets.length) {
      delete feature.inlets;
    } else {
      feature.inlets = inlets;
    }

    const outlet =
      feature.outlet &&
      grid.rivers.find(river => river.index === feature.outlet);
    if (!outlet) {
      delete feature.outlet;
    }
  }
};

/**
 * Gets the more complete group type for the lake, defining what type of lake it is for drawing.
 */
export const getGroup = (feature: LakeFeature): LakeFeatureGroup => {
  if (feature.temperature < -3) {
    return LakeFeatureGroup.FROZEN;
  }

  if (feature.height > 60) {
    return LakeFeatureGroup.LAVA;
  }

  if (!feature.inlets && !feature.outlet) {
    if (feature.evaporation > feature.flux * 4) {
      return LakeFeatureGroup.DRY;
    }
  }

  if (!feature.outlet && feature.evaporation > feature.flux) {
    return LakeFeatureGroup.SALT;
  }

  return LakeFeatureGroup.FRESHWATER;
};

/**
 * Defines the groups for all lakes in the grid, giving them a more specific lake type to draw.
 */
export const defineLakeGroup = (grid: PackedGrid) => {
  for (const feature of grid.features) {
    if (feature.type !== FeatureType.LAKE) {
      continue;
    }

    (feature as unknown as LakeFeature).group = getGroup(
      feature as unknown as LakeFeature
    );
  }
};
