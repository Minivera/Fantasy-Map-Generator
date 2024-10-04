import Alea from 'alea';
import * as d3 from 'd3-array';

import { Grid } from '../../types/grid.ts';
import { Heightmap } from '../../types/heightmap.ts';
import { Range } from '../../types/probability.ts';
import {
  getNumberInRange,
  probability,
  randomRange,
} from '../../utils/probability.ts';
import { limitTo100 } from '../../utils/math.ts';
import { findGridCell } from '../../utils/grid.ts';

export type HeightmapTool = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  graphWidth: number,
  graphHeight: number,
  blobPower: number,
  linePower: number,
  heightmap: Heightmap
) => Heightmap;

const getPointInRange = (
  randomizer: ReturnType<typeof Alea>,
  range: Range,
  length: number
) => {
  if (typeof range === 'number') {
    return randomRange(randomizer, range * length, range * length);
  }

  const min = Number(range.from) / 100 || 0;
  const max = Number(range.to) / 100 || min;

  return randomRange(randomizer, min * length, max * length);
};

export const hill: (config: {
  count: Range;
  height: Range;
  rangeX: Range;
  rangeY: Range;
}) => HeightmapTool =
  config =>
  (
    randomizer,
    grid,
    graphWidth,
    graphHeight,
    blobPower,
    _linePower,
    heightmap
  ) => {
    let { heights } = heightmap;

    const count = getNumberInRange(randomizer, config.count);
    for (let i = 0; i < count; i++) {
      const change = new Array(heightmap.heights.length).fill(0);
      let limit = 0;
      let start: number;
      const h = limitTo100(getNumberInRange(randomizer, config.height));

      do {
        const x = getPointInRange(randomizer, config.rangeX, graphWidth);
        const y = getPointInRange(randomizer, config.rangeY, graphHeight);
        start = findGridCell(x, y, grid);
        limit++;
      } while (heightmap.heights[start].height + h > 90 && limit < 50);

      change[start] = h;
      const queue = [start];
      while (queue.length) {
        const q = queue.shift() as number;

        for (const c of grid.cells[q].adjacentCells) {
          if (change[c]) {
            continue;
          }

          change[c] = Math.floor(
            change[q] ** blobPower * (randomizer() * 0.2 + 0.9)
          );
          if (change[c] > 1) {
            queue.push(c);
          }
        }
      }

      heights = heights.map((h, i) => ({
        ...h,
        height: limitTo100(h.height + change[i]),
      }));
    }

    return {
      ...heightmap,
      heights,
    };
  };

export const pit: (config: {
  count: Range;
  height: Range;
  rangeX: Range;
  rangeY: Range;
}) => HeightmapTool =
  config =>
  (
    randomizer,
    grid,
    graphWidth,
    graphHeight,
    blobPower,
    _linePower,
    heightmap
  ) => {
    const count = getNumberInRange(randomizer, config.count);
    for (let i = 0; i < count; i++) {
      const used = new Array(heightmap.heights.length).fill(0);
      let limit = 0;
      let start: number;
      let h = limitTo100(getNumberInRange(randomizer, config.height));

      do {
        const x = getPointInRange(randomizer, config.rangeX, graphWidth);
        const y = getPointInRange(randomizer, config.rangeY, graphHeight);
        start = findGridCell(x, y, grid);
        limit++;
      } while (heightmap.heights[start].height < 20 && limit < 50);

      const queue = [start];
      while (queue.length) {
        const q = queue.shift() as number;
        h = Math.floor(h ** blobPower * (randomizer() * 0.2 + 0.9));
        if (h < 1) {
          break;
        }

        grid.cells[q].adjacentCells.forEach(function (c) {
          if (used[c]) {
            return;
          }

          heightmap.heights[c] = {
            ...heightmap.heights[c],
            height: limitTo100(
              Math.floor(
                heightmap.heights[c].height - h * (randomizer() * 0.2 + 0.9)
              )
            ),
          };
          used[c] = 1;
          queue.push(c);
        });
      }
    }

    return heightmap;
  };

