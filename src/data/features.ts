import { LakeFeatureGroup } from '../types/grid.ts';

export const LakeColors: Record<
  LakeFeatureGroup,
  { outline: string; outlineWidth: number; fill: string; fillAlpha: number }
> = {
  [LakeFeatureGroup.DRY]: {
    fillAlpha: 1,
    fill: '#c9bfa7',
    outline: '#8e816f',
    outlineWidth: 0.7,
  },
  [LakeFeatureGroup.LAVA]: {
    fillAlpha: 0.7,
    fill: '#90270d',
    outline: '#f93e0c',
    outlineWidth: 2,
  },
  [LakeFeatureGroup.FROZEN]: {
    fillAlpha: 0.95,
    fill: '#cdd4e7',
    outline: '#cfe0eb',
    outlineWidth: 0,
  },
  [LakeFeatureGroup.SALT]: {
    fillAlpha: 0.5,
    fill: '#409b8a',
    outline: '#388985',
    outlineWidth: 0.7,
  },
  [LakeFeatureGroup.FRESHWATER]: {
    fillAlpha: 0.5,
    fill: '#a6c1fd',
    outline: '#5f799d',
    outlineWidth: 0.7,
  },
};
