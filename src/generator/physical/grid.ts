import Alea from 'alea';
import Delaunator from 'delaunator';

import { roundNumber } from '../../utils/math.ts';
import { voronoi } from '../../utils/voronoi.ts';
import { Grid, Point } from '../../types/grid.ts';

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

  // spacing between points before jittering
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
  };
};
