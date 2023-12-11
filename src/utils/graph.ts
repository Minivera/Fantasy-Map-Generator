import { PackedCells } from '../types/grid.ts';

/**
 * Creates a filter function that will check if the given cell is a land cell.
 */
export const isLandFilter = (cells: PackedCells) => (i: number) => {
  return cells.heights[i] >= 20;
};

/**
 * Creates a filter function that will check if the given cell is a water cell.
 */
export const isWater = (cells: PackedCells) => (i: number) => {
  return cells.heights[i] < 20;
};
