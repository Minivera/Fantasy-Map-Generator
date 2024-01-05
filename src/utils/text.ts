import { curveToBezier } from 'points-on-curve/src/curve-to-bezier.ts';
import { pointsOnBezierCurves } from 'points-on-curve';

import { Point } from '../types/grid.ts';

/**
 * Gets a curved line of points for the given text by placing each letter along the quadratic curve
 * created by computing the baseline in the Lagrange polynomial interpolation. Each letter will have a
 * point, use the returned rope to create a pixi rope for drawing.
 */
export const getCurvedTextPoints = (
  text: string,
  baseLine: [Point, Point, Point]
): { scale: number; rope: Point[] } => {
  const [[xFrom, yFrom], , [xTo, yTo]] = baseLine;
  const freeSpace = xTo - xFrom;
  const textLength = text.length;

  // Determine how much space we need for the text, and compute the font size accordingly.
  const spacePerLetter = Math.floor(freeSpace / textLength);
  // Clamp the font size between 9 and 50.
  const fontSize = Math.min(50, Math.max(spacePerLetter, 15));

  // Put the text on the rope by calculating all the needed points. Cut the text in half
  // and get the points for each half from the center.
  const textLeftHalf = text.substring(0, (textLength - 1) / 2);
  const textRightHalf = text.substring((textLength - 1) / 2);

  // Extend the curve as much as we need if it's too small
  const curve = curveToBezier([
    ...(spacePerLetter < fontSize
      ? [
          [
            xFrom -
              fontSize * textLeftHalf.length +
              spacePerLetter * textLeftHalf.length,
            yFrom,
          ],
        ]
      : []),
    baseLine[0],
    baseLine[1],
    ...(spacePerLetter < fontSize
      ? [
          [
            xTo +
              fontSize * textRightHalf.length -
              spacePerLetter * textRightHalf.length,
            yTo,
          ],
        ]
      : []),
  ] as Point[]);

  const curvePoints = pointsOnBezierCurves(curve, 0.2, fontSize);
  const leftHalfPoints = curvePoints.slice(0, (curvePoints.length - 1) / 2);
  const rightHalfPoints = curvePoints.slice((curvePoints.length - 1) / 2);

  const points: Point[] = [];
  for (let i = 0; i < textLeftHalf.length; i++) {
    points.push(leftHalfPoints[leftHalfPoints.length - 1 - i] as Point);
  }

  for (let i = 0; i < textRightHalf.length; i++) {
    points.push(rightHalfPoints[i] as Point);
  }

  return {
    rope: points,
    scale: fontSize / 50,
  };
};
