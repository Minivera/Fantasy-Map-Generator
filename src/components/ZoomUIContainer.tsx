import { FunctionComponent, PropsWithChildren, useState } from 'react';
import { Container, useApp } from '@pixi/react';

import { Point } from '../types/grid.ts';

interface ZoomUIContainerProps {}

// TODO: Switch to viewport: https://pixijs.io/pixi-react/custom-component/
export const ZoomUIContainer: FunctionComponent<
  PropsWithChildren<ZoomUIContainerProps>
> = ({ children }) => {
  const app = useApp();

  const [scale, setScale] = useState<Point>([1, 1]);
  const [position, setPosition] = useState<Point>([0, 0]);
  const [dragging, setDragging] = useState(false);
  const [, setPrevMousePos] = useState<Point>([0, 0]);

  console.log(scale, position);
  return (
    <Container
      onwheel={(e: WheelEvent) => {
        const direction = e.deltaY < 0 ? 1 : -1;

        const factor = 1 + direction * 0.1;
        setScale(prevScale => [
          Math.max(1, Math.min(prevScale[0] * factor, 5)),
          Math.max(1, Math.min(prevScale[1] * factor, 5)),
        ]);
      }}
      onmousedown={e => {
        const pos = e.global;
        setDragging(true);

        setPrevMousePos([pos.x, pos.y]);
      }}
      onmouseup={() => setDragging(false)}
      onmouseleave={() => setDragging(false)}
      onmousemove={moveData => {
        if (!dragging) {
          return;
        }

        const pos = moveData.global;
        setPrevMousePos(prevMousePos => {
          setPosition(prevPosition => {
            const dx = pos.x - prevMousePos[0];
            const dy = pos.y - prevMousePos[1];

            return [
              Math.max(
                -app.stage.width,
                Math.min(prevPosition[0] + dx, app.stage.width)
              ),
              Math.max(
                -app.stage.height,
                Math.min(prevPosition[1] + dy, app.stage.height)
              ),
            ];
          });

          return [pos.x, pos.y];
        });
      }}
      position={position}
      scale={scale}
      eventMode="static"
    >
      {children}
    </Container>
  );
};
