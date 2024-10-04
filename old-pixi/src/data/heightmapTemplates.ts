import { Range } from '../types/probability.ts';

export enum HeightmapToolType {
  HILL = 'hill',
  PIT = 'pit',
  RANGE = 'range',
  TROUGH = 'trough',
  STRAIT = 'strait',
  MASK = 'mask',
  INVERT = 'invert',
  ADD = 'add',
  MULTIPLY = 'multiply',
  SMOOTH = 'smooth',
}

export interface HeightmapHillTool {
  tool: HeightmapToolType.HILL;
  count: Range;
  height: Range;
  rangeX: Range;
  rangeY: Range;
}

export interface HeightmapPitTool {
  tool: HeightmapToolType.PIT;
  count: Range;
  height: Range;
  rangeX: Range;
  rangeY: Range;
}

export interface HeightmapRangeTool {
  tool: HeightmapToolType.RANGE;
  count: Range;
  height: Range;
  rangeX: Range;
  rangeY: Range;
}

export interface HeightmapTroughTool {
  tool: HeightmapToolType.TROUGH;
  count: Range;
  height: Range;
  rangeX: Range;
  rangeY: Range;
}

export interface HeightmapStraitTool {
  tool: HeightmapToolType.STRAIT;
  width: Range;
  direction: 'vertical' | 'horizontal';
}

export interface HeightmapMaskTool {
  tool: HeightmapToolType.MASK;
  power: number;
}

export interface HeightmapInvertTool {
  tool: HeightmapToolType.INVERT;
  count: number;
  axes: 'both' | 'x' | 'y';
}

export interface HeightmapAddTool {
  tool: HeightmapToolType.ADD;
  add: number;
  range: Range | 'all';
}

export interface HeightmapMultiplyTool {
  tool: HeightmapToolType.MULTIPLY;
  multiplier: number;
  range: Range | 'land';
}

export interface HeightmapSmoothTool {
  tool: HeightmapToolType.SMOOTH;
  power: number;
}

export type HeightmapTool =
  | HeightmapHillTool
  | HeightmapPitTool
  | HeightmapRangeTool
  | HeightmapTroughTool
  | HeightmapStraitTool
  | HeightmapMaskTool
  | HeightmapInvertTool
  | HeightmapAddTool
  | HeightmapMultiplyTool
  | HeightmapSmoothTool;

export interface HeightmapTemplate {
  id: number;
  name: string;
  steps: HeightmapTool[];
  probability: number;
}

