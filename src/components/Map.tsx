import { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';

import { PhysicalMap } from '../types/map.ts';

import { createStage, createViewport } from '../pixi/stage.ts';
import { drawCells } from '../pixi/grid.ts';
import { drawLandmasses } from '../pixi/landmasses.ts';
import { Viewport } from 'pixi-viewport';

interface MapProps {
  physicalMap: PhysicalMap | null;
  graphHeight: number;
  graphWidth: number;

  onRequestGeneration: () => void;
}

export const Map: FunctionComponent<MapProps> = ({
  physicalMap,
  graphHeight,
  graphWidth,
  onRequestGeneration,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef<boolean>();

  const [app, setApp] = useState<Application | null>(null);
  const viewport = useRef<Viewport | null>(null);
  const [whatToRender, setWhatToRender] = useState<
    Parameters<typeof drawLandmasses>[3] & Parameters<typeof drawCells>[3]
  >({
    shouldDrawCells: true,
    shouldDrawCellHeight: true,
    shouldDrawCellHeightType: false,
    shouldDrawCellTemperature: false,
  });

  useEffect(() => {
    const generateStage = () => {
      if (!physicalMap || !containerRef.current || startedRef.current) {
        return;
      }

      startedRef.current = true;
      createStage(containerRef.current, { graphWidth, graphHeight }).then(
        stage => {
          setApp(stage);
          viewport.current = createViewport(stage);
        }
      );
    };

    generateStage();
    return () => {
      if (app) {
        app.destroy();
        containerRef.current?.removeChild(app.canvas);
        setApp(null);
        startedRef.current = false;
      }
    };
  }, [containerRef.current, startedRef.current]);

  useEffect(() => {
    if (!app || !viewport.current || !physicalMap) {
      return;
    }

    viewport.current.children.forEach(
      child => viewport.current?.removeChild(child)
    );

    drawLandmasses(app, viewport.current, physicalMap, whatToRender);
    drawCells(app, viewport.current, physicalMap, whatToRender);
  }, [app, !viewport.current, physicalMap, whatToRender]);

  if (!physicalMap) {
    return null;
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 5,
          left: 5,
          backgroundColor: 'white',
        }}
      >
        <fieldset>
          <legend>Cell render options</legend>
          <label htmlFor="cells">Render cells:</label>
          <input
            type="checkbox"
            id="cells"
            onChange={() =>
              setWhatToRender(options => ({
                ...options,
                shouldDrawCells: !options.shouldDrawCells,
              }))
            }
            checked={whatToRender.shouldDrawCells}
          />
        </fieldset>
        <fieldset>
          <legend>Physical map render options</legend>
          <label htmlFor="heightmap">Render Heightmap:</label>
          <input
            type="checkbox"
            id="heightmap"
            onChange={() =>
              setWhatToRender(options => ({
                ...options,
                shouldDrawCellHeight: !options.shouldDrawCellHeight,
              }))
            }
            checked={whatToRender.shouldDrawCellHeight}
          />
          <br />
          <br />
          <label htmlFor="heightgroups">Render Height groups:</label>
          <input
            type="checkbox"
            id="heightgroups"
            onChange={() =>
              setWhatToRender(options => ({
                ...options,
                shouldDrawCellHeightType: !options.shouldDrawCellHeightType,
              }))
            }
            checked={whatToRender.shouldDrawCellHeightType}
          />
          <br />
          <br />
          <label htmlFor="temperaturelevels">Render temperature levels:</label>
          <input
            type="checkbox"
            id="temperaturelevels"
            onChange={() =>
              setWhatToRender(options => ({
                ...options,
                shouldDrawCellTemperature: !options.shouldDrawCellTemperature,
              }))
            }
            checked={whatToRender.shouldDrawCellTemperature}
          />
        </fieldset>
        <div style={{ marginTop: 4, padding: 8 }}>
          <button onClick={onRequestGeneration}>Regenerate</button>
        </div>
      </div>
      <div ref={containerRef} />
    </div>
  );
};
