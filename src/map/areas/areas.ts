import Alea from 'alea';
import * as d3Polygon from 'd3-polygon';
import * as d3Array from 'd3-array';

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
import { insertIntoSorted } from '../../utils/arrays.ts';

/**
 * Assigns the adjacent areas of this area after generation, this should allow us to know which
 * areas are near one another to capture during political generation, or for creating regions.
 */
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
 * Gets the weight value of a cell based on the rivers between it and the start cell. This should allow us
 * to make areas match the topology of the map, following rivers and not overlapping them. Since rivers are on
 * a specific cell rather than between cells, the map might not match perfectly.
 */
const getRiverWeight = (
  physicalMap: PackedGrid,
  startCell: number,
  currentCell: number,
  pathsToStart: Record<number, number[]>
): number => {
  const { cells } = physicalMap;
  // We'll consider three cases for calculating the value of a cell based on rivers.
  const pathToStart = pathsToStart[currentCell];
  if (!pathToStart) {
    return cells.rivers[currentCell] ? 10 : 0;
  }

  // Case 1 will check if a cell cuts an area in two. We should only keep cells that are on the start cell's
  // side of the river. The pathsToStart variable should contain all those paths.
  if (pathToStart.slice(1).some(c => cells.rivers[c])) {
    // If one cell within the path is a river (ignoring the start cell), then this is case 1.
    // Drop the cell as it's now "cut off" from the start cell.
    return -99999;
  }

  // Case 2 will check if the start cell is a river. It will be hard to know if a cell is on the same side
  // as another cell, so to keep things simple, we instead make sure that areas follow the flow of water.
  // If start is a river, only select cells that are also a river or have an adjacent river.
  if (cells.rivers[startCell]) {
    return cells.rivers[currentCell] === cells.rivers[startCell] ||
      cells.adjacentCells[currentCell].some(c => cells.rivers[c])
      ? 10
      : -99999;
  }

  // Case 3 will check if the current cell is a river. Do the same as case 1, but capture this cell
  // if no river cuts it from start. We want to return a good weight to make this cell valuable on a
  // first pass, but avoid over-capturing rivers.
  if (cells.rivers[currentCell]) {
    return pathToStart.slice(1).some(c => cells.rivers[c]) ? -99999 : 10;
  }

  return 0;
};

/**
 * Filters out cells from the adjacent cell selection based on the cell's properties. This will make sure
 * that areas have matching themes, like their height, their biome, their temperature, their precipitation,
 * and their features. We'll then make sure to not cross any river so they properly separate regions.
 */
