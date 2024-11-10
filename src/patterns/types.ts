/**
 * Represents a 2D point in the pattern
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Basic configuration options shared by all pattern generators
 */
export interface BasePatternConfig {
  // Overall size of the pattern
  radius: number;
  
  // Size of each hole
  holeRadius: number;
  
  // Minimum distance between holes
  minClearance: number;
  
  // Radius of the center exclusion zone
  centerExclusion: number;
  
  // Whether to enforce a hole in the exact center
  centerHole?: boolean;

  // Inner radius where pattern should start (used internally)
  innerRadius?: number;

  getSpacing?: (x: number, y: number) => number;
}

/**
 * Available pattern generation algorithms 
 */
export type PatternType = 
  | 'phyllotaxis'
  | 'fermat'
  | 'concentric';

/**
 * Configuration specific to phyllotaxis/fermat spiral patterns
 */
export interface SpiralPatternConfig extends BasePatternConfig {
  // Angle between successive points (in degrees)
  divergenceAngle: number;
  
  // Base spacing between points
  spacing: number;
  
  // Maximum number of points to generate
  numPoints: number;
}

/**
 * Configuration specific to concentric ring patterns
 */
export interface ConcentricPatternConfig extends BasePatternConfig {
  // Spacing between rings
  concentricSpacing: number;
}

/**
 * Interface that all pattern generators must implement
 */
export interface PatternGenerator {
  /**
   * Generate points for the pattern based on configuration
   */
  generatePoints(config: SpiralPatternConfig | ConcentricPatternConfig, getSpacing: (x: number, y: number) => number): Point[];
}
