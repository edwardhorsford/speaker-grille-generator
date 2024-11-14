import { Point, ConcentricPatternConfig, PatternGenerator } from './types';

export class ConcentricPattern implements PatternGenerator {
  generatePoints(config: ConcentricPatternConfig): Point[] {
    const { 
      radius,
      innerRadius = 0,
      centerHole,
      ringSpacingFactor = 0,
      pointSpacingFactor = 0,
      spacingFactor = 0,
      getSpacing,
      holeRadius,
    } = config;

    const points: Point[] = [];
    
    // Base spacing is affected by the global spacing factor
    const baseSpacing = holeRadius * (3 + spacingFactor);
    console.log({ringSpacingFactor})
    
    // Calculate ring spacing
    const ringBaseMultiplier = ringSpacingFactor >= 0 
      ? (1 + ringSpacingFactor * 2)
      : (1 / (1 + Math.abs(ringSpacingFactor) * 0.5));
    const ringSpacing = baseSpacing * ringBaseMultiplier;

    // Calculate point spacing
    const pointBaseMultiplier = pointSpacingFactor >= 0
      ? (1 + pointSpacingFactor * 2)
      : (1 / (1 + Math.abs(pointSpacingFactor) * 0.5));
    const pointSpacing = baseSpacing * pointBaseMultiplier;

    // Starting radius - account for center hole
    let currentRadius = Math.max(innerRadius, centerHole ? holeRadius : 0);

    // Add center point if center hole is enabled
    if (centerHole) {
        points.push({ x: 0, y: 0 });
        currentRadius += ringSpacing;
    }

    // Generate rings
    while (currentRadius <= radius) {
        // Get spacing for current radius position
        const effectivePointSpacing = getSpacing 
            ? getSpacing(currentRadius, 0, pointSpacing)
            : pointSpacing;

        const effectiveRingSpacing = getSpacing
            ? getSpacing(currentRadius, 0, ringSpacing)
            : ringSpacing;

        // Calculate points in this ring
        const circumference = 2 * Math.PI * currentRadius;
        const pointsInRing = Math.max(1, Math.floor(circumference / effectivePointSpacing));
        
        // Generate points around the ring
        const angleStep = (2 * Math.PI) / pointsInRing;
        for (let i = 0; i < pointsInRing; i++) {
            const angle = i * angleStep;
            const x = currentRadius * Math.cos(angle);
            const y = currentRadius * Math.sin(angle);
            points.push({ x, y });
        }

        // Move to next ring
        currentRadius += effectiveRingSpacing;
    }

    return points;
  }
}
