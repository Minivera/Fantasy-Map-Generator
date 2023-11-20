import Alea from 'alea';
import Delaunator from 'delaunator';
import * as d3QuadTree from 'd3-quadtree';
import * as d3Polygon from 'd3-polygon';

import { roundNumber } from '../utils/math.ts';
import { voronoi } from '../utils/voronoi.ts';
import { CellType, Grid, PackedCells } from '../types/grid.ts';
import { createTypedArray, UINT16_MAX } from '../utils/arrays.ts';

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

  const points: [number, number][] = [];
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

  const points: [number, number][] = [];
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
export const calculateVoronoi = (
  points: [number, number][],
  boundary: [number, number][]
) => {
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
  };
};

/**
 * Recalculate the Voronoi Graph or the grid to generate the final cells now that a lot of the features and terrain
 * has been generated.
 */
export const reVoronoi = (grid: Grid) => {
  const { cells: gridCells, points } = grid;
  // store new data
  const newCells: {
    points: [number, number][];
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
    points: newCells.points,
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
  };

  return [finalCells, vertices];
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
