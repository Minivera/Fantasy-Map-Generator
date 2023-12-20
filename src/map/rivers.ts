import * as d3 from 'd3-array';

import {
  FeatureType,
  LakeFeature,
  PackedCells,
  PackedFeature,
  PackedGrid,
  Point,
} from '../types/grid.ts';
import { roundNumber } from '../utils/math.ts';
import { last } from '../utils/arrays.ts';

import { cleanupLakeData, prepareLakeData, setClimateData } from './lakes.ts';

const FLUX_FACTOR = 500;
const MAX_FLUX_WIDTH = 2;
const LENGTH_FACTOR = 200;
const STEP_WIDTH = 1 / LENGTH_FACTOR;
const LENGTH_PROGRESSION = [1, 1, 2, 3, 5, 8, 13, 21, 34].map(
  n => n / LENGTH_FACTOR
);
const MAX_PROGRESSION = last(LENGTH_PROGRESSION);

/**
 * Adds a cell to a river in the passed river data object.
 */
const addCellToRiver = (
  riversData: Record<number, number[]>,
  cell: number,
  river: number
) => {
  if (!riversData[river]) {
    riversData[river] = [cell];
  } else {
    riversData[river].push(cell);
  }
};

/**
 * Add distance to water value to land cells to make map less depressed
 */
const alterHeights = (cells: PackedCells) => {
  const { heights, adjacentCells, types } = cells;
  return Array.from(heights).map((height, i) => {
    if (height < 20 || types[i] < 1) {
      return height;
    }

    return (
      height +
      types[i] / 100 +
      (d3.mean(adjacentCells[i].map(c => types[c])) as number) / 10000
    );
  });
};

/**
 * Depression filling algorithm (for a correct water flux modeling)
 */
const resolveDepressions = (
  grid: PackedGrid,
  heights: number[],
  resolveDepressionsSteps: number
) => {
  const { cells, features } = grid;
  const maxIterations = resolveDepressionsSteps;
  const checkLakeMaxIteration = maxIterations * 0.85;
  const elevateLakeMaxIteration = maxIterations * 0.75;

  // height of lake or specific cell
  const height = (i: number) =>
    (features[cells.features[i]] as { height?: number }).height || heights[i];

  const lakes = features.filter(f => f.type === 'lake');
  // exclude near-border cells
  const land = cells.indexes.filter(
    i => heights[i] >= 20 && !cells.nearBorderCells[i]
  );
  // lowest cells go first
  land.sort((a, b) => heights[a] - heights[b]);

  const progress = [];
  let depressions = Infinity;
  let prevDepressions = null;
  for (
    let iteration = 0;
    depressions && iteration < maxIterations;
    iteration++
  ) {
    if (progress.length > 5 && d3.sum(progress) > 0) {
      // bad progress, abort and set heights back
      heights = alterHeights(grid.cells);
      depressions = progress[0];
      break;
    }

    depressions = 0;

    if (iteration < checkLakeMaxIteration) {
      for (const f of lakes) {
        const lake = f as unknown as LakeFeature;

        if (lake.closed) {
          continue;
        }

        const minHeight = d3.min(lake.shoreline.map(s => heights[s])) as number;
        if (minHeight >= 100 || lake.height > minHeight) {
          continue;
        }

        if (iteration > elevateLakeMaxIteration) {
          lake.shoreline.forEach(i => (heights[i] = cells.heights[i]));
          lake.height =
            (d3.min(lake.shoreline.map(s => heights[s])) as number) - 1;
          lake.closed = true;
          continue;
        }

        depressions++;
        lake.height = minHeight + 0.2;
      }
    }

    for (const i of land) {
      const minHeight = d3.min(
        cells.adjacentCells[i].map(c => height(c))
      ) as number;
      if (minHeight >= 100 || heights[i] > minHeight) {
        continue;
      }

      depressions++;
      heights[i] = minHeight + 0.1;
    }

    prevDepressions !== null && progress.push(depressions - prevDepressions);
    prevDepressions = depressions;
  }
};

/**
 * Make a river flow down to a specific cell using the river's base water flux.
 */
