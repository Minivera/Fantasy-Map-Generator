import * as d3Polygon from 'd3-polygon';
import * as d3Array from 'd3-array';

import { FeatureType, PackedGrid, Point } from '../../types/grid.ts';
import { Area, Areas, Region, Regions } from '../../types/areas.ts';
import { clipPoly } from '../../utils/polygons.ts';
import { BiomeIndexes } from '../../data/biomes.ts';

/**
 * Assigns the adjacent regions of this regions after generation, this should allow us to know which
 * regions are near one another to capture during political generation.
 */
const assignAdjacent = (region: Region, others: Regions) => {
  const known: boolean[] = new Array(others.length)
    .fill(false)
    .map(r => r === region || region.adjacentRegions.includes(r));

  region.areas.forEach(area => {
    // Find the neighboring regions by looking at the other regions and getting any regions where one of the area's
    // adjacent area is in another region that we don't have already registered as neighbor.
    const neighboringRegions: Regions = [];
    area.adjacentAreas.forEach(adjacent => {
      const found = others
        .filter(r => r.areas.includes(adjacent))
        .filter(a => !known[a.index]);
      if (found.length) {
        // Then assign the neighboring regions to the found areas
        neighboringRegions.push(...found);
      }

      // And update the known array to avoid duplicates
      found.forEach(a => {
        known[a.index] = true;
      });
    });

    region.adjacentRegions.push(...neighboringRegions);
  });

  const uniqueFilter = (value: unknown, index: number, array: unknown[]) =>
    array.indexOf(value) === index;

  // Clean up the array to make sure they're unique, then assign this area to all neighbors
  region.adjacentRegions = region.adjacentRegions.filter(uniqueFilter);
  region.adjacentRegions.forEach(other => {
    other.adjacentRegions = other.adjacentRegions
      .concat(region)
      .filter(uniqueFilter);
  });
};

/**
 * Defines the regions on the physical map given the currently existing areas. This will join those areas in
 * common regions by checking the biomes or heightmap to ensure that common heights and biomes are joined
 * together as a region. This should allow us to create things like mountain ranges or forests.
 */