export const heightmapTemplates = {
  volcano: {
    id: 0,
    name: 'Volcano',
    steps: [
      {
        tool: HeightmapToolType.HILL,
        count: 1,
        height: { from: 90, to: 100 },
        rangeX: { from: 44, to: 56 },
        rangeY: { from: 40, to: 60 },
      },
      {
        tool: HeightmapToolType.MULTIPLY,
        multiplier: 0.8,
        range: { from: 50, to: 100 },
      },
      {
        tool: HeightmapToolType.RANGE,
        count: 1.5,
        height: { from: 30, to: 55 },
        rangeX: { from: 45, to: 55 },
        rangeY: { from: 40, to: 60 },
      },
      {
        tool: HeightmapToolType.SMOOTH,
        power: 3,
      },
      {
        tool: HeightmapToolType.HILL,
        count: 1.5,
        height: { from: 35, to: 45 },
        rangeX: { from: 25, to: 30 },
        rangeY: { from: 20, to: 75 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 1,
        height: { from: 35, to: 55 },
        rangeX: { from: 75, to: 80 },
        rangeY: { from: 25, to: 75 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 0.5,
        height: { from: 20, to: 25 },
        rangeX: { from: 10, to: 15 },
        rangeY: { from: 20, to: 25 },
      },
      {
        tool: HeightmapToolType.MASK,
        power: 3,
      },
    ],
    probability: 3,
  },
  highIsland: {
    id: 1,
    name: 'High Island',
    steps: [
      {
        tool: HeightmapToolType.HILL,
        count: 1,
        height: { from: 90, to: 100 },
        rangeX: { from: 65, to: 75 },
        rangeY: { from: 47, to: 53 },
      },
      {
        tool: HeightmapToolType.ADD,
        add: 7,
        range: 'all',
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 5, to: 6 },
        height: { from: 20, to: 30 },
        rangeX: { from: 25, to: 55 },
        rangeY: { from: 45, to: 55 },
      },
      {
        tool: HeightmapToolType.RANGE,
        count: 1,
        height: { from: 40, to: 50 },
        rangeX: { from: 45, to: 55 },
        rangeY: { from: 45, to: 55 },
      },
      { tool: HeightmapToolType.MULTIPLY, multiplier: 0.8, range: 'land' },
      { tool: HeightmapToolType.MASK, power: 3 },
      { tool: HeightmapToolType.SMOOTH, power: 2 },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 2, to: 3 },
        height: { from: 20, to: 30 },
        rangeX: { from: 20, to: 30 },
        rangeY: { from: 20, to: 30 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 2, to: 3 },
        height: { from: 20, to: 30 },
        rangeX: { from: 60, to: 80 },
        rangeY: { from: 70, to: 80 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 1,
        height: { from: 10, to: 15 },
        rangeX: { from: 60, to: 60 },
        rangeY: { from: 50, to: 50 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 1.5,
        height: { from: 13, to: 16 },
        rangeX: { from: 15, to: 20 },
        rangeY: { from: 20, to: 75 },
      },
      {
        tool: HeightmapToolType.RANGE,
        count: 1.5,
        height: { from: 30, to: 40 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 30, to: 40 },
      },
      {
        tool: HeightmapToolType.RANGE,
        count: 1.5,
        height: { from: 30, to: 40 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 60, to: 70 },
      },
      {
        tool: HeightmapToolType.PIT,
        count: { from: 3, to: 5 },
        height: { from: 10, to: 30 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 20, to: 80 },
      },
    ],
    probability: 19,
  },
  lowIsland: {
    id: 2,
    name: 'Low Island',
    steps: [
      {
        tool: HeightmapToolType.HILL,
        count: 1,
        height: { from: 90, to: 99 },
        rangeX: { from: 60, to: 80 },
        rangeY: { from: 45, to: 55 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 1, to: 2 },
        height: { from: 20, to: 30 },
        rangeX: { from: 10, to: 30 },
        rangeY: { from: 10, to: 90 },
      },
      { tool: HeightmapToolType.SMOOTH, power: 2 },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 6, to: 7 },
        height: { from: 25, to: 35 },
        rangeX: { from: 20, to: 70 },
        rangeY: { from: 30, to: 70 },
      },
      {
        tool: HeightmapToolType.RANGE,
        count: 1,
        height: { from: 40, to: 50 },
        rangeX: { from: 45, to: 55 },
        rangeY: { from: 45, to: 55 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 2, to: 3 },
        height: { from: 20, to: 30 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 20, to: 30 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 2, to: 3 },
        height: { from: 20, to: 30 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 70, to: 80 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 1.5,
        height: { from: 10, to: 15 },
        rangeX: { from: 5, to: 15 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 1,
        height: { from: 10, to: 15 },
        rangeX: { from: 85, to: 95 },
        rangeY: { from: 70, to: 80 },
      },
      {
        tool: HeightmapToolType.PIT,
        count: { from: 5, to: 7 },
        height: { from: 15, to: 20 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.MULTIPLY,
        multiplier: 0.4,
        range: { from: 20, to: 100 },
      },
      { tool: HeightmapToolType.MASK, power: 4 },
    ],
    probability: 9,
  },
  continents: {
    id: 3,
    name: 'Continents',
    steps: [
      {
        tool: HeightmapToolType.HILL,
        count: 1,
        height: { from: 80, to: 85 },
        rangeX: { from: 60, to: 80 },
        rangeY: { from: 40, to: 60 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 1,
        height: { from: 80, to: 85 },
        rangeX: { from: 20, to: 30 },
        rangeY: { from: 40, to: 60 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 6, to: 7 },
        height: { from: 15, to: 30 },
        rangeX: { from: 25, to: 75 },
        rangeY: { from: 15, to: 85 },
      },
      { tool: HeightmapToolType.MULTIPLY, multiplier: 0.6, range: 'land' },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 8, to: 10 },
        height: { from: 5, to: 10 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.RANGE,
        count: { from: 1, to: 2 },
        height: { from: 30, to: 60 },
        rangeX: { from: 5, to: 15 },
        rangeY: { from: 25, to: 75 },
      },
      {
        tool: HeightmapToolType.RANGE,
        count: { from: 1, to: 2 },
        height: { from: 30, to: 60 },
        rangeX: { from: 80, to: 95 },
        rangeY: { from: 25, to: 75 },
      },
      {
        tool: HeightmapToolType.RANGE,
        count: { from: 0, to: 3 },
        height: { from: 30, to: 60 },
        rangeX: { from: 80, to: 90 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.STRAIT,
        width: 2,
        direction: 'vertical',
      },
      { tool: HeightmapToolType.STRAIT, width: 1, direction: 'vertical' },
      { tool: HeightmapToolType.SMOOTH, power: 3 },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 3, to: 4 },
        height: { from: 15, to: 20 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 3, to: 4 },
        height: { from: 5, to: 10 },
        rangeX: { from: 45, to: 55 },
        rangeY: { from: 45, to: 55 },
      },
      {
        tool: HeightmapToolType.PIT,
        count: { from: 3, to: 4 },
        height: { from: 10, to: 20 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 20, to: 80 },
      },
      { tool: HeightmapToolType.MASK, power: 4 },
    ],
    probability: 16,
  },
  archipelago: {
    id: 4,
    name: 'Archipelago',
    steps: [
      { tool: HeightmapToolType.ADD, add: 11, range: 'all' },
      {
        tool: HeightmapToolType.RANGE,
        count: { from: 2, to: 3 },
        height: { from: 40, to: 60 },
        rangeX: { from: 20, to: 80 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 5,
        height: { from: 15, to: 20 },
        rangeX: { from: 10, to: 90 },
        rangeY: { from: 30, to: 70 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 2,
        height: { from: 10, to: 15 },
        rangeX: { from: 10, to: 30 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 2,
        height: { from: 10, to: 15 },
        rangeX: { from: 60, to: 90 },
        rangeY: { from: 20, to: 80 },
      },
      { tool: HeightmapToolType.SMOOTH, power: 3 },
      {
        tool: HeightmapToolType.TROUGH,
        count: 10,
        height: { from: 20, to: 30 },
        rangeX: { from: 5, to: 95 },
        rangeY: { from: 5, to: 95 },
      },
      { tool: HeightmapToolType.STRAIT, width: 2, direction: 'vertical' },
      { tool: HeightmapToolType.STRAIT, width: 2, direction: 'horizontal' },
    ],
    probability: 18,
  },
  atoll: {
    id: 5,
    name: 'Atoll',
    steps: [
      {
        tool: HeightmapToolType.HILL,
        count: 1,
        height: { from: 75, to: 80 },
        rangeX: { from: 50, to: 60 },
        rangeY: { from: 45, to: 55 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 1.5,
        height: { from: 30, to: 50 },
        rangeX: { from: 25, to: 75 },
        rangeY: { from: 30, to: 70 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 0.5,
        height: { from: 30, to: 50 },
        rangeX: { from: 25, to: 35 },
        rangeY: { from: 30, to: 70 },
      },
      { tool: HeightmapToolType.SMOOTH, power: 1 },
      {
        tool: HeightmapToolType.MULTIPLY,
        multiplier: 0.2,
        range: { from: 25, to: 100 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: 0.5,
        height: { from: 10, to: 20 },
        rangeX: { from: 50, to: 55 },
        rangeY: { from: 48, to: 52 },
      },
    ],
    probability: 1,
  },
  mediterranean: {
    id: 6,
    name: 'Mediterranean',
    steps: [
      {
        tool: HeightmapToolType.RANGE,
        count: { from: 4, to: 6 },
        height: { from: 30, to: 80 },
        rangeX: { from: 0, to: 100 },
        rangeY: { from: 0, to: 10 },
      },
      {
        tool: HeightmapToolType.RANGE,
        count: { from: 4, to: 6 },
        height: { from: 30, to: 80 },
        rangeX: { from: 0, to: 100 },
        rangeY: { from: 90, to: 100 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 6, to: 8 },
        height: { from: 30, to: 50 },
        rangeX: { from: 10, to: 90 },
        rangeY: { from: 0, to: 5 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 6, to: 8 },
        height: { from: 30, to: 50 },
        rangeX: { from: 10, to: 90 },
        rangeY: { from: 95, to: 100 },
      },
      { tool: HeightmapToolType.MULTIPLY, multiplier: 0.9, range: 'land' },
      { tool: HeightmapToolType.MASK, power: -2 },
      { tool: HeightmapToolType.SMOOTH, power: 1 },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 2, to: 3 },
        height: { from: 30, to: 70 },
        rangeX: { from: 0, to: 5 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 2, to: 3 },
        height: { from: 30, to: 70 },
        rangeX: { from: 95, to: 100 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 3, to: 5 },
        height: { from: 40, to: 50 },
        rangeX: { from: 0, to: 100 },
        rangeY: { from: 0, to: 10 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 3, to: 5 },
        height: { from: 40, to: 50 },
        rangeX: { from: 0, to: 100 },
        rangeY: { from: 90, to: 100 },
      },
    ],
    probability: 5,
  },
  peninsula: {
    id: 7,
    name: 'Peninsula',
    steps: [
      {
        tool: HeightmapToolType.RANGE,
        count: { from: 2, to: 3 },
        height: { from: 20, to: 35 },
        rangeX: { from: 40, to: 50 },
        rangeY: { from: 0, to: 15 },
      },
      { tool: HeightmapToolType.ADD, add: 5, range: 'all' },
      {
        tool: HeightmapToolType.HILL,
        count: 1,
        height: { from: 90, to: 100 },
        rangeX: { from: 10, to: 90 },
        rangeY: { from: 0, to: 5 },
      },
      { tool: HeightmapToolType.ADD, add: 13, range: 'all' },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 3, to: 4 },
        height: { from: 3, to: 5 },
        rangeX: { from: 5, to: 95 },
        rangeY: { from: 80, to: 100 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 1, to: 2 },
        height: { from: 3, to: 5 },
        rangeX: { from: 5, to: 95 },
        rangeY: { from: 40, to: 60 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 5, to: 6 },
        height: { from: 10, to: 25 },
        rangeX: { from: 5, to: 95 },
        rangeY: { from: 5, to: 95 },
      },
      { tool: HeightmapToolType.SMOOTH, power: 3 },
      { tool: HeightmapToolType.INVERT, count: 0.4, axes: 'both' },
    ],
    probability: 3,
  },
  pangea: {
    id: 8,
    name: 'Pangea',
    steps: [
      {
        tool: HeightmapToolType.HILL,
        count: { from: 1, to: 2 },
        height: { from: 25, to: 40 },
        rangeX: { from: 15, to: 50 },
        rangeY: { from: 0, to: 10 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 1, to: 2 },
        height: { from: 5, to: 40 },
        rangeX: { from: 50, to: 85 },
        rangeY: { from: 0, to: 10 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 1, to: 2 },
        height: { from: 25, to: 40 },
        rangeX: { from: 50, to: 85 },
        rangeY: { from: 90, to: 100 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 1, to: 2 },
        height: { from: 5, to: 40 },
        rangeX: { from: 15, to: 50 },
        rangeY: { from: 90, to: 100 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 8, to: 12 },
        height: { from: 20, to: 40 },
        rangeX: { from: 20, to: 80 },
        rangeY: { from: 48, to: 52 },
      },
      { tool: HeightmapToolType.SMOOTH, power: 2 },
      { tool: HeightmapToolType.MULTIPLY, multiplier: 0.7, range: 'land' },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 3, to: 4 },
        height: { from: 25, to: 35 },
        rangeX: { from: 5, to: 95 },
        rangeY: { from: 10, to: 20 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 3, to: 4 },
        height: { from: 25, to: 35 },
        rangeX: { from: 5, to: 95 },
        rangeY: { from: 80, to: 90 },
      },
      {
        tool: HeightmapToolType.RANGE,
        count: { from: 5, to: 6 },
        height: { from: 30, to: 40 },
        rangeX: { from: 10, to: 90 },
        rangeY: { from: 35, to: 65 },
      },
    ],
    probability: 5,
  },
  isthmus: {
    id: 9,
    name: 'Isthmus',
    steps: [
      {
        tool: HeightmapToolType.HILL,
        count: { from: 5, to: 10 },
        height: { from: 15, to: 30 },
        rangeX: { from: 0, to: 30 },
        rangeY: { from: 0, to: 20 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 5, to: 10 },
        height: { from: 15, to: 30 },
        rangeX: { from: 10, to: 50 },
        rangeY: { from: 20, to: 40 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 5, to: 10 },
        height: { from: 15, to: 30 },
        rangeX: { from: 30, to: 70 },
        rangeY: { from: 40, to: 60 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 5, to: 10 },
        height: { from: 15, to: 30 },
        rangeX: { from: 50, to: 90 },
        rangeY: { from: 60, to: 80 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 5, to: 10 },
        height: { from: 15, to: 30 },
        rangeX: { from: 70, to: 100 },
        rangeY: { from: 80, to: 100 },
      },
      { tool: HeightmapToolType.SMOOTH, power: 2 },
      {
        tool: HeightmapToolType.TROUGH,
        count: 4 - 8,
        height: { from: 15, to: 30 },
        rangeX: { from: 0, to: 30 },
        rangeY: { from: 0, to: 20 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: 4 - 8,
        height: { from: 15, to: 30 },
        rangeX: { from: 10, to: 50 },
        rangeY: { from: 20, to: 40 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: 4 - 8,
        height: { from: 15, to: 30 },
        rangeX: { from: 30, to: 70 },
        rangeY: { from: 40, to: 60 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: 4 - 8,
        height: { from: 15, to: 30 },
        rangeX: { from: 50, to: 90 },
        rangeY: { from: 60, to: 80 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: 4 - 8,
        height: { from: 15, to: 30 },
        rangeX: { from: 70, to: 100 },
        rangeY: { from: 80, to: 100 },
      },
      { tool: HeightmapToolType.INVERT, count: 0.25, axes: 'x' },
    ],
    probability: 2,
  },
  shattered: {
    id: 10,
    name: 'Shattered',
    steps: [
      {
        tool: HeightmapToolType.HILL,
        count: 8,
        height: { from: 35, to: 40 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 30, to: 70 },
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 10, to: 20 },
        height: { from: 40, to: 50 },
        rangeX: { from: 5, to: 95 },
        rangeY: { from: 5, to: 95 },
      },
      {
        tool: HeightmapToolType.RANGE,
        count: { from: 5, to: 7 },
        height: { from: 30, to: 40 },
        rangeX: { from: 10, to: 90 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.PIT,
        count: { from: 12, to: 20 },
        height: { from: 30, to: 40 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 20, to: 80 },
      },
    ],
    probability: 7,
  },
  taklamakan: {
    id: 11,
    name: 'Taklamakan',
    steps: [
      {
        tool: HeightmapToolType.HILL,
        count: { from: 1, to: 3 },
        height: { from: 20, to: 30 },
        rangeX: { from: 30, to: 70 },
        rangeY: { from: 30, to: 70 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 2, to: 4 },
        height: { from: 60, to: 85 },
        rangeX: { from: 0, to: 5 },
        rangeY: { from: 0, to: 100 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 2, to: 4 },
        height: { from: 60, to: 85 },
        rangeX: { from: 95, to: 100 },
        rangeY: { from: 0, to: 100 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 3, to: 4 },
        height: { from: 60, to: 85 },
        rangeX: { from: 20, to: 80 },
        rangeY: { from: 0, to: 5 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 3, to: 4 },
        height: { from: 60, to: 85 },
        rangeX: { from: 20, to: 80 },
        rangeY: { from: 95, to: 100 },
      },
      { tool: HeightmapToolType.SMOOTH, power: 3 },
    ],
    probability: 1,
  },
  oldWorld: {
    id: 12,
    name: 'Old World',
    steps: [
      {
        tool: HeightmapToolType.RANGE,
        count: 3,
        height: 70,
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 2, to: 3 },
        height: { from: 50, to: 70 },
        rangeX: { from: 15, to: 45 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 2, to: 3 },
        height: { from: 50, to: 70 },
        rangeX: { from: 65, to: 85 },
        rangeY: { from: 20, to: 80 },
      },
      {
        tool: HeightmapToolType.HILL,
        count: { from: 4, to: 6 },
        height: { from: 20, to: 25 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 20, to: 80 },
      },
      { tool: HeightmapToolType.MULTIPLY, multiplier: 0.5, range: 'land' },
      { tool: HeightmapToolType.SMOOTH, power: 2 },
      {
        tool: HeightmapToolType.RANGE,
        count: { from: 3, to: 4 },
        height: { from: 20, to: 50 },
        rangeX: { from: 15, to: 35 },
        rangeY: { from: 20, to: 45 },
      },
      {
        tool: HeightmapToolType.RANGE,
        count: { from: 2, to: 4 },
        height: { from: 20, to: 50 },
        rangeX: { from: 65, to: 85 },
        rangeY: { from: 45, to: 80 },
      },
      {
        tool: HeightmapToolType.STRAIT,
        width: { from: 3, to: 7 },
        direction: 'vertical',
      },
      {
        tool: HeightmapToolType.TROUGH,
        count: { from: 6, to: 8 },
        height: { from: 20, to: 50 },
        rangeX: { from: 15, to: 85 },
        rangeY: { from: 45, to: 65 },
      },
      {
        tool: HeightmapToolType.PIT,
        count: { from: 5, to: 6 },
        height: { from: 20, to: 30 },
        rangeX: { from: 10, to: 90 },
        rangeY: { from: 10, to: 90 },
      },
    ],
    probability: 8,
  },
  fractious: {
    id: 13,
    name: 'Fractious',
    steps: [
      {
        tool: HeightmapToolType.HILL,
        count: { from: 12, to: 15 },
        height: { from: 50, to: 80 },
        rangeX: { from: 5, to: 95 },
        rangeY: { from: 5, to: 95 },
      },
      { tool: HeightmapToolType.MASK, power: -1.5 },
      { tool: HeightmapToolType.MASK, power: 3 },
      { tool: HeightmapToolType.ADD, add: -20, range: { from: 30, to: 100 } },
      {
        tool: HeightmapToolType.RANGE,
        count: { from: 6, to: 8 },
        height: { from: 40, to: 50 },
        rangeX: { from: 5, to: 95 },
        rangeY: { from: 10, to: 90 },
      },
    ],
    probability: 3,
  },
} satisfies Record<string, HeightmapTemplate>;
