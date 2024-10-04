import { FunctionComponent, useCallback, useMemo } from 'react';
import { Graphics as GraphicsType, Point, Text } from 'pixi.js';
import { Container, Graphics, SimpleRope, Sprite, useApp } from '@pixi/react';

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

  const regionTextures = useMemo(
    () =>
      shouldDrawRegions
        ? areaMap.regions.map(region => {
            const g = new GraphicsType();
            const regionColor = randomDistinguishableColor(region.index);

            if (debug && region.index !== debug) {
              return null;
            }
            if (debug) {
              console.log(region.border);
            }

            const double = (x: number) => x + x + x + x;

            g.lineStyle(1, 0x000000, 0.0000001);
            g.drawRect(
              0,
              0,
              double(app.screen.width),
              double(app.screen.height)
            );

            g.lineStyle(1, regionColor, 1);
            g.beginFill(regionColor, 0.2);
            drawD3ClosedCurve(
              g,
              region.border.map(p => [double(p[0]), double(p[1])])
            );

            region.borderHoles.forEach(hole => {
              g.beginHole();
              g.lineStyle(1, 0xff0000, 1);
              drawD3ClosedCurve(
                g,
                hole.map(p => [double(p[0]), double(p[1])])
              );
              g.endHole();
            });

            g.endFill();

            if (!debugRegions) {
              return app.renderer.generateTexture(g);
            }

            g.lineStyle(1, regionColor, 1);
            region.areas.forEach(area => {
              area.cells.forEach(c => {
                g.drawCircle(
                  double(physicalMap.cells.points[c][0]),
                  double(physicalMap.cells.points[c][1]),
                  1
                );

                const text = new Text(region.index, {
                  fontSize: double(7),
                  fill: 0x000000,
                });
                text.x = double(physicalMap.cells.points[c][0] - 7);
                text.y = double(physicalMap.cells.points[c][1] - 7);

                g.addChild(text);
              });
            });

            return app.renderer.generateTexture(g);
          })
        : [],
    [areaMap, physicalMap, app, shouldDrawRegions]
  );

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
        fontSize: 50 * curvedText.scale,
        fill: 0x000000,
      });
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
      {shouldDrawRegions &&
        regionTextures.map(
          (texture, index) =>
            texture && (
              <Sprite
                key={index}
                texture={texture}
                x={0}
                y={0}
                width={app.screen.width}
                height={app.screen.height}
              />
            )
        )}
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
