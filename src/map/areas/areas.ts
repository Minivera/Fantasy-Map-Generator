import Alea from 'alea';
import * as d3Polygon from 'd3-polygon';

import {
  CellType,
  FeatureType,
  LakeFeature,
  LakeFeatureGroup,
  PackedCells,
  PackedGrid,
  Point,
} from '../../types/grid.ts';
import { randomRange } from '../../utils/probability.ts';
import { Area, Areas } from '../../types/areas.ts';
import { BiomeIndexes } from '../../data/biomes.ts';
import { clipPoly } from '../../utils/polygons.ts';

const assignAdjacent = (cells: PackedCells, area: Area, others: Areas) => {
  const known: boolean[] = new Array(others.length)
    .fill(false)
    .map(a => a === area || area.adjacentAreas.includes(a));

  area.cells.forEach(cell => {
    // Find the neighboring areas by looking at the other areas and getting any area where one of the cell's
    // adjacent cell is in another area that we don't have already registered as neighbor.
    const neighboringAreas: Areas = [];
    cells.adjacentCells[cell].forEach(adjacent => {
      const found = others
        .filter(a => a.cells.includes(adjacent))
        .filter(a => !known[a.index]);
      if (found.length) {
        // Then assign the neighboring areas to the found cells
        neighboringAreas.push(...found);
      }

      // And update the known array to avoid duplicates
      found.forEach(a => {
        known[a.index] = true;
      });
    });

    area.adjacentAreas.push(...neighboringAreas);
  });

  const uniqueFilter = (value: unknown, index: number, array: unknown[]) =>
    array.indexOf(value) === index;

  // Clean up the array to make sure they're unique, then assign this area to all neighbors
  area.adjacentAreas = area.adjacentAreas.filter(uniqueFilter);
  area.adjacentAreas.forEach(other => {
    other.adjacentAreas = other.adjacentAreas.concat(area).filter(uniqueFilter);
  });
};

/**
 * Checks if the shortest path between the current cell and the target cell is cut by a map feature such as a
 * river. Will look for paths of length up to the limit.
 */
const isSeparatedFromStart = (
  cells: PackedCells,
  sourceCell: number,
  targetCell: number,
  limit: number = 4
): boolean => {
  const paths: number[][] = [];

  // This is a fairly standard path lookup algorithm
  const queue = [sourceCell];
  const visited = { [sourceCell]: true };
  const predecessor: Record<number, number> = {};

  while (queue.length) {
    // Pop a vertex off the queue.
    const current = queue.pop() as number;
    const neighbors = cells.adjacentCells[current];

    for (let i = 0; i < neighbors.length; ++i) {
      const v = neighbors[i];
      if (visited[v]) {
        continue;
      }

      visited[v] = true;
      const path = [v];
      let pathCell = current;
      while (pathCell !== sourceCell) {
        path.push(pathCell);
        pathCell = predecessor[pathCell];
      }
      // We don't add the source cell to the path, since we don't want to check it as separated.

      // Make sure to avoid paths that break the limit
      if (path.length >= limit) {
        break;
      }

      if (v === targetCell) {
        // Check if the path is complete.
        // If so, backtrack through the path and add it to the known paths.
        path.reverse();
        paths.push(path);
        break;
      }

      predecessor[v] = current;
      queue.push(v);
    }
  }

  const shortestPath = paths.toSorted((p1, p2) => p1.length - p2.length)[0];
  return shortestPath.some(c => cells.rivers[c]);
};

/**
 * Defines a set of area on the map by associating cells with common attributes together, up to a maximum number of
 * cells as defined in the options. These areas will be useful to generate political elements that will ignore anything
 * related to the physical generation. These areas should already have everything the generation needs to evaluate the
 * value of a set of cells and "conquer" them.
 */
