import { Application, FederatedPointerEvent, Graphics } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import * as d3Array from 'd3-array';
import * as d3Scale from 'd3-scale';
import * as d3ScaleChromatic from 'd3-scale-chromatic';

import { PhysicalMap } from '../types/map.ts';
import { heightmapColors, landColors } from '../data/colors.ts';
import { findGridCellUnderPoint } from '../utils/grid.ts';

import { drawVertexPath } from './drawUtils.ts';
import { roundNumber } from '../utils/math.ts';
import { LandType } from '../types/featuresMap.ts';
import { coastlineColor } from '../../old-pixi/src/data/colors.ts';
import { drawD3ClosedPath } from '../../old-pixi/src/pixi/drawUtils.ts';

interface landmassesOptions {
  shouldDrawCoastlines?: boolean;
  shouldDrawCellHeight?: boolean;
  shouldDrawCellLandType?: boolean;
  shouldDrawCellHeightType?: boolean;
  shouldDrawCellTemperature?: boolean;
  shouldDrawCellPrecipitation?: boolean;
}

export const drawLandmasses = (
  _app: Application,
  container: Viewport,
  physicalMap: PhysicalMap,
  {
    shouldDrawCoastlines = false,
    shouldDrawCellHeight = false,
    shouldDrawCellLandType = false,
    shouldDrawCellHeightType = false,
    shouldDrawCellTemperature = false,
    shouldDrawCellPrecipitation = false,
  }: landmassesOptions,
  onCellHover: (message?: string) => void
) => {
  const getCellUnderCursor = (event: FederatedPointerEvent) => {
    const position = container.toWorld(event.client);
    const found = findGridCellUnderPoint(
      [position.x, position.y],
      physicalMap.grid
    );
    if (!found) {
      return undefined;
    }

    return found[0];
  };

  const getHeightUnderCursor = (event: FederatedPointerEvent) => {
    const found = getCellUnderCursor(event);
    if (!found) {
      return undefined;
    }

    return physicalMap.heightmap.heights[found];
  };

  const getFeatureUnderCursor = (event: FederatedPointerEvent) => {
    const found = getCellUnderCursor(event);
    if (!found) {
      return undefined;
    }

    return physicalMap.featuresMap.features[found];
  };

  if (shouldDrawCellHeight) {
    const cellHeights = new Graphics();

    const colorSchemeLand = d3Scale.scaleSequential(
      d3ScaleChromatic.interpolateRdYlGn
    );
    const colorSchemeWater = d3Scale.scaleSequential(
      d3ScaleChromatic.interpolateGnBu
    );
    physicalMap.heightmap.heights.forEach((height, i) => {
      const cell = physicalMap.grid.cells[i];
      const color =
        height.height <= 20
          ? colorSchemeWater(1 - ((height.height - 5) * 100) / 20 / 100)
          : colorSchemeLand(1 - (height.height * 100) / 80 / 100);

      drawVertexPath(cellHeights, physicalMap.grid.vertices, cell.vertices);

      // Drawing the cell content only, not the borders
      cellHeights.fill({
        color,
        alpha: 1,
      });
    });

    cellHeights.on('mousemove', event => {
      const height = getHeightUnderCursor(event);
      const h = height?.height;
      onCellHover(
        h
          ? `Elevation: ${Math.floor(
              h >= 20 ? Math.pow(h - 18, 2) : ((h - 20) / h) * 50
            )} m`
          : undefined
      );
    });
    cellHeights.on('mouseleave', () => {
      onCellHover(undefined);
    });
    cellHeights.eventMode = 'static';

    container.addChild(cellHeights);
  }

  if (shouldDrawCellLandType) {
    const cellLandTypes = new Graphics();

    physicalMap.featuresMap.features.forEach((feature, i) => {
      const cell = physicalMap.grid.cells[i];
      const color = landColors[feature.type];

      drawVertexPath(cellLandTypes, physicalMap.grid.vertices, cell.vertices);

      // Drawing the cell content only, not the borders
      cellLandTypes.fill({
        color,
        alpha: 1,
      });
    });

    cellLandTypes.on('mousemove', event => {
      const feature = getFeatureUnderCursor(event);
      onCellHover(
        feature
          ? `Land type: ${
              feature.type.charAt(0).toUpperCase() +
              feature.type.slice(1).toLowerCase()
            }`
          : undefined
      );
    });
    cellLandTypes.on('mouseleave', () => {
      onCellHover(undefined);
    });
    cellLandTypes.eventMode = 'static';

    container.addChild(cellLandTypes);
  }

  if (shouldDrawCellHeightType) {
    const cellHeightsTypes = new Graphics();

    physicalMap.heightmap.heights.forEach((height, i) => {
      const cell = physicalMap.grid.cells[i];
      const color = heightmapColors[height.type];

      drawVertexPath(
        cellHeightsTypes,
        physicalMap.grid.vertices,
        cell.vertices
      );

      // Drawing the cell content only, not the borders
      cellHeightsTypes.fill({
        color,
        alpha: 1,
      });
    });

    cellHeightsTypes.on('mousemove', event => {
      const height = getHeightUnderCursor(event);
      onCellHover(
        height
          ? `Elevation type: ${
              height.type.charAt(0).toUpperCase() +
              height.type.slice(1).toLowerCase()
            }`
          : undefined
      );
    });
    cellHeightsTypes.on('mouseleave', () => {
      onCellHover(undefined);
    });
    cellHeightsTypes.eventMode = 'static';

    container.addChild(cellHeightsTypes);
  }

  if (shouldDrawCellTemperature) {
    const cellTemperatures = new Graphics();

    const colorSchemeTemperature = d3Scale.scaleSequential(
      d3ScaleChromatic.interpolateGreens
    );
    const minTemp = d3Array.min(
      physicalMap.featuresMap.features.map(el => el.temperature)
    ) as number;
    const maxTemp = d3Array.max(
      physicalMap.featuresMap.features.map(el => el.temperature)
    ) as number;
    physicalMap.featuresMap.features.forEach((feature, i) => {
      const cell = physicalMap.grid.cells[i];
      const color = colorSchemeTemperature(
        ((feature.temperature + (minTemp < 0 ? -minTemp : 0)) * 100) /
          (maxTemp - minTemp) /
          100
      );

      drawVertexPath(
        cellTemperatures,
        physicalMap.grid.vertices,
        cell.vertices
      );

      // Drawing the cell content only, not the borders
      cellTemperatures.fill({
        color,
        alpha: 1,
      });
    });

    cellTemperatures.on('mousemove', event => {
      const feature = getFeatureUnderCursor(event);
      onCellHover(
        feature
          ? `Temperature: ${roundNumber(feature.temperature)} °C`
          : undefined
      );
    });
    cellTemperatures.on('mouseleave', () => {
      onCellHover(undefined);
    });
    cellTemperatures.eventMode = 'static';

    container.addChild(cellTemperatures);
  }

  if (shouldDrawCellPrecipitation) {
    const cellPrecipitation = new Graphics();

    const colorSchemePrecipitation = d3Scale.scaleSequential(
      d3ScaleChromatic.interpolateBlues
    );
    const maxPrecipitation = d3Array.max(
      physicalMap.featuresMap.features.map(el => el.precipitation)
    ) as number;
    physicalMap.featuresMap.features.forEach((feature, i) => {
      if (feature.type !== LandType.LAND) {
        return;
      }

      const cell = physicalMap.grid.cells[i];
      const color = colorSchemePrecipitation(
        (feature.precipitation * 100) / maxPrecipitation / 100
      );

      drawVertexPath(
        cellPrecipitation,
        physicalMap.grid.vertices,
        cell.vertices
      );

      // Drawing the cell content only, not the borders
      cellPrecipitation.fill({
        color,
        alpha: 1,
      });
    });

    cellPrecipitation.on('mousemove', event => {
      const feature = getFeatureUnderCursor(event);
      onCellHover(
        feature ? `Precipitation: ${feature.precipitation * 100} mm` : undefined
      );
    });
    cellPrecipitation.on('mouseleave', () => {
      onCellHover(undefined);
    });
    cellPrecipitation.eventMode = 'static';

    container.addChild(cellPrecipitation);
  }

  if (shouldDrawCoastlines) {
    const coastlines = new Graphics();

    physicalMap.heightmap.landmasses.forEach(landmass => {
      drawD3ClosedPath(coastlines, landmass.coastline);

      coastlines.stroke({
        width: 1,
        color: coastlineColor,
        alpha: 1,
      });
    });

    container.addChild(coastlines);
  }
};
