export interface Point {
  x: number;
  y: number;
}

export interface BasePatternConfig {
  radius: number;
  holeRadius: number;
  minClearance: number;
  centerHole?: boolean;
  innerRadius?: number;
  centerExclusion: number;
  getSpacing?: (x: number, y: number, baseSpacing: number) => number;
  spacingFactor?: number;  // Add this line
}

export type PatternType = 
  | 'phyllotaxis'
  | 'fermat'
  | 'concentric'
  | 'hex';

export interface SpiralPatternConfig extends BasePatternConfig {
  divergenceAngle: number;
  spacing: number;
  numPoints: number;
}

export interface ConcentricPatternConfig extends BasePatternConfig {
  ringSpacingFactor?: number;
  pointSpacingFactor?: number;
}

export interface HexPatternConfig extends BasePatternConfig {
  spacing: number;
}

export interface PatternGenerator {
  generatePoints(config: SpiralPatternConfig | ConcentricPatternConfig | HexPatternConfig): Point[];
}
