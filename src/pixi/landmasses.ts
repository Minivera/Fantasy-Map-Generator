import { Application, Graphics } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import * as d3Array from 'd3-array';
import * as d3Scale from 'd3-scale';
import * as d3ScaleChromatic from 'd3-scale-chromatic';

import { PhysicalMap } from '../types/map.ts';
import { heightmapColors } from '../data/colors.ts';
import { drawVertexPath } from './drawUtils.ts';

interface landmassesOptions {
  shouldDrawCellHeight?: boolean;
  shouldDrawCellHeightType?: boolean;
  shouldDrawCellTemperature?: boolean;
}

export const drawLandmasses = (
  _app: Application,
  container: Viewport,
  physicalMap: PhysicalMap,
  {
    shouldDrawCellHeight = false,
    shouldDrawCellHeightType = false,
    shouldDrawCellTemperature = false,
  }: landmassesOptions
) => {
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

      // Drawing the cell content only, not the borders
      cellHeights.fill({
        color,
        alpha: 1,
      });

      drawVertexPath(cellHeights, physicalMap.grid.vertices, cell.vertices);
    });

    container.addChild(cellHeights);
  }

  if (shouldDrawCellHeightType) {
    const cellHeightsTypes = new Graphics();

    physicalMap.heightmap.heights.forEach((height, i) => {
      const cell = physicalMap.grid.cells[i];
      const color = heightmapColors[height.type];

      // Drawing the cell content only, not the borders
      cellHeightsTypes.fill({
        color,
        alpha: 1,
      });

      drawVertexPath(
        cellHeightsTypes,
        physicalMap.grid.vertices,
        cell.vertices
      );
    });

    container.addChild(cellHeightsTypes);
  }
  if (shouldDrawCellTemperature) {
    const cellHeights = new Graphics();

    const colorSchemeTemperature = d3Scale.scaleSequential(
      d3ScaleChromatic.interpolateBuGn
    );
    const minTemp = d3Array.min(
      physicalMap.featuresMap.features.map(el => el.temperature)
    ) as number;
    const maxTemp = d3Array.max(
      physicalMap.featuresMap.features.map(el => el.temperature)
    ) as number;
    console.log(
      physicalMap.featuresMap.features.map(
        feature =>
          ((feature.temperature + (minTemp < 0 ? -minTemp : 0)) * 100) /
          (maxTemp - minTemp) /
          100
      )
    );
    physicalMap.featuresMap.features.forEach((feature, i) => {
      const cell = physicalMap.grid.cells[i];
      const color = colorSchemeTemperature(
        ((feature.temperature + (minTemp < 0 ? -minTemp : 0)) * 100) /
          (maxTemp - minTemp) /
          100
      );

      // Drawing the cell content only, not the borders
      cellHeights.fill({
        color,
        alpha: 1,
      });

      drawVertexPath(cellHeights, physicalMap.grid.vertices, cell.vertices);
    });

    container.addChild(cellHeights);
  }
};
