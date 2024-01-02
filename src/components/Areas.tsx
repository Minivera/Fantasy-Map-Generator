import { FunctionComponent, useCallback } from 'react';
import { Graphics as GraphicsType } from 'pixi.js';
import { Container, Graphics, useApp } from '@pixi/react';

import { drawD3ClosedCurve } from '../pixiUtils/draw.ts';
import { AreaMap } from '../types/areas.ts';
import { randomDistinguishableColor } from '../utils/colors.ts';
import { PackedGrid } from '../types/grid.ts';

interface AreasProps {
  areaMap: AreaMap;
  physicalMap: PackedGrid;

  shouldDrawArea?: boolean;
  shouldDrawRegions?: boolean;
}

export const Areas: FunctionComponent<AreasProps> = ({
  areaMap,
  shouldDrawArea = false,
  shouldDrawRegions = false,
}) => {
  const app = useApp();

  // TODO: Extract all this logic when the drawing is finalized
  const drawAreas = useCallback(
    (g: GraphicsType) => {
      g.clear();

      areaMap.areas.forEach(area => {
        const areaColor = randomDistinguishableColor(area.index);

        g.lineStyle(1, areaColor, 1);
        g.beginFill(areaColor, 0.3);
        drawD3ClosedCurve(g, area.border);
        g.endFill();
      });
    },
    [areaMap, app]
  );

  const drawRegions = useCallback(
    (g: GraphicsType) => {
      g.clear();

      areaMap.regions.forEach(region => {
        const regionColor = randomDistinguishableColor(region.index);

        g.lineStyle(1, regionColor, 1);
        g.beginFill(regionColor, 0.7);
        drawD3ClosedCurve(g, region.border);

        region.borderHoles.forEach(hole => {
          g.beginHole();
          g.lineStyle(1, 0xff0000, 1);
          drawD3ClosedCurve(g, hole);
          g.endHole();
        });

        g.endFill();
      });
    },
    [areaMap, app]
  );

  if (!areaMap) {
    return null;
  }

  return (
    <Container>
      {shouldDrawArea && <Graphics draw={drawAreas} />}
      {shouldDrawRegions && <Graphics draw={drawRegions} />}
    </Container>
  );
};
