import { PhysicalMap } from '../types/map.ts';
import { Application, Graphics } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import { cellsColor } from '../data/colors.ts';

interface gridOptions {
  shouldDrawCells?: boolean;
}

export const drawCells = (
  _app: Application,
  container: Viewport,
  physicalMap: PhysicalMap,
  { shouldDrawCells = false }: gridOptions
) => {
  if (!shouldDrawCells) {
    return;
  }

  const cells = new Graphics();

  // Start by drawing all the cells
  physicalMap.grid.cells.forEach(cell => {
    // Drawing the cell itself, only the borders
    cells.stroke({
      width: 0.1,
      color: cellsColor,
      alpha: 1,
    });

    const [start, ...rest] = cell.vertices;
    cells.moveTo(
      physicalMap.grid.vertices[start].coordinates[0],
      physicalMap.grid.vertices[start].coordinates[1]
    );

    rest.forEach(vertex => {
      cells.lineTo(
        physicalMap.grid.vertices[vertex].coordinates[0],
        physicalMap.grid.vertices[vertex].coordinates[1]
      );
    });

    cells.closePath();
  });

  container.addChild(cells);
};
