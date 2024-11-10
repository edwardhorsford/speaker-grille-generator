import { Point, SpiralPatternConfig, PatternGenerator } from './types';

/**
 * Generates points in a phyllotaxis pattern (spiral pattern found in nature, like sunflower seeds)
 * See: https://en.wikipedia.org/wiki/Phyllotaxis
 */
export class PhyllotaxisPattern implements PatternGenerator {
  generatePoints(config: SpiralPatternConfig): Point[] {
    const { 
      radius,
      spacing,
      divergenceAngle,
      numPoints,
      centerExclusion,
      centerHole,
      holeRadius,
      minClearance
    } = config;

    const points: Point[] = [];
    const centerHoleRadius = holeRadius + minClearance;
    
    // If centerHole is true, add a point at the exact center
    if (centerHole) {
      points.push({ x: 0, y: 0 });
    }

    for (let i = centerHole ? 1 : 0; i < numPoints; i++) {
      // Convert divergence angle to radians
      const angle = i * divergenceAngle * (Math.PI / 180);
      
      // Distance from center increases with square root of i
      // This maintains consistent density across the pattern
      const r = spacing * Math.sqrt(i);
      
      // Break if we've exceeded the maximum radius
      if (r > radius) break;
      
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      
      // Check if point is outside center exclusion zone
      // If we have a center hole, ensure new points don't overlap with it
      const distanceFromCenter = Math.sqrt(x * x + y * y);
      const minDistance = centerHole ? centerHoleRadius : centerExclusion;
      
      if (distanceFromCenter >= minDistance) {
        points.push({ x, y });
      }
    }

    return points;
  }

  /**
   * Helper function to suggest good divergence angles based on common patterns in nature
   * Returns array of angles that tend to produce aesthetically pleasing results
   */
  static getSuggestedAngles(): number[] {
    return [
      137.5,  // Golden angle (most common in nature)
      137.3,  // Slight variation
      137.6,  // Slight variation
      99.5,   // Alternative pattern
      77.96   // Alternative pattern
    ];
  }
}
