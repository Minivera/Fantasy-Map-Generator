import { forwardRef, PropsWithChildren } from 'react';
import { PixiComponent, useApp } from '@pixi/react';
import { Viewport, IViewportOptions } from 'pixi-viewport';
import { Application, DisplayObject, ICanvas } from 'pixi.js';
import { DisplayObject as PixiDisplayObject } from '@pixi/display';

interface ViewportContainerProps
  extends Omit<IViewportOptions, 'ticker' | 'events'> {}

const PixiViewportComponent = PixiComponent<
  PropsWithChildren<ViewportContainerProps> & {
    app: Application<ICanvas>;
  },
  PixiDisplayObject
>('Viewport', {
  create(props) {
    const { app, ...viewportProps } = props;

    const viewport = new Viewport({
      ticker: app.ticker,
      events: app.renderer.events,
      ...viewportProps,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      worldWidth: app.stage.width,
      worldHeight: app.stage.height,
    });

    viewport
      .drag({})
      .pinch({})
      .wheel({})
      .clamp({
        direction: 'all',
        // underflow: 'center',
      })
      .clampZoom({
        minScale: 1,
        maxScale: 5,
      });

    (viewport as Viewport)
      .fitWorld(true)
      .moveCenter(app.stage.width / 2, app.stage.height / 2);

    return viewport;
  },

  applyProps(viewport, oldProps, newProps) {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      children: oldChildren,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      app: oldApp,
      ...oldRest
    } = oldProps;
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      children: newChildren,
      app: newApp,
      ...newRest
    } = newProps;

    Object.keys(newProps).forEach(p => {
      // @ts-expect-error TS7053
      if (oldRest[p] !== newRest[p]) {
        // @ts-expect-error TS7053
        viewport[p] = newRest[p];
      }
    });

    (viewport as Viewport).snapZoom({
      width: newApp.stage.width,
      height: newApp.stage.height,
      removeOnComplete: true,
    });
    (viewport as Viewport).snap(
      -newApp.stage.width / 2,
      -newApp.stage.height / 2,
      { removeOnComplete: true }
    );
  },
});

export const ViewportContainer = forwardRef<
  DisplayObject,
  PropsWithChildren<ViewportContainerProps>
>((props, ref) => (
  <PixiViewportComponent ref={ref} app={useApp()} {...props} />
));

ViewportContainer.displayName = 'ViewportContainer';