import * as d3 from 'd3-array';
import * as d3Voronoi from 'd3-voronoi';
import * as d3Polygon from 'd3-polygon';
import simplifyJS from 'simplify-js';

import * as turf from '@turf/turf';
import { aStar } from 'ngraph.path';
import createGraph from 'ngraph.graph';

import { Point } from '../types/grid.ts';

type toDeepMapType = {
  (source: Record<string, number>): Map<string, number>;
  (
    source: Record<string, Record<string, number>>
  ): Map<string, Map<string, number>>;
};
// @ts-expect-error TS2322
const toDeepMap: toDeepMapType = source => {
  const map = new Map<string, number | Map<string, number>>();
  const keys = Object.keys(source);

  keys.forEach(key => {
    const val = source[key];

    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      return map.set(key, toDeepMap(val));
    }

    return map.set(key, Number(val));
  });

  return map;
};

// Observable-compatible stub of Alberto Restifo's node-dijsktra
// https://github.com/albertorestifo/node-dijkstra
class Queue<T> {
  private keys: Set<T>;
  private queue: { key: T; priority: number }[];

  /**
   * Creates a new empty priority queue
   */
  constructor() {
    // The `keys` set is used to greatly improve the speed at which we can
    // check the presence of a value in the queue
    this.keys = new Set<T>();
    this.queue = [];
  }

  /**
   * Sort the queue to have the least expensive node to visit on top
   *
   * @private
   */
  sort() {
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Sets a priority for a key in the queue.
   * Inserts it in the queue if it does not already exists.
   *
   * @param {any}     key       Key to update or insert
   * @param {number}  value     Priority of the key
   * @return {number} Size of the queue
   */
  set(key: T, value: number): number {
    const priority = Number(value);
    if (isNaN(priority)) {
      throw new TypeError('"priority" must be a number');
    }

    if (!this.keys.has(key)) {
      // Insert a new entry if the key is not already in the queue
      this.keys.add(key);
      this.queue.push({ key, priority });
    } else {
      // Update the priority of an existing key
      this.queue.map(element => {
        if (element.key === key) {
          Object.assign(element, { priority });
        }

        return element;
      });
    }

    this.sort();
    return this.queue.length;
  }

  /**
   * The next method is used to dequeue a key:
   * It removes the first element from the queue and returns it
   *
   * @return {object} First priority queue entry
   */
  next(): { key: T; priority: number } {
    const element = this.queue.shift();

    // Remove the key from the `_keys` set
    this.keys.delete(element!.key);

    return element!;
  }

  /**
   * @return {boolean} `true` when the queue is empty
   */
  isEmpty(): boolean {
    return Boolean(this.queue.length === 0);
  }

  /**
   * Check if the queue has a key in it
   *
   * @param {any} key   Key to lookup
   * @return {boolean}
   */
  has(key: T): boolean {
    return this.keys.has(key);
  }

  /**
   * Get the element in the queue with the specified key
   *
   * @param {any} key   Key to lookup
   * @return {object}
   */
  get(key: T): { key: T; priority: number } {
    return this.queue.find(element => element.key === key)!;
  }
}

class Graph {
  private graph: Map<string, Map<string, number>>;

  /**
   * Creates a new Graph, optionally initializing it a nodes graph representation.
   *
   * A graph representation is an object that has as keys the name of the point and as values
   * the points reacheable from that node, with the cost to get there:
   *
   *     {
   *       node (Number|String): {
   *         neighbor (Number|String): cost (Number),
   *         ...,
   *       },
   *     }
   *
   * In alternative to an object, you can pass a `Map` of `Map`. This will
   * allow you to specify numbers as keys.
   *
   * @param {Object|Map} [graph] - Initial graph definition
   * @example
   *
   * const route = new Graph();
   *
   * // Pre-populated graph
   * const route = new Graph({
   *   A: { B: 1 },
   *   B: { A: 1, C: 2, D: 4 },
   * });
   *
   * // Passing a Map
   * const g = new Map()
   *
   * const a = new Map()
   * a.set('B', 1)
   *
   * const b = new Map()
   * b.set('A', 1)
   * b.set('C', 2)
   * b.set('D', 4)
   *
   * g.set('A', a)
   * g.set('B', b)
   *
   * const route = new Graph(g)
   */
  constructor(
    graph:
      | Record<string, Record<string, number>>
      | Map<string, Map<string, number>>
  ) {
    if (graph instanceof Map) {
      this.graph = graph;
    } else if (graph) {
      this.graph = toDeepMap(graph);
    } else {
      this.graph = new Map();
    }
  }

