import { Point, SpiralPatternConfig, PatternGenerator } from './types';

/**
 * Generates points in a Fermat spiral pattern.
 * Similar to phyllotaxis but with different radial scaling.
 */
export class FermatPattern implements PatternGenerator {
  generatePoints(config: SpiralPatternConfig): Point[] {
    const { 
      radius,
      spacing,
      divergenceAngle,
      numPoints,
      innerRadius = 0,
      centerHole,
      holeRadius,
      minClearance
    } = config;

    const points: Point[] = [];
    
    // If centerHole is true and no innerRadius, add a point at the exact center
    if (centerHole && !innerRadius) {
      points.push({ x: 0, y: 0 });
    }

    // Calculate starting angle based on innerRadius to maintain proper density
    // For Fermat spiral, r = spacing * sqrt(angle), so angle = (r/spacing)^2
    const startAngle = innerRadius > 0 ? Math.pow(innerRadius / spacing, 2) : 0;
    const angleStep = divergenceAngle * (Math.PI / 180);
    
    let angle = startAngle;
    let i = Math.floor(startAngle / angleStep);
    
    while (i < numPoints) {
      angle = i * angleStep;
      
      // In Fermat spiral, radius grows with square root of angle
      const r = spacing * Math.sqrt(angle);
      
      // Break if we've exceeded the maximum radius
      if (r > radius) break;
      
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      
      // Only add points outside the innerRadius
      const distanceFromCenter = Math.sqrt(x * x + y * y);
      if (distanceFromCenter >= innerRadius) {
        points.push({ x, y });
      }
      
      i++;
    }

    return points;
  }
}
