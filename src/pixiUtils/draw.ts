import { Graphics as GraphicsType } from 'pixi.js';
import * as d3Shape from 'd3-shape';

import { Point } from '../types/grid.ts';

export const drawCurvedLine = (g: GraphicsType, points: Point[]) => {
  const [start, ...rest] = points;
  g.moveTo(start[0], start[1]);

  for (let i = 0; i < rest.length - 2; i++) {
    const xc = (rest[i][0] + rest[i + 1][0]) / 2;
    const yc = (rest[i][1] + rest[i + 1][1]) / 2;
    g.quadraticCurveTo(rest[i][0], rest[i][1], xc, yc);
  }

  // curve through the last two points
  g.quadraticCurveTo(
    rest[rest.length - 2][0],
    rest[rest.length - 2][1],
    rest[rest.length - 1][0],
    rest[rest.length - 1][1]
  );

  // Then curve back to start
  g.quadraticCurveTo(
    rest[rest.length - 1][0],
    rest[rest.length - 1][1],
    start[0],
    start[1]
  );
};

export const drawD3ClosedCurve = (g: GraphicsType, points: Point[]) => {
  d3Shape
    .line()
    .curve(d3Shape.curveBasisClosed)
    // The pixijs graphics don't fully cover the features of the canvas, but the curves only use `moveTo` and
    // `bezierCurveTo`, which the pixijs graphics API fully supports. We force a conversion and use d3 to draw the
    // lines, which should allow us to use their solid algorithms.
    .context(g as unknown as CanvasRenderingContext2D)([...points, points[0]]);
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
