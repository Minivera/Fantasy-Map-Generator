import { FunctionComponent, useCallback } from 'react';
import { Graphics as GraphicsType } from 'pixi.js';
import '@pixi/graphics-extras';
import { Stage, Graphics } from '@pixi/react';

import { PackedGrid } from '../types/grid.ts';
import { biomeColor } from '../data/biomes.ts';
import { ZoomUIContainer } from './ZoomUIContainer.tsx';

interface MapProps {
  physicalMap: PackedGrid | null;
  graphHeight: number;
  graphWidth: number;
}

export const Map: FunctionComponent<MapProps> = ({
  physicalMap,
  graphHeight,
  graphWidth,
}) => {
  const drawCells = useCallback(
    (g: GraphicsType) => {
      if (!physicalMap) {
        return;
      }

      g.clear();

      // Start by drawing all the cells
      // TODO: Extract all this logic when the drawing is finalized
      physicalMap.cells.vertices.forEach((cellVertices, i) => {
        g.beginFill(biomeColor[physicalMap.cells.biomes[i]]);
        g.lineStyle(0.1, 0x808080, 1);

        const [start, ...rest] = cellVertices;
        g.moveTo(
          physicalMap.vertices.coordinates[start][0],
          physicalMap.vertices.coordinates[start][1]
        );

        rest.forEach(vertex => {
          g.lineTo(
            physicalMap.vertices.coordinates[vertex][0],
            physicalMap.vertices.coordinates[vertex][1]
          );
        });

        g.closePath();
        g.endFill();
      });
    },
    [physicalMap]
  );

  if (!physicalMap) {
    return null;
  }

  return (
    <Stage width={graphWidth} height={graphHeight}>
      <ZoomUIContainer>
        <Graphics draw={drawCells} />
      </ZoomUIContainer>
    </Stage>
  );
};
