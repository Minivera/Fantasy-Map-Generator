import { HeightType } from '../types/heightmap.ts';

export const coastlineColor = '#c0af7a';
export const cellsColor = '#808080';

export const oceanColor = '#466eab';
export const oceanLayerColor = '#ecf2f9';
export const riverColor = '#5d97bb';

export const heightmapColors: Record<HeightType, string> = {
  [HeightType.OCEAN]: '#494a85',
  [HeightType.COASTAL]: '#248674',
  [HeightType.WETLANDS]: '#347e69',
  [HeightType.FLATLAND]: '#609737',
  [HeightType.HILLS]: '#69847d',
  [HeightType.PLATEAU]: '#78682c',
  [HeightType.MOUNTAIN]: '#5e2b17',
};
