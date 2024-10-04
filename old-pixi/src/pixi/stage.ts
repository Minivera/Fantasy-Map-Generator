import { Application } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

export const createStage = async (
  node: Element,
  options: { graphWidth: number; graphHeight: number }
) => {
  const app = new Application();

  await app.init({
    antialias: true,
    background: 0x466eab,
    backgroundAlpha: 0.75,
    width: options.graphWidth,
    height: options.graphHeight,
    resizeTo: window,
  });
  node.appendChild(app.canvas);

  return app;
};

export const createViewport = (app: Application) => {
  const viewport = new Viewport({
    ticker: app.ticker,
    events: app.renderer.events,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: app.screen.width,
    worldHeight: app.screen.height,
  })
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
    .moveCenter(app.screen.width / 2, app.screen.height / 2);

  app.stage.addChild(viewport);

  return viewport;
};
