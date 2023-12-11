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