export const defineAreas = (
  randomizer: ReturnType<typeof Alea>,
  physicalMap: PackedGrid,
  options: {
    minAreaSize: number;
    maxAreaSize: number;
    cellsToDrop: number;
  }
) => {
  const { cells, features } = physicalMap;
  const { minAreaSize, maxAreaSize, cellsToDrop } = options;

  const areas: Areas = [];

  const used: boolean[] = new Array(cells.indexes.length).fill(false);

  // Start by creating a queue of ocean cells
  let queue = cells.indexes.filter(
    c => features[cells.features[c]].type === FeatureType.OCEAN
  );

  // Then group those ocean cells into areas. We don't care about the size of the areas in this case. We should group
  // connected oceans together.
  while (queue.length) {
    // Get a random cell within the queue
    const startCell = queue[randomRange(randomizer, 0, queue.length - 1)];

    const oceanArea: number[] = [startCell];
    const subQueue = [...cells.adjacentCells[startCell]];
    while (subQueue.length) {
      // Loop over all the adjacent cells we detect, keep only the ocean cells until the queue is empty
      const currentCell = subQueue.pop() as number;
      if (features[cells.features[currentCell]].type !== FeatureType.OCEAN) {
        // Drop any non-ocean cell, use the features for that
        continue;
      }
      if (used[currentCell]) {
        // If, somehow, we used that cell already. Skip it.
        continue;
      }

      // if we got an ocean cell, save it and add its adjacent cells to the subqeue
      used[currentCell] = true;
      oceanArea.push(currentCell);
      subQueue.push(...cells.adjacentCells[currentCell]);
    }

    // now that we're out of this queue, we have all the connected ocean cells. Create a new area and
    // save it.
    const newArea: Area = {
      center: startCell,
      cells: oceanArea,
      adjacentAreas: [],
      border: [],
      index: areas.length,
      properties: {
        biome: cells.biomes[startCell],
        features: [cells.features[startCell]],
        harbor: [],
        height: cells.heights[startCell],
        population: 0,
        precipitation: cells.precipitation[startCell],
        temperature: cells.temperatures[startCell],
      },
    };

    // Assign adjacent areas
    assignAdjacent(cells, newArea, areas);
    areas.push(newArea);

    // Set those cells as used, then clear the queue for the next cells
    oceanArea.forEach(c => {
      used[c] = true;
    });
    queue = queue.filter(c => !used[c]);
  }

  // TODO: Split the oceans if we only get one. Will be difficult since the ocean cells are not "chained",
  // TODO: I.E. the cell indexes don't meant that we'll only get adjacent cells. So we're likely to create
  // TODO: randomly separated oceans if we're not careful.

  // And now we can start building the land and lakes areas
  queue = cells.indexes.filter(i => !used[i]);
  while (queue.length) {
    // Get a random cell within the queue
    const startCell = queue[randomRange(randomizer, 0, queue.length - 1)];
    let areaCells = [startCell];

    // Get all adjacent cells for the current cell into the array, removing any used cell
    areaCells.push(...cells.adjacentCells[startCell].filter(c => !used[c]));
    if (areaCells.length <= 1) {
      // If the size of the area is 1 even while looking at the neighbors, try to merge this
      // cell into an adjacent area. Find the one with the smallest cell count.
      let adjacent = areas
        .filter(a =>
          a.cells.some(c => cells.adjacentCells[startCell].includes(c))
        )
        .toSorted((a1, a2) => a2.cells.length - a1.cells.length);

      if (features[cells.features[startCell]].type !== FeatureType.LAKE) {
        // If we hit a single cell in a lake, assign it to another area of that lake if any
        adjacent = adjacent.filter(
          a => features[cells.features[a.center]].type !== FeatureType.LAKE
        );
      }

      if (
        cells.biomes[startCell] !== BiomeIndexes.MARINE &&
        !adjacent.some(a => a.properties.biome !== BiomeIndexes.MARINE)
      ) {
        // If all adjacent cells are marine cells, it's a lone island. Add and keep going
        const newArea: Area = {
          center: startCell,
          cells: [startCell],
          adjacentAreas: [],
          border: [],
          index: areas.length,
          properties: {
            biome: cells.biomes[startCell],
            features: [cells.features[startCell]],
            harbor: [cells.harbor[startCell]],
            height: cells.heights[startCell],
            population: 0,
            precipitation: cells.precipitation[startCell],
            temperature: cells.temperatures[startCell],
          },
        };

        // Assign adjacent areas
        assignAdjacent(cells, newArea, areas);
        areas.push(newArea);

        used[startCell] = true;
        queue = cells.indexes.filter(i => !used[i]);
        continue;
      } else if (adjacent.length) {
        // If we found an adjacent area, assign this cell to it and keep going.
        adjacent[0].cells.push(startCell);
        assignAdjacent(cells, adjacent[0], areas);

        used[startCell] = true;
        queue = cells.indexes.filter(i => !used[i]);
        continue;
      }

      // If not, then continue. We'll assign this one to an area eventually
      continue;
    }

    // Add more adjacent cells to the area to make sure we hit the minimum. The minimum is not strict though,
    // cancel if we gone thought all cells.
    let currentCell = 1;
    const lastCell = areaCells.length - 1;
    while (areaCells.length < minAreaSize) {
      areaCells.push(
        ...cells.adjacentCells[areaCells[currentCell]].filter(
          c => !areaCells.includes(c) && !used[c]
        )
      );

      currentCell++;
      if (currentCell > lastCell) {
        // Stop when we've gone over all the original cells. Don't create "line" areas, so don't add more.
        break;
      }
    }

    // Remove any cells above the maximum size
    while (areaCells.length > maxAreaSize) {
      areaCells.splice(randomRange(randomizer, 0, areaCells.length - 1), 1);
    }

    // Drop a small set of cells randomly to randomize the size of the area
    const toDrop: number[] = [];
    const amountToDrop = randomRange(
      randomizer,
      0,
      Math.max(Math.min(cellsToDrop, areaCells.length - 1 - minAreaSize), 0)
    );

    let i = 0;
    while (i < amountToDrop) {
      // We don't want to select the start cell, which should always be the "first" cell.
      const indexToDrop = randomRange(randomizer, 1, areaCells.length - 1);
      if (toDrop.includes(areaCells[indexToDrop])) {
        continue;
      }

      toDrop.push(areaCells[indexToDrop]);
      i++;
    }

    areaCells = areaCells.filter(c => !toDrop.includes(c));

    // Start ranking the cells, cells should start with a base rank, and we'll filter them based on that.
    const ranks: Record<number, number> = Object.fromEntries(
      areaCells.map(c => [c, 10])
    );
    areaCells.forEach(cell => {
      if (cell === startCell) {
        // If we hit the start cell, make _sure_ we always select it.
        ranks[cell] = 99999;
        return;
      }

      if (features[cells.features[cell]].type === FeatureType.LAKE) {
        // If we hit a lake cell (other marine cells should be ignored), make sure to associate it only with
        // lake start cells.
        ranks[cell] =
          features[cells.features[startCell]].type === FeatureType.LAKE
            ? 99999
            : -99999;
        return;
      } else if (
        features[cells.features[startCell]].type === FeatureType.LAKE
      ) {
        // Same thing if we hit a land cell and are generating a lake area.
        ranks[cell] =
          features[cells.features[cell]].type === FeatureType.LAKE
            ? 99999
            : -99999;
        return;
      }

      // We value elevation close to the start cell
      if (cells.heights[cell] === cells.heights[startCell]) {
        ranks[cell] += 20;
      } else if (
        cells.heights[cell] > cells.heights[startCell] - 5 ||
        cells.heights[cell] < cells.heights[startCell] + 5
      ) {
        ranks[cell] +=
          (cells.heights[cell] > cells.heights[startCell]
            ? cells.heights[cell] - cells.heights[startCell]
            : cells.heights[startCell] - cells.heights[cell]) * 5;
      } else {
        ranks[cell] -= 10;
      }

      // We value the same, or close, biome to the start cell
      if (cells.biomes[cell] === cells.biomes[startCell]) {
        ranks[cell] += 20;
      } else if (
        cells.temperatures[cell] > cells.temperatures[startCell] - 5 ||
        cells.temperatures[cell] < cells.temperatures[startCell] + 5
      ) {
        // if they're different biomes, use the temperature and precipitation
        ranks[cell] +=
          (cells.temperatures[cell] > cells.temperatures[startCell]
            ? cells.temperatures[cell] - cells.temperatures[startCell]
            : cells.temperatures[startCell] - cells.temperatures[cell]) * 5;
        ranks[cell] +=
          (cells.precipitation[cell] > cells.precipitation[startCell]
            ? cells.precipitation[cell] - cells.precipitation[startCell]
            : cells.precipitation[startCell] - cells.precipitation[cell]) * 5;
      }

      // Cut any cell that is not "connected" to the start cell
      if (isSeparatedFromStart(cells, cell, startCell)) {
        // TODO: This does not check if the start cell _is_ a river, which would lead to a river overlap
        ranks[cell] -= 30;
      }

      if (cells.types[cell] === CellType.Land) {
        // estuary is valued
        if (cells.rivers[cell]) {
          ranks[cell] += 15;
        }

        const feature = features[cells.features[cells.haven[i]]];
        if (feature.type === FeatureType.LAKE) {
          const lakeFeature = feature as unknown as LakeFeature;
          if (lakeFeature.group === LakeFeatureGroup.FRESHWATER) {
            ranks[cell] += 30;
          } else if (lakeFeature.group === LakeFeatureGroup.SALT) {
            ranks[cell] += 10;
          } else if (lakeFeature.group === LakeFeatureGroup.FROZEN) {
            ranks[cell] += 1;
          } else if (lakeFeature.group === LakeFeatureGroup.DRY) {
            ranks[cell] -= 5;
          } else if (lakeFeature.group === LakeFeatureGroup.LAVA) {
            ranks[cell] -= 30;
          }
        } else {
          // ocean coast is valued
          ranks[cell] += 5;
          // safe sea harbor is valued
          if (cells.harbor[i] === 1) {
            ranks[cell] += 20;
          }
        }
      }
    });

    // Finally, filter out any cell that have negative
    areaCells = areaCells.filter(c => ranks[c] > 0);

    // Then create the area and add it
    const newArea: Area = {
      center: startCell,
      cells: areaCells,
      adjacentAreas: [],
      border: [],
      index: areas.length,
      properties: {
        biome: cells.biomes[startCell],
        features: [...new Set(areaCells.map(c => cells.features[c]))],
        harbor: [...new Set(areaCells.map(c => cells.harbor[c]))],
        height: cells.heights[startCell],
        population: 0,
        precipitation: cells.precipitation[startCell],
        temperature: cells.temperatures[startCell],
      },
    };

    // Assign adjacent areas
    assignAdjacent(cells, newArea, areas);
    areas.push(newArea);

    // Set those cells as used, then clear the queue for the next cells
    areaCells.forEach(c => {
      used[c] = true;
    });
    queue = cells.indexes.filter(i => !used[i]);
  }

  return areas;
};

