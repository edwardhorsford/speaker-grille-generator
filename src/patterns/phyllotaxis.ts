import { Point, SpiralPatternConfig, PatternGenerator } from './types';

export class PhyllotaxisPattern implements PatternGenerator {
  generatePoints(config: SpiralPatternConfig): Point[] {
    const { 
      radius,
      spacing: baseSpacing,
      getSpacing,
      divergenceAngle,
      numPoints,
      centerHole
    } = config;

    const points: Point[] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = i * divergenceAngle * (Math.PI / 180);
      
      // Start with base radius
      let r = baseSpacing * Math.sqrt(i);
      
      // If we have dynamic spacing, adjust the radius
      if (getSpacing) {
        const x = r * Math.cos(angle);
        const y = r * Math.sin(angle);
        const adjustedSpacing = getSpacing(x, y);
        const spacingRatio = adjustedSpacing / baseSpacing - 1;
        const adjustmentFactor = spacingRatio < 0 ? 1.0 : 0.2;
        r = r * (1 + adjustmentFactor * spacingRatio);
      }
      
      if (r > radius) break;
      
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      
      points.push({ x, y });
    }

    // Add center point if needed
    if (centerHole) {
      points.unshift({ x: 0, y: 0 });
    }

    return points;
  }

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
