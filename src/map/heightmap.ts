import Alea from 'alea';
import * as d3 from 'd3-array';

import { createTypedArray } from '../utils/arrays.ts';
import {
  getNumberInRange,
  probability,
  randomRange,
} from '../utils/probability.ts';
import { limitTo100 } from '../utils/math.ts';
import {
  HeightmapAddTool,
  HeightmapHillTool,
  HeightmapInvertTool,
  HeightmapMaskTool,
  HeightmapMultiplyTool,
  HeightmapPitTool,
  HeightmapRangeTool,
  HeightmapSmoothTool,
  HeightmapStraitTool,
  HeightmapTemplate,
  HeightmapToolType,
  HeightmapTroughTool,
} from '../data/heightmapTemplates.ts';
import { Range } from '../types/probability.ts';
import { Grid } from '../types/grid.ts';

import { findGridCell } from './grid.ts';

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

const addHill = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  graphWidth: number,
  graphHeight: number,
  heights: Uint8Array | Uint16Array | Uint32Array,
  blobPower: number,
  step: HeightmapHillTool
): Uint8Array | Uint16Array | Uint32Array => {
  const count = getNumberInRange(randomizer, step.count);
  for (let i = 0; i < count; i++) {
    const change = new Uint8Array(heights.length);
    let limit = 0;
    let start: number;
    const h = limitTo100(getNumberInRange(randomizer, step.height));

    do {
      const x = getPointInRange(randomizer, step.rangeX, graphWidth);
      const y = getPointInRange(randomizer, step.rangeY, graphHeight);
      start = findGridCell(x, y, grid);
      limit++;
    } while (heights[start] + h > 90 && limit < 50);

    change[start] = h;
    const queue = [start];
    while (queue.length) {
      const q = queue.shift() as number;

      for (const c of grid.cells.adjacentCells[q]) {
        if (change[c]) {
          continue;
        }

        change[c] = change[q] ** blobPower * (Math.random() * 0.2 + 0.9);
        if (change[c] > 1) {
          queue.push(c);
        }
      }
    }

    heights = heights.map((h, i) => limitTo100(h + change[i]));
  }

  return heights;
};

const addPit = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  graphWidth: number,
  graphHeight: number,
  heights: Uint8Array | Uint16Array | Uint32Array,
  blobPower: number,
  step: HeightmapPitTool
): Uint8Array | Uint16Array | Uint32Array => {
  const count = getNumberInRange(randomizer, step.count);
  for (let i = 0; i < count; i++) {
    const used = new Uint8Array(heights.length);
    let limit = 0;
    let start: number;
    let h = limitTo100(getNumberInRange(randomizer, step.height));

    do {
      const x = getPointInRange(randomizer, step.rangeX, graphWidth);
      const y = getPointInRange(randomizer, step.rangeY, graphHeight);
      start = findGridCell(x, y, grid);
      limit++;
    } while (heights[start] < 20 && limit < 50);

    const queue = [start];
    while (queue.length) {
      const q = queue.shift() as number;
      h = h ** blobPower * (Math.random() * 0.2 + 0.9);
      if (h < 1) {
        break;
      }

      grid.cells.adjacentCells[q].forEach(function (c) {
        if (used[c]) {
          return;
        }

        heights[c] = limitTo100(heights[c] - h * (Math.random() * 0.2 + 0.9));
        used[c] = 1;
        queue.push(c);
      });
    }
  }

  return heights;
};

