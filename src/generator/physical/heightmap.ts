import Alea from 'alea';
import * as d3Array from 'd3-array';
import * as d3QuadTree from 'd3-quadtree';
import * as d3Polygon from 'd3-polygon';

import { Cell, Grid } from '../../types/grid.ts';
import { Heightmap, HeightType, Landmass } from '../../types/heightmap.ts';
import { clipPoly } from '../../utils/polygons.ts';

import { HeightmapTemplate } from './heightmapTemplates.ts';
import { roundNumber } from '../../utils/math.ts';

const getBlobPower = (cellsCount: number) => {
  const blobPowerMap = {
    1000: 0.93,
    2000: 0.95,
    5000: 0.97,
    10000: 0.98,
    20000: 0.99,
    30000: 0.991,
    40000: 0.993,
    50000: 0.994,
    60000: 0.995,
    70000: 0.9955,
    80000: 0.996,
    90000: 0.9964,
    100000: 0.9973,
  };

  return blobPowerMap[cellsCount as keyof typeof blobPowerMap] || 0.98;
};

const getLinePower = (cellsCount: number) => {
  const linePowerMap = {
    1000: 0.75,
    2000: 0.77,
    5000: 0.79,
    10000: 0.81,
    20000: 0.82,
    30000: 0.83,
    40000: 0.84,
    50000: 0.86,
    60000: 0.87,
    70000: 0.88,
    80000: 0.91,
    90000: 0.92,
    100000: 0.93,
  };

  return linePowerMap[cellsCount as keyof typeof linePowerMap] || 0.81;
};

const fromTemplate = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  template: HeightmapTemplate,
  options: {
    cellsToGenerate: number;
    graphWidth: number;
    graphHeight: number;
  }
): Heightmap => {
  const { points } = grid;

  const blobPower = getBlobPower(options.cellsToGenerate);
  const linePower = getLinePower(options.cellsToGenerate);

  const heightmap: Heightmap = {
    heights: Array.from({ length: points.length }, () => ({
      height: 0,
      landmass: -1,
      // Height types will be marked after we've defined the features, as they can lower the height
      // when we generate lakes.
      type: HeightType.WATER,
    })),
    landmasses: [],
  };
  return template.steps.reduce((heightmap, step) => {
    return step(
      randomizer,
      grid,
      options.graphWidth,
      options.graphHeight,
      blobPower,
      linePower,
      heightmap
    );
  }, heightmap);
};

const markHeightmapType = (grid: Grid, heightmap: Heightmap) => {
  const { cells } = grid;
  const { heights } = heightmap;

  cells.forEach((_cell, index) => {
    const isLand = heights[index].height >= 20;
    // Start by marking the height
    let heightType = HeightType.WATER;
    if (isLand && heights[index].height < 22) {
      heightType = HeightType.COASTAL;
    } else if (heights[index].height >= 22 && heights[index].height < 32) {
      heightType = HeightType.FLATLAND;
    } else if (heights[index].height >= 32 && heights[index].height < 38) {
      heightType = HeightType.HILLS;
    } else if (heights[index].height >= 38 && heights[index].height < 54) {
      heightType = HeightType.PLATEAU;
    } else if (heights[index].height >= 54) {
      heightType = HeightType.MOUNTAIN;
    }

    heights[index].type = heightType;
  });
};

/**
 * Detects the coastlines from the heigmap to generate the landmass data, then adjusts the cells of the coastline
 * to make it look a bit more realistic. Once that done, it will then make sure that all cells are assigned to their
 * correct landmasses regardless of type.
 */
