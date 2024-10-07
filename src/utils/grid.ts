import * as d3Polygon from 'd3-polygon';
import { Cell, Grid, Point } from '../types/grid';

/**
 * Return the cell index on the regular square grid passed in parameters.
 */
export const findGridCell = (x: number, y: number, grid: Grid) => {
  return (
    Math.floor(Math.min(y / grid.spacing, grid.cellsY - 1)) * grid.cellsX +
    Math.floor(Math.min(x / grid.spacing, grid.cellsX - 1))
  );
};

/**
 * Return the cell index on the irregular cell grid passed in parameters using a polygon intersection
 * check.
 */
export const findGridCellUnderPoint = (
  point: Point,
  grid: Grid
): [number, Cell] | undefined => {
  const index = grid.cells.findIndex(cell =>
    d3Polygon.polygonContains(
      cell.vertices.map(v => grid.vertices[v].coordinates),
      point
    )
  );

  return index >= 0 ? [index, grid.cells[index]] : undefined;
};