export const defineRegions = (
  physicalMap: PackedGrid,
  areaMap: Areas,
  options: {
    minRegionSize: number;
  }
): Regions => {
  const { cells, features } = physicalMap;
  const { minRegionSize } = options;

  let regions: Regions = [];

  // Start with identifying the lakes, so we don't capture them later.
  let queue = areaMap.filter(
    area => features[cells.features[area.center]].type === FeatureType.LAKE
  );
  const used: boolean[] = new Array(areaMap.length).fill(false);

  while (queue.length) {
    const currentArea = queue.pop() as Area;

    const regionAreas: Areas = [currentArea];
    let captured: Areas = currentArea.adjacentAreas.filter(
      area => features[cells.features[area.center]].type === FeatureType.LAKE
    );

    while (captured.length) {
      regionAreas.push(...captured);
      captured = regionAreas
        .map(a => a.adjacentAreas)
        .flat(1)
        .filter((val, index, array) => array.indexOf(val) === index)
        .filter(
          area =>
            !regionAreas.includes(area) &&
            features[cells.features[area.center]].type ===
              features[cells.features[currentArea.center]].type
        );
    }

    regionAreas.push(...captured);
    captured = [];

    const newRegion: Region = {
      index: regions.length,
      adjacentRegions: [],
      areas: regionAreas,
      border: [],
      borderHoles: [],
    };

    assignAdjacent(newRegion, regions);
    regions.push(newRegion);

    regionAreas.forEach(area => {
      used[area.index] = true;
    });

    queue = queue.filter(a => !used[a.index]);
  }

  // Then switch to looking at all the areas that are not currently used
  queue = areaMap.filter(a => !used[a.index]);
  while (queue.length) {
    const currentArea = queue.pop() as Area;

    const areaFilter = (area: Area): boolean => {
      // Merge mountains together so we create mountain ranges
      if (cells.heights[currentArea.center] > 50) {
        return cells.heights[area.center] > 50;
      }

      // Finally, compare the biomes, so we combine similar biomes together in global regions.
      switch (cells.biomes[currentArea.center]) {
        case BiomeIndexes.MARINE:
          return cells.biomes[area.center] === BiomeIndexes.MARINE;
        case BiomeIndexes.TEMPERATE_RAINFOREST:
        case BiomeIndexes.TEMPERATE_DECIDUOUS_FOREST:
          return (
            cells.biomes[area.center] === BiomeIndexes.TEMPERATE_RAINFOREST ||
            cells.biomes[area.center] ===
              BiomeIndexes.TEMPERATE_DECIDUOUS_FOREST
          );
        case BiomeIndexes.GRASSLAND:
          return cells.biomes[area.center] === BiomeIndexes.GRASSLAND;
        case BiomeIndexes.WETLAND:
          return cells.biomes[area.center] === BiomeIndexes.WETLAND;
        case BiomeIndexes.TROPICAL_RAINFOREST:
        case BiomeIndexes.TROPICAL_SEASONAL_FOREST:
          return (
            cells.biomes[area.center] === BiomeIndexes.TROPICAL_RAINFOREST ||
            cells.biomes[area.center] === BiomeIndexes.TROPICAL_SEASONAL_FOREST
          );
        case BiomeIndexes.COLD_DESERT:
          return cells.biomes[area.center] === BiomeIndexes.COLD_DESERT;
        case BiomeIndexes.HOT_DESERT:
          return cells.biomes[area.center] === BiomeIndexes.HOT_DESERT;
        case BiomeIndexes.SAVANNA:
          return cells.biomes[area.center] === BiomeIndexes.SAVANNA;
        case BiomeIndexes.GLACIER:
          return cells.biomes[area.center] === BiomeIndexes.GLACIER;
        case BiomeIndexes.TAIGA:
        case BiomeIndexes.TUNDRA:
          return (
            cells.biomes[area.center] === BiomeIndexes.TAIGA ||
            cells.biomes[area.center] === BiomeIndexes.TUNDRA
          );
      }

      return false;
    };

    // Filter out the adjacent areas until we have no candidates left. The filter function will be reused
    // in the loop multiple times.
    const regionAreas: Areas = [currentArea];
    let captured: Areas = currentArea.adjacentAreas.filter(
      area => !used[area.index] && areaFilter(area)
    );

    while (captured.length) {
      regionAreas.push(...captured);
      captured = captured
        .map(a => a.adjacentAreas)
        .flat(1)
        .filter((val, index, array) => array.indexOf(val) === index)
        .filter(
          area =>
            !regionAreas.includes(area) && !used[area.index] && areaFilter(area)
        );
    }

    regionAreas.push(...captured);
    captured = [];

    const newRegion: Region = {
      index: regions.length,
      adjacentRegions: [],
      areas: regionAreas,
      border: [],
      borderHoles: [],
    };

    assignAdjacent(newRegion, regions);
    regions.push(newRegion);

    regionAreas.forEach(area => {
      used[area.index] = true;
    });

    queue = queue.filter(a => !used[a.index]);
  }

  // Run a cleanup of all the regions to remove any regions that is smaller than the minimum
  const regionsQueue = regions.map(a => a.index);
  while (regionsQueue.length) {
    const currentRegion = regions[regionsQueue.pop() as number];
    if (currentRegion.areas.length >= minRegionSize) {
      continue;
    }

    // TODO: Skip the ocean based regions so we don't run into infinite loops

    // If the size of the region is smaller than the minimum even while looking at the neighbors,
    // try to merge this cell into an adjacent area. Find the one with the smallest cell count.
    const allAdjacentAreas = [
      ...new Set(
        currentRegion.areas
          .map(a =>
            a.adjacentAreas.filter(
              other => !currentRegion.areas.includes(other)
            )
          )
          .flat(1)
      ),
    ];
    const adjacentRegions = regions.filter(
      r =>
        r.areas.every(
          area =>
            features[cells.features[area.center]].type !== FeatureType.OCEAN &&
            features[cells.features[area.center]].type !== FeatureType.LAKE
        ) && r.areas.some(a => allAdjacentAreas.includes(a))
    );

    if (adjacentRegions.length) {
      // If we found an adjacent region, then look up which is the smallest and assign this region's area to it.
      const smallestAdjacent = d3Array.least(
        adjacentRegions,
        a => a.areas.length
      ) as Region;
      const regionAreas = [...smallestAdjacent.areas, ...currentRegion.areas];

      regions = regions
        .filter(r => r !== currentRegion)
        .map(r => {
          if (r.index === smallestAdjacent.index) {
            return {
              index: smallestAdjacent.index,
              adjacentRegions: [],
              areas: regionAreas,
              border: [],
              borderHoles: [],
            };
          }

          return r;
        });
    }
  }

  // Now that we've cleaned up all the regions, reassign the indexes to make sure they match their
  // array positions.
  regions.forEach((r, index) => {
    r.index = index;
    r.adjacentRegions = [];
    assignAdjacent(r, regions);
  });

  return regions;
};

