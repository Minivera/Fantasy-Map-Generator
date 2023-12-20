import Alea from 'alea';
import Delaunator from 'delaunator';
import * as d3Array from 'd3-array';
import * as d3QuadTree from 'd3-quadtree';
import * as d3Polygon from 'd3-polygon';

import { normalize, roundNumber } from '../utils/math.ts';
import { voronoi } from '../utils/voronoi.ts';
import {
  CellType,
  FeatureType,
  Grid,
  LakeFeature,
  LakeFeatureGroup,
  PackedCells,
  PackedGrid,
  Vertices,
  Point,
} from '../types/grid.ts';
import { createTypedArray, UINT16_MAX } from '../utils/arrays.ts';
import { biomeHabitability } from '../data/biomes.ts';

/**
 * Add points to the edge of the map to clip the voronoi generation, which should allow us to create good looking
 * islands and landmasses.
 */
const getBoundaryPoints = (width: number, height: number, spacing: number) => {
  const offset = roundNumber(-1 * spacing);
  const powerSpacing = spacing * 2;
  const widthOffset = width - offset * 2;
  const heightOffset = height - offset * 2;

  const pointsOnX = Math.ceil(widthOffset / powerSpacing) - 1;
  const pointsOnY = Math.ceil(heightOffset / powerSpacing) - 1;

  const points: Point[] = [];
  for (let i = 0.5; i < pointsOnX; i++) {
    const x = Math.ceil((widthOffset * i) / pointsOnX + offset);
    points.push([x, offset], [x, heightOffset + offset]);
  }

  for (let i = 0.5; i < pointsOnY; i++) {
    const y = Math.ceil((heightOffset * i) / pointsOnY + offset);
    points.push([offset, y], [widthOffset + offset, y]);
  }

  return points;
};

/**
 * Generate a set of points on a square grid, then jitter them a bit to make them look more random. Should generate a
 * grid of points where each point has been moved by a small amount in the x and y position.
 */
const getJitteredGrid = (
  randomizer: ReturnType<typeof Alea>,
  width: number,
  height: number,
  spacing: number
) => {
  const radius = spacing / 2; // square radius
  const jittering = radius * 0.9; // max deviation
  const doubleJittering = jittering * 2;

  const jitter = () => randomizer() * doubleJittering - jittering;

  const points: Point[] = [];
  for (let y = radius; y < height; y += spacing) {
    for (let x = radius; x < width; x += spacing) {
      const xj = Math.min(roundNumber(x + jitter(), 2), width);
      const yj = Math.min(roundNumber(y + jitter(), 2), height);

      points.push([xj, yj]);
    }
  }

  return points;
};

/**
 * Places a base set of points on the grid given the provided options. The generation takes the seed to jitted the
 * added to a square grid.
 */
const placePoints = (
  randomizer: ReturnType<typeof Alea>,
  options: {
    cellsToGenerate: number;
    graphWidth: number;
    graphHeight: number;
  }
) => {
  const { graphHeight, graphWidth, cellsToGenerate } = options;

  // spacing between points before jirrering
  const spacing = roundNumber(
    Math.sqrt((graphWidth * graphHeight) / cellsToGenerate),
    2
  );

  const boundary = getBoundaryPoints(graphWidth, graphHeight, spacing);
  // points of jittered square grid
  const points = getJitteredGrid(randomizer, graphWidth, graphHeight, spacing);

  const cellsX = Math.floor((graphWidth + 0.5 * spacing - 1e-10) / spacing);
  const cellsY = Math.floor((graphHeight + 0.5 * spacing - 1e-10) / spacing);

  return { spacing, boundary, points, cellsX, cellsY };
};

/**
 * Calculates a Delaunay, then Voronoi diagram based on those two algorithms and using the provided grid of points and
 * the boundary points (to limit the generation within those points).
 */
export const calculateVoronoi = (points: Point[], boundary: Point[]) => {
  const allPoints = points.concat(boundary);
  const delaunay = Delaunator.from(allPoints);

  return voronoi(delaunay, allPoints, points.length);
};

export const generateGrid = (
  randomizer: ReturnType<typeof Alea>,
  options: {
    cellsToGenerate: number;
    graphWidth: number;
    graphHeight: number;
  }
): Grid => {
  const { spacing, boundary, points, cellsX, cellsY } = placePoints(
    randomizer,
    options
  );

  const { cells, vertices } = calculateVoronoi(points, boundary);

  return {
    spacing,
    boundary,
    points,
    cellsX,
    cellsY,
    cells,
    vertices,
    features: [],
    rivers: [],
  };
};

/**
 * Recalculate the Voronoi Graph or the grid to generate the final cells now that a lot of the features and terrain
 * has been generated.
 */