const addRange = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  graphWidth: number,
  graphHeight: number,
  heights: Uint8Array | Uint16Array | Uint32Array,
  linePower: number,
  step: HeightmapRangeTool
): Uint8Array | Uint16Array | Uint32Array => {
  const count = getNumberInRange(randomizer, step.count);
  for (let i = 0; i < count; i++) {
    const used = new Uint8Array(heights.length);
    let h = limitTo100(getNumberInRange(randomizer, step.height));

    // find start and end points
    const startX = getPointInRange(randomizer, step.rangeX, graphWidth);
    const startY = getPointInRange(randomizer, step.rangeY, graphHeight);

    let dist = 0;
    let limit = 0;
    let endX: number;
    let endY: number;

    do {
      endX = Math.random() * graphWidth * 0.8 + graphWidth * 0.1;
      endY = Math.random() * graphHeight * 0.7 + graphHeight * 0.15;
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
        grid.cells.adjacentCells[cur].forEach(e => {
          if (used[e]) {
            return;
          }
          let diff = (p[end][0] - p[e][0]) ** 2 + (p[end][1] - p[e][1]) ** 2;
          if (Math.random() > 0.85) {
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
        heights[i] = limitTo100(heights[i] + h * (Math.random() * 0.3 + 0.85));
      });

      h = h ** linePower - 1;
      if (h < 2) {
        break;
      }

      frontier.forEach(f => {
        grid.cells.adjacentCells[f].forEach(i => {
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
      for (const _ of d3.range(i)) {
        const min =
          grid.cells.adjacentCells[cur][
            d3.leastIndex(
              grid.cells.adjacentCells[cur],
              (a, b) => heights[a] - heights[b]
            ) as number
          ]; // downhill cell
        heights[min] = (heights[cur] * 2 + heights[min]) / 3;
        cur = min;
      }
    });
  }

  return heights;
};

const addTrough = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  graphWidth: number,
  graphHeight: number,
  heights: Uint8Array | Uint16Array | Uint32Array,
  linePower: number,
  step: HeightmapTroughTool
): Uint8Array | Uint16Array | Uint32Array => {
  const count = getNumberInRange(randomizer, step.count);
  for (let i = 0; i < count; i++) {
    const used = new Uint8Array(heights.length);
    let h = limitTo100(getNumberInRange(randomizer, step.height));

    // find start and end points
    let limit = 0;
    let startX: number;
    let startY: number;
    let startCell: number;
    let dist: number = 0;
    let endX: number;
    let endY: number;
    do {
      startX = getPointInRange(randomizer, step.rangeX, graphWidth);
      startY = getPointInRange(randomizer, step.rangeY, graphHeight);
      startCell = findGridCell(startX, startY, grid);
      limit++;
    } while (heights[startCell] < 20 && limit < 50);

    limit = 0;
    do {
      endX = Math.random() * graphWidth * 0.8 + graphWidth * 0.1;
      endY = Math.random() * graphHeight * 0.7 + graphHeight * 0.15;
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
        grid.cells.adjacentCells[cur].forEach(function (e) {
          if (used[e]) {
            return;
          }
          let diff = (p[end][0] - p[e][0]) ** 2 + (p[end][1] - p[e][1]) ** 2;
          if (Math.random() > 0.8) {
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
        heights[i] = limitTo100(heights[i] - h * (Math.random() * 0.3 + 0.85));
      });

      h = h ** linePower - 1;
      if (h < 2) {
        break;
      }

      frontier.forEach(f => {
        grid.cells.adjacentCells[f].forEach(i => {
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
      for (const _ of d3.range(i)) {
        const min =
          grid.cells.adjacentCells[cur][
            d3.leastIndex(
              grid.cells.adjacentCells[cur],
              (a, b) => heights[a] - heights[b]
            ) as number
          ]; // downhill cell
        heights[min] = (heights[cur] * 2 + heights[min]) / 3;
        cur = min;
      }
    });
  }

  return heights;
};

const addStrait = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  graphWidth: number,
  graphHeight: number,
  heights: Uint8Array | Uint16Array | Uint32Array,
  step: HeightmapStraitTool
): Uint8Array | Uint16Array | Uint32Array => {
  const width = Math.min(
    getNumberInRange(randomizer, step.width),
    grid.cellsX / 3
  );
  if (width < 1 && probability(randomizer, width)) {
    return heights;
  }

  const used = new Uint8Array(heights.length);
  const vert = step.direction === 'vertical';
  const startX = vert
    ? Math.floor(Math.random() * graphWidth * 0.4 + graphWidth * 0.3)
    : 5;
  const startY = vert
    ? 5
    : Math.floor(Math.random() * graphHeight * 0.4 + graphHeight * 0.3);
  const endX = vert
    ? Math.floor(
        graphWidth -
          startX -
          graphWidth * 0.1 +
          Math.random() * graphWidth * 0.2
      )
    : graphWidth - 5;
  const endY = vert
    ? graphHeight - 5
    : Math.floor(
        graphHeight -
          startY -
          graphHeight * 0.1 +
          Math.random() * graphHeight * 0.2
      );

  const getRange = (cur: number, end: number): number[] => {
    const range = [];
    const p = grid.points;

    while (cur !== end) {
      let min = Infinity;
      grid.cells.adjacentCells[cur].forEach(e => {
        let diff = (p[end][0] - p[e][0]) ** 2 + (p[end][1] - p[e][1]) ** 2;
        if (Math.random() > 0.8) {
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
      grid.cells.adjacentCells[r].forEach(e => {
        if (used[e]) {
          return;
        }

        used[e] = 1;
        query.push(e);
        heights[e] **= exp;

        if (heights[e] > 100) {
          heights[e] = 5;
        }
      });
    });
    range = query.slice();
  }

  return heights;
};

const modify = (
  heights: Uint8Array | Uint16Array | Uint32Array,
  step: HeightmapAddTool | HeightmapMultiplyTool
): Uint8Array | Uint16Array | Uint32Array => {
  let min = 0;
  let max = 0;
  if (step.range === 'land') {
    min = 20;
    max = 100;
  } else if (step.range === 'all') {
    min = 0;
    max = 100;
  } else if (typeof step.range === 'number') {
    min = max = step.range;
  } else {
    min = step.range.from;
    max = step.range.to;
  }

  const isLand = min === 20;

  return heights.map(h => {
    if (h < min || h > max) {
      return h;
    }

    if ((step as HeightmapAddTool).add) {
      h = isLand
        ? Math.max(h + (step as HeightmapAddTool).add, 20)
        : h + (step as HeightmapAddTool).add;
    }
    if ((step as HeightmapMultiplyTool).multiplier !== 1) {
      h = isLand
        ? (h - 20) * (step as HeightmapMultiplyTool).multiplier + 20
        : h * (step as HeightmapMultiplyTool).multiplier;
    }
    return limitTo100(h);
  });
};

const smooth = (
  grid: Grid,
  heights: Uint8Array | Uint16Array | Uint32Array,
  step: HeightmapSmoothTool
): Uint8Array | Uint16Array | Uint32Array => {
  return heights.map((h, i) => {
    const a = [h];
    grid.cells.adjacentCells[i].forEach(c => a.push(heights[c]));
    if (step.power === 1) {
      return d3.mean(a) as number;
    }

    return limitTo100(
      (h * (step.power - 1) + (d3.mean(a) as number)) / step.power
    );
  });
};

const mask = (
  grid: Grid,
  graphWidth: number,
  graphHeight: number,
  heights: Uint8Array | Uint16Array | Uint32Array,
  step: HeightmapMaskTool
): Uint8Array | Uint16Array | Uint32Array => {
  const factor = step.power ? Math.abs(step.power) : 1;

  return heights.map((h, i) => {
    const [x, y] = grid.points[i];
    // [-1, 1], 0 is center
    const nx = (2 * x) / graphWidth - 1;
    // [-1, 1], 0 is center
    const ny = (2 * y) / graphHeight - 1;
    // 1 is center, 0 is edge
    let distance = (1 - nx ** 2) * (1 - ny ** 2);

    // inverted, 0 is center, 1 is edge
    if (step.power < 0) {
      distance = 1 - distance;
    }

    const masked = h * distance;
    return limitTo100((h * (factor - 1) + masked) / factor);
  });
};

const invert = (
  randomizer: ReturnType<typeof Alea>,
  grid: Grid,
  heights: Uint8Array | Uint16Array | Uint32Array,
  step: HeightmapInvertTool
): Uint8Array | Uint16Array | Uint32Array => {
  if (!probability(randomizer, step.count)) {
    return heights;
  }

  const invertX = step.axes !== 'y';
  const invertY = step.axes !== 'x';
  const { cellsX, cellsY } = grid;

  return heights.map((_, i) => {
    const x = i % cellsX;
    const y = Math.floor(i / cellsX);

    const nx = invertX ? cellsX - x - 1 : x;
    const ny = invertY ? cellsY - y - 1 : y;
    const invertedI = nx + ny * cellsX;
    return heights[invertedI];
  });
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
) => {
  const { cells, points } = grid;

  const heights = cells.heights
    ? Uint8Array.from(cells.heights)
    : createTypedArray({ maxValue: 100, length: points.length });
  const blobPower = getBlobPower(options.cellsToGenerate);
  const linePower = getLinePower(options.cellsToGenerate);

  return template.steps.reduce((heights, step) => {
    switch (step.tool) {
      case HeightmapToolType.HILL:
        return addHill(
          randomizer,
          grid,
          options.graphWidth,
          options.graphHeight,
          heights,
          blobPower,
          step
        );
      case HeightmapToolType.PIT:
        return addPit(
          randomizer,
          grid,
          options.graphWidth,
          options.graphHeight,
          heights,
          blobPower,
          step
        );
      case HeightmapToolType.RANGE:
        return addRange(
          randomizer,
          grid,
          options.graphWidth,
          options.graphHeight,
          heights,
          linePower,
          step
        );
      case HeightmapToolType.TROUGH:
        return addTrough(
          randomizer,
          grid,
          options.graphWidth,
          options.graphHeight,
          heights,
          linePower,
          step
        );
      case HeightmapToolType.STRAIT:
        return addStrait(
          randomizer,
          grid,
          options.graphWidth,
          options.graphHeight,
          heights,
          step
        );
      case HeightmapToolType.MASK:
        return mask(
          grid,
          options.graphWidth,
          options.graphHeight,
          heights,
          step
        );
      case HeightmapToolType.INVERT:
        return invert(randomizer, grid, heights, step);
      case HeightmapToolType.ADD:
        return modify(heights, step);
      case HeightmapToolType.MULTIPLY:
        return modify(heights, step);
      case HeightmapToolType.SMOOTH:
        return smooth(grid, heights, step);
      default:
        return heights;
    }
  }, heights);
};

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
  return fromTemplate(randomizer, grid, template, options);
};
