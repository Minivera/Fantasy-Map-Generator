import { PackedCells, PackedGrid, Point } from '../types/grid.ts';

/**
 * Creates a filter function that will check if the given cell is a land cell.
 */
export const isLandFilter = (cells: PackedCells) => (i: number) => {
  return cells.heights[i] >= 20;
};

/**
 * Creates a filter function that will check if the given cell is a water cell.
 */
export const isWater = (cells: PackedCells) => (i: number) => {
  return cells.heights[i] < 20;
};

/**
 * Gets the distance between two points on a 2D plane.
 */
export const distanceBetweenPoints = (a: Point, b: Point) => {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
};

/**
 * Get polygon points for a specific packed cell for the given cell ID
 */
export const getPackPolygon = (grid: PackedGrid, i: number) => {
  return grid.cells.vertices[i].map(v => grid.vertices.coordinates[v]);
};

/**
 * mbostock's poissonDiscSampler
 * See: https://gist.github.com/mbostock/19168c663618b7f07158
 * TODO: Rewrite this to be more readable, once we understand what this does.
 */
export function* poissonDiscSampler(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  k = 3
) {
  if (!(x1 >= x0) || !(y1 >= y0) || !(r > 0)) {
    throw new Error();
  }

  const width = x1 - x0;
  const height = y1 - y0;
  const r2 = r * r;
  const r23 = 3 * r2;
  const cellSize = r * Math.SQRT1_2;
  const gridWidth = Math.ceil(width / cellSize);
  const gridHeight = Math.ceil(height / cellSize);
  const grid = new Array(gridWidth * gridHeight);
  const queue: number[][] = [];

  const far = (x: number, y: number) => {
    const i = (x / cellSize) | 0;
    const j = (y / cellSize) | 0;
    const i0 = Math.max(i - 2, 0);
    const j0 = Math.max(j - 2, 0);
    const i1 = Math.min(i + 3, gridWidth);
    const j1 = Math.min(j + 3, gridHeight);
    for (let j = j0; j < j1; ++j) {
      const o = j * gridWidth;
      for (let i = i0; i < i1; ++i) {
        const s = grid[o + i];
        if (s) {
          const dx = s[0] - x;
          const dy = s[1] - y;
          if (dx * dx + dy * dy < r2) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const sample = (x: number, y: number) => {
    queue.push(
      (grid[gridWidth * ((y / cellSize) | 0) + ((x / cellSize) | 0)] = [x, y])
    );
    return [x + x0, y + y0];
  };

  yield sample(width / 2, height / 2);

  // eslint-disable-next-line no-labels
  pick: while (queue.length) {
    const i: number = (Math.random() * queue.length) | 0;
    const parent = queue[i];

    for (let j = 0; j < k; ++j) {
      const a = 2 * Math.PI * Math.random();
      const r = Math.sqrt(Math.random() * r23 + r2);
      const x = parent[0] + r * Math.cos(a);
      const y = parent[1] + r * Math.sin(a);
      if (x >= 0 && x < width && y >= 0 && y < height && far(x, y)) {
        yield sample(x, y);
        // eslint-disable-next-line no-labels
        continue pick;
      }
    }

    const r = queue.pop() as number[];
    if (i < queue.length) {
      queue[i] = r;
    }
  }
}