export const range: (config: {
  count: Range;
  height: Range;
  rangeX: Range;
  rangeY: Range;
}) => HeightmapTool =
  config =>
  (
    randomizer,
    grid,
    graphWidth,
    graphHeight,
    _blobPower,
    linePower,
    heightmap
  ) => {
    const count = getNumberInRange(randomizer, config.count);
    for (let i = 0; i < count; i++) {
      const used = new Array(heightmap.heights.length).fill(0);
      let h = limitTo100(getNumberInRange(randomizer, config.height));

      // find start and end points
      const startX = getPointInRange(randomizer, config.rangeX, graphWidth);
      const startY = getPointInRange(randomizer, config.rangeY, graphHeight);

      let dist = 0;
      let limit = 0;
      let endX: number;
      let endY: number;

      do {
        endX = randomizer() * graphWidth * 0.8 + graphWidth * 0.1;
        endY = randomizer() * graphHeight * 0.7 + graphHeight * 0.15;
        dist = Math.abs(endY - startY) + Math.abs(endX - startX);
        limit++;
      } while ((dist < graphWidth / 8 || dist > graphWidth / 3) && limit < 50);

      const startCell = findGridCell(startX, startY, grid);
      const endCell = findGridCell(endX, endY, grid);

      // get main ridge
      const getRange = (cur: number, end: number): number[] => {
        const range = [cur];
        const p = grid.points;
        used[cur] = 1;

        while (cur !== end) {
          let min = Infinity;
          grid.cells[cur].adjacentCells.forEach(e => {
            if (used[e]) {
              return;
            }
            let diff = (p[end][0] - p[e][0]) ** 2 + (p[end][1] - p[e][1]) ** 2;
            if (randomizer() > 0.85) {
              diff = diff / 2;
            }
            if (diff < min) {
              min = diff;
              cur = e;
            }
          });
          if (min === Infinity) {
            return range;
          }
          range.push(cur);
          used[cur] = 1;
        }

        return range;
      };

      const range = getRange(startCell, endCell);

      // add height to ridge and cells around
      let queue = range.slice();
      let i = 0;
      while (queue.length) {
        const frontier = queue.slice();
        queue = [];
        i++;

        frontier.forEach(i => {
          heightmap.heights[i].height = limitTo100(
            Math.floor(
              heightmap.heights[i].height + h * (randomizer() * 0.3 + 0.85)
            )
          );
        });

        h = h ** linePower - 1;
        if (h < 2) {
          break;
        }

        frontier.forEach(f => {
          grid.cells[f].adjacentCells.forEach(i => {
            if (!used[i]) {
              queue.push(i);
              used[i] = 1;
            }
          });
        });
      }

      // generate prominences
      range.forEach((cur, d) => {
        if (d % 6 !== 0) {
          return;
        }

        d3.range(i).forEach(() => {
          const min =
            grid.cells[cur].adjacentCells[
              d3.leastIndex(
                grid.cells[cur].adjacentCells,
                (a, b) =>
                  heightmap.heights[a].height - heightmap.heights[b].height
              ) as number
            ]; // downhill cell
          heightmap.heights[min].height = Math.floor(
            (heightmap.heights[cur].height * 2 +
              heightmap.heights[min].height) /
              3
          );
          cur = min;
        });
      });
    }

    return heightmap;
  };

