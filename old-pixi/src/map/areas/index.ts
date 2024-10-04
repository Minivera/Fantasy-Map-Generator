import Alea from 'alea';

import { PackedGrid } from '../../types/grid.ts';

import { defineAreas, groupAreas } from './areas.ts';
import { defineRegions, groupRegions } from './regions.ts';
import { AreaMap } from '../../types/areas.ts';

export const generateAreaMap = (
  randomizer: ReturnType<typeof Alea>,
  physicalMap: PackedGrid,
  options: {
    /**
     * The minimum area size for a single area. The generation will try to make sure all areas are, at least, this
     * size. Smaller areas may still exist if it's not possible to make them bigger.
     */
    minAreaSize: number;

    /**
     * Maximum size for an area. The generation may still create bigger area, this size is used to limit the initial
     * size of the area when selecting the base cells. The area will always be reduced afterwards as we remove cells
     * that don't match the original cell.
     */
    maxAreaSize: number;

    /**
     * How many cells to drop from the initial selection. We will then try to select cells adjacent to the original
     * selection to make the cells shape more randomized. We will always try to add as many cells back as possible.
     */
    cellsToDrop: number;

    /**
     * The minimum area size for a single region. The generation will try to make sure all regions are, at least, this
     * size. Smaller regions may still exist if it's not possible to make them bigger.
     */
    minRegionSize: number;

    /**
     * Width of the physical map graph to display on scree.
     */
    graphWidth: number;

    /**
     * Height of the physical map graph to display on scree.
     */
    graphHeight: number;
  }
): AreaMap => {
  const areas = defineAreas(randomizer, physicalMap, options);
  groupAreas(physicalMap, areas, options.graphWidth, options.graphHeight);

  const regions = defineRegions(physicalMap, areas, options);
  groupRegions(physicalMap, regions, options.graphWidth, options.graphHeight);

  return {
    areas,
    regions,
  };
};
