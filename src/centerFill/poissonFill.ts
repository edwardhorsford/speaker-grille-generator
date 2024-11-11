import { Point } from '../patterns/types';
import { CenterFillGenerator, CenterFillConfig, checkOverlap, isWithinCenter } from './types';

export class PoissonFillGenerator implements CenterFillGenerator {
  generatePoints(config: CenterFillConfig): Point[] {
    const {
      centerRadius,
      minDistance,
      holeRadius,
      centerHole = false,
      poissonAttempts = 30,
      densityFactor = 0,
      outerPoints = []
    } = config;

    if (centerRadius <= 0) return [];
    
    if (densityFactor <= -0.9) {
      return centerHole ? [{ x: 0, y: 0 }] : [];
    }

    const points: Point[] = [];
    
    // Calculate base spacing based on outer points
    const baseSpacing = (holeRadius * 2) + minDistance;
    let effectiveSpacing = baseSpacing;
    
    if (outerPoints.length > 0) {
      const spacings = outerPoints.map(p1 => 
        Math.min(...outerPoints
          .filter(p2 => p2 !== p1)
          .map(p2 => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)))
      ).sort((a, b) => a - b);
      
      const sampleSize = Math.max(1, Math.floor(spacings.length * 0.2));
      effectiveSpacing = spacings.slice(0, sampleSize).reduce((a, b) => a + b) / sampleSize;
    }

    // Calculate spacing multiplier based on density factor
    const spacingMultiplier = densityFactor < 0
      ? Math.exp(Math.abs(densityFactor) * 0.8)
      : 1 - (densityFactor * 0.3);
    
    const targetSpacing = effectiveSpacing * spacingMultiplier;
    const minCenterDistance = centerHole ? (holeRadius * 2 + minDistance) : 0;
    
    // Grid setup
    const cellSize = targetSpacing / Math.sqrt(2);
    const gridSize = Math.ceil((centerRadius * 2 + targetSpacing) / cellSize); // Slightly larger grid
    const grid: (number | null)[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    const active: number[] = [];
    
    const worldToGrid = (x: number, y: number): [number, number] => {
      const gridX = Math.floor((x + centerRadius + targetSpacing/2) / cellSize);
      const gridY = Math.floor((y + centerRadius + targetSpacing/2) / cellSize);
      return [
        Math.max(0, Math.min(gridSize - 1, gridX)),
        Math.max(0, Math.min(gridSize - 1, gridY))
      ];
    };

    const addPoint = (p: Point): void => {
      const pointIndex = points.length;
      points.push(p);
      const [gridX, gridY] = worldToGrid(p.x, p.y);
      grid[gridY][gridX] = pointIndex;
      active.push(pointIndex);
    };

    // Find a valid starting point - try to start near boundaries
    let attempts = 100;
    let startPoint = null;
    while (attempts > 0 && !startPoint) {
      const angle = Math.random() * Math.PI * 2;
      const r = centerRadius * (0.8 + Math.random() * 0.2); // Prefer starting near the boundary
      const candidate = {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      };
      
      // Allow slightly closer placement to outer points for first point
      const tooCloseToOuter = outerPoints.some(p => {
        const dx = candidate.x - p.x;
        const dy = candidate.y - p.y;
        return (dx * dx + dy * dy) < (targetSpacing * targetSpacing * 0.9);
      });
      
      if (!tooCloseToOuter && (!centerHole || 
          Math.sqrt(candidate.x * candidate.x + candidate.y * candidate.y) >= minCenterDistance)) {
        startPoint = candidate;
        addPoint(startPoint);
      }
      attempts--;
    }

    if (!startPoint) {
      return centerHole ? [{ x: 0, y: 0 }] : [];
    }

    // Scale base number of attempts by circle size
    const baseAttempts = Math.ceil(Math.PI * centerRadius * centerRadius / (targetSpacing * targetSpacing));
    const maxFailures = Math.max(20, Math.ceil(baseAttempts * 0.1));
    let failures = 0;

    while (active.length > 0 && failures < maxFailures) {
      const activeIndex = Math.floor(Math.random() * active.length);
      const point = points[active[activeIndex]];
      let found = false;

      const currentAttempts = Math.max(poissonAttempts, 
        Math.ceil(poissonAttempts * (1 - Math.min(densityFactor, 0))));

      for (let i = 0; i < currentAttempts; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = targetSpacing * (0.9 + Math.random() * 0.2); // Allow some variance in spacing
        const newPoint = {
          x: point.x + Math.cos(angle) * r,
          y: point.y + Math.sin(angle) * r
        };

        // Check for center hole first
        const distFromCenter = Math.sqrt(newPoint.x * newPoint.x + newPoint.y * newPoint.y);
        if (centerHole && distFromCenter < minCenterDistance) continue;
        
        // Allow points slightly outside circle and then clip them
        const distFromCenterNormalized = distFromCenter / centerRadius;
        if (distFromCenterNormalized > 1.1) continue; // Only skip if way outside
        
        // If close to boundary, adjust point to lie exactly on circle
        if (distFromCenterNormalized > 1) {
          newPoint.x *= centerRadius / distFromCenter;
          newPoint.y *= centerRadius / distFromCenter;
        }

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
                if (distSq < targetSpacing * targetSpacing * 0.85) { // Allow slightly closer placement
                  valid = false;
                }
              }
            }
          }
        }

        // Check against outer points with slightly reduced spacing requirement
        const tooCloseToOuter = outerPoints.some(p => {
          const dx = newPoint.x - p.x;
          const dy = newPoint.y - p.y;
          const distSq = dx * dx + dy * dy;
          const reduction = 0.9; // Allow closer placement to outer points
          return distSq < (targetSpacing * targetSpacing * reduction);
        });

        if (valid && !tooCloseToOuter) {
          found = true;
          addPoint(newPoint);
          failures = 0;
          break;
        }
      }

      if (!found) {
        active.splice(activeIndex, 1);
        failures++;
      }
    }

    if (centerHole) {
      points.unshift({ x: 0, y: 0 });
    }

    return points;
  }
}
