import { Quadtree } from 'd3-quadtree';

/**
 * A point on a 2D plane, utility type.
 */
export type Point = [number, number];

/**
 * Describes the type of cell, either a land cell for a landmass or a water cells from the water next to a landmass.
 */
export enum CellType {
  Highland = 2,
  Land = 1,
  Water = -1,
}

/**
 * Describes the type of a feature.
 */
export enum FeatureType {
  INVALID = 'invalid',
  ISLAND = 'island',
  OCEAN = 'ocean',
  LAKE = 'lake',
}

export enum FeatureGroup {
  OCEAN = 'ocean',
  SEA = 'sea',
  GULF = 'gulf',
  LAKEISLAND = 'lake_island',
  CONTINENT = 'continent',
  ISLAND = 'island',
  ISLE = 'isle',
}

export enum LakeFeatureGroup {
  FROZEN = 'frozen',
  LAVA = 'lava',
  DRY = 'dry',
  SALT = 'salt',
  FRESHWATER = 'freshwater',
}

/**
 * Describes a map feature to make handling each cell feature easier. We'll assign one of those features to every cell
 * to describe if it is a lake, a landmass, or the ocean.
 */
export interface Feature {
  index: number;
  isLand?: boolean;
  isBorder?: boolean;
  type: FeatureType;
}

/**
 * Packed version of a feature that includes additional properties that can only be computed once the grid has been
 * converted into a packed grid. Additional feature types should extend this type, not the first level Feature type.
 */
export interface PackedFeature extends Feature {
  /**
   * The number of cells making up this feature, for reference to figure out how big the feature is.
   */
  cellsCount: number;

  /**
   * The index of the first cell used to generate this feature.
   */
  firstCell: number;

  /**
   * Defines the specific feature group for the feature's type, which helps further define the type of
   * feature this represents.
   */
  group: FeatureGroup;

  /**
   * Vertices that make up this feature.
   */
  vertices: number[];

  /**
   * The total land area taken by this feature, helpful to find large features or compute rulers.
   */
  area: number;
}

/**
 * The definition for a lake feature, which includes a few more properties than normal features.
 * TODO: Lots of these are not used or mis-used, cleanup.
 */
export interface LakeFeature extends Omit<PackedFeature, 'group'> {
  type: FeatureType.LAKE;
  group: LakeFeatureGroup;

  /**
   * Water flux of the lake.
   */
  flux: number;

  /**
   * Water flux entering the lake if it's not a closed lake.
   */
  enteringFlux?: number;

  /**
   * Temperature and evaporation of the lake, useful to detect closed lakes.
   */
  temperature: number;

  /**
   * The average height of the lake in the map.
   */
  height: number;

  /**
   * The evaporation value of the lake based on height and temperature.
   */
  evaporation: number;

  /**
   * Is the lake a closed lake (I.E. no inlet nor outlet).
   */
  closed?: boolean;

  /**
   * The river ID to find the river leaving the lake, if any.
   */
  outlet?: number;

  /**
   * Array of river IDs to find which rivers enter the lake, if any.
   */
  inlets?: number[];

  /**
   * Which rivers pass through this lake, should be included in the inlets array and used as the outlet. This river
   * is usually the river that led to the lake generating.
   */
  river?: number;

  /**
   * Which cell contain the outlet for this lake, if any.
   */
  outCell?: number;

  /**
   * Array of cell IDs that define the lake's shoreline.
   */
  shoreline: number[];
}

/**
 * Defines a river feature, which slides along cells to generate a river. This contains all the data necessary to draw
 * it properly.
 */
export interface River {
  index: number;

  /**
   * The cell source of this river, where this river originated.
   */
  source: number;

  /**
   * The mouth of the river, which is one cell off of the final river cell, which should usually be
   * a water cell.
   */
  mouth: number;

  /**
   * How much water this river discharges into its output water feature in m³ per second.
   */
  discharge: number;

  /**
   * The length of the river from the source to its mouth.
   */
  length: number;

  /**
   * The average width of this rivers throughout its cells.
   */
  width: number;

  /**
   * How much this rivers grows or shrinks as you navigate up or down the river.
   */
  widthFactor: number;

  /**
   * The width of the source of this river, usually 0 if it originates from a land cell.
   */
  sourceWidth: number;

  /**
   * The id of the river's parent if any. The ID will be 0 if the river has no parent (it's a root river).
   */
  parent: number;

  /**
   * The list of cells that make up this river. The river is configured to meander throughout its cells to give the
   * appearance of a real river and not a straight line.
   */
  cells: number[];
}

/**
 * voronoi cells generated from the voronoi algorithm.
 */
export interface Cells {
  /**
   * Array of indexes for each cell in the grid.
   */
  indexes: Uint32Array | Uint8Array | Uint16Array;

