import { Point } from '../patterns/types';
import { CenterFillGenerator, CenterFillConfig } from './types';

export class ForceFillGenerator implements CenterFillGenerator {
  generatePoints(config: CenterFillConfig): Point[] {
    const {
      centerRadius,
      minDistance,
      holeRadius,
      bufferRadius = centerRadius + minDistance,
      outerPoints = [],
      centerHole = false,
      maxIterations = 150,
      densityFactor = 0  // -1 to 1 range
    } = config;

    if (centerRadius <= 0) return [];

    const baseSpacing = (holeRadius * 2) + minDistance;
    
    // Calculate area and number of points based on outer pattern density
    const centerArea = Math.PI * centerRadius * centerRadius;
    const outerPointDensity = outerPoints.length > 0 ? 
      outerPoints.length / (Math.PI * (Math.pow(bufferRadius, 2) - Math.pow(centerRadius, 2))) :
      1 / (Math.pow(baseSpacing, 2) * Math.sqrt(3)/2);

    // Adjust density based on densityFactor (reversed and scaled)
    const adjustedDensity = outerPointDensity * Math.exp(densityFactor * 1.2);
    const targetPoints = Math.ceil(centerArea * adjustedDensity);

    console.log('Density calculation:', {
      centerArea,
      outerPointDensity,
      adjustedDensity,
      targetPoints,
      densityFactor
    });

    // Calculate grid spacing based on target density
    const gridSpacing = Math.sqrt(centerArea / (targetPoints * Math.sqrt(3)/2));
    
    const points: Point[] = [];
    
    // Generate hexagonal grid with slight randomization
    const hexHeight = gridSpacing * Math.sqrt(3) / 2;
    const gridRadius = centerRadius * 1.02;
    
    let row = -Math.ceil(gridRadius / hexHeight);
    while (row * hexHeight <= gridRadius) {
      const rowOffset = (row % 2) * (gridSpacing / 2);
      const rowWidth = Math.sqrt(Math.pow(gridRadius, 2) - Math.pow(row * hexHeight, 2));
      
      let col = -Math.ceil(rowWidth / gridSpacing);
      while (col * gridSpacing <= rowWidth) {
        // Add small random offset (10% of spacing)
        const randomOffset = gridSpacing * 0.1;
        const x = col * gridSpacing + rowOffset + (Math.random() - 0.5) * randomOffset;
        const y = row * hexHeight + (Math.random() - 0.5) * randomOffset;
        
        const distFromCenter = Math.sqrt(x * x + y * y);
        if (distFromCenter <= centerRadius) {
          // Skip points in the very center if centerHole
          if (!centerHole || distFromCenter > baseSpacing) {
            // Check for overlap with outer points
            let tooClose = false;
            for (const outerPoint of outerPoints) {
              const dx = x - outerPoint.x;
              const dy = y - outerPoint.y;
              const distSq = dx * dx + dy * dy;
              if (distSq < baseSpacing * baseSpacing) {
                tooClose = true;
                break;
              }
            }
            
            if (!tooClose) {
              points.push({ x, y });
            }
          }
        }
        col++;
      }
      row++;
    }

    // Add center point if needed
    if (centerHole) {
      points.unshift({ x: 0, y: 0 });
    }

    console.log('Grid generation:', {
      gridSpacing,
      initialPoints: points.length,
      targetPoints
    });

    // Apply forces
    for (let iter = 0; iter < maxIterations; iter++) {
      let maxMove = 0;
      const forces: Point[] = points.map(() => ({ x: 0, y: 0 }));

      // Calculate forces
      points.forEach((p1, i) => {
        if (centerHole && i === 0) return;

        // Repulsion from other points
        points.forEach((p2, j) => {
          if (i === j || (centerHole && j === 0)) return;
          
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < gridSpacing * gridSpacing * 4) {
            const dist = Math.sqrt(distSq);
            const forceMagnitude = Math.pow(gridSpacing / dist, 2.5) * gridSpacing;
            forces[i].x += dx * forceMagnitude / dist;
            forces[i].y += dy * forceMagnitude / dist;
          }
        });

        // Strong repulsion from outer points
        outerPoints.forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < baseSpacing * baseSpacing * 4) {
            const dist = Math.sqrt(distSq);
            const forceMagnitude = Math.pow(baseSpacing / dist, 3) * baseSpacing * 3;
            forces[i].x += dx * forceMagnitude / dist;
            forces[i].y += dy * forceMagnitude / dist;
          }
        });

        // Boundary forces
        const distFromCenter = Math.sqrt(p1.x * p1.x + p1.y * p1.y);
        const ratio = distFromCenter / centerRadius;

        if (ratio > 0.85) {
          const forceMagnitude = Math.exp(10 * (ratio - 0.85)) * gridSpacing;
          forces[i].x -= p1.x * forceMagnitude / distFromCenter;
          forces[i].y -= p1.y * forceMagnitude / distFromCenter;
        }

        // Center hole is treated just like any other point repulsion
        // No special additional forces needed
      });

      // Apply forces with adaptive damping
      const damping = 0.3 * Math.pow(0.95, iter);

      points.forEach((p, i) => {
        if (centerHole && i === 0) return;

        const moveX = forces[i].x * damping;
        const moveY = forces[i].y * damping;
        
        let newX = p.x + moveX;
        let newY = p.y + moveY;
        
        // Boundary enforcement
        const newDist = Math.sqrt(newX * newX + newY * newY);
        if (newDist > centerRadius * 0.98) {
          const scale = (centerRadius * 0.98) / newDist;
          newX *= scale;
          newY *= scale;
        }
        
        p.x = newX;
        p.y = newY;
        
        maxMove = Math.max(maxMove, Math.abs(moveX), Math.abs(moveY));
      });

      if (iter % 10 === 0) {
        console.log(`Iteration ${iter}: maxMove = ${maxMove}`);
      }

      // Early termination if stable
      if (maxMove < gridSpacing * 0.001) {
        console.log(`Converged after ${iter} iterations with final movement ${maxMove}`);
        break;
      }
    }

    return points;
  }
}
