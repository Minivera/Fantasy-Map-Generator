import { Grid } from '../types/grid';

/**
 * Return the cell index on the regular square grid passed in parameters.
 */
export const findGridCell = (x: number, y: number, grid: Grid) => {
  return (
    Math.floor(Math.min(y / grid.spacing, grid.cellsY - 1)) * grid.cellsX +
    Math.floor(Math.min(x / grid.spacing, grid.cellsX - 1))
  );
};
