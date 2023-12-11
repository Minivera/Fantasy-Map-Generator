import { FunctionComponent, useEffect, useRef, useState } from 'react';
import Two from 'two.js';

import { PackedGrid } from '../types/grid.ts';
import { biomeColor } from '../data/biomes.ts';

export const Map: FunctionComponent<{
  physicalMap: PackedGrid | null;
  graphHeight: number;
  graphWidth: number;
}> = ({ physicalMap, graphHeight, graphWidth }) => {
  const two = useRef(
    new Two({
      type: Two.Types.webgl,
      fullscreen: true,
      autostart: true,
      height: graphHeight,
      width: graphWidth,
    })
  );
  const canvasRef = useRef<HTMLDivElement>(null);

  const [appended, setAppended] = useState(false);

  useEffect(() => {
    if (physicalMap && canvasRef.current && !appended) {
      two.current.appendTo(canvasRef.current);

      // Start by drawing all the cells
      // TODO: Extract all this logic when the drawing is finalized
      physicalMap.cells.vertices.forEach((cellVertices, i) => {
        const anchors = cellVertices.map(vertex => {
          const point = physicalMap.vertices.coordinates[vertex];
          return new Two.Anchor(point[0], point[1]);
        });

        const cellPath = two.current.makePath(anchors);
        cellPath.stroke = '#808080';
        cellPath.linewidth = 0.1;
        cellPath.fill = biomeColor[physicalMap.cells.biomes[i]];
      });

      two.current.update();
      setAppended(true);
    }
  }, [canvasRef, physicalMap, two, appended]);

  return <div id="two-canvas" ref={canvasRef} />;
};
