import * as d3Array from 'd3-array';
import * as d3Polygon from 'd3-polygon';
import Alea from 'alea';

import { PackedGrid, Point } from '../types/grid.ts';
import { biomeIcons, biomeIconsDensity } from '../data/biomes.ts';
import { getPackPolygon, poissonDiscSampler } from '../utils/graph.ts';
import { clamp, roundNumber } from '../utils/math.ts';
import { randomRange } from '../utils/probability.ts';

import reliefAcacia1 from '../assets/icons/relief-acacia-1.svg';
import reliefAcacia2 from '../assets/icons/relief-acacia-2-bw.svg';
import reliefCactus1 from '../assets/icons/relief-cactus-1-bw.svg';
import reliefCactus2 from '../assets/icons/relief-cactus-2-bw.svg';
import reliefCactus3 from '../assets/icons/relief-cactus-3-bw.svg';
import reliefConifer1 from '../assets/icons/relief-conifer-1.svg';
import reliefConifer2 from '../assets/icons/relief-conifer-2-bw.svg';
import reliefConiferSnow from '../assets/icons/relief-coniferSnow-1-bw.svg';
import reliefDeadTree1 from '../assets/icons/relief-deadTree-1-bw.svg';
import reliefDeadTree2 from '../assets/icons/relief-deadTree-2-bw.svg';
import reliefDeciduous1 from '../assets/icons/relief-deciduous-1.svg';
import reliefDeciduous2 from '../assets/icons/relief-deciduous-2-bw.svg';
import reliefDeciduous3 from '../assets/icons/relief-deciduous-3-bw.svg';
import reliefDune1 from '../assets/icons/relief-dune-1.svg';
import reliefDune2 from '../assets/icons/relief-dune-2-bw.svg';
import reliefGrass1 from '../assets/icons/relief-grass-1.svg';
import reliefGrass2 from '../assets/icons/relief-grass-2-bw.svg';
import reliefHill1 from '../assets/icons/relief-hill-1.svg';
import reliefHill2 from '../assets/icons/relief-hill-2-bw.svg';
import reliefHill3 from '../assets/icons/relief-hill-3-bw.svg';
import reliefHill4 from '../assets/icons/relief-hill-4-bw.svg';
import reliefHill5 from '../assets/icons/relief-hill-5-bw.svg';
import reliefMount1 from '../assets/icons/relief-mount-1.svg';
import reliefMount2 from '../assets/icons/relief-mount-2-bw.svg';
import reliefMount3 from '../assets/icons/relief-mount-3-bw.svg';
import reliefMount4 from '../assets/icons/relief-mount-4-bw.svg';
import reliefMount5 from '../assets/icons/relief-mount-5-bw.svg';
import reliefMount6 from '../assets/icons/relief-mount-6-bw.svg';
import reliefMount7 from '../assets/icons/relief-mount-7-bw.svg';
import reliefMountSnow1 from '../assets/icons/relief-mountSnow-1-bw.svg';
import reliefMountSnow2 from '../assets/icons/relief-mountSnow-2-bw.svg';
import reliefMountSnow3 from '../assets/icons/relief-mountSnow-3-bw.svg';
import reliefMountSnow4 from '../assets/icons/relief-mountSnow-4-bw.svg';
import reliefMountSnow5 from '../assets/icons/relief-mountSnow-5-bw.svg';
import reliefMountSnow6 from '../assets/icons/relief-mountSnow-6-bw.svg';
import reliefPalm1 from '../assets/icons/relief-palm-1.svg';
import reliefPalm2 from '../assets/icons/relief-palm-2-bw.svg';
import reliefSwamp1 from '../assets/icons/relief-swamp-1.svg';
import reliefSwamp2 from '../assets/icons/relief-swamp-2-bw.svg';
import reliefSwamp3 from '../assets/icons/relief-swamp-3-bw.svg';
import reliefVulcan1 from '../assets/icons/relief-vulcan-1-bw.svg';
import reliefVulcan2 from '../assets/icons/relief-vulcan-2-bw.svg';
import reliefVulcan3 from '../assets/icons/relief-vulcan-3-bw.svg';