function flowDown(
  cells: PackedCells,
  features: PackedFeature[],
  heights: number[],
  riversData: Record<number, number[]>,
  riverParents: Record<number, number | undefined>,
  toCell: number,
  fromFlux: number,
  river: number
) {
  const toFlux = cells.waterFlux[toCell] - cells.confluences[toCell];
  const toRiver = cells.rivers[toCell];

  if (toRiver) {
    // downhill cell already has river assigned
    if (fromFlux > toFlux) {
      // mark confluence
      cells.confluences[toCell] += cells.waterFlux[toCell];

      // min river is a tributary of current river
      if (heights[toCell] >= 20) {
        riverParents[toRiver] = river;
      }

      // re-assign river if downhill part has less flux
      cells.rivers[toCell] = river;
    } else {
      // mark confluence
      cells.confluences[toCell] += fromFlux;

      // current river is a tributary of min river
      if (heights[toCell] >= 20) {
        riverParents[river] = toRiver;
      }
    }
  } else {
    // assign the river to the downhill cell
    cells.rivers[toCell] = river;
  }

  if (heights[toCell] < 20) {
    // pour water to the water body
    const waterBody = features[
      cells.features[toCell]
    ] as unknown as LakeFeature;

    if (waterBody.type === FeatureType.LAKE) {
      if (!waterBody.river || fromFlux > (waterBody.enteringFlux || 0)) {
        waterBody.river = river;
        waterBody.enteringFlux = fromFlux;
      }

      waterBody.flux = waterBody.flux + fromFlux;
      if (!waterBody.inlets) {
        waterBody.inlets = [river];
      } else {
        waterBody.inlets.push(river);
      }
    }
  } else {
    // propagate flux and add next river segment
    cells.waterFlux[toCell] += fromFlux;
  }

  addCellToRiver(riversData, toCell, river);
}

/**
 * Drains the water of lakes into adjacent cells following the heightmap and the water flux of the lake
 * and adjacent rivers.
 */
export const drainWater = (
  grid: PackedGrid,
  heights: number[],
  riversData: Record<number, number[]>,
  riverParents: Record<number, number | undefined>,
  cellsToGenerate: number,
  heightExponent: number
) => {
  // first river id is 1
  let riverNext = 1;

  const MIN_FLUX_TO_FORM_RIVER = 30;
  const cellsNumberModifier = (cellsToGenerate / 10000) ** 0.25;

  const prec = grid.cells.precipitation;
  const land = grid.cells.indexes
    .filter(i => heights[i] >= 20)
    .sort((a, b) => heights[b] - heights[a]);
  const lakeOutCells = setClimateData(grid, heights, heightExponent);

  // add flux from precipitation
  land.forEach(i => {
    const { cells, features } = grid;
    cells.waterFlux[i] += prec[cells.gridIndex[i]] / cellsNumberModifier;

    // create lake outlet if lake is not in deep depression and flux > evaporation
    const lakes: LakeFeature[] = lakeOutCells[i]
      ? (features.filter(
          feature =>
            feature.type === FeatureType.LAKE &&
            i === (feature as unknown as LakeFeature).outCell &&
            (feature as unknown as LakeFeature).flux >
              (feature as unknown as LakeFeature).evaporation
        ) as unknown as LakeFeature[])
      : [];

    for (const lake of lakes) {
      const lakeCell = cells.adjacentCells[i].find(
        c => heights[c] < 20 && cells.features[c] === lake.index
      ) as number;
      // not evaporated lake water drains to outlet
      cells.waterFlux[lakeCell] += Math.max(lake.flux - lake.evaporation, 0);

      // allow chain lakes to retain identity
      if (cells.rivers[lakeCell] !== lake.river) {
        const sameRiver = cells.adjacentCells[lakeCell].some(
          c => cells.rivers[c] === lake.river
        );

        if (sameRiver && lake.river) {
          cells.rivers[lakeCell] = lake.river;
          addCellToRiver(riversData, lakeCell, lake.river);
        } else {
          cells.rivers[lakeCell] = riverNext;
          addCellToRiver(riversData, lakeCell, riverNext);
          riverNext++;
        }
      }

      lake.outlet = cells.rivers[lakeCell];
      flowDown(
        grid.cells,
        grid.features,
        heights,
        riversData,
        riverParents,
        i,
        cells.waterFlux[lakeCell],
        lake.outlet
      );
    }

    // assign all tributary rivers to outlet basin
    const outlet = lakes[0]?.outlet;
    for (const lake of lakes) {
      if (!Array.isArray(lake.inlets)) {
        continue;
      }

      for (const inlet of lake.inlets) {
        riverParents[inlet] = outlet;
      }
    }

    // near-border cell: pour water out of the screen
    if (cells.nearBorderCells[i] && cells.rivers[i]) {
      return addCellToRiver(riversData, -1, cells.rivers[i]);
    }

    // downhill cell (make sure it's not in the source lake)
    let min: number | null;
    if (lakeOutCells[i]) {
      const filtered = cells.adjacentCells[i].filter(
        c => !lakes.map(lake => lake.index).includes(cells.features[c])
      );
      min = filtered.sort((a, b) => heights[a] - heights[b])[0];
    } else if (cells.haven[i]) {
      min = cells.haven[i];
    } else {
      min = cells.adjacentCells[i].sort((a, b) => heights[a] - heights[b])[0];
    }

    // cells is depressed
    if (heights[i] <= heights[min]) {
      return;
    }

    if (cells.waterFlux[i] < MIN_FLUX_TO_FORM_RIVER) {
      // flux is too small to operate as a river
      if (heights[min] >= 20) {
        cells.waterFlux[min] += cells.waterFlux[i];
      }
      return;
    }

    // proclaim a new river
    if (!cells.rivers[i]) {
      cells.rivers[i] = riverNext;
      addCellToRiver(riversData, i, riverNext);
      riverNext++;
    }

    flowDown(
      grid.cells,
      grid.features,
      heights,
      riversData,
      riverParents,
      min,
      cells.waterFlux[i],
      cells.rivers[i]
    );
  });
};