/**
 * Groups the areas together to generate paths of cells that we can then draw as a group. This will greatly simplify
 * how we draw areas since we'll know how to draw the area's border path. Paths may overlap each other, we don't want
 * areas to match perfectly.
 */
export const groupAreas = (
  grid: PackedGrid,
  areas: Areas,
  graphWidth: number,
  graphHeight: number
) => {
  const { cells, vertices, features } = grid;
  const n = cells.indexes.length;
  const used = new Uint8Array(n);

  const cellsToArea: Record<number, number> = {};
  cells.indexes.forEach(c => {
    const found = areas.find(a => a.cells.includes(c));
    if (!found) {
      cellsToArea[c] = -1;
      return;
    }

    cellsToArea[c] = found.index;
  });

  // connect vertices to chain
  const connectVertices = (start: number, a: number) => {
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
      c.filter(c => cellsToArea[c] === a).forEach(c => (used[c] = 1));

      const c0 = c[0] >= n || cellsToArea[c[0]] !== a;
      const c1 = c[1] >= n || cellsToArea[c[1]] !== a;
      const c2 = c[2] >= n || cellsToArea[c[2]] !== a;

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

  areas.forEach(area => {
    if (
      area.properties.features.some(f => features[f].type === FeatureType.OCEAN)
    ) {
      return;
    }

    const hull = d3Polygon.polygonHull(
      area.cells
        .map(c => cells.vertices[c].map(v => vertices.coordinates[v]))
        .flat(1) as Point[]
    ) as Point[];
    const chain = connectVertices(
      vertices.coordinates.findIndex(c => c === hull[0]),
      area.index
    );
    if (chain.length < 3) {
      return;
    }

    area.border = clipPoly(
      chain.map(v => vertices.coordinates[v]),
      graphWidth,
      graphHeight
    );
  });
};
