import { Point } from '../patterns/types';
import { CenterFillGenerator, CenterFillConfig, checkOverlap, isWithinCenter } from './types';

export class PoissonFillGenerator implements CenterFillGenerator {
  generatePoints(config: CenterFillConfig): Point[] {
    const {
      centerRadius,
      minDistance,
      holeRadius,
      centerHole = false,
      poissonAttempts = 30
    } = config;

    if (centerRadius <= 0) return [];

    const points: Point[] = [];
    const targetSpacing = (holeRadius * 2) + minDistance;
    
    // Limit grid size to prevent array allocation errors
    const cellSize = targetSpacing / Math.sqrt(2);
    const maxGridSize = 100; // Reasonable maximum
    const gridSize = Math.min(maxGridSize, Math.ceil((centerRadius * 2) / cellSize));
    const grid: (number | null)[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    const active: number[] = [];
    
    // Convert world coordinates to grid coordinates
    const worldToGrid = (x: number, y: number): [number, number] => {
      const gridX = Math.floor((x + centerRadius) / cellSize);
      const gridY = Math.floor((y + centerRadius) / cellSize);
      return [
        Math.max(0, Math.min(gridSize - 1, gridX)),
        Math.max(0, Math.min(gridSize - 1, gridY))
      ];
    };

    const addPoint = (p: Point): void => {
      points.push(p);
      const [gridX, gridY] = worldToGrid(p.x, p.y);
      grid[gridY][gridX] = points.length - 1;
      active.push(points.length - 1);
    };

    // Start with center point if required
    if (centerHole) {
      addPoint({ x: 0, y: 0 });
    } else {
      // Start with a random point
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (centerRadius * 0.5);
      addPoint({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }

    while (active.length > 0) {
      const activeIndex = Math.floor(Math.random() * active.length);
      const point = points[active[activeIndex]];
      let found = false;

      for (let i = 0; i < poissonAttempts; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = targetSpacing;
        const newPoint = {
          x: point.x + Math.cos(angle) * r,
          y: point.y + Math.sin(angle) * r
        };

        if (!isWithinCenter(newPoint, centerRadius)) continue;

        // Check nearby points for conflicts
        let valid = true;
        const [gridX, gridY] = worldToGrid(newPoint.x, newPoint.y);
        
        for (let dx = -2; dx <= 2 && valid; dx++) {
          for (let dy = -2; dy <= 2 && valid; dy++) {
            const checkX = gridX + dx;
            const checkY = gridY + dy;
            
            if (checkX >= 0 && checkX < gridSize && checkY >= 0 && checkY < gridSize) {
              const idx = grid[checkY][checkX];
              if (idx !== null) {
                const existingPoint = points[idx];
                const distSq = 
                  Math.pow(newPoint.x - existingPoint.x, 2) + 
                  Math.pow(newPoint.y - existingPoint.y, 2);
                if (distSq < targetSpacing * targetSpacing) {
                  valid = false;
                }
              }
            }
          }
        }

        if (valid) {
          found = true;
          addPoint(newPoint);
          break;
        }
      }

      if (!found) {
        active.splice(activeIndex, 1);
      }
    }

    return points;
  }
}
