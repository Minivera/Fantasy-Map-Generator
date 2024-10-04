import { polygon, Point } from 'lineclip';

/**
 * Clips the provided polygon using the graph bounding box, making sure it does not overflow beyond the
 * boundary of the graph.
 */
export const clipPoly = (
  points: Point[],
  graphWidth: number,
  graphHeight: number
) => {
  return polygon(points, [0, 0, graphWidth, graphHeight]);
};

const simplifyPolygonRecursive = (
  path: Point[],
  first: number,
  last: number,
  eps: number
): Point[] => {
  if (first >= last - 1) {
    return [path[first]];
  }

  const px = path[first][0];
  const py = path[first][1];

  const dx = path[last][0] - px;
  const dy = path[last][1] - py;

  const nn = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / nn;
  const ny = dx / nn;

  let ii = first;
  let max = -1;

  for (let i = first + 1; i < last; i++) {
    const p = path[i];

    const qx = p[0] - px;
    const qy = p[1] - py;

    const d = Math.abs(qx * nx + qy * ny);
    if (d > max) {
      max = d;
      ii = i;
    }
  }

  if (max < eps) {
    return [path[first]];
  }

  const p1 = simplifyPolygonRecursive(path, first, ii, eps);
  const p2 = simplifyPolygonRecursive(path, ii, last, eps);

  return [...p1, ...p2];
};

/**
 * Simplifies a polygon based on its points using the Douglas-Peucker algorithm, based on the provided tolerance
 * value. The tolerance defaults to 10.
 */
export const simplifyPolygon = (points: Point[], tolerance: number = 10) => {
  const p = simplifyPolygonRecursive(points, 0, points.length - 1, tolerance);
  return [...p, points[points.length - 1]];
};
