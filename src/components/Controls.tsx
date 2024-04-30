import { FunctionComponent, useCallback } from 'react';
import * as THREE from 'three';
import { MapControls as MapControlsImpl } from 'three-stdlib';
import { useThree } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';

export interface ControlsProps {
  graphWidth: number;
  graphHeight: number;
}

export const Controls: FunctionComponent<ControlsProps> = ({
  graphWidth,
  graphHeight,
}) => {
  const { camera, size } = useThree();

  const limitPanningDistance = useCallback(
    (scope: MapControlsImpl) => {
      const pan = (graphWidth * camera.zoom - size.width) / 2 / camera.zoom;
      const vertical =
        (graphHeight * camera.zoom - size.height) / 2 / camera.zoom;

      const maxX = pan;
      const minX = -pan;
      const maxY = vertical;
      const minY = -vertical;
      scope.target.clamp(
        new THREE.Vector3(minX, minY, 0),
        new THREE.Vector3(maxX, maxY, 999999)
      );
    },
    [camera.zoom, size, graphWidth, graphHeight]
  );

  return (
    <MapControls
      onUpdate={limitPanningDistance}
      makeDefault
      minDistance={15}
      maxDistance={1000}
      zoomToCursor
      enableRotate={false}
      enableDamping={false}
      screenSpacePanning
    />
  );
};
