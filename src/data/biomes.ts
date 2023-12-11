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

export const biomeNames = [
  'Marine',
  'Hot desert',
  'Cold desert',
  'Savanna',
  'Grassland',
  'Tropical seasonal forest',
  'Temperate deciduous forest',
  'Tropical rainforest',
  'Temperate rainforest',
  'Taiga',
  'Tundra',
  'Glacier',
  'Wetland',
];

export const biomeColor = [
  '#466eab',
  '#fbe79f',
  '#b5b887',
  '#d2d082',
  '#c8d68f',
  '#b6d95d',
  '#29bc56',
  '#7dcb35',
  '#409c43',
  '#4b6b32',
  '#96784b',
  '#d5e7eb',
  '#0b9131',
];

export const biomeHabitability = [
  0, 4, 10, 22, 30, 50, 100, 80, 90, 12, 4, 0, 12,
];
export const biomeIconsDensity = [
  0, 3, 2, 120, 120, 120, 120, 150, 150, 100, 5, 0, 150,
];
export const biomeIcons: string[][] = (
  [
    {},
    { dune: 3, cactus: 6, deadTree: 1 },
    { dune: 9, deadTree: 1 },
    { acacia: 1, grass: 9 },
    { grass: 1 },
    { acacia: 8, palm: 1 },
    { deciduous: 1 },
    { acacia: 5, palm: 3, deciduous: 1, swamp: 1 },
    { deciduous: 6, swamp: 1 },
    { conifer: 1 },
    { grass: 1 },
    {},
    { swamp: 1 },
  ] as Record<string, number>[]
).map((iconWeights: Record<string, number>) => {
  const currentWeightedArray: string[] = [];
  Object.entries(iconWeights).forEach(([key, weight]) => {
    for (let i = 0; i < weight; i++) {
      currentWeightedArray.push(key);
    }
  });

  return currentWeightedArray;
});

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
