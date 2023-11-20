import * as d3 from 'd3-array';

import { Cells, CellType, FeatureType, Grid } from '../types/grid.ts';
import { HeightmapTemplate } from '../data/heightmapTemplates.ts';

/**
 * Calculate cell-distance to coast for every cell given.
 */
const markupCoastDistance = (
  cells: Cells,
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
    for (let i = 0; i < cells.indexes.length; i++) {
      if (cells.types[i] !== prevT) {
        continue;
      }

      for (const c of cells.adjacentCells[i]) {
        if (cells.types[c]) {
          continue;
        }

        cells.types[c] = t;
        count++;
      }
    }
  }
};

/**
 * Looks at every cell to find deep depressions in the map at a specific elevation limit, then generates lakes there to
 * "fill holes" in the map.
 */
const addLakesInDeepDepressions = (grid: Grid, lakeElevationLimit: number) => {
  const { cells, features } = grid;
  const { adjacentCells, heights, nearBorderCells } = cells;

  if (lakeElevationLimit >= 80) {
    return;
  }

  for (const i of cells.indexes) {
    // cells at lower than 20 are likely underwater already
    if (nearBorderCells[i] || heights[i] < 20) {
      continue;
    }

    const minHeight = d3.min(adjacentCells[i].map(c => heights[c])) as number;
    if (heights[i] > minHeight) {
      continue;
    }

    let deep = true;
    const threshold = heights[i] + lakeElevationLimit;
    const queue = [i];
    const checked = [];
    checked[i] = true;

    // check if elevated cell can potentially pour to water
    while (deep && queue.length) {
      const q = queue.pop() as number;

      for (const n of adjacentCells[q]) {
        if (checked[n]) {
          continue;
        }
        if (heights[n] >= threshold) {
          continue;
        }

        if (heights[n] < 20) {
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
        adjacentCells[i].filter(n => heights[n] === heights[i])
      );
      const feature = features.length;

      lakeCells.forEach(i => {
        cells.heights[i] = 19;
        cells.types[i] = -1;
        cells.features[i] = feature;
        adjacentCells[i].forEach(
          n => !lakeCells.includes(n) && (cells.types[n] = 1)
        );
      });

      features.push({
        index: feature,
        isLand: false,
        isBorder: false,
        type: FeatureType.LAKE,
      });
    }
  }
};

/**
 * Near sea lakes usually get a lot of water inflow, most of them should brake threshold and flow out to sea (see
 * Ancylus Lake). This opens up those lakes, so they flow into the ocean rather than stay as lakes.
 */
const openNearSeaLakes = (grid: Grid, template: HeightmapTemplate) => {
  // no need for Atolls, the point is they have a lake that's not opened to the sea
  if (template.name === 'Atoll') {
    return;
  }

  const cells = grid.cells;
  const features = grid.features;

  // no lakes
  if (!features.find(f => f.type === FeatureType.LAKE)) {
    return;
  }

  // max height that can be breached by water
  const LIMIT = 22;

  for (const i of cells.indexes) {
    const lake = cells.features[i];

    const feature = features[lake];

    // not a lake cell
    if (feature.type !== FeatureType.LAKE) {
      continue;
    }

    for (const c of cells.adjacentCells[i]) {
      let shouldBreak = false;
      // water cannot brake this
      if (cells.types[c] !== 1 || cells.heights[c] > LIMIT) {
        continue;
      }

      // Find nearest ocean from the adjacent cells
      for (const n of cells.adjacentCells[c]) {
        const ocean = cells.features[n];
        // not an ocean
        if (feature.type !== FeatureType.OCEAN) {
          continue;
        }

        cells.heights[c] = 19;
        cells.types[c] = CellType.Water;
        cells.features[c] = ocean;
        cells.adjacentCells[c].forEach(c => {
          // mark as coastline
          if (cells.heights[c] >= 20) {
            cells.types[c] = 1;
          }
        });

        // mark former lake as ocean
        feature.type = FeatureType.OCEAN;

        shouldBreak = true;
      }

      if (shouldBreak) {
        break;
      }
    }
  }
};

/**
 * Mark features (ocean, lakes, islands) into the grid based on the cells data, and calculate distance field between
 * features like the land and ocean. This marks the landmasses and lake properly, so they can be rendered later.
 */
export const markFeatures = (
  grid: Grid,
  template: HeightmapTemplate,
  options: {
    lakeElevationLimit: number;
  }
) => {
  const cells = grid.cells;
  const heights = grid.cells.heights!;
  // cell feature number
  cells.features = new Uint16Array(cells.indexes.length);
  // cell type: 1 = land coast; -1 = water near coast
  cells.types = [];

  // TODO: Whyyyy???
  grid.features = [
    {
      index: 0,
      type: FeatureType.INVALID,
    },
  ];

  for (let i = 1, queue = [0]; queue[0] !== -1; i++) {
    // feature number
    cells.features[queue[0]] = i;
    const isLand = heights[queue[0]] >= 20;

    // true if feature touches map border
    let isBorder = false;

    while (queue.length) {
      const q = queue.pop() as number;
      if (cells.nearBorderCells[q]) {
        isBorder = true;
      }

      cells.adjacentCells[q].forEach(c => {
        const adjacentLand = heights[c] >= 20;
        if (isLand === adjacentLand && !cells.features[c]) {
          cells.features[c] = i;
          queue.push(c);
        } else if (isLand && !adjacentLand) {
          cells.types[q] = CellType.Land;
          cells.types[c] = CellType.Water;
        }
      });
    }

    let type = FeatureType.ISLAND;
    if (!isLand) {
      type = isBorder ? FeatureType.OCEAN : FeatureType.LAKE;
    }

    grid.features.push({ index: i, isLand, isBorder, type });

    // find next unmarked cell
    queue[0] = cells.features.findIndex(f => !f);
  }

  markupCoastDistance(grid.cells, -2, -1, -10);
  addLakesInDeepDepressions(grid, options.lakeElevationLimit);
  openNearSeaLakes(grid, template);
};