/**
 * Groups the regions together to generate paths of cells that we can then draw as a group. This will greatly simplify
 * how we draw regions since we'll know how to draw the area's border path. We'll also add "holes" for any region that
 * overlaps another region to avoid drawing regions over one another.
 */
export const groupRegions = (
  grid: PackedGrid,
  regions: Regions,
  graphWidth: number,
  graphHeight: number
) => {
  const { cells, vertices, features } = grid;

  const cellsToRegion: Record<number, number> = {};
  cells.indexes.forEach(c => {
    const found = regions.find(r => r.areas.some(a => a.cells.includes(c)));
    if (!found) {
      cellsToRegion[c] = -1;
      return;
    }

    cellsToRegion[c] = found.index;
  });

  const n = cells.indexes.length;
  const used = new Uint8Array(n);

  // connect vertices to chain
  const connectVertices = (start: number, region: number) => {
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
      c.forEach(c => {
        used[c] = 1;
      });

      const c0 = c[0] >= n || cellsToRegion[c[0]] !== region;
      const c1 = c[1] >= n || cellsToRegion[c[1]] !== region;
      const c2 = c[2] >= n || cellsToRegion[c[2]] !== region;

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

  regions.forEach(region => {
    // Skip the ocean, no need to mark it
    if (
      region.areas.some(
        area => features[cells.features[area.center]].type === FeatureType.OCEAN
      )
    ) {
      // return;
    }

    const allAreaCells = region.areas.map(area => area.cells).flat(1);
    const allVerticesCoordinates = allAreaCells
      .map(c => cells.vertices[c].map(v => vertices.coordinates[v]))
      .flat(1);
    const hull = d3Polygon.polygonHull(allVerticesCoordinates) as Point[];

    const chain = connectVertices(
      vertices.coordinates.findIndex(
        (v, index) =>
          vertices.adjacent[index].some(
            c => cellsToRegion[c] === region.index
          ) && hull.includes(v)
      ),
      region.index
    );
    if (chain.length < 3) {
      return;
    }

    region.border = clipPoly(
      chain.map(v => vertices.coordinates[v]),
      graphWidth,
      graphHeight
    );
  });

  // After we calculated all the borders, check if a border is within another border
  // with d3-polygon, that way we know which hole to create for regions.
  regions.forEach(region => {
    if (!region.border.length) {
      return;
    }

    regions.forEach(otherRegion => {
      if (region === otherRegion) {
        return;
      }

      // If all points of the polygon are contained in the region's polygon
      if (
        otherRegion.border.every(p =>
          d3Polygon.polygonContains(region.border, p)
        )
      ) {
        // Add this other polygon as a hole of the current region
        region.borderHoles.push(otherRegion.border);
      }
    });

    // Get the rulers
    const from =
      region.border[
        d3Array.leastIndex(region.border, (a, b) => a[0] - b[0]) as number
      ];
    const to =
      region.border[
        d3Array.leastIndex(region.border, (a, b) => b[0] - a[0]) as number
      ];
    const center = d3Polygon.polygonCentroid(region.border);

    // Now that we've got the center, we'll want to move the y closer to the actual center of the
    // region. Get all y points that are within 5 pixels of the center x.
    const yCandidates = region.border.filter(
      point => point[0] < center[0] + 5 || point[0] > center[0] - 5
    );

    // Then calculate the center between the highest and lowest y position near the center.
    const topY = d3Array.least(yCandidates, (a, b) => a[1] - b[1]) as Point;
    const bottomY = d3Array.least(yCandidates, (a, b) => b[1] - a[1]) as Point;

    // Chose the center as the center between the two ys rather than the polygon center
    center[1] = topY[1] + (bottomY[1] - topY[1]) / 2;
    region.ruler = [from, center, to];
  });
};
