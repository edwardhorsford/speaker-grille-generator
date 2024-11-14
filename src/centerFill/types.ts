// In centerFill/types.ts

import { Point } from '../patterns/types';

export interface CenterFillConfig {
  centerRadius: number;
  minDistance: number;
  holeRadius: number;
  patternPoints: Point[];
  centerHole?: boolean;
  densityFactor?: number;
  forceStrength?: number;
  maxIterations?: number;
  outerPoints?: Point[];
}

export interface CenterFillGenerator {
  generatePoints(config: CenterFillConfig): Point[];
}

export function isWithinCenter(point: Point, radius: number): boolean {
  return (point.x * point.x + point.y * point.y) <= radius * radius;
}
