import { Bezier } from 'bezier-js';

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
  const [[xFrom], , [xTo]] = baseLine;
  const freeSpace = xTo - xFrom;
  const textLength = text.length;

  // Determine how much space we need for the text, and compute the font size accordingly.
  const spacePerLetter = Math.floor(freeSpace / textLength);
  // Clamp the font size between 9 and 25.
  const fontSize = Math.min(25, Math.max(spacePerLetter, 9));

  let bezierCurve = new Bezier(baseLine.flat(1));
  if (fontSize > spacePerLetter) {
    // If we're missing space for all the letters at our minimum font size
    // Extends the base line end points to include the missing space
    const bezierLength = bezierCurve.length();
    const missingSpace = textLength * fontSize - bezierLength;

    bezierCurve = new Bezier([
      baseLine[0][0] - missingSpace,
      baseLine[0][1],
      baseLine[1][0],
      baseLine[1][1],
      baseLine[2][0] + missingSpace,
      baseLine[2][1],
    ]);
  } else if (fontSize < spacePerLetter) {
    // If on the opposite we have too much space per letter, cut the bezier curve near the middle to
    // only include the center.
    const bezierLength = bezierCurve.length();
    const actualSpace = textLength * fontSize;
    const curveRatio = actualSpace / bezierLength;

    bezierCurve = bezierCurve.split(0.5 - curveRatio / 2, 0.5 + curveRatio / 2);
  }

  // Put the text on the rope by calculating all the needed points. Cut the text in half
  // and get the points for each half from the center.
  const textLeftHalf = text.substring(0, (textLength - 1) / 2);
  const textRightHalf = text.substring((textLength - 1) / 2);

  const curvePoints = bezierCurve.getLUT(textLength);
  const leftHalfPoints = curvePoints.slice(0, (curvePoints.length - 1) / 2);
  const rightHalfPoints = curvePoints.slice((curvePoints.length - 1) / 2);

  const points: Point[] = [];
  for (let i = 0; i < textLeftHalf.length; i++) {
    const point = leftHalfPoints[i];
    points.push([point.x, point.y]);
  }

  for (let i = 0; i < textRightHalf.length; i++) {
    const point = rightHalfPoints[i];
    points.push([point.x, point.y]);
  }

  return {
    rope: points,
    scale: fontSize / 25,
  };
};
