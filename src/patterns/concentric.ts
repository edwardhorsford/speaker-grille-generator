import { Point, ConcentricPatternConfig, PatternGenerator } from './types';

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
    
    // Start at the minimum radius or center exclusion radius
    let r = innerRadius;
    const minimumSpacing = 2 * holeRadius + minClearance;

    // Generate rings until we reach the outer radius
    while (r <= radius) {
      // Calculate how many points can fit around this ring
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

    // Add center point if needed
    if (centerHole) {
      points.unshift({ x: 0, y: 0 });
    }

    return points;
  }

  static getOptimalSpacing(holeRadius: number, minClearance: number): number {
    // A good default is slightly more than twice the hole diameter
    // This ensures holes in adjacent rings don't overlap
    return (2 * holeRadius + minClearance) * 1.1;
  }
}
