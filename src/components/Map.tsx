import { FunctionComponent } from 'react';
import { Stage } from '@pixi/react';

import { PackedGrid } from '../types/grid.ts';
import { Areas as AreasType } from '../types/areas.ts';

import { ViewportContainer } from './ViewportContainer.tsx';
import { Landmasses } from './Landmasses.tsx';
import { Areas } from './Areas.tsx';

interface MapProps {
  physicalMap: PackedGrid | null;
  areaMap: AreasType | null;
  graphHeight: number;
  graphWidth: number;
}

export const Map: FunctionComponent<MapProps> = ({
  physicalMap,
  areaMap,
  graphHeight,
  graphWidth,
}) => {
  if (!physicalMap || !areaMap) {
    return null;
  }

  return (
    <Stage
      width={graphWidth}
      height={graphHeight}
      options={{
        antialias: true,
        background: 0x466eab,
        backgroundAlpha: 0.75,
      }}
    >
      <ViewportContainer>
        <Landmasses
          physicalMap={physicalMap}
          shouldDrawLakes={true}
          shouldDrawRivers={true}
          shouldDrawBiomes={false}
          shouldDrawHeightmap={true}
          shouldDrawIcons={false}
          shouldDrawCells={true}
        />
        <Areas areaMap={areaMap} shouldDrawArea={true} />
      </ViewportContainer>
    </Stage>
  );
};