/**
 * Gets the point on the graph's border if the point touches or overflows the graph.
 */
const getBorderPoint = (
  grid: PackedGrid,
  i: number,
  graphHeight: number,
  graphWidth: number
) => {
  const [x, y] = grid.cells.points[i];
  const min = Math.min(y, graphHeight - y, x, graphWidth - x);
  if (min === y) {
    return [x, 0];
  } else if (min === graphHeight - y) {
    return [x, graphHeight];
  } else if (min === x) {
    return [0, y];
  }

  return [graphWidth, y];
};

/**
 * Gets the specific points of a river from the given cells.
 */
const getRiverPoints = (
  grid: PackedGrid,
  riverCells: number[],
  graphHeight: number,
  graphWidth: number
): Point[] => {
  const { points } = grid.cells;

  return riverCells.map((cell, i) => {
    if (cell === -1) {
      return getBorderPoint(grid, riverCells[i - 1], graphHeight, graphWidth);
    }

    return points[cell];
  }) as Point[];
};

/**
 * Add points at 1/3 and 2/3 of a line between adjacents river cells to make the river feel like it is meandering
 * between the geography.
 */
const addMeandering = function (
  grid: PackedGrid,
  riverCells: number[],
  graphHeight: number,
  graphWidth: number,
  meandering: number = 0.5
): [number, number, number][] {
  const { waterFlux, confluences, heights } = grid.cells;
  const meandered: [number, number, number][] = [];
  const lastStep = riverCells.length - 1;

  const points = getRiverPoints(grid, riverCells, graphHeight, graphWidth);
  let step = heights[riverCells[0]] < 20 ? 1 : 10;

  let fluxPrev = 0;
  const getFlux = (step: number, flux: number) =>
    step === lastStep ? fluxPrev : flux;

  for (let i = 0; i <= lastStep; i++, step++) {
    const cell = riverCells[i];
    const isLastCell = i === lastStep;

    const [x1, y1] = points[i];
    const flux1 = getFlux(i, waterFlux[cell]);
    fluxPrev = flux1;

    meandered.push([x1, y1, flux1]);
    if (isLastCell) {
      break;
    }

    const nextCell = riverCells[i + 1];
    const [x2, y2] = points[i + 1];

    if (nextCell === -1) {
      meandered.push([x2, y2, fluxPrev]);
      break;
    }

    // square distance between cells
    const dist2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (dist2 <= 25 && riverCells.length >= 6) {
      continue;
    }

    const flux2 = getFlux(i + 1, waterFlux[nextCell]);
    const keepInitialFlux = confluences[nextCell] || flux1 === flux2;

    const meander =
      meandering + 1 / step + Math.max(meandering - step / 100, 0);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const sinMeander = Math.sin(angle) * meander;
    const cosMeander = Math.cos(angle) * meander;

    if (step < 10 && (dist2 > 64 || (dist2 > 36 && riverCells.length < 5))) {
      // if dist2 is big or river is small add extra points at 1/3 and 2/3 of segment
      const p1x = (x1 * 2 + x2) / 3 + -sinMeander;
      const p1y = (y1 * 2 + y2) / 3 + cosMeander;
      const p2x = (x1 + x2 * 2) / 3 + sinMeander / 2;
      const p2y = (y1 + y2 * 2) / 3 - cosMeander / 2;

      const [p1fl, p2fl] = keepInitialFlux
        ? [flux1, flux1]
        : [(flux1 * 2 + flux2) / 3, (flux1 + flux2 * 2) / 3];

      meandered.push([p1x, p1y, p1fl], [p2x, p2y, p2fl]);
    } else if (dist2 > 25 || riverCells.length < 6) {
      // if dist is medium or river is small add 1 extra middlepoint
      const p1x = (x1 + x2) / 2 + -sinMeander;
      const p1y = (y1 + y2) / 2 + cosMeander;

      const p1fl = keepInitialFlux ? flux1 : (flux1 + flux2) / 2;

      meandered.push([p1x, p1y, p1fl]);
    }
  }

  return meandered;
};

