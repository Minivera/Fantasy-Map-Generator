import { FunctionComponent } from 'react';
import { Stage } from '@pixi/react';

import { PackedGrid } from '../types/grid.ts';

import { ViewportContainer } from './ViewportContainer.tsx';
import { Landmasses } from './Landmasses.tsx';

interface MapProps {
  physicalMap: PackedGrid | null;
  graphHeight: number;
  graphWidth: number;
}

export const Map: FunctionComponent<MapProps> = ({
  physicalMap,
  graphHeight,
  graphWidth,
}) => {
  if (!physicalMap) {
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
        <Landmasses physicalMap={physicalMap} />
      </ViewportContainer>
    </Stage>
  );
};
