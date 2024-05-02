import * as d3 from 'd3-array';

import { GroupDefs, PackedGrid } from '../../types/grid.ts';
import { roundNumber } from '../../utils/math.ts';
import { isLandFilter } from '../../utils/graph.ts';
import { BiomeIndexes, biomesMartix } from '../../data/biomes.ts';
import { clipPoly } from '../../utils/polygons.ts';
import { calculateCenterLine } from '../../utils/centerlines.ts';

/**
 * Calculates the general moisture level of a cell by checking how close it is to a wated feature and it's
 * precipitation level.
 */
const calculateMoisture = (grid: PackedGrid, i: number) => {
  const { cells } = grid;
  const { precipitation } = grid.cells;

  let moist = precipitation[cells.gridIndex[i]];
  if (cells.rivers[i]) {
    moist += Math.max(cells.waterFlux[i] / 20, 2);
  }

  const n = cells.adjacentCells[i]
    .filter(isLandFilter(cells))
    .map(c => precipitation[cells.gridIndex[c]])
    .concat([moist]);

  return roundNumber(4 + (d3.mean(n) as number));
};

/**
 * Checks if the moisture level, temperature, and height combine to mean the cell with these value is a
 * wetland cell or not.
 */
const isWetLand = (moisture: number, temperature: number, height: number) => {
  // near coast
  if (moisture > 40 && temperature > -2 && height < 25) {
    return true;
  }

  // off coast
  return moisture > 24 && temperature > -2 && height > 24 && height < 60;
};

/**
 * Returns the biome ID from the preconfigured biome data of the map given the moisture level, the temprature
 * and the height of the cell.
 */
const getBiomeId = (moisture: number, temperature: number, height: number) => {
  // marine biome: all water cells
  if (height < 20) {
    return BiomeIndexes.MARINE;
  }
  // permafrost biome
  if (temperature < -5) {
    return BiomeIndexes.GLACIER;
  }
  // wetland biome
  if (isWetLand(moisture, temperature, height)) {
    return BiomeIndexes.WETLAND;
  }

  // [0-4]
  const moistureBand = Math.min((moisture / 5) | 0, 4);
  // [0-25]
  const temperatureBand = Math.min(Math.max(20 - temperature, 0), 25);

  return biomesMartix[moistureBand][temperatureBand];
};

/**
 * Defines the bio of each cell by assigning it a new biome ID based on the cell's environment, such as
 * its temperature, height, or proximity with various features.
 */
export const defineBiomes = (grid: PackedGrid) => {
  const { cells } = grid;
  const { temperatures } = grid.cells;
  // biomes array
  cells.biomes = new Uint8Array(cells.indexes.length);

  for (const i of cells.indexes) {
    const temperature = temperatures[cells.gridIndex[i]];
    const height = cells.heights[i];
    const moisture = height < 20 ? 0 : calculateMoisture(grid, i);
    cells.biomes[i] = getBiomeId(moisture, temperature, height);
  }
};

/**
 * Groups the biomes together to generate paths of cells that we can then draw as a group. This will greatly simplify
 * how we draw biomes and make them look a lot smoother and less jagged, since the cells are what would decide the shape
 * of the landmasses otherwise.
 */
export const groupBiomes = (
  grid: PackedGrid,
  graphWidth: number,
  graphHeight: number
) => {
  const { cells, vertices } = grid;
  const n = cells.indexes.length;
  const used = new Uint8Array(n);
  // Biome paths are stored under their biome index. Since a single biome can have multiple paths,
  // we store the paths as arrays of points.
  const paths: Record<BiomeIndexes, GroupDefs[]> = {
    [BiomeIndexes.MARINE]: [],
    [BiomeIndexes.HOT_DESERT]: [],
    [BiomeIndexes.COLD_DESERT]: [],
    [BiomeIndexes.SAVANNA]: [],
    [BiomeIndexes.GRASSLAND]: [],
    [BiomeIndexes.TROPICAL_SEASONAL_FOREST]: [],
    [BiomeIndexes.TEMPERATE_DECIDUOUS_FOREST]: [],
    [BiomeIndexes.TROPICAL_RAINFOREST]: [],
    [BiomeIndexes.TEMPERATE_RAINFOREST]: [],
    [BiomeIndexes.TAIGA]: [],
    [BiomeIndexes.TUNDRA]: [],
    [BiomeIndexes.GLACIER]: [],
    [BiomeIndexes.WETLAND]: [],
  };

  // connect vertices to chain
  const connectVertices = (start: number, b: number) => {
    // vertices chain to form a path
    const chain: number[] = [];
    for (
      let i = 0, current = start;
      i === 0 || (current !== start && i < 20000);
      i++
    ) {
      // previous vertex in chain
      const prev = chain[chain.length - 1];
      // add current vertex to sequence
      chain.push(current);

      // cells adjacent to vertex
      const c = vertices.adjacent[current];
      // Get all the cells with the same biome adjacent to this vertex, or cells which biome are on a lower
      // drawing priority than the current biome (will be drawn over).
      // Only set the current biome's cells as used. This should allow us to draw larger biomes and have them
      // overlap to avoid empty spaces.
      c.filter(c => cells.biomes[c] === b || cells.biomes[c] > b).forEach(c => {
        if (cells.biomes[c] === b) {
          used[c] = 1;
        }
      });

      // We check which cell to move to based on the cells length and if the other cell's biome is
      // on a lower drawing priority than the current cell.
      const c0 = c[0] >= n || cells.biomes[c[0]] < b;
      const c1 = c[1] >= n || cells.biomes[c[1]] < b;
      const c2 = c[2] >= n || cells.biomes[c[2]] < b;

      // neighboring vertices
      const v = vertices.neighbours[current];
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

  for (const i of cells.indexes) {
    // no need to mark marine biome (liquid water)
    if (!cells.biomes[i]) {
      continue;
    }

    // already marked
    if (used[i]) {
      continue;
    }

    const biome: BiomeIndexes = cells.biomes[i];
    const onborder = cells.adjacentCells[i].some(
      n => cells.biomes[n] !== biome
    );
    if (!onborder) {
      continue;
    }

    const edgeVerticle = cells.vertices[i].find(v =>
      vertices.adjacent[v].some(i => cells.biomes[i] !== biome)
    ) as number;
    const chain = connectVertices(edgeVerticle, biome);
    if (chain.length < 3) {
      continue;
    }

    const points = clipPoly(
      chain.map(v => vertices.coordinates[v]),
      graphWidth,
      graphHeight
    );

    paths[biome].push({
      points,
      centerline: calculateCenterLine(points),
    });
  }

  grid.biomeGroups = paths;
};
