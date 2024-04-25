import { Texture } from 'pixi.js';

import dirtPattern from '../assets/dirt_pattern.png';
import grassPattern from '../assets/grass_pattern.png';
import icePattern from '../assets/ice_pattern.png';
import leavesPattern from '../assets/leaves_pattern.png';
import sandPattern from '../assets/sand_pattern.png';
import stonePattern from '../assets/stone_pattern.png';

export enum BiomeIndexes {
  MARINE,
  HOT_DESERT,
  COLD_DESERT,
  SAVANNA,
  GRASSLAND,
  TROPICAL_SEASONAL_FOREST,
  TEMPERATE_DECIDUOUS_FOREST,
  TROPICAL_RAINFOREST,
  TEMPERATE_RAINFOREST,
  TAIGA,
  TUNDRA,
  GLACIER,
  WETLAND,
}

export const biomeNames: Record<BiomeIndexes, string> = {
  [BiomeIndexes.MARINE]: 'Marine',
  [BiomeIndexes.HOT_DESERT]: 'Hot desert',
  [BiomeIndexes.COLD_DESERT]: 'Cold desert',
  [BiomeIndexes.SAVANNA]: 'Savanna',
  [BiomeIndexes.GRASSLAND]: 'Grassland',
  [BiomeIndexes.TROPICAL_SEASONAL_FOREST]: 'Tropical seasonal forest',
  [BiomeIndexes.TEMPERATE_DECIDUOUS_FOREST]: 'Temperate deciduous forest',
  [BiomeIndexes.TROPICAL_RAINFOREST]: 'Tropical rainforest',
  [BiomeIndexes.TEMPERATE_RAINFOREST]: 'Temperate rainforest',
  [BiomeIndexes.TAIGA]: 'Taiga',
  [BiomeIndexes.TUNDRA]: 'Tundra',
  [BiomeIndexes.GLACIER]: 'Glacier',
  [BiomeIndexes.WETLAND]: 'Wetland',
};

export const biomeColor: Record<BiomeIndexes, string> = {
  [BiomeIndexes.MARINE]: '#466eab',
  [BiomeIndexes.HOT_DESERT]: '#fbe79f',
  [BiomeIndexes.COLD_DESERT]: '#b5b887',
  [BiomeIndexes.SAVANNA]: '#d2d082',
  [BiomeIndexes.GRASSLAND]: '#5cbc5f',
  [BiomeIndexes.TROPICAL_SEASONAL_FOREST]: '#7dcb35',
  [BiomeIndexes.TEMPERATE_DECIDUOUS_FOREST]: '#409c43',
  [BiomeIndexes.TROPICAL_RAINFOREST]: '#3e651a',
  [BiomeIndexes.TEMPERATE_RAINFOREST]: '#2c6d2f',
  [BiomeIndexes.TAIGA]: '#d6d0c7',
  [BiomeIndexes.TUNDRA]: '#d5e7eb',
  [BiomeIndexes.GLACIER]: '#eef5f7',
  [BiomeIndexes.WETLAND]: '#0b9131',
};

const dirtTexture = Texture.from(dirtPattern);
const grassTexture = Texture.from(grassPattern);
const iceTexture = Texture.from(icePattern);
const leaveTexture = Texture.from(leavesPattern);
const sandTexture = Texture.from(sandPattern);
const stoneTexture = Texture.from(stonePattern);

export const biomeTextures: Record<BiomeIndexes, Texture | null> = {
  [BiomeIndexes.MARINE]: null,
  [BiomeIndexes.HOT_DESERT]: sandTexture,
  [BiomeIndexes.COLD_DESERT]: sandTexture,
  [BiomeIndexes.SAVANNA]: grassTexture,
  [BiomeIndexes.GRASSLAND]: grassTexture,
  [BiomeIndexes.TROPICAL_SEASONAL_FOREST]: leaveTexture,
  [BiomeIndexes.TEMPERATE_DECIDUOUS_FOREST]: grassTexture,
  [BiomeIndexes.TROPICAL_RAINFOREST]: leaveTexture,
  [BiomeIndexes.TEMPERATE_RAINFOREST]: leaveTexture,
  [BiomeIndexes.TAIGA]: dirtTexture,
  [BiomeIndexes.TUNDRA]: stoneTexture,
  [BiomeIndexes.GLACIER]: iceTexture,
  [BiomeIndexes.WETLAND]: dirtTexture,
};

export const biomeHabitability = [
  0, 4, 10, 22, 30, 50, 100, 80, 90, 12, 4, 0, 12,
];
export const biomeIconsDensity = [
  0, 3, 2, 120, 120, 120, 120, 150, 150, 100, 5, 0, 150,
];
export const biomeIcons: string[][] = Object.values({
  [BiomeIndexes.MARINE]: {},
  [BiomeIndexes.HOT_DESERT]: { dune: 3, cactus: 6, deadTree: 1 },
  [BiomeIndexes.COLD_DESERT]: { dune: 9, deadTree: 1 },
  [BiomeIndexes.SAVANNA]: { acacia: 1, grass: 9 },
  [BiomeIndexes.GRASSLAND]: { grass: 1 },
  [BiomeIndexes.TROPICAL_SEASONAL_FOREST]: { acacia: 8, palm: 1 },
  [BiomeIndexes.TEMPERATE_DECIDUOUS_FOREST]: { deciduous: 1 },
  [BiomeIndexes.TROPICAL_RAINFOREST]: {
    acacia: 5,
    palm: 3,
    deciduous: 1,
    swamp: 1,
  },
  [BiomeIndexes.TEMPERATE_RAINFOREST]: { deciduous: 6, swamp: 1 },
  [BiomeIndexes.TAIGA]: { conifer: 1 },
  [BiomeIndexes.TUNDRA]: { grass: 1 },
  [BiomeIndexes.GLACIER]: {},
  [BiomeIndexes.WETLAND]: { swamp: 1 },
} as Record<BiomeIndexes, Record<string, number>>).map(
  (iconWeights: Record<string, number>) => {
    const currentWeightedArray: string[] = [];
    Object.entries(iconWeights).forEach(([key, weight]) => {
      for (let i = 0; i < weight; i++) {
        currentWeightedArray.push(key);
      }
    });

    return currentWeightedArray;
  }
);

// biome movement cost
export const biomeCost = [
  10, 200, 150, 60, 50, 70, 70, 80, 90, 200, 1000, 5000, 150,
];
export const biomesMartix = [
  // hot ↔ cold [>19°C; <-4°C]; dry ↕ wet
  new Uint8Array([
    1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    10,
  ]),
  new Uint8Array([
    3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 9, 9, 9, 9, 10, 10,
    10,
  ]),
  new Uint8Array([
    5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 9, 9, 9, 9, 9, 10, 10,
    10,
  ]),
  new Uint8Array([
    5, 6, 6, 6, 6, 6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 10, 10,
    10,
  ]),
  new Uint8Array([
    7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 10,
    10,
  ]),
];

export const indexes = Array.from(Array(biomeIcons.length).keys());