  /**
   * Adds a node to the graph
   *
   * @param {string} name      - Name of the node
   * @param {Object|Map} neighbors - Neighbouring nodes and cost to reach them
   * @return {this}
   * @example
   *
   * const route = new Graph();
   *
   * route.addNode('A', { B: 1 });
   *
   * // It's possible to chain the calls
   * route
   *   .addNode('B', { A: 1 })
   *   .addNode('C', { A: 3 });
   *
   * // The neighbors can be expressed in a Map
   * const d = new Map()
   * d.set('A', 2)
   * d.set('B', 8)
   *
   * route.addNode('D', d)
   */
  addNode(
    name: string,
    neighbors: Record<string, number> | Map<string, number>
  ): this {
    let nodes;
    if (neighbors instanceof Map) {
      nodes = neighbors;
    } else {
      nodes = toDeepMap(neighbors);
    }

    this.graph.set(name, nodes);

    return this;
  }

  /**
   * Compute the shortest path between the specified nodes
   *
   * @param {string}  start     - Starting node
   * @param {string}  goal      - Node we want to reach
   * @param {object}  [options] - Options
   *
   * @param {boolean} [options.trim]    - Exclude the origin and destination nodes from the result
   * @param {boolean} [options.reverse] - Return the path in reversed order
   * @param {boolean} [options.cost]    - Also return the cost of the path when set to true
   *
   * @return {array|object} Computed path between the nodes.
   *
   *  When `option.cost` is set to true, the returned value will be an object with shape:
   *    - `path` *(Array)*: Computed path between the nodes
   *    - `cost` *(Number)*: Cost of the path
   *
   * @example
   *
   * const route = new Graph()
   *
   * route.addNode('A', { B: 1 })
   * route.addNode('B', { A: 1, C: 2, D: 4 })
   * route.addNode('C', { B: 2, D: 1 })
   * route.addNode('D', { C: 1, B: 4 })
   *
   * route.path('A', 'D') // => ['A', 'B', 'C', 'D']
   *
   * // trimmed
   * route.path('A', 'D', { trim: true }) // => [B', 'C']
   *
   * // reversed
   * route.path('A', 'D', { reverse: true }) // => ['D', 'C', 'B', 'A']
   *
   * // include the cost
   * route.path('A', 'D', { cost: true })
   * // => {
   * // path: [ 'A', 'B', 'C', 'D' ],
   * // cost: 4
   * // }
   */
  path(
    start: string,
    goal: string,
    options: {
      trim?: boolean;
      reverse?: boolean;
      cost?: boolean;
      avoid?: string[];
    } = {}
  ): { path: string[] | null; cost: number } | string[] | null {
    // Don't run when we don't have nodes set
    if (!this.graph.size) {
      if (options.cost) {
        return { path: null, cost: 0 };
      }

      return null;
    }

    const explored = new Set();
    const frontier = new Queue<string>();
    const previous = new Map();

    let path: string[] = [];
    let totalCost = 0;

    const avoid: string[] = [];
    if (options.avoid) {
      avoid.push(...options.avoid);
    }

    if (avoid.includes(start)) {
      throw new Error(`Starting node (${start}) cannot be avoided`);
    } else if (avoid.includes(goal)) {
      throw new Error(`Ending node (${goal}) cannot be avoided`);
    }

    // Add the starting point to the frontier, it will be the first node visited
    frontier.set(start, 0);

    // Run until we have visited every node in the frontier
    while (!frontier.isEmpty()) {
      // Get the node in the frontier with the lowest cost (`priority`)
      const node = frontier.next();

      // When the node with the lowest cost in the frontier in our goal node,
      // we can compute the path and exit the loop
      if (node.key === goal) {
        // Set the total cost to the current value
        totalCost = node.priority;

        let nodeKey = node.key;
        while (previous.has(nodeKey)) {
          path.push(nodeKey);
          nodeKey = previous.get(nodeKey);
        }

        break;
      }

      // Add the current node to the explored set
      explored.add(node.key);

      // Loop all the neighboring nodes
      const neighbors = this.graph.get(node.key) || new Map<string, number>();
      neighbors.forEach((nCost, nNode) => {
        // If we already explored the node, or the node is to be avoided, skip it
        if (explored.has(nNode) || avoid.includes(nNode)) {
          return null;
        }

        // If the neighboring node is not yet in the frontier, we add it with
        // the correct cost
        if (!frontier.has(nNode)) {
          previous.set(nNode, node.key);
          return frontier.set(nNode, node.priority + nCost);
        }

        const frontierPriority = frontier.get(nNode).priority;
        const nodeCost = node.priority + nCost;

        // Otherwise we only update the cost of this node in the frontier when
        // it's below what's currently set
        if (nodeCost < frontierPriority) {
          previous.set(nNode, node.key);
          return frontier.set(nNode, nodeCost);
        }

        return null;
      });
    }

    // Return null when no path can be found
    if (!path.length) {
      if (options.cost) {
        return { path: null, cost: 0 };
      }

      return null;
    }

    // From now on, keep in mind that `path` is populated in reverse order,
    // from destination to origin

    // Remove the first value (the goal node) if we want a trimmed result
    if (options.trim) {
      path.shift();
    } else {
      // Add the origin waypoint at the end of the array
      path = path.concat([start]);
    }

    // Reverse the path if we don't want it reversed, so the result will be
    // from `start` to `goal`
    if (!options.reverse) {
      path = path.reverse();
    }

    // Return an object if we also want the cost
    if (options.cost) {
      return {
        path,
        cost: totalCost,
      };
    }

    return path;
  }
}

// Defines the precision of the algorithm. More points = more precise.
// SEE: https://observablehq.com/@veltman/centerline-labeling
const numPerimeterPoints = 260;

export const distanceBetween = (a: Point, b: Point) => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];

  return Math.sqrt(dx * dx + dy * dy);
};