/**
 * Gets the aproximated length of a river based on its points
 */
const getApproximateLength = (points: [number, number, number][]) => {
  const length = points.reduce(
    (s, v, i, p) =>
      s + (i ? Math.hypot(v[0] - p[i - 1][0], v[1] - p[i - 1][1]) : 0),
    0
  );

  return roundNumber(length, 2);
};

/**
 * Gets the width of a river's mouth in km given a specific offset.
 * Real mouth width examples: Amazon 6000m, Volga 6000m, Dniepr 3000m, Mississippi 1300m, Themes 900m,
 * Danube 800m, Daugava 600m, Neva 500m, Nile 450m, Don 400m, Wisla 300m, Pripyat 150m, Bug 140m, Muchavets 40m
 */
const getWidth = (offset: number) => roundNumber((offset / 1.5) ** 1.8, 2);

/**
 * Gets a river's offset given its flux and points.
 */
const getOffset = (
  flux: number,
  pointNumber: number,
  widthFactor: number,
  startingWidth = 0
) => {
  const fluxWidth = Math.min(flux ** 0.9 / FLUX_FACTOR, MAX_FLUX_WIDTH);
  const lengthWidth =
    pointNumber * STEP_WIDTH +
    (LENGTH_PROGRESSION[pointNumber] || MAX_PROGRESSION);
  return widthFactor * (lengthWidth + fluxWidth) + startingWidth;
};

/**
 * Defines the rivers structure from the generated data and saves them in the packaged grid.
 */
const defineRivers = (
  grid: PackedGrid,
  riversData: Record<number, number[]>,
  riverParents: Record<number, number | undefined>,
  cellsToGenerate: number,
  graphWidth: number,
  graphHeight: number
) => {
  const { cells } = grid;

  // re-initialize rivers and confluence arrays
  cells.rivers = new Uint16Array(cells.indexes.length);
  cells.confluences = new Uint16Array(cells.indexes.length);

  grid.rivers = [];

  const defaultWidthFactor = roundNumber(
    1 / (cellsToGenerate / 10000) ** 0.25,
    2
  );
  const mainStemWidthFactor = defaultWidthFactor * 1.2;

  for (const key in riversData) {
    const riverCells = riversData[key];
    // exclude tiny rivers
    if (riverCells.length < 3) {
      continue;
    }

    const riverId = +key;
    for (const cell of riverCells) {
      if (cell < 0 || cells.heights[cell] < 20) {
        continue;
      }

      // mark real confluences and assign river to cells
      if (cells.rivers[cell]) {
        cells.confluences[cell] = 1;
      } else {
        cells.rivers[cell] = riverId;
      }
    }

    const source = riverCells[0];
    const mouth = riverCells[riverCells.length - 2];
    const parent = riverParents[key] || 0;

    const widthFactor =
      !parent || parent === riverId ? mainStemWidthFactor : defaultWidthFactor;
    const meanderedPoints = addMeandering(
      grid,
      riverCells,
      graphHeight,
      graphWidth
    );

    // m3 in second
    const discharge = cells.waterFlux[mouth];
    const length = getApproximateLength(meanderedPoints);
    const width = getWidth(
      getOffset(discharge, meanderedPoints.length, widthFactor, 0)
    );

    grid.rivers.push({
      index: riverId,
      source,
      mouth,
      discharge,
      length,
      width,
      widthFactor,
      sourceWidth: 0,
      parent,
      cells: riverCells,
    });
  }
};

