import { HeightType } from '../types/heightmap.ts';
import { LandType } from '../types/featuresMap.ts';

export const coastlineColor = '#c0af7a';
export const cellsColor = '#808080';

export const oceanColor = '#466eab';
export const oceanLayerColor = '#ecf2f9';
export const riverColor = '#5d97bb';

export const heightmapColors: Record<HeightType, string> = {
  [HeightType.WATER]: '#494a85',
  [HeightType.COASTAL]: '#248674',
  [HeightType.WETLANDS]: '#347e69',
  [HeightType.FLATLAND]: '#609737',
  [HeightType.HILLS]: '#69847d',
  [HeightType.PLATEAU]: '#78682c',
  [HeightType.MOUNTAIN]: '#5e2b17',
};

export const landColors: Record<LandType, string> = {
  [LandType.OCEAN]: '#466eab',
  [LandType.SEA]: '#409b8a',
  [LandType.LAKE]: '#a6c1fd',
  [LandType.LAND]: '#609737',
};