const getPointsAlongPolyline = (polyline: Point[], count: number) => {
  // Calculate distance between each point of polyline
  const distances = polyline.map((p, i) => {
    return distanceBetween(p, polyline[i + 1] || polyline[0]);
  });

  const totalLength = d3.sum(distances);
  const stepsize = totalLength / count;
  let traversed = 0;
  let next = stepsize / 2;

  return polyline.reduce<Point[]>((arr, currentPoint, i) => {
    const distanceBetweenCurrentPoints = distances[i];
    while (next < traversed + distanceBetweenCurrentPoints) {
      const nextPoint = polyline[i + 1] || polyline[0];
      const percent = (next - traversed) / distanceBetweenCurrentPoints;

      arr.push([
        currentPoint[0] + (nextPoint[0] - currentPoint[0]) * percent,
        currentPoint[1] + (nextPoint[1] - currentPoint[1]) * percent,
      ]);

      next += stepsize;
    }
    traversed += distanceBetweenCurrentPoints;
    return arr;
  }, []);
};

const findIntersection = (
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): Point | undefined => {
  // Adapted from https://github.com/Turfjs/turf-line-slice-at-intersection
  const uaT =
    (b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0]);
  const ubT =
    (a2[0] - a1[0]) * (a1[1] - b1[1]) - (a2[1] - a1[1]) * (a1[0] - b1[0]);
  const uB =
    (b2[1] - b1[1]) * (a2[0] - a1[0]) - (b2[0] - b1[0]) * (a2[1] - a1[1]);

  if (uB !== 0) {
    const ua = uaT / uB;
    const ub = ubT / uB;
    if (ua > 0 && ua < 1 && ub > 0 && ub < 1) {
      return [a1[0] + ua * (a2[0] - a1[0]), a1[1] + ua * (a2[1] - a1[1])];
    }
  }
};

type Node = Point & {
  id?: string;
  clipped?: boolean;
  links?: Record<string, number>;
};

const findClosestPolygonIntersection = (
  start: Point,
  end: Point,
  polygon: Point[]
) => {
  return polygon.reduce<{
    intersection?: Node;
    distance?: number;
  }>((best, point, i) => {
    const intersection = findIntersection(
      start,
      end,
      point,
      polygon[i + 1] || polygon[0]
    );
    if (intersection) {
      const distance = distanceBetween(start, intersection);
      if (!best.distance || distance < best.distance) {
        return { intersection, distance };
      }
    }
    return best;
  }, {});
};

