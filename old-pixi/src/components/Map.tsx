import { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';

import { PackedGrid } from '../types/grid.ts';
import { AreaMap } from '../types/areas.ts';

import { createStage, createViewport } from '../pixi/stage.ts';
import { drawLandmasses } from '../pixi/landmasses.ts';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef<boolean>();

  const [app, setApp] = useState<Application | null>(null);

  useEffect(() => {
    if (!physicalMap || !areaMap || !containerRef.current) {
      return;
    }

    if (!startedRef.current) {
      startedRef.current = true;
      createStage(containerRef.current, { graphWidth, graphHeight }).then(
        app => {
          setApp(app);
          const viewport = createViewport(app);
          drawLandmasses(app, viewport, physicalMap, {
            shouldDrawCells: true,
          });
        }
      );
    }

    return () => {
      if (app) {
        app.destroy();
        containerRef.current?.removeChild(app.canvas);
        setApp(null);
        startedRef.current = false;
      }
    };
  }, [physicalMap, areaMap, containerRef.current, setApp, startedRef.current]);

  if (!physicalMap || !areaMap) {
    return null;
  }

  return <div ref={containerRef} />;
};
