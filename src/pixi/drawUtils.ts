import { Graphics as GraphicsType } from 'pixi.js';
import * as d3Shape from 'd3-shape';

import { Point, Vertex } from '../types/grid.ts';

export const drawVertexPath = (
  g: GraphicsType,
  vertices: Vertex[],
  path: number[]
) => {
  const [start, ...rest] = path;
  g.moveTo(vertices[start].coordinates[0], vertices[start].coordinates[1]);

  rest.forEach(vertex => {
    g.lineTo(vertices[vertex].coordinates[0], vertices[vertex].coordinates[1]);
  });

  g.closePath();
};

export const drawD3OpenCurve = (g: GraphicsType, points: Point[]) => {
  d3Shape
    .line()
    .curve(d3Shape.curveBasisOpen)
    // The pixijs graphics don't fully cover the features of the canvas, but the curves only use `moveTo` and
    // `bezierCurveTo`, which the pixijs graphics API fully supports. We force a conversion and use d3 to draw the
    // lines, which should allow us to use their solid algorithms.
    .context(g as unknown as CanvasRenderingContext2D)(points);

  return g;
};

export const drawD3ClosedCurve = (g: GraphicsType, points: Point[]) => {
  d3Shape
    .line()
    .curve(d3Shape.curveBasisClosed)
    // The pixijs graphics don't fully cover the features of the canvas, but the curves only use `moveTo` and
    // `bezierCurveTo`, which the pixijs graphics API fully supports. We force a conversion and use d3 to draw the
    // lines, which should allow us to use their solid algorithms.
    .context(g as unknown as CanvasRenderingContext2D)(points);

  return g.closePath();
};

export const drawD3ClosedPath = (g: GraphicsType, points: Point[]) => {
  points.forEach((point, index) => {
    if (index === 0) {
      g.moveTo(point[0], point[1]);
    } else {
      g.lineTo(point[0], point[1]);
    }
  });

  return g.lineTo(points[0][0], points[0][1]).closePath();
};

export const drawD3RiverCurve = (g: GraphicsType, points: Point[]) => {
  d3Shape
    .line()
    .curve(d3Shape.curveCatmullRom.alpha(0.1))
    // The pixijs graphics don't fully cover the features of the canvas, but the curves only use `moveTo` and
    // `bezierCurveTo`, which the pixijs graphics API fully supports. We force a conversion and use d3 to draw the
    // lines, which should allow us to use their solid algorithms.
    .context(g as unknown as CanvasRenderingContext2D)(points);

  return g;
};

export const drawDebugPath = (g: GraphicsType, path: Point[]) => {
  return drawD3ClosedPath(g, path).stroke({ width: 2, color: 0x00ff00 });
};