  /**
   * Cell vertices for the cell at the given index.
   */
  vertices: number[][];

  /**
   * Cells adjacent to the cell at the given index.
   */
  adjacentCells: number[][];

  /**
   * List of all the cells, identifying which one is a near border cell or not.
   */
  nearBorderCells: boolean[];

  /**
   * Array of heights from the heightmap for each cell.
   */
  heights: Uint32Array | Uint8Array | Uint16Array;

  /**
   * Array of features indexes for individual cells, can be used to query the actual feature from the features array of
   * the grid.
   */
  features: Uint16Array;

  /**
   * Array of types for cells to identify which cells are part of the land/coast of a landmass and which cells are the
   * water near the landmass.
   */
  types: CellType[];

  /**
   * Array of temperatures for the given cell IDs, generated by creating a random position for the map on a globe.
   */
  temperatures: Int8Array;

  /**
   * Array of precipitation for the given cell IDs, used to generate biomes for individual cells as it tells how dry or
   * wet an area of the map is.
   */
  precipitation: Uint8Array;

  /**
   * Array of water flux values for each cell, useful to generate rivers and biomes, in m³ per second.
   */
  waterFlux: Uint16Array;

  /**
   * Array of river indexes for a cell. 0 if there are no rivers on that cell, otherwise it defines the ID for the river
   * from the grid object.
   */
  rivers: Uint16Array;

  /**
   * Array of confluence for rivers, this describes when two or more rivers merge into one another.
   */
  confluences: Uint8Array | Uint16Array;
}

export interface PackedCells extends Cells {
  /**
   * Array of tupples that record all the points from all the cells in the grid.
   */
  points: Point[];

  /**
   * Object containing the precalculated points for the various paths to draw for coastlines, rivers, lakes, and
   * other objects that are calculated from cell positions. This avoids having to recalculate all this every time we
   * render the map if they don't change.
   */
  pathPoints: {
    coastlines: Point[][];
    /**
     * Lakes are stored as an object with the feature ID as the key and the points for the lake's shoreline
     * as value.
     */
    lakes: Record<number, Point[]>;
  };

  /**
   * Array of indexes that maps 1:1 with the `indexes` property. Prioritize using this array instead of `index` as the
   * cells might have moved slightly during the second Voronoi pass.
   */
  gridIndex: Uint32Array | Uint8Array | Uint16Array;

  /**
   * Array of cell indexes that points towards the opposite water cell of the given land cell, helps with
   * figuring out where to go to access the sea the fastest from a cell.
   */
  haven: Uint16Array | Uint32Array;

  /**
   * Array that contains the number of adjacent water cells to a given cell, if any. Helps with figuring out
   * where to position a "harbor" for features.
   */
  harbor: Uint8Array;

  /**
   * Tree of quads generates by d3, useful for drawing the map.
   */
  quads: Quadtree<[number, number, number]>;

  /**
   * Array of polygon areas for each cell. Use the array index to find out the general size of the cell's polygon.
   */
  area: Uint32Array | Uint8Array | Uint16Array;

  /**
   * Array of biome IDs for each cell, which maps with the defined biomes for the current grid.
   */
  biomes: Uint8Array;

  /**
   * Array of suitability for humans on each cell. Ranks the suitability as a weight to determine population
   * and culture generation.
   */
  suitability: Int16Array;

  /**
   * Array of population count (unit is a thousand people) for each cell, which will be used to determine the
   * settlements placement and other cultural generation.
   */
  populations: Float32Array;
}

/**
 * Lists of vertices for each cell in the grid.
 */
export interface Vertices {
  /**
   * Coordinates for the vertices of the cells at the given index, will be set to the center of the triangle generated
   * by delaunator.
   */
  coordinates: Point[];

  /**
   * Neighbouring vertices for the vertex at the given index.
   */
  neighbours: number[][];

  /**
   * Adjacent cells of the vertex at the given index.
   */
  adjacent: [number, number, number][];
}

/**
 * The definition for a map's Grid, which contains all the cells and vertices definitions, but the description
 * of what kind of map feature they contain (heightmap, ocean, lake, river, etc.).
 */
export interface Grid {
  spacing: number;
  boundary: Point[];
  points: Point[];
  cellsX: number;
  cellsY: number;

  cells: Cells;
  vertices: Vertices;
  features: Feature[];
  rivers: River[];
}

/**
 * The final definition for a grid, once all the calculations have been done. This grid has had multiple runs of the
 * Voronoi algorithm run on it and should be final.
 */
export interface PackedGrid extends Grid {
  mapSize: number;
  mapLatitude: number;

  cells: PackedCells;
  features: PackedFeature[];
  ruler?: [Point, Point];
}
