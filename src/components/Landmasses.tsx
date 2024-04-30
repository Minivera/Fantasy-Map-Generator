import { FunctionComponent, useMemo } from 'react';
import { Shape } from 'three';
import { Instances } from '@react-three/drei';

import { PackedGrid } from '../types/grid.ts';

interface LandmassesProps {
  physicalMap: PackedGrid;

  shouldDrawCells?: boolean;
  shouldDrawBiomes?: boolean;
  shouldDrawHeightmap?: boolean;
  shouldDrawHeightIndicators?: boolean;
  shouldDrawTemperatureIndicators?: boolean;
  shouldDrawLakes?: boolean;
  shouldDrawRivers?: boolean;
  shouldDrawIcons?: boolean;
}

interface CellProps {
  color: number;
  fillOpacity: number;
  shape: Shape;
}

const debugCoastlines = false;

const Cell: FunctionComponent<CellProps> = ({ color, shape, fillOpacity }) => (
  <mesh>
    <meshBasicMaterial color={color} opacity={fillOpacity} />
    <shapeGeometry args={[shape]} />
  </mesh>
);

export const Landmasses: FunctionComponent<LandmassesProps> = ({
  physicalMap,
  shouldDrawCells = false,
  shouldDrawBiomes = false,
  shouldDrawHeightmap = false,
  shouldDrawHeightIndicators = false,
  shouldDrawTemperatureIndicators = false,
  shouldDrawLakes = false,
  shouldDrawRivers = false,
  shouldDrawIcons = false,
}) => {
  const cells = useMemo(() => {
    return physicalMap.cells.vertices.map(cellVertices => {
      const path = new Shape();

      const [start, ...rest] = cellVertices;
      path.moveTo(
        physicalMap.vertices.coordinates[start][0],
        physicalMap.vertices.coordinates[start][1]
      );

      rest.forEach(vertex => {
        path.lineTo(
          physicalMap.vertices.coordinates[vertex][0],
          physicalMap.vertices.coordinates[vertex][1]
        );
      });

      return { shape: path, color: 0xff0000, fillOpacity: 1 };
    });
  }, [physicalMap]);

  return (
    <>
      {shouldDrawCells &&
        cells.map(props => <Cell key={props.shape.uuid} {...props} />)}
    </>
  );
};