const simplifyPath = (points: Point[]): Point[] => {
  // Convert from [x, y] to { x, y } and back for simplify-js
  return simplifyJS(points.map(p => ({ x: p[0], y: p[1] }))).map(p => [
    p.x,
    p.y,
  ]);
};

export const calculateCenterLineCostly = (polygon: Point[]): Point[] => {
  const evenlySpacedPoints = getPointsAlongPolyline(
    polygon,
    numPerimeterPoints
  );

  const [x0, x1] = d3.extent(evenlySpacedPoints.map(d => d[0])) as [
    number,
    number,
  ];
  const [y0, y1] = d3.extent(evenlySpacedPoints.map(d => d[1])) as [
    number,
    number,
  ];

  const fromVoronoi = d3Voronoi.voronoi().extent([
    [x0 - 1, y0 - 1],
    [x1 + 1, y1 + 1],
  ])(evenlySpacedPoints).edges;

  const edges = fromVoronoi
    .filter(edge => {
      if (edge && edge.right) {
        const inside = edge.map(point =>
          d3Polygon.polygonContains(evenlySpacedPoints, point)
        );
        if (inside[0] === inside[1]) {
          return inside[0];
        }
        if (inside[1]) {
          edge.reverse();
        }
        return true;
      }
      return false;
    })
    .map(([start, end]) => {
      const { intersection, distance } = findClosestPolygonIntersection(
        start,
        end,
        polygon
      );

      if (intersection) {
        intersection.clipped = true;
      }

      // Each edge has a starting point, a clipped end point, and an original end point
      const edge = [start, intersection || end] as [Node, Node] & {
        distance?: number;
      };
      edge.distance = intersection ? distance : distanceBetween(start, end);

      return edge;
    });

  const nodes: Node[] = [];

  edges.forEach(edge => {
    edge.forEach((node, i) => {
      if (!i || !node.clipped) {
        const match = nodes.find(d => d === node);
        if (match) {
          return (node.id = match.id);
        }
      }
      node.id = nodes.length.toString();
      node.links = {};
      nodes.push(node);
    });

    if (edge.distance != null) {
      (edge[0].links as Record<string, number>)[edge[1].id || ''] =
        edge.distance;
      (edge[1].links as Record<string, number>)[edge[0].id || ''] =
        edge.distance;
    }
  });

  const graph = new Graph({});
  nodes.forEach(node => graph.addNode(node.id!, node.links!));
  const perimeterNodes = nodes.filter(d => d.clipped);

  let totalBest:
    | {
        path: string[];
        cost: number;
      }
    | undefined;
  let bestPath: string[] | undefined;

  for (let i = 0; i < perimeterNodes.length; i++) {
    const start = perimeterNodes[i];
    const longestShortestPath = perimeterNodes
      .slice(i + 1)
      .reduce<{ path: string[]; cost: number } | null>((nodeBest, node) => {
        const path = graph.path(node.id!, start.id!, { cost: true }) as {
          path: string[];
          cost: number;
        };
        if (path && (!nodeBest || path.cost > nodeBest.cost)) {
          return path;
        }
        return nodeBest;
      }, null);

    if (longestShortestPath && longestShortestPath.path) {
      if (!totalBest || longestShortestPath.cost > totalBest.cost) {
        totalBest = longestShortestPath;
      }

      bestPath = totalBest.path;
    }
  }

  if (totalBest) {
    bestPath = totalBest.path;
  }

  return simplifyPath(
    bestPath!.map(nodeId => nodes.find(node => node.id === nodeId)!)
  );
};

export const calculateCenterLine = (polygon: Point[]): Point[] => {
  const multiPolygon = turf.polygon([polygon]);
  const voronoiPolygons = turf.voronoi(turf.polygonToLine(multiPolygon));
  const graph = createGraph();

  voronoiPolygons.forEach(node => {
    graph.addNode(node.id, { x: node[0], y: node[1] });
  });

  uniqueEdges.forEach(([fromNode, toNode]) => {
    const dx = fromNode[0] - toNode[0];
    const dy = fromNode[1] - toNode[1];

    const distance = Math.sqrt(dx * dx + dy * dy);

    graph.addLink(fromNode.id, toNode.id, { distance });
  });
};
