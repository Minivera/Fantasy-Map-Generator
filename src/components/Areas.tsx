import { FunctionComponent, useCallback, useMemo } from 'react';
import { Graphics as GraphicsType, Point, Text } from 'pixi.js';
import { Container, Graphics, SimpleRope, useApp } from '@pixi/react';

import { drawD3ClosedCurve } from '../pixiUtils/draw.ts';
import { AreaMap } from '../types/areas.ts';
import { randomDistinguishableColor } from '../utils/colors.ts';
import { FeatureType, PackedGrid } from '../types/grid.ts';
import { getCurvedTextPoints } from '../utils/text.ts';

interface AreasProps {
  areaMap: AreaMap;
  physicalMap: PackedGrid;

  shouldDrawArea?: boolean;
  shouldDrawRegions?: boolean;
  shouldDrawRegionLabels?: boolean;
}

const debugRegions: boolean = false;
const debug: number | undefined = undefined;

export const Areas: FunctionComponent<AreasProps> = ({
  areaMap,
  physicalMap,
  shouldDrawArea = false,
  shouldDrawRegions = false,
  shouldDrawRegionLabels = false,
}) => {
  const app = useApp();

  // TODO: Extract all this logic when the drawing is finalized
  const drawAreas = useCallback(
    (g: GraphicsType) => {
      g.clear();

      areaMap.areas.forEach(area => {
        if (
          !debug ||
          areaMap.regions.some(r => r.index === debug && r.areas.includes(area))
        ) {
          const areaColor = randomDistinguishableColor(area.index);

          g.lineStyle(1, areaColor, 1);
          g.beginFill(areaColor, 0.3);
          drawD3ClosedCurve(g, area.border);
          g.endFill();

          if (!debug) {
            return;
          }

          area.adjacentAreas.forEach(adjacent => {
            if (
              physicalMap.features[adjacent.properties.features[0]].type ===
                FeatureType.OCEAN ||
              physicalMap.features[area.properties.features[0]].type ===
                FeatureType.OCEAN
            ) {
              return;
            }

            g.lineStyle(1, areaColor, 1);
            g.moveTo(
              physicalMap.cells.points[area.center][0],
              physicalMap.cells.points[area.center][1]
            );
            g.lineTo(
              physicalMap.cells.points[adjacent.center][0],
              physicalMap.cells.points[adjacent.center][1]
            );
            g.closePath();
          });
        }
      });
    },
    [areaMap, physicalMap, app]
  );

  const drawRegions = useCallback(
    (g: GraphicsType) => {
      g.clear();

      areaMap.regions.forEach(region => {
        const regionColor = randomDistinguishableColor(region.index);

        if (debug && region.index !== debug) {
          return;
        }
        if (debug) {
          console.log(region.border);
        }

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

        if (!debugRegions) {
          return;
        }

        g.lineStyle(1, regionColor, 1);
        region.areas.forEach(area => {
          area.cells.forEach(c => {
            g.drawCircle(
              physicalMap.cells.points[c][0],
              physicalMap.cells.points[c][1],
              1
            );

            const text = new Text(region.index, {
              fontSize: 7,
              fill: 0x000000,
            });
            text.x = physicalMap.cells.points[c][0];
            text.y = physicalMap.cells.points[c][1];

            g.addChild(text);
          });
        });
      });
    },
    [areaMap, physicalMap, app]
  );

  const regionLabels = useMemo(() => {
    if (!shouldDrawRegionLabels) {
      return [];
    }

    return areaMap.regions.map(region => {
      if (!region.ruler?.length) {
        return null;
      }

      const curvedText = getCurvedTextPoints('Some region', region.ruler);

      const text = new Text('Some region', {
        fontSize: 50,
        fill: 0x000000,
      });
      text.scale = { y: 0.2, x: 0.2 };
      text.updateText(false);

      return {
        texture: text.texture,
        rope: curvedText.rope.map(p => new Point(p[0], p[1])),
        scale: curvedText.scale,
      };
    });
  }, [areaMap, shouldDrawRegionLabels]);

  if (!areaMap) {
    return null;
  }

  return (
    <Container>
      {shouldDrawArea && <Graphics draw={drawAreas} />}
      {shouldDrawRegions && <Graphics draw={drawRegions} />}
      {regionLabels.map((labelTexture, index) => {
        if (!labelTexture) {
          return null;
        }

        const region = areaMap.regions[index];
        if (!region.ruler) {
          return null;
        }

        return (
          <SimpleRope
            key={region.index}
            texture={labelTexture.texture}
            // @ts-expect-error TS2322
            points={labelTexture.rope}
            scale={labelTexture.scale}
            pivot={region.ruler[1]}
            position={region.ruler[1]}
          />
        );
      })}
    </Container>
  );
};
