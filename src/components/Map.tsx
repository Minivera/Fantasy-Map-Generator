import { FunctionComponent } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';

import { PackedGrid } from '../types/grid.ts';
import { AreaMap } from '../types/areas.ts';
import {
  MapControls,
  OrthographicCamera,
  PerspectiveCamera,
} from '@react-three/drei';
import { Landmasses } from './Landmasses.tsx';
import { Controls } from './Controls.tsx';

interface MapProps {
  physicalMap: PackedGrid | null;
  areaMap: AreaMap | null;
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
    <Canvas
      gl={canvas => {
        const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
        renderer.setSize(graphWidth, graphHeight);

        return renderer;
      }}
    >
      <PerspectiveCamera
        makeDefault
        near={10}
        far={1000}
        aspect={graphWidth / graphHeight}
        position={[0, 0, 800]}
        up={[0, 0, 0]}
      />
      <Controls graphWidth={graphWidth} graphHeight={graphHeight} />
      <color attach="background" args={[243, 243, 243]} />
      <group position={[-(graphWidth / 2), -(graphHeight / 2), 20]}>
        <Landmasses physicalMap={physicalMap} shouldDrawCells />
      </group>
      <ambientLight args={[0x000000]} intensity={0.1} />
      <directionalLight position={[0, 0, 500]} intensity={0.5} />
    </Canvas>
  );
};
