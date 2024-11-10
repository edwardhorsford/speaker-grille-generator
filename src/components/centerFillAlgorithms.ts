import { Point } from './generatePatternPoints';

export type CenterFillAlgorithm = 'force' | 'poisson';

export interface CenterFillConfig {
  algorithm: CenterFillAlgorithm;
  centerRadius: number;
  minDistance: number;
  bufferRadius?: number;
  outerPoints?: Point[];
  numPoints?: number;
  spacing?: number;
}

function packPoints(
  centerPoints: Point[], 
  outerPoints: Point[], 
  centerRadius: number, 
  bufferRadius: number, 
  minDistance: number
): Point[] {
  const points = [...centerPoints];
  const bufferRadiusSq = bufferRadius * bufferRadius;
  const centerRadiusSq = centerRadius * centerRadius;
  
  for (let iter = 0; iter < 50; iter++) {
    points.forEach((p, i) => {
      let [fx, fy] = [0, 0];
      
      // Repulsion from other center points
      points.forEach((p2, j) => {
        if (i !== j) {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          if (dist < minDistance * 2) {
            const force = (minDistance * 2 - dist) / dist;
            fx += dx * force;
            fy += dy * force;
          }
        }
      });
      
      // Repulsion from outer points with falloff
      outerPoints.forEach(p2 => {
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= bufferRadiusSq) {
          const dist = Math.sqrt(distSq);
          if (dist < minDistance * 2) {
            const falloff = 1 - (Math.sqrt(distSq) - centerRadius) / (bufferRadius - centerRadius);
            const force = (minDistance * 2 - dist) / dist * falloff;
            fx += dx * force;
            fy += dy * force;
          }
        }
      });
      
      // Containment force
      const distSq = p.x * p.x + p.y * p.y;
      if (distSq > centerRadiusSq) {
        const dist = Math.sqrt(distSq);
        const force = (dist - centerRadius) / dist;
        fx -= p.x * force * 2;
        fy -= p.y * force * 2;
      }
      
      p.x += fx * 0.1;
      p.y += fy * 0.1;
    });
  }
  
  return points;
}

function poissonSample(radius: number, minDistance: number): Point[] {
  const points: Point[] = [];
  const cellSize = minDistance / Math.sqrt(2);
  const gridSize = Math.ceil((radius * 2) / cellSize);
  const grid = new Array(gridSize * gridSize).fill(null);
  const active: number[] = [];
  
  function getGridIndex(x: number, y: number): number {
    const gridX = Math.floor((x + radius) / cellSize);
    const gridY = Math.floor((y + radius) / cellSize);
    if (gridX < 0 || gridX >= gridSize || gridY < 0 || gridY >= gridSize) return -1;
    return gridX + gridY * gridSize;
  }
  
  function addPoint(p: Point): void {
    points.push(p);
    const idx = getGridIndex(p.x, p.y);
    if (idx !== -1) {
      grid[idx] = points.length - 1;
      active.push(points.length - 1);
    }
  }
  
  addPoint({ x: 0, y: 0 });
  
  while (active.length > 0) {
    const activeIndex = Math.floor(Math.random() * active.length);
    const point = points[active[activeIndex]];
    let found = false;
    
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = minDistance + Math.random() * minDistance;
      const newPoint = {
        x: point.x + Math.cos(angle) * r,
        y: point.y + Math.sin(angle) * r
      };
      
      if (newPoint.x * newPoint.x + newPoint.y * newPoint.y > radius * radius) continue;
      
      const gridIndex = getGridIndex(newPoint.x, newPoint.y);
      if (gridIndex === -1) continue;
      
      let valid = true;
      for (let j = 0; j < points.length; j++) {
        const dx = newPoint.x - points[j].x;
        const dy = newPoint.y - points[j].y;
        if (dx * dx + dy * dy < minDistance * minDistance) {
          valid = false;
          break;
        }
      }
      
      if (valid) {
        found = true;
        addPoint(newPoint);
        break;
      }
    }
    
    if (!found) active.splice(activeIndex, 1);
  }
  
  return points;
}

export function generateCenterPoints(config: CenterFillConfig): Point[] {
  const {
    algorithm,
    centerRadius,
    minDistance,
    bufferRadius = centerRadius + minDistance * 2,
    outerPoints = [],
    numPoints = Math.floor(Math.PI * centerRadius * centerRadius / (minDistance * minDistance)),
  } = config;

  if (algorithm === 'force') {
    const initialPoints = Array.from({ length: numPoints }, () => ({
      x: (Math.random() - 0.5) * centerRadius,
      y: (Math.random() - 0.5) * centerRadius
    }));
    return packPoints(initialPoints, outerPoints, centerRadius, bufferRadius, minDistance);
  } else {
    return poissonSample(centerRadius, minDistance);
  }
}