export const through: (config: {
  count: Range;
  height: Range;
  rangeX: Range;
  rangeY: Range;
}) => HeightmapTool =
  config =>
  (
    randomizer,
    grid,
    graphWidth,
    graphHeight,
    _blobPower,
    linePower,
    heightmap
  ) => {
    const count = getNumberInRange(randomizer, config.count);
    for (let i = 0; i < count; i++) {
      const used = new Array(heightmap.heights.length).fill(0);
      let h = limitTo100(getNumberInRange(randomizer, config.height));

      // find start and end points
      let limit = 0;
      let startX: number;
      let startY: number;
      let startCell: number;
      let dist: number = 0;
      let endX: number;
      let endY: number;
      do {
        startX = getPointInRange(randomizer, config.rangeX, graphWidth);
        startY = getPointInRange(randomizer, config.rangeY, graphHeight);
        startCell = findGridCell(startX, startY, grid);
        limit++;
      } while (heightmap.heights[startCell].height < 20 && limit < 50);

      limit = 0;
      do {
        endX = randomizer() * graphWidth * 0.8 + graphWidth * 0.1;
        endY = randomizer() * graphHeight * 0.7 + graphHeight * 0.15;
        dist = Math.abs(endY - startY) + Math.abs(endX - startX);
        limit++;
      } while ((dist < graphWidth / 8 || dist > graphWidth / 2) && limit < 50);

      const endCell = findGridCell(endX, endY, grid);

      // get main ridge
      const getRange = (cur: number, end: number): number[] => {
        const range = [cur];
        const p = grid.points;
        used[cur] = 1;

        while (cur !== end) {
          let min = Infinity;
          grid.cells[cur].adjacentCells.forEach(e => {
            if (used[e]) {
              return;
            }
            let diff = (p[end][0] - p[e][0]) ** 2 + (p[end][1] - p[e][1]) ** 2;
            if (randomizer() > 0.8) {
              diff = diff / 2;
            }
            if (diff < min) {
              min = diff;
              cur = e;
            }
          });

          if (min === Infinity) {
            return range;
          }

          range.push(cur);
          used[cur] = 1;
        }

        return range;
      };

      const range = getRange(startCell, endCell);

      // add height to ridge and cells around
      let queue = range.slice();
      let i = 0;
      while (queue.length) {
        const frontier = queue.slice();
        queue = [];
        i++;

        frontier.forEach(i => {
          heightmap.heights[i].height = limitTo100(
            Math.floor(
              heightmap.heights[i].height - h * (randomizer() * 0.3 + 0.85)
            )
          );
        });

        h = h ** linePower - 1;
        if (h < 2) {
          break;
        }

        frontier.forEach(f => {
          grid.cells[f].adjacentCells.forEach(i => {
            if (!used[i]) {
              queue.push(i);
              used[i] = 1;
            }
          });
        });
      }

      // generate prominences
      range.forEach((cur, d) => {
        if (d % 6 !== 0) {
          return;
        }

        d3.range(i).forEach(() => {
          const min =
            grid.cells[cur].adjacentCells[
              d3.leastIndex(
                grid.cells[cur].adjacentCells,
                (a, b) =>
                  heightmap.heights[a].height - heightmap.heights[b].height
              ) as number
            ]; // downhill cell
          heightmap.heights[min].height = Math.floor(
            (heightmap.heights[cur].height * 2 +
              heightmap.heights[min].height) /
              3
          );
          cur = min;
        });
      });
    }

    return heightmap;
  };

export const strait: (config: {
  width: Range;
  direction: 'vertical' | 'horizontal';
}) => HeightmapTool =
  config =>
  (
    randomizer,
    grid,
    graphWidth,
    graphHeight,
    _blobPower,
    _linePower,
    heightmap
  ) => {
    const width = Math.min(
      getNumberInRange(randomizer, config.width),
      grid.cellsX / 3
    );
    if (width < 1 && probability(randomizer, width)) {
      return heightmap;
    }

    const used = new Array(heightmap.heights.length).fill(0);
    const vert = config.direction === 'vertical';
    const startX = vert
      ? Math.floor(randomizer() * graphWidth * 0.4 + graphWidth * 0.3)
      : 5;
    const startY = vert
      ? 5
      : Math.floor(randomizer() * graphHeight * 0.4 + graphHeight * 0.3);
    const endX = vert
      ? Math.floor(
          graphWidth -
            startX -
            graphWidth * 0.1 +
            randomizer() * graphWidth * 0.2
        )
      : graphWidth - 5;
    const endY = vert
      ? graphHeight - 5
      : Math.floor(
          graphHeight -
            startY -
            graphHeight * 0.1 +
            randomizer() * graphHeight * 0.2
        );

    const getRange = (cur: number, end: number): number[] => {
      const range = [];
      const p = grid.points;

      while (cur !== end) {
        let min = Infinity;
        grid.cells[cur].adjacentCells.forEach(e => {
          let diff = (p[end][0] - p[e][0]) ** 2 + (p[end][1] - p[e][1]) ** 2;
          if (randomizer() > 0.8) {
            diff = diff / 2;
          }
          if (diff < min) {
            min = diff;
            cur = e;
          }
        });
        range.push(cur);
      }

      return range;
    };

    const start = findGridCell(startX, startY, grid);
    const end = findGridCell(endX, endY, grid);
    let range = getRange(start, end);
    const query: number[] = [];

    const currentStep = 0.1 / width;

    for (let i = width; i > 0; i--) {
      const exp = 0.9 - currentStep * width;
      range.forEach(r => {
        grid.cells[r].adjacentCells.forEach(e => {
          if (used[e]) {
            return;
          }

          used[e] = 1;
          query.push(e);
          heightmap.heights[e].height = Math.floor(
            heightmap.heights[e].height ** exp
          );

          if (heightmap.heights[e].height > 100) {
            heightmap.heights[e].height = 5;
          }
        });
      });
      range = query.slice();
    }

    return heightmap;
  };