const defineLandmasses = (
  grid: Grid,
  heightmap: Heightmap,
  options: { graphWidth: number; graphHeight: number }
) => {
  const { cells, vertices } = grid;
  const { heights } = heightmap;

  const n = cells.length;
  // find cell vertex to start path detection
  const findStart = (cell: Cell, onlyLand: boolean = true): number => {
    // map border cell
    if (!onlyLand && cell.isNearBorder) {
      return cell.vertices.find(v =>
        vertices[v].adjacent.some(c => c >= n)
      ) as number;
    }

    const filtered = cell.vertices.filter(v =>
      vertices[v].adjacent.some(c =>
        onlyLand
          ? heights[c].type !== HeightType.WATER
          : heights[c].type === HeightType.WATER
      )
    );
    const index = d3Array.min(filtered) as number;

    return cell.vertices[index];
  };

  // connect vertices to chain
  const connectVertices = (start: number, onlyLand: boolean = true) => {
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
      const c = vertices[current].adjacent;
      // neighboring vertices
      const v = vertices[current].neighbours;

      const c0 =
        c[0] >= n ||
        (onlyLand
          ? heights[c[0]].type !== HeightType.WATER
          : heights[c[0]].type === HeightType.WATER);
      const c1 =
        c[1] >= n ||
        (onlyLand
          ? heights[c[1]].type !== HeightType.WATER
          : heights[c[1]].type === HeightType.WATER);
      const c2 =
        c[2] >= n ||
        (onlyLand
          ? heights[c[2]].type !== HeightType.WATER
          : heights[c[2]].type === HeightType.WATER);

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
    const tree = d3QuadTree.quadtree();

    for (let i = 0; i < vchain.length; i++) {
      const v = vchain[i];
      const p = vertices[v].coordinates;
      let [x, y] = [p[0], p[1]];

      if (i && vchain[i + 1] && tree.find(x, y, r) !== undefined) {
        const v1 = vchain[i - 1];
        const v2 = vchain[i + 1];
        const [x1, y1] = [
          vertices[v1].coordinates[0],
          vertices[v1].coordinates[1],
        ];
        const [x2, y2] = [
          vertices[v2].coordinates[0],
          vertices[v2].coordinates[1],
        ];
        [x, y] = [(x1 + x2) / 2, (y1 + y2) / 2];
        vertices[v].coordinates = [x, y];
      }

      tree.add([x, y]);
    }
  };

  const used = Array.from({ length: cells.length }, () => false);
  cells.forEach((cell, index) => {
    // already connected
    if (used[index]) {
      return;
    }

    // ocean cell
    if (heights[index].type === HeightType.WATER) {
      return;
    }

    // type value to search for
    const start = findStart(cell);
    // cannot start here
    if (typeof start === 'undefined') {
      return;
    }

    const vchain = connectVertices(start);

    used[index] = true;
    let points = clipPoly(
      vchain.map(v => vertices[v].coordinates),
      options.graphWidth,
      options.graphHeight
    );

    const newLandmass: Landmass = {
      coastline: [],
      size: 0,
    };
    points = points.map(point => [
      roundNumber(point[0], 1),
      roundNumber(point[1], 1),
    ]);
    newLandmass.coastline = points;
    const landmassIndex = heightmap.landmasses.length;
    heightmap.landmasses.push(newLandmass);

    // Detect all cells within that landmass and assign them to the new landmass. Also make sure they are not marked
    // as used, so we don't loop over them
    // TODO: We'll need to also mark all lakes within that landmass for coastline drawing
    cells.forEach((_, j) => {
      if (d3Polygon.polygonContains(points, grid.points[j])) {
        heights[j].landmass = landmassIndex;
        newLandmass.size++;
        used[j] = true;
      }
    });
  });
};

/**
 * Generates a random continent or set of continents for the map using the provided heightmap template. The template
 * describes a list of actions to take on each "pass" on the heightmap, which will generate various map features until
 * all passes are done.
 */
export const generateHeightmap = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  template: HeightmapTemplate,
  options: {
    cellsToGenerate: number;
    graphWidth: number;
    graphHeight: number;
  }
) => {
  // TODO: Add image templates
  const heightmap = fromTemplate(randomizer, grid, template, options);

  // markHeightmapType(grid, heightmap);
  // defineLandmasses(grid, heightmap, options);

  return heightmap;
};
