export interface Point {
  x: number;
  y: number;
}

export type PatternType = 'phyllotaxis' | 'fermat' | 'concentric';

export interface PatternConfig {
  pattern: PatternType;
  radius: number;
  holeRadius: number;
  divergenceAngle: number;
  spacing: number;
  minClearance: number;
  numPoints: number;
  concentricSpacing: number;
  centerExclusion: number;
}

export function generatePatternPoints(config: PatternConfig): Point[] {
  const points: Point[] = [];
  const {
    pattern,
    radius,
    spacing,
    divergenceAngle,
    numPoints,
    minClearance,
    centerExclusion,
    concentricSpacing,
    holeRadius
  } = config;

  if (pattern === 'concentric') {
    let r = centerExclusion;
    while (r <= radius) {
      const count = Math.floor(2 * Math.PI * r / (2 * holeRadius + minClearance));
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count;
        points.push({ 
          x: r * Math.cos(angle), 
          y: r * Math.sin(angle) 
        });
      }
      r += concentricSpacing;
    }
  } else {
    for (let i = 0; i < numPoints; i++) {
      const angle = i * divergenceAngle * (Math.PI / 180);
      const r = spacing * Math.sqrt(pattern === 'fermat' ? angle : i);
      if (r > radius) break;
      
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);
      
      if ((x * x + y * y) >= centerExclusion * centerExclusion) {
        points.push({ x, y });
      }
    }
  }

  return points;
}
