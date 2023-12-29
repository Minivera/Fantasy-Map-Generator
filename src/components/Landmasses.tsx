import { FunctionComponent, useCallback } from 'react';
import { BLEND_MODES, Graphics as GraphicsType, Texture } from 'pixi.js';
import { Container, Graphics, Sprite, useApp } from '@pixi/react';
import * as d3Scale from 'd3-scale';
import * as d3ScaleChromatic from 'd3-scale-chromatic';

import { LakeFeature, PackedGrid } from '../types/grid.ts';
import { biomeColor, BiomeIndexes } from '../data/biomes.ts';
import oceanPattern from '../assets/ocean_pattern1.png';
import { LakeColors } from '../data/features.ts';
import { drawD3ClosedCurve, drawD3RiverCurve } from '../pixiUtils/draw.ts';
import {
  cellsColor,
  coastlineColor,
  oceanColor,
  oceanLayerColor,
  riverColor,
} from '../data/colors.ts';
import { roundNumber } from '../utils/math.ts';

const oceanTexture = Texture.from(oceanPattern);

interface LandmassesProps {
  physicalMap: PackedGrid;

  shouldDrawCells?: boolean;
  shouldDrawBiomes?: boolean;
  shouldDrawHeightmap?: boolean;
  shouldDrawLakes?: boolean;
  shouldDrawRivers?: boolean;
  shouldDrawIcons?: boolean;
}

export const Landmasses: FunctionComponent<LandmassesProps> = ({
  physicalMap,
  shouldDrawCells = false,
  shouldDrawBiomes = false,
  shouldDrawHeightmap = false,
  shouldDrawLakes = false,
  shouldDrawRivers = false,
  shouldDrawIcons = false,
}) => {
  const app = useApp();

  // TODO: Extract all this logic when the drawing is finalized
  const drawOcean = useCallback(
    (g: GraphicsType) => {
      const drawHole = () => {
        g.beginHole();
        physicalMap.cells.pathPoints.coastlines.forEach(path => {
          g.beginFill(0x000000);

          drawD3ClosedCurve(g, path);

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

      // Finally, draw the layers for the continents outline and punch the continents hole into it.
      const opacity = roundNumber(
        0.4 / Object.keys(physicalMap.cells.pathPoints.oceanLayers).length,
        2
      );
      Object.values(physicalMap.cells.pathPoints.oceanLayers).forEach(paths => {
        g.beginFill(oceanLayerColor, opacity);
        paths.forEach(path => {
          drawD3ClosedCurve(g, path);
        });

        drawHole();
        g.endFill();
      });
    },
    [physicalMap, app]
  );

  const drawCoastline = useCallback(
    (g: GraphicsType) => {
      g.clear();
      physicalMap.cells.pathPoints.coastlines.forEach(path => {
        g.lineStyle(2, coastlineColor, 1, 0.5);

        drawD3ClosedCurve(g, path);
      });
    },
    [physicalMap]
  );

  const drawCells = useCallback(
    (g: GraphicsType) => {
      g.clear();

      // Start by drawing all the cells
      physicalMap.cells.vertices.forEach(cellVertices => {
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
      });
    },
    [physicalMap]
  );

  const drawBiomes = useCallback(
    (g: GraphicsType) => {
      if (!physicalMap.biomeGroups) {
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

  const drawHeightmap = useCallback(
    (g: GraphicsType) => {
      if (!physicalMap.heightmapGroups) {
        return;
      }

      g.clear();

      const colorScheme = d3Scale.scaleSequential(
        d3ScaleChromatic.interpolateSpectral
      );
      // First, render all the coastlines without border and fill them with the base color
      physicalMap.cells.pathPoints.coastlines.forEach(path => {
        g.beginFill(colorScheme(0.8));

        drawD3ClosedCurve(g, path);

        g.endFill();
      });

      Object.entries(physicalMap.heightmapGroups).forEach(([key, paths]) => {
        const heightLevel: BiomeIndexes = parseInt(key);
        if (!paths.length) {
          return;
        }

        paths.forEach(path => {
          const color = colorScheme(
            1 - (heightLevel < 20 ? heightLevel - 5 : heightLevel) / 100
          );
          g.beginFill(color);

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

  const drawRivers = useCallback(
    (g: GraphicsType) => {
      g.clear();

      physicalMap.cells.pathPoints.rivers.forEach(({ right, left }) => {
        g.beginFill(riverColor, 1);

        drawD3RiverCurve(g, [...right, ...left]);

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

          let islandColor: number | string = 0xffffff;
          if (shouldDrawBiomes) {
            const firstCellBiome =
              physicalMap.cells.biomes[islandFeature.firstCell];

            islandColor = biomeColor[firstCellBiome];
          } else if (shouldDrawHeightmap) {
            const firstCellHeight =
              physicalMap.cells.heights[islandFeature.firstCell];

            const colorScheme = d3Scale.scaleSequential(
              d3ScaleChromatic.interpolateSpectral
            );

            islandColor = colorScheme(
              1 -
                (firstCellHeight < 20 ? firstCellHeight - 5 : firstCellHeight) /
                  100
            );
          }

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
      <Graphics draw={drawCoastline} />
      {shouldDrawBiomes && <Graphics draw={drawBiomes} />}
      {shouldDrawHeightmap && <Graphics draw={drawHeightmap} />}
      {shouldDrawRivers && <Graphics draw={drawRivers} />}
      {shouldDrawLakes && (
        <>
          <Graphics draw={drawLakesShapes} blendMode={BLEND_MODES.NONE} />
          <Graphics draw={drawLakes} />
        </>
      )}
      {shouldDrawCells && <Graphics draw={drawCells} />}
      {shouldDrawIcons &&
        physicalMap.biomeIcons?.map(({ image, x, y, size }, index) => (
          <Sprite
            key={index}
            image={image}
            height={size * 1.5}
            width={size * 1.5}
            x={x}
            y={y}
          />
        ))}
    </Container>
  );
};
