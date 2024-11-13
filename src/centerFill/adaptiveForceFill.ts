import { Point } from '../patterns/types';
import { CenterFillGenerator, CenterFillConfig } from './types';

export class AdaptiveForceFillGenerator implements CenterFillGenerator {
  generatePoints(config: CenterFillConfig): Point[] {
    const {
      centerRadius,
      minDistance,
      holeRadius,
      patternPoints = [],
      centerHole = false,
      maxIterations = 150,
      densityFactor = 0,
      forceStrength = 1.0
    } = config;

    if (centerRadius <= 0) return patternPoints;

    // Create working copy of all points
    const points = patternPoints.map(p => ({ ...p }));
    const baseSpacing = (holeRadius * 2) + minDistance;

    // Identify which points are in the center area
    const pointsInCenter = points.filter(p => {
      const distSq = p.x * p.x + p.y * p.y;
      return distSq <= centerRadius * centerRadius;
    });

    // Adjust center point count based on density factor
    if (densityFactor !== 0) {
      const targetCount = Math.max(1, Math.round(pointsInCenter.length * (1 + densityFactor)));
      
      if (targetCount < pointsInCenter.length) {
        // Remove points when reducing density
        while (pointsInCenter.length > targetCount) {
          let maxNeighbors = -1;
          let indexToRemove = -1;
          
          pointsInCenter.forEach((p1, i) => {
            if (centerHole && i === 0) return;
            
            let neighbors = 0;
            pointsInCenter.forEach((p2, j) => {
              if (i !== j) {
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                if (dx * dx + dy * dy < baseSpacing * baseSpacing * 4) {
                  neighbors++;
                }
              }
            });
            
            if (neighbors > maxNeighbors) {
              maxNeighbors = neighbors;
              indexToRemove = i;
            }
          });
          
          if (indexToRemove >= 0) {
            // Remove from both arrays
            const removed = pointsInCenter.splice(indexToRemove, 1)[0];
            const mainIndex = points.findIndex(p => p.x === removed.x && p.y === removed.y);
            if (mainIndex >= 0) {
              points.splice(mainIndex, 1);
            }
          }
        }
      } else if (targetCount > pointsInCenter.length) {
        // Add points when increasing density
        while (pointsInCenter.length < targetCount) {
          let bestX = 0, bestY = 0;
          let maxMinDist = 0;
          
          for (let attempts = 0; attempts < 50; attempts++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * centerRadius;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            
            let minDist = Number.POSITIVE_INFINITY;
            points.forEach(p => {
              const dx = x - p.x;
              const dy = y - p.y;
              const distSq = dx * dx + dy * dy;
              minDist = Math.min(minDist, Math.sqrt(distSq));
            });
            
            if (minDist > maxMinDist) {
              maxMinDist = minDist;
              bestX = x;
              bestY = y;
            }
          }
          
          if (maxMinDist > baseSpacing) {
            const newPoint = { x: bestX, y: bestY };
            points.push(newPoint);
            pointsInCenter.push(newPoint);
          } else {
            break;
          }
        }
      }
    }

    // Only run force simulation if force strength is non-zero
    if (forceStrength > 0) {
      // Apply forces only to center points but consider all points for repulsion
      for (let iter = 0; iter < maxIterations; iter++) {
        let maxMove = 0;
        const forces: Point[] = pointsInCenter.map(() => ({ x: 0, y: 0 }));

        pointsInCenter.forEach((p1, i) => {
          if (centerHole && i === 0) return;

          // Calculate distance from center for force scaling
          const distFromCenter = Math.sqrt(p1.x * p1.x + p1.y * p1.y);
          const distRatio = Math.min(1, distFromCenter / centerRadius);
          
          // Force gets stronger towards center
          const centerForceScale = forceStrength * (1 - Math.pow(distRatio, 2));

          // Consider all points for repulsion
          points.forEach(p2 => {
            if (p1 === p2) return;
            
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq < baseSpacing * baseSpacing * 4) {
              const dist = Math.sqrt(distSq);
              const forceMagnitude = Math.pow(baseSpacing / dist, 2) * baseSpacing * centerForceScale;
              forces[i].x += (dx / dist) * forceMagnitude;
              forces[i].y += (dy / dist) * forceMagnitude;
            }
          });
        });

        // Apply forces with adaptive damping
        const damping = 0.1 * Math.pow(0.95, iter);

        pointsInCenter.forEach((p, i) => {
          if (centerHole && i === 0) return;

          const moveX = forces[i].x * damping;
          const moveY = forces[i].y * damping;
          
          const newX = p.x + moveX;
          const newY = p.y + moveY;
          
          // Don't let points move outside center area
          const newDist = Math.sqrt(newX * newX + newY * newY);
          if (newDist <= centerRadius) {
            p.x = newX;
            p.y = newY;
            
            // Update corresponding point in main array
            const mainIndex = points.findIndex(point => point === p);
            if (mainIndex >= 0) {
              points[mainIndex].x = newX;
              points[mainIndex].y = newY;
            }
            
            maxMove = Math.max(maxMove, Math.abs(moveX), Math.abs(moveY));
          }
        });

        if (maxMove < baseSpacing * 0.001) {
          break;
        }
      }
    }
    
    return points;
  }
}