export const add: (config: {
  add: number;
  range: Range | 'all';
}) => HeightmapTool =
  config =>
  (
    _randomizer,
    _grid,
    _graphWidth,
    _graphHeight,
    _blobPower,
    _linePower,
    heightmap
  ) => {
    let min = 0;
    let max = 0;
    if (config.range === 'all') {
      min = 0;
      max = 100;
    } else if (typeof config.range === 'number') {
      min = max = config.range;
    } else {
      min = config.range.from;
      max = config.range.to;
    }

    const isLand = min === 20;

    heightmap.heights = heightmap.heights.map(h => {
      if (h.height < min || h.height > max) {
        return { ...h };
      }

      return {
        ...h,
        height: limitTo100(
          isLand ? Math.max(h.height + config.add, 20) : h.height + config.add
        ),
      };
    });

    return heightmap;
  };

export const multiply: (config: {
  multiplier: number;
  range: Range | 'land';
}) => HeightmapTool =
  config =>
  (
    _randomizer,
    _grid,
    _graphWidth,
    _graphHeight,
    _blobPower,
    _linePower,
    heightmap
  ) => {
    let min = 0;
    let max = 0;
    if (config.range === 'land') {
      min = 20;
      max = 100;
    } else if (typeof config.range === 'number') {
      min = max = config.range;
    } else {
      min = config.range.from;
      max = config.range.to;
    }

    const isLand = min === 20;

    heightmap.heights = heightmap.heights.map(h => {
      if (h.height < min || h.height > max) {
        return { ...h };
      }

      let val = h.height;
      if (config.multiplier !== 1) {
        val = Math.floor(
          isLand ? (val - 20) * config.multiplier + 20 : val * config.multiplier
        );
      }
      return {
        ...h,
        height: limitTo100(val),
      };
    });

    return heightmap;
  };

export const smooth: (config: { power: number }) => HeightmapTool =
  config =>
  (
    _randomizer,
    grid,
    _graphWidth,
    _graphHeight,
    _blobPower,
    _linePower,
    heightmap
  ) => {
    heightmap.heights = heightmap.heights.map((h, i) => {
      const a = [h.height];
      grid.cells[i].adjacentCells.forEach(c =>
        a.push(heightmap.heights[c].height)
      );
      if (config.power === 1) {
        return { ...h, height: d3.mean(a) as number };
      }

      return {
        ...h,
        height: limitTo100(
          Math.floor(
            (h.height * (config.power - 1) + (d3.mean(a) as number)) /
              config.power
          )
        ),
      };
    });

    return heightmap;
  };

export const mask: (config: { power: number }) => HeightmapTool =
  config =>
  (
    _randomizer,
    grid,
    graphWidth,
    graphHeight,
    _blobPower,
    _linePower,
    heightmap
  ) => {
    const factor = config.power ? Math.abs(config.power) : 1;

    heightmap.heights = heightmap.heights.map((h, i) => {
      const [x, y] = grid.points[i];
      // [-1, 1], 0 is center
      const nx = (2 * x) / graphWidth - 1;
      // [-1, 1], 0 is center
      const ny = (2 * y) / graphHeight - 1;
      // 1 is center, 0 is edge
      let distance = (1 - nx ** 2) * (1 - ny ** 2);

      // inverted, 0 is center, 1 is edge
      if (config.power < 0) {
        distance = 1 - distance;
      }

      const masked = h.height * distance;
      return {
        ...h,
        height: limitTo100(
          Math.floor((h.height * (factor - 1) + masked) / factor)
        ),
      };
    });

    return heightmap;
  };

export const invert: (config: {
  count: number;
  axes: 'both' | 'x' | 'y';
}) => HeightmapTool =
  config =>
  (
    randomizer,
    grid,
    _graphWidth,
    _graphHeight,
    _blobPower,
    _linePower,
    heightmap
  ) => {
    if (!probability(randomizer, config.count)) {
      return heightmap;
    }

    const invertX = config.axes !== 'y';
    const invertY = config.axes !== 'x';
    const { cellsX, cellsY } = grid;

    heightmap.heights = heightmap.heights.map((_, i) => {
      const x = i % cellsX;
      const y = Math.floor(i / cellsX);

      const nx = invertX ? cellsX - x - 1 : x;
      const ny = invertY ? cellsY - y - 1 : y;
      const invertedI = nx + ny * cellsX;
      return { ...heightmap.heights[invertedI] };
    });

    return heightmap;
  };