const getIcon = (type: string): string => {
  const randomizer = Alea();

  switch (type) {
    case 'acacia':
      return [reliefAcacia1, reliefAcacia2][randomRange(randomizer, 0, 1)];
    case 'cactus':
      return [reliefCactus1, reliefCactus2, reliefCactus3][
        randomRange(randomizer, 0, 2)
      ];
    case 'conifer':
      return [reliefConifer1, reliefConifer2][randomRange(randomizer, 0, 1)];
    case 'coniferSnow':
      return reliefConiferSnow;
    case 'deadTree':
      return [reliefDeadTree1, reliefDeadTree2][randomRange(randomizer, 0, 1)];
    case 'deciduous':
      return [reliefDeciduous1, reliefDeciduous2, reliefDeciduous3][
        randomRange(randomizer, 0, 2)
      ];
    case 'dune':
      return [reliefDune1, reliefDune2][randomRange(randomizer, 0, 1)];
    case 'grass':
      return [reliefGrass1, reliefGrass2][randomRange(randomizer, 0, 1)];
    case 'hill':
      return [reliefHill1, reliefHill2, reliefHill3, reliefHill4, reliefHill5][
        randomRange(randomizer, 0, 4)
      ];
    case 'mount':
      return [
        reliefMount1,
        reliefMount2,
        reliefMount3,
        reliefMount4,
        reliefMount5,
        reliefMount6,
        reliefMount7,
      ][randomRange(randomizer, 0, 6)];
    case 'mountSnow':
      return [
        reliefMountSnow1,
        reliefMountSnow2,
        reliefMountSnow3,
        reliefMountSnow4,
        reliefMountSnow5,
        reliefMountSnow6,
      ][randomRange(randomizer, 0, 5)];
    case 'palm':
      return [reliefPalm1, reliefPalm2][randomRange(randomizer, 0, 1)];
    case 'swamp':
      return [reliefSwamp1, reliefSwamp2, reliefSwamp3][
        randomRange(randomizer, 0, 2)
      ];
    case 'vulcan':
      return [reliefVulcan1, reliefVulcan2, reliefVulcan3][
        randomRange(randomizer, 0, 2)
      ];
  }

  return '';
};

const getBiomeIcon = (grid: PackedGrid, i: number, b: string[]) => {
  let type = b[Math.floor(Math.random() * b.length)];

  const temp = grid.cells.temperatures[grid.cells.gridIndex[i]];
  if (type === 'conifer' && temp < 0) {
    type = 'coniferSnow';
  }

  return getIcon(type);
};

/**
 * Place all the icons for the biomes on the packed grid based on the biomes of the cells, the temperature, and the
 * height. The biomes will be randomly spaced out on a biome to avoid packing them too much together.
 */
export const placeBiomeIcons = (
  grid: PackedGrid,
  options: {
    iconDensity?: number;
    iconSize?: number;
  }
) => {
  const { cells } = grid;
  const { iconDensity = 0.4, iconSize = 0 } = options;

  const density = iconDensity || 0.4;
  const size = 2 * iconSize || 1;
  // size modifier
  const mod = 0.2 * size;
  const relief: {
    image: string;
    x: number;
    y: number;
    size: number;
  }[] = [];

  for (const i of cells.indexes) {
    const height = cells.heights[i];
    // no icons on water
    if (height < 20) {
      continue;
    }

    // no icons on rivers
    if (cells.rivers[i]) {
      continue;
    }

    const biome = cells.biomes[i];
    // no icons for this biome
    if (height < 50 && biomeIconsDensity[biome] === 0) {
      continue;
    }

    const polygon = getPackPolygon(grid, i);
    const [minX, maxX] = d3Array.extent(polygon, p => p[0]) as Point;
    const [minY, maxY] = d3Array.extent(polygon, p => p[1]) as Point;

    const placeBiomeIcons = (i: number, biome: number) => {
      const iconsDensity = biomeIconsDensity[biome] / 100;
      const radius = 2 / iconsDensity / density;
      if (Math.random() > iconsDensity * 10) {
        return;
      }

      for (const [cx, cy] of poissonDiscSampler(
        minX,
        minY,
        maxX,
        maxY,
        radius
      )) {
        if (!d3Polygon.polygonContains(polygon, [cx, cy])) {
          continue;
        }

        let h = (4 + Math.random()) * size;
        const icon = getBiomeIcon(grid, i, biomeIcons[biome]);
        if (icon === '#relief-grass-1') {
          h *= 1.2;
        }

        relief.push({
          image: icon,
          x: roundNumber(cx - h, 2),
          y: roundNumber(cy - h, 2),
          size: roundNumber(h * 2, 2),
        });
      }
    };

    const getReliefIcon = (i: number, h: number): [string, number] => {
      const temp = grid.cells.temperatures[grid.cells.gridIndex[i]];
      const type = h > 70 && temp < 0 ? 'mountSnow' : h > 70 ? 'mount' : 'hill';
      const size = h > 70 ? (h - 45) * mod : clamp((h - 40) * mod, 3, 6);
      return [getIcon(type), size];
    };

    const placeReliefIcons = (i: number, height: number) => {
      const radius = 2 / density;
      const [icon, h] = getReliefIcon(i, height);

      for (const [cx, cy] of poissonDiscSampler(
        minX,
        minY,
        maxX,
        maxY,
        radius
      )) {
        if (!d3Polygon.polygonContains(polygon, [cx, cy])) {
          continue;
        }
        relief.push({
          image: icon,
          x: roundNumber(cx - h, 2),
          y: roundNumber(cy - h, 2),
          size: roundNumber(h * 2, 2),
        });
      }
    };

    if (height < 50) {
      placeBiomeIcons(i, biome);
    } else {
      placeReliefIcons(i, height);
    }
  }

  // sort relief icons by y+size
  relief.sort((a, b) => a.y + a.size - (b.y + b.size));

  grid.biomeIcons = relief;
};
