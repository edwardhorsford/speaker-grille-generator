import { Point, SpiralPatternConfig, PatternGenerator } from './types';

export class FermatPattern implements PatternGenerator {
  generatePoints(config: SpiralPatternConfig): Point[] {
    const { 
      radius,
      spacing: baseSpacing,
      getSpacing,
      divergenceAngle,
      innerRadius = 0,
      centerHole
    } = config;

    const points: Point[] = [];
    
    const densityFactor = 0.80;
    const c = baseSpacing * densityFactor;
    
    const divergenceRad = divergenceAngle * (Math.PI / 180);
    const growthFactor = 8 * Math.PI;
    
    const maxR = radius * 1.02;
    const n = Math.ceil((maxR * growthFactor) / (c * 0.2));

    for (let i = 0; i < n; i++) {
        const theta = i * divergenceRad;
        
        // More moderate center effect with gradual decay
        const centerSpacingFactor = 1 + 8.0 * Math.exp(-theta / (Math.PI * 4));
        
        let r = ((c * theta) / growthFactor) * centerSpacingFactor;
        
        if (getSpacing) {
            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            const adjustedSpacing = getSpacing(x, y);
            r = r * Math.max(0.6, Math.min(3.0, adjustedSpacing / baseSpacing));
        }
        
        if (r > maxR) break;
        
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        
        const distanceFromCenter = Math.sqrt(x * x + y * y);
        
        // Only skip points if inside inner radius (for center exclusion)
        if (innerRadius > 0 && distanceFromCenter < innerRadius) continue;
        
        let tooClose = false;
        const minDistFactor = 0.8;
        
        // Check fewer previous points
        for (let j = Math.max(0, points.length - 8); j < points.length; j++) {
            const dx = x - points[j].x;
            const dy = y - points[j].y;
            const distSq = dx * dx + dy * dy;
            if (distSq < (baseSpacing * baseSpacing * minDistFactor)) {
                tooClose = true;
                break;
            }
        }
        
        if (!tooClose) {
            points.push({ x, y });
        }
    }

    // Add center point if needed
    if (centerHole) {
      points.unshift({ x: 0, y: 0 });
    }

    return points;
  }
}
