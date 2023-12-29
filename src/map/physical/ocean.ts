import { Grid } from '../../types/grid.ts';
import { roundNumber } from '../../utils/math.ts';
import { clipPoly } from '../../utils/polygons.ts';
import { Point } from 'lineclip';

export const defineOceanLayers = (
  grid: Grid,
  graphWidth: number,
  graphHeight: number,
  limits = [-6, -3, -1]
) => {
  const { cells, vertices } = grid;
  const pointsN = cells.indexes.length;
  const used = new Uint8Array(pointsN);

  const chains: Record<number, Point[][]> = {};

  // find eligible cell vertex to start path detection
  const findStart = (i: number, t: number) => {
    // map border cell
    if (cells.nearBorderCells[i]) {
      return cells.vertices[i].find(v =>
        vertices.adjacent[v].some(c => c >= pointsN)
      );
    }
    return cells.vertices[i][
      cells.adjacentCells[i].findIndex(
        c => cells.types[c] < t || !cells.types[c]
      )
    ];
  };

  const connectVertices = (start: number, t: number) => {
    const chain: number[] = []; // vertices chain to form a path
    for (
      let i = 0, current = start;
      i === 0 || (current !== start && i < 10000);
      i++
    ) {
      // previous vertex in chain
      const prev = chain[chain.length - 1];
      // add current vertex to sequence
      chain.push(current);

      // cells adjacent to vertex
      const c = vertices.adjacent[current];
      c.filter(c => cells.types[c] === t).forEach(c => (used[c] = 1));

      // neighboring vertices
      const v = vertices.neighbours[current];

      const c0 = !cells.types[c[0]] || cells.types[c[0]] === t - 1;
      const c1 = !cells.types[c[1]] || cells.types[c[1]] === t - 1;
      const c2 = !cells.types[c[2]] || cells.types[c[2]] === t - 1;

      if (v[0] !== undefined && v[0] !== prev && c0 !== c1) {
        current = v[0];
      } else if (v[1] !== undefined && v[1] !== prev && c1 !== c2) {
        current = v[1];
      } else if (v[2] !== undefined && v[2] !== prev && c0 !== c2) {
        current = v[2];
      }

      if (current === chain[chain.length - 1]) {
        break;
      }
    }

    // push first vertex as the last one
    chain.push(chain[0]);
    return chain;
  };

  for (const i of cells.indexes) {
    const t = cells.types[i];
    if (t > 0) {
      continue;
    }

    if (used[i] || !limits.includes(t)) {
      continue;
    }

    const start = findStart(i, t);
    if (!start) {
      continue;
    }
    used[i] = 1;

    // vertices chain to form a path
    const chain = connectVertices(start, t);
    if (chain.length < 4) {
      continue;
    }

    // select only n-th point
    const relax = 1 + t * -2;
    const relaxed = chain.filter(
      (v, i) => !(i % relax) || vertices.adjacent[v].some(c => c >= pointsN)
    );

    if (relaxed.length < 4) {
      continue;
    }

    const points: Point[] = clipPoly(
      relaxed.map(v => vertices.coordinates[v]),
      graphWidth,
      graphHeight
    ).map(p => [roundNumber(p[0]), roundNumber(p[1])]);

    chains[t] = Array.isArray(chains[t]) ? [...chains[t], points] : [points];
  }

  return chains;
};
