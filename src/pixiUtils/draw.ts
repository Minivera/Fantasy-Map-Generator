import { Graphics as GraphicsType } from 'pixi.js';

import { Point } from '../types/grid.ts';

/**
 * given an array of x,y's, return distance between any two,
 * note that i and j are indexes to the points, not directly into the array.
 */
const distanceBetweenPoints = (point1: Point, point2: Point) => {
  return Math.sqrt(
    Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2)
  );
};

const getControlPoints = (
  tension: number,
  point1: Point,
  point2: Point,
  point3: Point
): [Point, Point] => {
  const d01 = distanceBetweenPoints(point1, point2);
  const d12 = distanceBetweenPoints(point2, point3);
  const fa = (tension * d01) / (d01 + d12); // scaling factor for triangle Ta
  const fb = (tension * d12) / (d01 + d12); // ditto for Tb, simplifies to fb=t-fa
  const p1x = point2[0] - fa * (point3[0] - point1[0]); // x2-x0 is the width of triangle T
  const p1y = point2[1] - fa * (point3[1] - point1[1]); // y2-y0 is the height of T
  const p2x = point2[0] + fb * (point3[0] - point1[0]);
  const p2y = point2[1] + fb * (point3[1] - point1[1]);

  return [
    [p1x, p1y],
    [p2x, p2y],
  ];
};

export const drawCurvedLine = (
  g: GraphicsType,
  tension: number,
  points: Point[]
) => {
  // There will be two control points for each "middle" point, 1 ... len-2e
  const controlPointsArray: [Point, Point][] = [];
  for (let i = 0; i < points.length - 2; i++) {
    controlPointsArray.push(
      getControlPoints(tension, points[i], points[i + 1], points[i + 2])
    );
  }

  const [first, second] = points;
  controlPointsArray.push(
    getControlPoints(
      tension,
      points[points.length - 2],
      points[points.length - 1],
      first
    )
  );
  controlPointsArray.push(
    getControlPoints(tension, points[points.length - 1], first, second)
  );

  g.moveTo(first[0], first[1]);

  // for all middle points, connect with bezier
  points.forEach((middlePoint, index) => {
    const controlPoints = controlPointsArray[index];

    g.bezierCurveTo(
      controlPoints[0][0],
      controlPoints[0][1],
      controlPoints[1][0],
      controlPoints[1][1],
      middlePoint[0],
      middlePoint[1]
    );
  });
};
