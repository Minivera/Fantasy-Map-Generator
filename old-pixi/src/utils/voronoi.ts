import Delaunator from 'delaunator';

import { Cells, Vertices, Point } from '../types/grid.ts';

import { createTypedArray } from './arrays.ts';

/**
 * Finds the circumcenter of the triangle identified by points a, b, and c. Taken from {@link https://en.wikipedia.org/wiki/Circumscribed_circle#Circumcenter_coordinates| Wikipedia}
 * @param {[number, number]} a The coordinates of the first point of the triangle
 * @param {[number, number]} b The coordinates of the second point of the triangle
 * @param {[number, number]} c The coordinates of the third point of the triangle
 * @return {[number, number]} The coordinates of the circumcenter of the triangle.
 */
const circumcenter = (a: Point, b: Point, c: Point): Point => {
  const [ax, ay] = a;
  const [bx, by] = b;
  const [cx, cy] = c;
  const ad = ax * ax + ay * ay;
  const bd = bx * bx + by * by;
  const cd = cx * cx + cy * cy;
  const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

  return [
    Math.floor((1 / D) * (ad * (by - cy) + bd * (cy - ay) + cd * (ay - by))),
    Math.floor((1 / D) * (ad * (cx - bx) + bd * (ax - cx) + cd * (bx - ax))),
  ];
};

/**
 * Retrieves all the half-edges for a specific triangle `t`. Taken from {@link https://mapbox.github.io/delaunator/#edge-and-triangle| the Delaunator docs.}
 * @param {number} t The index of the triangle
 * @returns {[number, number, number]} The edges of the triangle.
 */
const edgesOfTriangle = (t: number): [number, number, number] => {
  return [3 * t, 3 * t + 1, 3 * t + 2];
};

/**
 * Enables lookup of a triangle, given one of the half-edges of that triangle. Taken from {@link https://mapbox.github.io/delaunator/#edge-and-triangle| the Delaunator docs.}
 * @param {number} e The index of the edge
 * @returns {number} The index of the triangle
 */
const triangleOfEdge = (e: number): number => {
  return Math.floor(e / 3);
};

/**
 * Moves to the next half-edge of a triangle, given the current half-edge's index. Taken from {@link https://mapbox.github.io/delaunator/#edge-to-edges| the Delaunator docs.}
 * @param {number} e The index of the current half edge
 * @returns {number} The index of the next half edge
 */
const nextHalfedge = (e: number): number => {
  return e % 3 === 2 ? e - 2 : e + 1;
};

/**
 * Gets the IDs of the points comprising the given triangle. Taken from {@link https://mapbox.github.io/delaunator/#triangle-to-points| the Delaunator docs.}
 * @param {Delaunator<ArrayLike<number>>} delaunay The result of the Delaunay algorithm
 * @param {number} t The index of the triangle
 * @returns {[number, number, number]} The IDs of the points comprising the given triangle.
 */
const pointsOfTriangle = (
  delaunay: Delaunator<ArrayLike<number>>,
  t: number
): [number, number, number] => {
  return edgesOfTriangle(t).map(edge => delaunay.triangles[edge]) as [
    number,
    number,
    number,
  ];
};

/**
 * Gets the indices of all the incoming and outgoing half-edges that touch the given point. Taken from {@link https://mapbox.github.io/delaunator/#point-to-edges| the Delaunator docs.}
 * @param {Delaunator<ArrayLike<number>>} delaunay The result of the Delaunay algorithm
 * @param {number} start The index of an incoming half-edge that leads to the desired point
 * @returns {number[]} The indices of all half-edges (incoming or outgoing) that touch the point.
 */
const edgesAroundPoint = (
  delaunay: Delaunator<ArrayLike<number>>,
  start: number
): number[] => {
  const result: number[] = [];
  let incoming = start;
  do {
    result.push(incoming);
    const outgoing = nextHalfedge(incoming);
    incoming = delaunay.halfedges[outgoing];
  } while (incoming !== -1 && incoming !== start && result.length < 20);

  return result;
};

/**
 * Returns the center of the triangle located at the given index.
 * @param {Delaunator<ArrayLike<number>>} delaunay The result of the Delaunay algorithm
 * @param {[number, number][]} points The available points
 * @param {number} t The index of the triangle
 * @returns {[number, number]}
 */
const triangleCenter = (
  delaunay: Delaunator<ArrayLike<number>>,
  points: Point[],
  t: number
): Point => {
  const vertices = pointsOfTriangle(delaunay, t).map(p => points[p]);
  return circumcenter(vertices[0], vertices[1], vertices[2]);
};

/**
 * Identifies what triangles are adjacent to the given triangle. Taken from {@link https://mapbox.github.io/delaunator/#triangle-to-triangles| the Delaunator docs.}
 * @param {Delaunator<ArrayLike<number>>} delaunay The result of the Delaunay algorithm
 * @param {number} t The index of the triangle
 * @returns {number[]} The indices of the triangles that share half-edges with this triangle.
 */
const trianglesAdjacentToTriangle = (
  delaunay: Delaunator<ArrayLike<number>>,
  t: number
): number[] => {
  const triangles: number[] = [];

  for (const edge of edgesOfTriangle(t)) {
    const opposite = delaunay.halfedges[edge];
    triangles.push(triangleOfEdge(opposite));
  }

  return triangles;
};

/**
 * Generate a set of cells and vertices based on the voronoi algorithm.
 */
export const voronoi = (
  delaunay: Delaunator<ArrayLike<number>>,
  points: Point[],
  pointsN: number
) => {
  const cells: Cells = {
    indexes: createTypedArray({
      maxValue: pointsN,
      length: pointsN,
    }),
    vertices: [],
    adjacentCells: [],
    nearBorderCells: [],
    heights: new Uint8Array(),
    features: new Uint16Array(),
    types: [],
    temperatures: new Int8Array(),
    precipitation: new Uint8Array(),
    waterFlux: new Uint16Array(),
    rivers: new Uint16Array(),
    confluences: new Uint8Array(),
  };
  const vertices: Vertices = { coordinates: [], neighbours: [], adjacent: [] };

  // Half-edges are the indices into the delaunator outputs:
  // delaunay.triangles[e] gives the point ID where the half-edge starts
  // delaunay.halfedges[e] returns either the opposite half-edge in the adjacent triangle, or -1 if there's not an adjacent triangle.
  for (let e = 0; e < delaunay.triangles.length; e++) {
    const p = delaunay.triangles[nextHalfedge(e)];
    if (p < pointsN && !cells.adjacentCells[p]) {
      const edges = edgesAroundPoint(delaunay, e);

      // cell: adjacent vertex
      cells.vertices[p] = edges.map(e => triangleOfEdge(e));
      // cell: adjacent valid cells
      cells.adjacentCells[p] = edges
        .map(e => delaunay.triangles[e])
        .filter(c => c < pointsN);
      // cell: is border
      cells.nearBorderCells[p] = edges.length > cells.adjacentCells[p].length;
    }

    const t = triangleOfEdge(e);
    if (!vertices.coordinates[t]) {
      // vertex: coordinates
      vertices.coordinates[t] = triangleCenter(delaunay, points, t);
      // vertex: adjacent vertices
      vertices.neighbours[t] = trianglesAdjacentToTriangle(delaunay, t);
      // vertex: adjacent cells
      vertices.adjacent[t] = pointsOfTriangle(delaunay, t);
    }
  }

  cells.indexes = cells.indexes.map((_, i) => i); // array of indexes

  return { cells, vertices };
};
