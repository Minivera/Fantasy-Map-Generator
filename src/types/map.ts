import { Grid } from './grid.ts';
import { Heightmap } from './heightmap.ts';
import { FeaturesMap } from './featuresMap.ts';

export interface Coordinates {
  latitudeT: number;
  latitudeN: number;
  latitudeS: number;
  longitudeT: number;
  longitudeW: number;
  longitudeE: number;
}

export interface PhysicalMap {
  grid: Grid;
  heightmap: Heightmap;
  featuresMap: FeaturesMap;

  coordinates: Coordinates;
}
