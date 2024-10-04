import { PackedGrid } from '../types/grid.ts';
import { Application, Assets, Graphics, GraphicsContext } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

import {
  cellsColor,
  coastlineColor,
  oceanColor,
  oceanLayerColor,
} from '../data/colors.ts';
import { roundNumber } from '../utils/math.ts';
import {
  drawD3ClosedCurve,
  drawD3ClosedPath,
  drawDebugPath,
} from './drawUtils.ts';

import oceanPattern from '../assets/ocean_pattern1.png';

const oceanTexture = await Assets.load(oceanPattern);

const debugCoastlines = false;

const drawOcean = (
  app: Application,
  container: Viewport,
  physicalMap: PackedGrid
) => {
  const textureContext = new GraphicsContext()
    .rect(0, 0, oceanTexture.width, oceanTexture.height)
    .texture(
      oceanTexture,
      0xffffff,
      0,
      0,
      oceanTexture.width,
      oceanTexture.height
    )
    .fill({ color: oceanColor, alpha: 0.75 });

  // Render the base ocean on the map
  let x = 0;
  let y = 0;
  while (y <= app.screen.height) {
    const oceanCell = new Graphics(textureContext);
    oceanCell.x = x;
    oceanCell.y = y;

    x += oceanTexture.width;
    if (x > app.screen.width) {
      x = 0;
      y += oceanTexture.height;
    }

    container.addChild(oceanCell);
  }

  // Next, draw the layers for the continents outline.
  const layers = new Graphics();
  const opacity = roundNumber(
    0.4 / Object.keys(physicalMap.cells.pathPoints.oceanLayers).length,
    2
  );
  Object.values(physicalMap.cells.pathPoints.oceanLayers).forEach(paths => {
    paths.forEach(path => {
      drawD3ClosedCurve(layers, path).fill({
        color: oceanLayerColor,
        alpha: opacity,
      });

      if (debugCoastlines) {
        drawDebugPath(layers, path);
      }
    });
  });

  container.addChild(layers);
};
const drawCoastline = (
  _: Application,
  container: Viewport,
  physicalMap: PackedGrid
) => {
  const coastlines = new Graphics();

  physicalMap.cells.pathPoints.coastlines.forEach(path => {
    coastlines
      .stroke({
        width: 1,
        color: coastlineColor,
        alpha: 1,
      })
      .fill('white');

    drawD3ClosedPath(coastlines, path);

    if (debugCoastlines) {
      drawDebugPath(coastlines, path);
    }
  });

  container.addChild(coastlines);
};

const drawCells = (
  _: Application,
  container: Viewport,
  physicalMap: PackedGrid
) => {
  const cells = new Graphics();

  // Start by drawing all the cells
  physicalMap.cells.vertices.forEach(cellVertices => {
    // Drawing the cell itself, only the borders
    cells.stroke({
      width: 0.1,
      color: cellsColor,
      alpha: 1,
    });

    const [start, ...rest] = cellVertices;
    cells.moveTo(
      physicalMap.vertices.coordinates[start][0],
      physicalMap.vertices.coordinates[start][1]
    );

    rest.forEach(vertex => {
      cells.lineTo(
        physicalMap.vertices.coordinates[vertex][0],
        physicalMap.vertices.coordinates[vertex][1]
      );
    });

    cells.closePath();
  });

  container.addChild(cells);
};

const drawBiomes = (
  app: Application,
  container: Viewport,
  physicalMap: PackedGrid
) => {};

const drawHeightmap = (
  app: Application,
  container: Viewport,
  physicalMap: PackedGrid
) => {};

const drawHeightIndicators = (
  app: Application,
  container: Viewport,
  physicalMap: PackedGrid
) => {};

const drawTemperatureIndicators = (
  app: Application,
  container: Viewport,
  physicalMap: PackedGrid
) => {};

const drawLakes = (
  app: Application,
  container: Viewport,
  physicalMap: PackedGrid
) => {};

const drawRivers = (
  app: Application,
  container: Viewport,
  physicalMap: PackedGrid
) => {};

const drawRelief = (
  app: Application,
  container: Viewport,
  physicalMap: PackedGrid
) => {};

interface landmassesOptions {
  shouldDrawCells?: boolean;
  shouldDrawBiomes?: boolean;
  shouldDrawHeightmap?: boolean;
  shouldDrawHeightIndicators?: boolean;
  shouldDrawTemperatureIndicators?: boolean;
  shouldDrawLakes?: boolean;
  shouldDrawRivers?: boolean;
  shouldDrawRelief?: boolean;
}

export const drawLandmasses = (
  app: Application,
  container: Viewport,
  physicalMap: PackedGrid,
  {
    shouldDrawCells = false,
    shouldDrawBiomes = false,
    shouldDrawHeightmap = false,
    shouldDrawHeightIndicators = false,
    shouldDrawTemperatureIndicators = false,
    shouldDrawLakes = false,
    shouldDrawRivers = false,
    shouldDrawRelief = false,
  }: landmassesOptions
) => {
  drawOcean(app, container, physicalMap);
  drawCoastline(app, container, physicalMap);
  if (shouldDrawBiomes) {
    drawBiomes(app, container, physicalMap);
  }
  if (shouldDrawHeightmap) {
    drawHeightmap(app, container, physicalMap);
  }
  if (shouldDrawHeightIndicators) {
    drawHeightIndicators(app, container, physicalMap);
  }
  if (shouldDrawTemperatureIndicators) {
    drawTemperatureIndicators(app, container, physicalMap);
  }
  if (shouldDrawLakes) {
    drawLakes(app, container, physicalMap);
  }
  if (shouldDrawRivers) {
    drawRivers(app, container, physicalMap);
  }
  if (shouldDrawRelief) {
    drawRelief(app, container, physicalMap);
  }
  if (shouldDrawCells) {
    drawCells(app, container, physicalMap);
  }
};
