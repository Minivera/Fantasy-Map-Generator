import { FunctionComponent, useCallback } from 'react';
import { Graphics as GraphicsType } from 'pixi.js';
import { Container, Graphics, useApp } from '@pixi/react';

import { drawD3ClosedCurve } from '../pixiUtils/draw.ts';
import { Areas as AreasType } from '../types/areas.ts';
import { randomDistinguishableColor } from '../utils/colors.ts';

interface AreasProps {
  areaMap: AreasType;

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

      areaMap.forEach(area => {
        const areaColor = randomDistinguishableColor(area.index);

        g.lineStyle(1, areaColor, 1);
        g.beginFill(areaColor, 0.3);
        drawD3ClosedCurve(g, area.border);
        g.endFill();
      });
    },
    [areaMap, app]
  );

  if (!areaMap) {
    return null;
  }

  return (
    <Container>{shouldDrawArea && <Graphics draw={drawAreas} />}</Container>
  );
};
