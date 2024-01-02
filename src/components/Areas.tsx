import { FunctionComponent, useCallback } from 'react';
import { Graphics as GraphicsType } from 'pixi.js';
import { Container, Graphics, useApp } from '@pixi/react';

import { drawD3ClosedCurve } from '../pixiUtils/draw.ts';
import { AreaMap } from '../types/areas.ts';
import { randomDistinguishableColor } from '../utils/colors.ts';
import { FeatureType, PackedGrid } from '../types/grid.ts';

interface AreasProps {
  areaMap: AreaMap;
  physicalMap: PackedGrid;

  shouldDrawArea?: boolean;
  shouldDrawRegions?: boolean;
}

export const Areas: FunctionComponent<AreasProps> = ({
  areaMap,
  physicalMap,
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

        if (
          physicalMap.features[physicalMap.cells.features[area.center]].type ===
          FeatureType.OCEAN
        ) {
          return;
        }

        g.lineStyle(1, 0x00ff00, 1);
        area.adjacentAreas.forEach(a => {
          if (
            physicalMap.features[physicalMap.cells.features[a.center]].type !==
            FeatureType.LAKE
          ) {
            return;
          }

          g.moveTo(
            physicalMap.cells.points[area.center][0],
            physicalMap.cells.points[area.center][1]
          );
          g.lineTo(
            physicalMap.cells.points[a.center][0],
            physicalMap.cells.points[a.center][1]
          );
          g.closePath();
        });
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
        g.beginFill(regionColor, 0.3);
        drawD3ClosedCurve(g, region.border);
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
