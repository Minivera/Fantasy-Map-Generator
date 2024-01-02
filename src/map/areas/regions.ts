import { FeatureType, PackedGrid, Point } from '../../types/grid.ts';
import { Area, Areas, Regions } from '../../types/areas.ts';
import * as d3Polygon from 'd3-polygon';
import { clipPoly } from '../../utils/polygons.ts';

export const defineRegions = (
  physicalMap: PackedGrid,
  areaMap: Areas
): Regions => {
  const { cells, features } = physicalMap;

  const regions: Regions = [];

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

    regions.push({
      index: regions.length,
      adjacentRegions: [],
      areas: regionAreas,
      border: [],
    });

    regionAreas.forEach(area => {
      used[area.index] = true;
    });

    queue = queue.filter(a => !used[a.index]);
  }

  return regions;
};

export const groupRegions = (
  grid: PackedGrid,
  regions: Regions,
  graphWidth: number,
  graphHeight: number
) => {
  const { cells, vertices, features } = grid;
  const n = cells.indexes.length;
  const used = new Uint8Array(n);

  const cellsToRegion: Record<number, number> = {};
  cells.indexes.forEach(c => {
    const found = regions.find(r => r.areas.some(a => a.cells.includes(c)));
    if (!found) {
      cellsToRegion[c] = -1;
      return;
    }

    cellsToRegion[c] = found.index;
  });

  // connect vertices to chain
  const connectVertices = (start: number, r: number) => {
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
      c.filter(c => cellsToRegion[c] === r).forEach(c => (used[c] = 1));

      const c0 = c[0] >= n || cellsToRegion[c[0]] !== r;
      const c1 = c[1] >= n || cellsToRegion[c[1]] !== r;
      const c2 = c[2] >= n || cellsToRegion[c[2]] !== r;

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
    const edgeArea = region.areas.find(a =>
      a.adjacentAreas.some(other => !region.areas.includes(other))
    ) as Area;

    const hull = d3Polygon.polygonHull(
      edgeArea.cells
        .map(c => cells.vertices[c].map(v => vertices.coordinates[v]))
        .flat(1) as Point[]
    ) as Point[];
    const chain = connectVertices(
      vertices.coordinates.findIndex(c => c === hull[0]),
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
};
