import type { Point } from '../patterns/types';

type CenterFillAlgorithm = 'force' | 'poisson' | 'hex' | 'concentric';

interface CenterFillConfig {
  /** Radius of center area to fill */
  centerRadius: number;
  
  /** Minimum distance between points */
  minDistance: number;
  
  /** Radius of each hole */
  holeRadius: number;
  
  /** Radius to consider outer points */
  bufferRadius?: number;
  
  /** Points near the center area to avoid */
  outerPoints?: Point[];
  
  /** Whether to force a hole in the exact center */
  centerHole?: boolean;
  
  /** Maximum iterations for force-directed */
  maxIterations?: number;
  
  /** Number of attempts for each poisson point */
  poissonAttempts?: number;

  /** Density factor for center fill (-1 to 1) */
  densityFactor?: number;
}

interface CenterFillGenerator {
  generatePoints(config: CenterFillConfig): Point[];
}

const checkOverlap = (
  point: Point,
  points: Point[],
  minDistance: number
): boolean => {
  return points.some(p => {
    const dx = point.x - p.x;
    const dy = point.y - p.y;
    return (dx * dx + dy * dy) < minDistance * minDistance;
  });
};

const isWithinCenter = (
  point: Point,
  centerRadius: number
): boolean => {
  const distSq = point.x * point.x + point.y * point.y;
  return distSq <= centerRadius * centerRadius;
};

export type {
  CenterFillAlgorithm,
  CenterFillConfig,
  CenterFillGenerator,
  Point
};

export {
  checkOverlap,
  isWithinCenter
};