/**
 * Calculates the flux of the cell's confluence, which helps generate lakes from the rivers.
 */
const calculateConfluenceFlux = (cells: PackedCells, heights: number[]) => {
  for (const i of cells.indexes) {
    if (!cells.confluences[i]) {
      continue;
    }

    const sortedInflux = cells.adjacentCells[i]
      .filter(c => cells.rivers[c] && heights[c] > heights[i])
      .map(c => cells.waterFlux[c])
      .sort((a, b) => b - a);
    cells.confluences[i] = sortedInflux.reduce(
      (acc, flux, index) => (index ? acc + flux : acc),
      0
    );
  }
};

/**
 * Downcuts a river, which deepens the channel into which the river flow to adjust the river's cells heights
 * accordingly.
 */
const downcutRivers = (grid: PackedGrid) => {
  const MAX_DOWNCUT = 5;

  const { cells } = grid;

  for (const i of grid.cells.indexes) {
    // don't donwcut lowlands
    if (cells.heights[i] < 35) {
      continue;
    }
    if (!cells.waterFlux[i]) {
      continue;
    }

    const higherCells = cells.adjacentCells[i].filter(
      c => cells.heights[c] > cells.heights[i]
    );
    const higherFlux =
      higherCells.reduce((acc, c) => acc + cells.waterFlux[c], 0) /
      higherCells.length;
    if (!higherFlux) {
      continue;
    }

    const downcut = Math.floor(cells.waterFlux[i] / higherFlux);
    if (downcut) {
      cells.heights[i] -= Math.min(downcut, MAX_DOWNCUT);
    }
  }
};

/**
 * Generates rivers from the water, precipitation, and heights parameters for the map, then adjusts the lakes
 * to make them flow realistically based on river water flows. Will mutate the grid and replace a good amount of
 * data on the cells, including the heights.
 */
export const generateRivers = (
  grid: PackedGrid,
  {
    allowErosion = true,
    lakeElevationLimit,
    resolveDepressionsSteps,
    cellsToGenerate,
    heightExponent,
    graphWidth,
    graphHeight,
  }: {
    allowErosion?: boolean;
    lakeElevationLimit: number;
    resolveDepressionsSteps: number;
    cellsToGenerate: number;
    heightExponent: number;
    graphWidth: number;
    graphHeight: number;
  }
) => {
  const { cells } = grid;

  // rivers data
  const riversData: Record<number, number[]> = {};
  const riverParents: Record<number, number | undefined> = {};

  // water flux array
  cells.waterFlux = new Uint16Array(cells.indexes.length);
  // rivers array
  cells.rivers = new Uint16Array(cells.indexes.length);
  // confluences array
  cells.confluences = new Uint8Array(cells.indexes.length);

  const heights = alterHeights(cells);
  prepareLakeData(grid, heights, lakeElevationLimit);

  resolveDepressions(grid, heights, resolveDepressionsSteps);
  drainWater(
    grid,
    heights,
    riversData,
    riverParents,
    cellsToGenerate,
    heightExponent
  );
  defineRivers(
    grid,
    riversData,
    riverParents,
    cellsToGenerate,
    graphHeight,
    graphWidth
  );

  calculateConfluenceFlux(grid.cells, heights);
  cleanupLakeData(grid);

  if (allowErosion) {
    // apply gradient
    cells.heights = Uint8Array.from(heights);
    // downcut river beds
    downcutRivers(grid);
  }
};
