import { FunctionComponent, useCallback } from 'react';
import { Graphics as GraphicsType, Texture } from 'pixi.js';
import { Container, Graphics, useApp, withFilters } from '@pixi/react';
import { GlowFilter } from '@pixi/filter-glow';
import { OutlineFilter } from '@pixi/filter-outline';

import { LakeFeature, PackedGrid, Point } from '../types/grid.ts';
import { biomeColor, BiomeIndexes } from '../data/biomes.ts';

import oceanPattern from '../assets/ocean_pattern1.png';
import { LakeColors } from '../data/features.ts';
import { drawCurvedLine, drawD3ClosedCurve } from '../pixiUtils/draw.ts';

const oceanTexture = Texture.from(oceanPattern);

const CoastlineFilters = withFilters(Graphics, {
  glow: GlowFilter,
  outline: OutlineFilter,
});

interface LandmassesProps {
  physicalMap: PackedGrid;
}

export const Landmasses: FunctionComponent<LandmassesProps> = ({
  physicalMap,
}) => {
  const app = useApp();

  // TODO: Extract all this logic when the drawing is finalized
  const drawOcean = useCallback(
    // TODO: Convert the ocean into a sprite so we can apply the coastline filters to it
    // https://stackoverflow.com/questions/50940737/how-to-convert-a-graphic-to-a-sprite-in-pixijs
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
      g.beginFill(0x466eab, 0.75);
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
        g.lineStyle(2, 0x808080, 1, 0.5);

        drawD3ClosedCurve(g, path);

        g.closePath();
      });
    },
    [physicalMap]
  );

  const drawCoastlineOutline = useCallback(
    (g: GraphicsType) => {
      if (!physicalMap) {
        return;
      }

      g.clear();
      physicalMap.cells.pathPoints.coastlines.forEach(path => {
        const [start, ...rest] = path;
        g.moveTo(start[0], start[1]);
        g.beginFill(0x00ff00);

        for (let i = 0; i < rest.length - 2; i++) {
          const xc = (rest[i][0] + rest[i + 1][0]) / 2;
          const yc = (rest[i][1] + rest[i + 1][1]) / 2;
          g.quadraticCurveTo(rest[i][0], rest[i][1], xc, yc);
        }

        // curve through the last two points
        g.quadraticCurveTo(
          rest[rest.length - 2][0],
          rest[rest.length - 2][1],
          rest[rest.length - 1][0],
          rest[rest.length - 1][1]
        );

        g.closePath();
        g.endFill();
      });
    },
    [physicalMap]
  );

  const drawCells = useCallback(
    // TODO: Convert the cells to a sprite so we can mask it for lakes and other things
    (g: GraphicsType) => {
      if (!physicalMap) {
        return;
      }

      g.clear();

      // const cellBlur = new BlurFilter(1.5);

      // Start by drawing all the cells
      physicalMap.cells.vertices.forEach((cellVertices, i) => {
        if (
          !physicalMap.cells.types[i] ||
          physicalMap.cells.types[i] <= 0 ||
          physicalMap.cells.biomes[i] === BiomeIndexes.MARINE
        ) {
          return;
        }

        // Drawing the cell itself
        g.beginFill(biomeColor[physicalMap.cells.biomes[i]]);
        // Also add some light blur to the cells to generate a biome blending effect
        // g.filters = [cellBlur];

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

  const drawLake = useCallback(
    (g: GraphicsType) => (featureID: string, points: Point[]) => {
      g.clear();

      // TODO: draw lakes over the map. If masked properly with another lake, it should render in place
      // TODO: without issues. Check if we could scale a lake a little to make it overlap all possible cells.
      const lakeFeature = physicalMap.features[
        parseInt(featureID)
      ] as unknown as LakeFeature;

      const colorData = LakeColors[lakeFeature.group];
      g.beginFill(colorData.fill, colorData.fillAlpha);
      g.lineStyle(colorData.outlineWidth, colorData.outline, 1, 0.5);

      drawD3ClosedCurve(g, points);
      g.endFill();
    },
    [physicalMap]
  );

  if (!physicalMap) {
    return null;
  }

  return (
    <Container>
      <Graphics draw={drawCells} />
      <Graphics draw={drawOcean} />
      <CoastlineFilters
        draw={drawCoastlineOutline}
        outline={{
          alpha: 0.25,
          color: 0xffffff,
          thickness: 15,
          knockout: true,
        }}
      />
      <CoastlineFilters
        draw={drawCoastlineOutline}
        outline={{
          alpha: 0.5,
          color: 0xffffff,
          thickness: 5,
          knockout: true,
        }}
      />
      <Graphics draw={drawCoastline} />
      {Object.entries(physicalMap.cells.pathPoints.lakes).map(
        ([lakeID, points]) => (
          <Graphics key={lakeID} draw={g => drawLake(g)(lakeID, points)} />
        )
      )}
    </Container>
  );
};
