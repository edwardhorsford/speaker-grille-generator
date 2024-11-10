import { Point, ConcentricPatternConfig, PatternGenerator } from './types';

/**
 * Generates points in concentric rings, with points evenly spaced around each ring.
 */
export class ConcentricPattern implements PatternGenerator {
  generatePoints(config: ConcentricPatternConfig): Point[] {
    const { 
      radius,
      holeRadius,
      minClearance,
      innerRadius = 0,
      centerHole,
      concentricSpacing
    } = config;

    const points: Point[] = [];
    
    // If centerHole is true and no innerRadius, add a point at the exact center
    if (centerHole && !innerRadius) {
      points.push({ x: 0, y: 0 });
    }

    // Start at innerRadius (or minimum spacing if centerHole)
    let r = innerRadius;
    const minimumSpacing = 2 * holeRadius + minClearance;

    // Generate rings until we reach the outer radius
    while (r <= radius) {
      // Calculate how many points can fit around this ring
      // Circumference divided by the minimum spacing between points
      const circumference = 2 * Math.PI * r;
      const pointsInRing = Math.floor(circumference / minimumSpacing);
      
      if (pointsInRing > 0) {  // Only create ring if it can fit at least one point
        // Generate points around the ring
        for (let i = 0; i < pointsInRing; i++) {
          const angle = (i * 2 * Math.PI) / pointsInRing;
          points.push({ 
            x: r * Math.cos(angle), 
            y: r * Math.sin(angle) 
          });
        }
      }

      // Move to next ring
      r += concentricSpacing;
    }

    return points;
  }

  /**
   * Calculate the optimal spacing between rings based on hole size and clearance
   */
  static getOptimalSpacing(holeRadius: number, minClearance: number): number {
    // A good default is slightly more than twice the hole diameter
    // This ensures holes in adjacent rings don't overlap
    return (2 * holeRadius + minClearance) * 1.1;
  }
}
