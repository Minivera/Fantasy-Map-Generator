import * as d3 from 'd3-array';
import * as d3QuadTree from 'd3-quadtree';
import * as d3Polygon from 'd3-polygon';

import {
  Cells,
  CellType,
  FeatureGroup,
  FeatureType,
  Grid,
  PackedCells,
  PackedGrid,
} from '../types/grid.ts';
import { HeightmapTemplate } from '../data/heightmapTemplates.ts';
import { clipPoly } from '../utils/polygons.ts';

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
        cells.types[i] = CellType.Water;
        cells.features[i] = feature;
        adjacentCells[i].forEach(n => {
          if (!lakeCells.includes(n)) {
            cells.types[n] = CellType.Land;
          }
        });
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
  const heights = grid.cells.heights;
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

/**
 * Detects the coastline and adjusts the features to properly set all coastlines and link them together.
 */
const defineCoastline = (
  grid: PackedGrid,
  options: { graphWidth: number; graphHeight: number }
) => {
  const { cells, vertices, features } = grid;

  const n = cells.indexes.length;
  // store connected features
  const used: boolean[] = new Array(features.length).fill(false);

  const largestLand = d3.leastIndex(
    features.map(f => (f.isLand ? f.cellsCount : 0)),
    (a, b) => b - a
  );

  // find cell vertex to start path detection
  const findStart = (i: number, t: CellType): number => {
    // map border cell
    if (t === CellType.Water && cells.nearBorderCells[i]) {
      return cells.vertices[i].find(v =>
        vertices.adjacent[v].some(c => c >= n)
      ) as number;
    }

    const filtered = cells.adjacentCells[i].filter(c => cells.types[c] === t);
    const index = cells.adjacentCells[i].indexOf(d3.min(filtered) as number);

    return index === CellType.Water ? index : cells.vertices[i][index];
  };

  // connect vertices to chain
  const connectVertices = (start: number, t: CellType) => {
    // vertices chain to form a path
    const chain: number[] = [];
    for (
      let i = 0, current = start;
      i === 0 || (current !== start && i < 50000);
      i++
    ) {
      // previous vertex in chain
      const prev = chain[chain.length - 1];
      // add current vertex to sequence
      chain.push(current);
      // cells adjacent to vertex
      const c = vertices.adjacent[current];
      // neighboring vertices
      const v = vertices.neighbours[current];

      const c0 = c[0] >= n || cells.types[c[0]] === t;
      const c1 = c[1] >= n || cells.types[c[1]] === t;
      const c2 = c[2] >= n || cells.types[c[2]] === t;

      if (v[0] !== prev && c0 !== c1) {
        current = v[0];
      } else if (v[1] !== prev && c1 !== c2) {
        current = v[1];
      } else if (v[2] !== prev && c0 !== c2) {
        current = v[2];
      }

      if (current === chain[chain.length - 1]) {
        break;
      }
    }

    return chain;
  };

  // move vertices that are too close to already added ones
  const relax = (vchain: number[], r: number) => {
    const p = vertices.coordinates;
    const tree = d3QuadTree.quadtree();

    for (let i = 0; i < vchain.length; i++) {
      const v = vchain[i];
      let [x, y] = [p[v][0], p[v][1]];

      if (i && vchain[i + 1] && tree.find(x, y, r) !== undefined) {
        const v1 = vchain[i - 1];
        const v2 = vchain[i + 1];
        const [x1, y1] = [p[v1][0], p[v1][1]];
        const [x2, y2] = [p[v2][0], p[v2][1]];
        [x, y] = [(x1 + x2) / 2, (y1 + y2) / 2];
        p[v] = [x, y];
      }

      tree.add([x, y]);
    }
  };

  for (const i of cells.indexes) {
    const startFromEdge = !i && cells.heights[i] >= 20;

    // non-edge cell
    if (
      !startFromEdge &&
      cells.types[i] !== CellType.Water &&
      cells.types[i] !== CellType.Land
    ) {
      continue;
    }

    // already connected
    const f = cells.features[i];
    if (used[f]) {
      continue;
    }

    // ocean cell
    if (features[f].type === FeatureType.OCEAN) {
      continue;
    }

    // type value to search for
    const type =
      features[f].type === FeatureType.LAKE ? CellType.Land : CellType.Water;
    const start = findStart(i, type);
    // cannot start here
    if (start === -1) {
      continue;
    }

    let vchain = connectVertices(start, type);
    if (features[f].type === FeatureType.LAKE) {
      relax(vchain, 1.2);
    }

    used[f] = true;
    let points = clipPoly(
      vchain.map(v => vertices.coordinates[v]),
      options.graphWidth,
      options.graphHeight
    );

    // area with lakes/islands
    const area = d3Polygon.polygonArea(points);
    if (area > 0 && features[f].type === FeatureType.LAKE) {
      points = points.reverse();
      vchain = vchain.reverse();
    }

    features[f].area = Math.abs(area);
    features[f].vertices = vchain;

    // draw ruler to cover the biggest land piece
    if (f === largestLand) {
      const from =
        points[d3.leastIndex(points, (a, b) => a[0] - b[0]) as number];
      const to = points[d3.leastIndex(points, (a, b) => b[0] - a[0]) as number];
      grid.ruler = [from, to];
    }
  }
};