export const reVoronoi = (grid: Grid): [PackedCells, Vertices] => {
  const { cells: gridCells, points } = grid;
  // store new data
  const newCells: {
    points: Point[];
    gridIndexes: number[];
    heights: number[];
  } = {
    points: [],
    gridIndexes: [],
    heights: [],
  };
  const spacing2 = grid.spacing ** 2;

  const addNewPoint = (i: number, x: number, y: number, height: number) => {
    newCells.points.push([x, y]);
    newCells.gridIndexes.push(i);
    newCells.heights.push(height);
  };

  for (const i of gridCells.indexes) {
    const height = gridCells.heights[i];
    const type = gridCells.types[i];
    // exclude all deep ocean points
    if (height < 20 && type !== CellType.Water) {
      continue;
    }

    const [x, y] = points[i];

    addNewPoint(i, x, y, height);

    // add additional points for cells along coast
    if (type === CellType.Land || type === CellType.Water) {
      // not for near-border cells
      if (gridCells.nearBorderCells[i]) {
        continue;
      }

      gridCells.adjacentCells[i].forEach(e => {
        if (i > e) {
          return;
        }
        if (gridCells.types[e] === type) {
          const dist2 = (y - points[e][1]) ** 2 + (x - points[e][0]) ** 2;
          if (dist2 < spacing2) {
            return;
          } // too close to each other
          const x1 = roundNumber((x + points[e][0]) / 2, 1);
          const y1 = roundNumber((y + points[e][1]) / 2, 1);
          addNewPoint(i, x1, y1, height);
        }
      });
    }
  }

  const { cells: packCells, vertices } = calculateVoronoi(
    newCells.points,
    grid.boundary
  );

  const finalCells: PackedCells = {
    ...packCells,
    // Carry over old grid data
    precipitation: grid.cells.precipitation,
    temperatures: grid.cells.temperatures,
    // New packed data
    points: newCells.points,
    pathPoints: {
      coastlines: [],
      lakes: [],
    },
    gridIndex: createTypedArray({
      maxValue: grid.points.length,
      from: newCells.gridIndexes,
    }),
    quads: d3QuadTree.quadtree(newCells.points.map(([x, y], i) => [x, y, i])),
    heights: createTypedArray({ maxValue: 100, from: newCells.heights }),
    area: createTypedArray({
      maxValue: UINT16_MAX,
      from: packCells.indexes.map(i => {
        const area = Math.abs(
          d3Polygon.polygonArea(
            packCells.vertices[i].map(v => vertices.coordinates[v])
          )
        );
        return Math.min(area, UINT16_MAX);
      }),
    }),
    haven: new Uint16Array(packCells.indexes.length),
    harbor: new Uint8Array(packCells.indexes.length),
    biomes: new Uint8Array(packCells.indexes.length),
    suitability: new Int16Array(packCells.indexes.length),
    populations: new Float32Array(packCells.indexes.length),
  };

  return [finalCells, vertices];
};

/**
 * Ranks each cell to calculate the base suitability for humans, then calculate population. This will be used to generate
 * things like cultures and settlements.
 * TODO: Allow for different culture types to have different preferences
 */
export const rankCells = (grid: PackedGrid) => {
  const { cells, features } = grid;
  // cell suitability array
  cells.suitability = new Int16Array(cells.indexes.length);
  // cell population array
  cells.populations = new Float32Array(cells.indexes.length);

  const flMean = d3Array.median(cells.waterFlux.filter(f => f)) || 0;
  // to normalize flux
  const flMax =
    (d3Array.max(cells.waterFlux) as number) +
    (d3Array.max(cells.confluences) as number);
  // to adjust population by cell area
  const areaMean = d3Array.mean(cells.area) as number;

  for (const i of cells.indexes) {
    // no population in water
    if (cells.heights[i] < 20) {
      continue;
    }

    // base suitability derived from biome habitability
    let s = +biomeHabitability[cells.biomes[i]];

    // uninhabitable biomes has 0 suitability
    if (!s) {
      continue;
    }

    // big rivers and confluences are valued
    if (flMean) {
      s +=
        normalize(cells.waterFlux[i] + cells.confluences[i], flMean, flMax) *
        250;
    }
    // low elevation is valued, high is not;
    s -= (cells.heights[i] - 50) / 5;

    if (cells.types[i] === CellType.Land) {
      // estuary is valued
      if (cells.rivers[i]) {
        s += 15;
      }

      const feature = features[cells.features[cells.haven[i]]];
      if (feature.type === FeatureType.LAKE) {
        const lakeFeature = feature as unknown as LakeFeature;
        if (lakeFeature.group === LakeFeatureGroup.FRESHWATER) {
          s += 30;
        } else if (lakeFeature.group === LakeFeatureGroup.SALT) {
          s += 10;
        } else if (lakeFeature.group === LakeFeatureGroup.FROZEN) {
          s += 1;
        } else if (lakeFeature.group === LakeFeatureGroup.DRY) {
          s -= 5;
        } else if (lakeFeature.group === LakeFeatureGroup.LAVA) {
          s -= 30;
        }
      } else {
        // ocean coast is valued
        s += 5;
        // safe sea harbor is valued
        if (cells.harbor[i] === 1) {
          s += 20;
        }
      }
    }

    // general population rate
    cells.suitability[i] = s / 5;
    // cell rural population is suitability adjusted by cell area
    cells.populations[i] =
      cells.suitability[i] > 0
        ? (cells.suitability[i] * cells.area[i]) / areaMean
        : 0;
  }
};

/**
 * Return the cell index on the regular square grid passed in parameters.
 */
export const findGridCell = (x: number, y: number, grid: Grid) => {
  return (
    Math.floor(Math.min(y / grid.spacing, grid.cellsY - 1)) * grid.cellsX +
    Math.floor(Math.min(x / grid.spacing, grid.cellsX - 1))
  );
};