const filterOutCells = (
  randomizer: ReturnType<typeof Alea>,
  physicalMap: PackedGrid,
  startCell: number,
  adjacentCells: number[],
  cellsToDrop: number,
  pathsToStart: Record<number, number[]>
) => {
  const { cells, features } = physicalMap;

  const startFeature = features[cells.features[startCell]];
  const startHeight = cells.heights[startCell];
  const startBiome = cells.biomes[startCell];
  const startTemperature = cells.temperatures[startCell];
  const startPrecipication = cells.precipitation[startCell];

  // If our start cell is a lake cell, don't even run the ranking, only return lake cells.
  if (startFeature.type === FeatureType.LAKE) {
    return adjacentCells.filter(
      c => features[cells.features[c]].type === FeatureType.LAKE
    );
  }

  // If we hit a lake cell, this filter should not even consider that cell. Drop it
  const toConsider = adjacentCells.filter(
    c => features[cells.features[c]].type !== FeatureType.LAKE
  );
  let cellsByWeight: [number, number][] = [];

  toConsider.forEach(adjacent => {
    let baseWeight = 10;

    // Start by checking the heightmap. Assign cells with either the same height, or
    // a height within 5 units of each other.
    const cellHeight = cells.heights[adjacent];
    if (cellHeight === startHeight) {
      baseWeight += 20;
    } else if (cellHeight <= startHeight + 5 && cellHeight >= startHeight - 5) {
      baseWeight += 10;
    } else {
      baseWeight -= 10;
    }

    // Next, check the biome and temperature/precipitations, same as heights. Same biome is preferred,
    // if not, make sure temperature and precipitations are close.
    const cellBiome = cells.biomes[adjacent];
    const cellTemperature = cells.temperatures[adjacent];
    const cellPrecipication = cells.precipitation[adjacent];
    if (cellBiome === startBiome) {
      baseWeight += 10;
    } else {
      if (
        cellTemperature <= startTemperature + 5 &&
        cellTemperature >= startTemperature - 5
      ) {
        baseWeight += 5;
      } else {
        baseWeight -= 5;
      }

      if (
        cellPrecipication <= startPrecipication + 5 &&
        cellPrecipication >= startPrecipication - 5
      ) {
        baseWeight += 5;
      } else {
        baseWeight -= 5;
      }
    }

    // Consider the features from the map to give some more value to the individual cells.
    // start by checking the rivers and harbors, then check if we should try to get
    // a "water" cell based on the cell type and the biome. Similar to how we select icons.
    baseWeight += getRiverWeight(
      physicalMap,
      startCell,
      adjacent,
      pathsToStart
    );

    const havenFeature = features[cells.features[cells.haven[adjacent]]];
    if (havenFeature.type === FeatureType.LAKE) {
      const lakeFeature = havenFeature as unknown as LakeFeature;

      if (cellHeight > 70) {
        // If the cell is very high in the sky and cold, ignore the biome
        if (
          lakeFeature.group === LakeFeatureGroup.FROZEN ||
          lakeFeature.group === LakeFeatureGroup.LAVA
        ) {
          baseWeight += 15;
        } else if (lakeFeature.group === LakeFeatureGroup.FRESHWATER) {
          baseWeight += 10;
        } else if (
          lakeFeature.group === LakeFeatureGroup.SALT ||
          lakeFeature.group === LakeFeatureGroup.DRY
        ) {
          baseWeight -= 5;
        }
      } else {
        // Otherwise, use the biome to check for cell value.
        switch (cellBiome) {
          case BiomeIndexes.TEMPERATE_RAINFOREST:
          case BiomeIndexes.TEMPERATE_DECIDUOUS_FOREST:
          case BiomeIndexes.GRASSLAND:
          case BiomeIndexes.WETLAND:
          case BiomeIndexes.TROPICAL_RAINFOREST:
          case BiomeIndexes.TROPICAL_SEASONAL_FOREST:
            if (lakeFeature.group === LakeFeatureGroup.FRESHWATER) {
              baseWeight += 15;
            } else if (lakeFeature.group === LakeFeatureGroup.SALT) {
              baseWeight += 10;
            } else if (
              lakeFeature.group === LakeFeatureGroup.FROZEN ||
              lakeFeature.group === LakeFeatureGroup.DRY ||
              lakeFeature.group === LakeFeatureGroup.LAVA
            ) {
              baseWeight -= 5;
            }
            break;
          case BiomeIndexes.COLD_DESERT:
          case BiomeIndexes.HOT_DESERT:
          case BiomeIndexes.SAVANNA:
            if (lakeFeature.group === LakeFeatureGroup.DRY) {
              baseWeight += 15;
            } else if (
              lakeFeature.group === LakeFeatureGroup.FRESHWATER ||
              lakeFeature.group === LakeFeatureGroup.LAVA
            ) {
              baseWeight += 10;
            } else if (
              lakeFeature.group === LakeFeatureGroup.FROZEN ||
              lakeFeature.group === LakeFeatureGroup.SALT
            ) {
              baseWeight -= 5;
            }
            break;
          case BiomeIndexes.GLACIER:
          case BiomeIndexes.TAIGA:
          case BiomeIndexes.TUNDRA:
            if (lakeFeature.group === LakeFeatureGroup.FROZEN) {
              baseWeight += 15;
            } else if (lakeFeature.group === LakeFeatureGroup.FRESHWATER) {
              baseWeight += 10;
            } else if (
              lakeFeature.group === LakeFeatureGroup.DRY ||
              lakeFeature.group === LakeFeatureGroup.SALT ||
              lakeFeature.group === LakeFeatureGroup.LAVA
            ) {
              baseWeight -= 5;
            }
            break;
        }
      }
    } else if (cells.types[adjacent] === CellType.Land) {
      // ocean coast is valued
      baseWeight += 5;
      // safe sea harbor is valued
      if (cells.harbor[adjacent] === 1) {
        baseWeight += 20;
      }
    }

    cellsByWeight = insertIntoSorted(
      cellsByWeight,
      [adjacent, baseWeight],
      (val1, val2) => val1[1] < val2[1]
    );
  });

  const amountToDrop = randomRange(randomizer, 0, cellsToDrop);

  // Return the selected cells by dropping those with low weight, and removing any with
  // negative weight. This will give a priority to the high value cells without necessarily
  // leading to areas that snake around.
  return cellsByWeight
    .filter(c => c[1] > 0)
    .slice(amountToDrop)
    .map(c => c[0]);
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
): Areas => {
  const { cells, features } = physicalMap;
  const { minAreaSize, maxAreaSize, cellsToDrop } = options;

  let areas: Areas = [];

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
    const areaCells = [startCell];

    // Select the immediately adjacent cells to the current start cell, which should give
    // us a roughly round area. Then drop a specific number of cells from it, which we add to the
    // final area cells.
    let previousBatch = filterOutCells(
      randomizer,
      physicalMap,
      startCell,
      [...cells.adjacentCells[startCell].filter(c => !used[c])],
      cellsToDrop,
      {}
    );
    areaCells.push(...previousBatch);

    // Object that contains a map of cell indexes and their path to the selected start cell,
    // which should make it easy to detect things between currently selected cells and the start
    // cell. The path is the cells to teh start cell, starting from the start cell, excluding the
    // current cell
    const pathsToStart: Record<number, number[]> = Object.fromEntries(
      areaCells.map(c => {
        if (c === startCell) {
          return [startCell, []];
        }

        return [c, [startCell]];
      })
    );
    while (areaCells.length < minAreaSize) {
      // While we are not at our max area size, keep adding cells.
      // Get all the adjacent cells of the previous batch.
      const newBatch: number[] = [];
      previousBatch.forEach(adjacent => {
        if (newBatch.length + areaCells.length > maxAreaSize) {
          return;
        }

        cells.adjacentCells[adjacent].forEach(c => {
          if (c === adjacent || areaCells.includes(c) || used[c]) {
            // Skip any cells we've already identified.
            return;
          }

          newBatch.push(c);
          pathsToStart[c] = pathsToStart[adjacent].concat(adjacent);
        });
      });

      if (!newBatch.length) {
        // If we had no candidates, we'll never be able to reach the min cells, drop this run
        break;
      }

      previousBatch = filterOutCells(
        randomizer,
        physicalMap,
        startCell,
        newBatch,
        cellsToDrop,
        pathsToStart
      );
      areaCells.push(...previousBatch);
    }

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
    queue = queue.filter(i => !used[i]);
  }

  // Run a cleanup of all the areas to remove any area that is smaller than the minimum
  const areaQueue = areas.map(a => a.index);
  while (areaQueue.length) {
    const currentArea = areas[areaQueue.pop() as number];
    if (currentArea.cells.length >= minAreaSize) {
      continue;
    }

    // If the size of the area is smaller than the minimum even while looking at the neighbors,
    // try to merge this cell into an adjacent area. Find the one with the smallest cell count.
    const allAdjacentCells = currentArea.cells
      .map(c =>
        cells.adjacentCells[c].filter(
          sub => sub !== c && !currentArea.cells.includes(sub)
        )
      )
      .flat(1);
    let adjacent = areas.filter(
      a =>
        features[cells.features[a.center]].type !== FeatureType.OCEAN &&
        a.cells.some(c => allAdjacentCells.includes(c))
    );

    if (
      features[cells.features[currentArea.center]].type === FeatureType.LAKE
    ) {
      // If we hit a single cell in a lake, assign it to another area of that lake if any
      adjacent = adjacent.filter(
        a => features[cells.features[a.center]].type === FeatureType.LAKE
      );
    } else {
      adjacent = adjacent.filter(
        a => features[cells.features[a.center]].type !== FeatureType.LAKE
      );
    }

    if (
      cells.biomes[currentArea.center] !== BiomeIndexes.MARINE &&
      adjacent.every(a => a.properties.biome === BiomeIndexes.MARINE)
    ) {
      // If all adjacent cells are marine cells, it's a lone island. Ignore and keep going
      continue;
    }

    if (adjacent.length) {
      // If we found an adjacent area, assign this area's cells to it.
      const smallestAdjacent = d3Array.least(
        adjacent,
        a => a.cells.length
      ) as Area;
      const areaCells = [...smallestAdjacent.cells, ...currentArea.cells];

      areas = areas
        .filter(a => a !== currentArea)
        .map(a => {
          if (a.index === smallestAdjacent.index) {
            return {
              center: smallestAdjacent.center,
              cells: areaCells,
              adjacentAreas: [],
              border: [],
              index: smallestAdjacent.index,
              properties: {
                biome: cells.biomes[smallestAdjacent.center],
                features: [...new Set(areaCells.map(c => cells.features[c]))],
                harbor: [...new Set(areaCells.map(c => cells.harbor[c]))],
                height: cells.heights[smallestAdjacent.center],
                population: 0,
                precipitation: cells.precipitation[smallestAdjacent.center],
                temperature: cells.temperatures[smallestAdjacent.center],
              },
            };
          }

          return a;
        });

      areas = areas.filter(a => a !== currentArea);
    }
  }

  // Now that we've cleaned up all the areas, reassign the indexes to make sure they match their
  // array positions.
  areas.forEach((a, index) => {
    a.index = index;
    assignAdjacent(cells, a, areas);
  });

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
