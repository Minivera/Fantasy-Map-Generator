import { FunctionComponent, useCallback } from 'react';
import {
  AlphaFilter,
  BLEND_MODES,
  Graphics as GraphicsType,
  Texture,
} from 'pixi.js';
import { Container, Graphics, useApp, withFilters } from '@pixi/react';

import { LakeFeature, PackedGrid } from '../types/grid.ts';
import { biomeColor, BiomeIndexes } from '../data/biomes.ts';

import oceanPattern from '../assets/ocean_pattern1.png';
import { LakeColors } from '../data/features.ts';
import { drawCurvedLine, drawD3ClosedCurve } from '../pixiUtils/draw.ts';
import { simplifyPolygon } from '../utils/polygons.ts';
import { cellsColor, coastlineColor, oceanColor } from '../data/colors.ts';

const oceanTexture = Texture.from(oceanPattern);

const CoastlineFilters = withFilters(Graphics, {
  alphaFilter: AlphaFilter,
});

interface LandmassesProps {
  physicalMap: PackedGrid;

  shouldDrawCells?: boolean;
  shouldDrawBiomes?: boolean;
  shouldDrawHeightmap?: boolean;
  shouldDrawIcons?: boolean;
}

export const Landmasses: FunctionComponent<LandmassesProps> = ({
  physicalMap,
  shouldDrawCells = false,
  shouldDrawBiomes = false,
  shouldDrawHeightmap = false,
  shouldDrawIcons = false,
}) => {
  const app = useApp();

  // TODO: Extract all this logic when the drawing is finalized
  const drawOcean = useCallback(
    (g: GraphicsType) => {
      if (!physicalMap) {
        return;
      }

      const drawHole = () => {
        g.beginHole();
        physicalMap.cells.pathPoints.coastlines.forEach(path => {
          g.beginFill(0x000000);

          drawCurvedLine(g, path);

          g.endFill();
        });

        g.endHole();
      };

      g.clear();

      // Render the rectangle's texture
      g.beginTextureFill({ texture: oceanTexture });
      g.drawRect(0, 0, app.screen.width, app.screen.height);
      // Then draw a hole in the texture
      drawHole();
      g.endFill();

      // Next, draw some color over it with opacity so the texture still shows up
      g.beginFill(oceanColor, 0.75);
      g.drawRect(0, 0, app.screen.width, app.screen.height);
      // Then redraw the hole again
      drawHole();
      g.endFill();
    },
    [physicalMap]
  );

  const drawCoastline = useCallback(
    (g: GraphicsType) => {
      if (!physicalMap) {
        return;
      }

      g.clear();
      physicalMap.cells.pathPoints.coastlines.forEach(path => {
        g.lineStyle(2, coastlineColor, 1, 0.5);

        drawD3ClosedCurve(g, path);

        g.closePath();
      });
    },
    [physicalMap]
  );

  const drawCoastlineOutlineNear = useCallback(
    (g: GraphicsType) => {
      if (!physicalMap) {
        return;
      }

      g.clear();
      physicalMap.cells.pathPoints.coastlines.forEach(path => {
        g.lineStyle(50, 0xffffff, 1, 0.5);

        drawD3ClosedCurve(g, simplifyPolygon(path, 5));

        g.closePath();
        g.endFill();
      });
    },
    [physicalMap]
  );

  const drawCoastlineOutlineFar = useCallback(
    (g: GraphicsType) => {
      if (!physicalMap) {
        return;
      }

      g.clear();
      physicalMap.cells.pathPoints.coastlines.forEach(path => {
        g.lineStyle(150, 0xffffff, 1, 0.5);

        drawD3ClosedCurve(g, simplifyPolygon(path, 10));

        g.closePath();
        g.endFill();
      });
    },
    [physicalMap]
  );

  const drawCoastlineEraser = useCallback(
    (g: GraphicsType) => {
      if (!physicalMap) {
        return;
      }

      g.clear();
      physicalMap.cells.pathPoints.coastlines.forEach(path => {
        g.beginFill(0x00ff00);

        drawD3ClosedCurve(g, path);

        g.closePath();
        g.endFill();
      });
    },
    [physicalMap]
  );

  const drawCells = useCallback(
    (g: GraphicsType) => {
      if (!physicalMap) {
        return;
      }

      g.clear();

      // Start by drawing all the cells
      physicalMap.cells.vertices.forEach((cellVertices, i) => {
        if (
          !physicalMap.cells.types[i] ||
          physicalMap.cells.types[i] <= 0 ||
          physicalMap.cells.biomes[i] === BiomeIndexes.MARINE
        ) {
          return;
        }

        // Drawing the cell itself, only the borders
        g.lineStyle(0.1, cellsColor, 1);

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
      });
    },
    [physicalMap]
  );

  const drawBiomes = useCallback(
    (g: GraphicsType) => {
      if (!physicalMap || !physicalMap.biomeGroups) {
        return;
      }

      g.clear();

      Object.entries(physicalMap.biomeGroups).forEach(([key, paths]) => {
        const biomeIndex: BiomeIndexes = parseInt(key);
        if (biomeIndex === BiomeIndexes.MARINE) {
          return;
        }

        paths.forEach(path => {
          g.beginFill(biomeColor[biomeIndex]);

          drawD3ClosedCurve(g, path);

          g.endFill();
        });
      });
    },
    [physicalMap]
  );

  const drawLakesShapes = useCallback(
    (g: GraphicsType) => {
      g.clear();

      // Draw only the shape of the lakes with basic background color
      Object.values(physicalMap.cells.pathPoints.lakes).forEach(points => {
        g.beginFill(0x466eab, 1);
        g.lineStyle(1, 0x466eab, 1, 1);

        drawD3ClosedCurve(g, points);
        g.endFill();
      });
    },
    [physicalMap]
  );

  const drawLakes = useCallback(
    (g: GraphicsType) => {
      g.clear();

      Object.entries(physicalMap.cells.pathPoints.lakes).forEach(
        ([lakeID, points]) => {
          const lakeFeature = physicalMap.features[
            parseInt(lakeID)
          ] as unknown as LakeFeature;

          const colorData = LakeColors[lakeFeature.group];
          g.beginFill(colorData.fill, colorData.fillAlpha);
          g.lineStyle(colorData.outlineWidth, colorData.outline, 1, 1);

          drawD3ClosedCurve(g, points);
          g.endFill();
        }
      );

      // Draw the lake islands over the lake so they render without causing issues on the cells or other layers.
      Object.entries(physicalMap.cells.pathPoints.islands).forEach(
        ([islandID, points]) => {
          const islandFeature = physicalMap.features[parseInt(islandID)];

          const islandColor = shouldDrawBiomes
            ? biomeColor[physicalMap.cells.biomes[islandFeature.firstCell]]
            : 0xffffff;
          g.beginFill(islandColor, 1);
          g.lineStyle(1, coastlineColor, 1, 1);

          drawD3ClosedCurve(g, points);
          g.endFill();
        }
      );
    },
    [physicalMap]
  );

  if (!physicalMap) {
    return null;
  }

  return (
    <Container>
      <Graphics draw={drawOcean} />
      <CoastlineFilters
        draw={drawCoastlineOutlineFar}
        alphaFilter={{
          enabled: true,
          alpha: 0.15,
        }}
        blendMode={BLEND_MODES.SRC_OVER}
      />
      <CoastlineFilters
        draw={drawCoastlineOutlineNear}
        alphaFilter={{
          enabled: true,
          alpha: 0.25,
        }}
        blendMode={BLEND_MODES.SRC_OVER}
      />
      <Graphics draw={drawCoastlineEraser} blendMode={BLEND_MODES.ERASE} />
      {shouldDrawBiomes && (
        <Graphics draw={drawBiomes} blendMode={BLEND_MODES.SRC_OVER} />
      )}
      <Graphics draw={drawCoastline} />
      <Graphics draw={drawLakesShapes} blendMode={BLEND_MODES.NONE} />
      <Graphics draw={drawLakes} />
      {shouldDrawCells && <Graphics draw={drawCells} />}
    </Container>
  );
};