/**
 * Calculate cell-distance to coast for every cell provided within the given limit.
 */
const calculateCoastDistance = (
  cells: PackedCells,
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
 * Re-marks the features (ocean, lakes, islands) on the map after a second pass of voronoi and a full
 * cell packing to add the required data to expand and draw those features. Necessary to get rivers and lakes going.
 */
export const reMarkFeatures = (
  grid: PackedGrid,
  options: { graphWidth: number; graphHeight: number }
) => {
  const { cells } = grid;

  const features = [grid.features[0]];

  // cell feature number
  cells.features = new Uint16Array(cells.indexes.length);
  // cell type: 1 = land along coast; -1 = water along coast;
  cells.types = [];
  // cell haven (opposite water cell);
  cells.haven =
    cells.indexes.length < 65535
      ? new Uint16Array(cells.indexes.length)
      : new Uint32Array(cells.indexes.length);
  // cell harbor (number of adjacent water cells);
  cells.harbor = new Uint8Array(cells.indexes.length);

  const defineHaven = (index: number) => {
    const water = cells.adjacentCells[index].filter(c => cells.heights[c] < 20);
    const dist2 = water.map(
      c =>
        (cells.points[index][0] - cells.points[c][0]) ** 2 +
        (cells.points[index][1] - cells.points[c][1]) ** 2
    );

    cells.haven[index] = water[dist2.indexOf(Math.min(...dist2))];
    cells.harbor[index] = water.length;
  };

  // no cells -> there is nothing to do
  if (!cells.indexes.length) {
    return;
  }

  for (let i = 1, queue = [0]; queue[0] !== -1; i++) {
    // first cell
    const start = queue[0];
    // assign feature number
    cells.features[start] = i;
    const land = cells.heights[start] >= 20;
    // true if feature touches map border
    let border = false;
    // to count cells number in a feature
    let cellNumber = 1;

    while (queue.length) {
      const q = queue.pop() as number;
      if (cells.nearBorderCells[q]) {
        border = true;
      }

      cells.adjacentCells[q].forEach(e => {
        const eLand = cells.heights[e] >= 20;
        if (land && !eLand) {
          cells.types[q] = CellType.Land;
          cells.types[e] = CellType.Water;

          if (!cells.haven[q]) {
            defineHaven(q);
          }
        } else if (land && eLand) {
          if (!cells.types[e] && cells.types[q] === CellType.Land) {
            cells.types[e] = CellType.Highland;
          } else if (!cells.types[q] && cells.types[e] === CellType.Land) {
            cells.types[q] = CellType.Highland;
          }
        }

        if (!cells.features[e] && land === eLand) {
          queue.push(e);
          cells.features[e] = i;
          cellNumber++;
        }
      });
    }

    let type: FeatureType = FeatureType.LAKE;
    if (land) {
      type = FeatureType.ISLAND;
    } else if (border) {
      type = FeatureType.OCEAN;
    }

    let group: FeatureGroup = FeatureGroup.ISLE;
    if (type === FeatureType.OCEAN) {
      if (cellNumber > grid.cells.indexes.length / 25) {
        group = FeatureGroup.OCEAN;
      } else if (cellNumber > grid.cells.indexes.length / 100) {
        group = FeatureGroup.SEA;
      } else {
        group = FeatureGroup.GULF;
      }
    } else if (type === FeatureType.ISLAND) {
      if (
        start &&
        features[cells.features[start - 1]].type === FeatureType.LAKE
      ) {
        group = FeatureGroup.LAKEISLAND;
      } else if (cellNumber > grid.cells.indexes.length / 10) {
        group = FeatureGroup.CONTINENT;
      } else if (cellNumber > grid.cells.indexes.length / 1000) {
        group = FeatureGroup.ISLAND;
      } else {
        group = FeatureGroup.ISLE;
      }
    }

    features.push({
      index: i,
      isLand: land,
      isBorder: border,
      type,
      cellsCount: cellNumber,
      firstCell: start,
      group,
      vertices: [],
      area: 0,
    });

    // find unmarked cell
    queue[0] = cells.features.findIndex(f => !f);
  }

  grid.features = features;

  // markupPackLand
  calculateCoastDistance(grid.cells, 3, 1, 0);

  defineCoastline(grid, options);
};
