import { Graphics as GraphicsType } from 'pixi.js';
import * as d3Shape from 'd3-shape';

import { Point } from '../types/grid.ts';

export const drawD3OpenCurve = (g: GraphicsType, points: Point[]) => {
  d3Shape
    .line()
    .curve(d3Shape.curveBasisOpen)
    // The pixijs graphics don't fully cover the features of the canvas, but the curves only use `moveTo` and
    // `bezierCurveTo`, which the pixijs graphics API fully supports. We force a conversion and use d3 to draw the
    // lines, which should allow us to use their solid algorithms.
    .context(g as unknown as CanvasRenderingContext2D)(points);
};

export const drawD3ClosedCurve = (g: GraphicsType, points: Point[]) => {
  d3Shape
    .line()
    .curve(d3Shape.curveBasisClosed)
    // The pixijs graphics don't fully cover the features of the canvas, but the curves only use `moveTo` and
    // `bezierCurveTo`, which the pixijs graphics API fully supports. We force a conversion and use d3 to draw the
    // lines, which should allow us to use their solid algorithms.
    .context(g as unknown as CanvasRenderingContext2D)(points);

  g.closePath();
};

export const drawD3RiverCurve = (g: GraphicsType, points: Point[]) => {
  d3Shape
    .line()
    .curve(d3Shape.curveCatmullRom.alpha(0.1))
    // The pixijs graphics don't fully cover the features of the canvas, but the curves only use `moveTo` and
    // `bezierCurveTo`, which the pixijs graphics API fully supports. We force a conversion and use d3 to draw the
    // lines, which should allow us to use their solid algorithms.
    .context(g as unknown as CanvasRenderingContext2D)(points);
};

export const drawDebugPath = (g: GraphicsType, path: Point[]) => {
  g.lineStyle({
    color: 0x00ff00,
    width: 2,
  });
  path.forEach((point, index) => {
    if (index === 0) {
      g.moveTo(point[0], point[1]);
    } else {
      g.lineTo(point[0], point[1]);
    }
  });

  g.lineTo(path[0][0], path[0][1]);
  g.closePath();
};
