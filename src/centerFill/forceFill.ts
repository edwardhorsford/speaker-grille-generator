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
      densityFactor = 0
    } = config;

    if (centerRadius <= 0) return [];
    if (densityFactor <= -0.95) {
      return centerHole ? [{ x: 0, y: 0 }] : [];
    }

    const baseSpacing = (holeRadius * 2) + minDistance;

    // A better density calculation based on point spacing
    const pointArea = Math.PI * Math.pow(baseSpacing / 2, 2); // Area each point represents
    const centerArea = Math.PI * centerRadius * centerRadius;
    const ringArea = Math.PI * (Math.pow(bufferRadius, 2) - Math.pow(centerRadius, 2));
    
    // Calculate how many points would maintain the same spacing as the outer pattern
    const expectedPoints = Math.ceil(centerArea / pointArea);
    
    // Linear density scaling
    const densityMultiplier = densityFactor <= 0 
      ? 1 + densityFactor  // Linear reduction from 1 to 0
      : 1 + densityFactor; // Linear increase from 1 to 2

    const targetPoints = Math.max(1, Math.ceil(expectedPoints * densityMultiplier));
    const gridSpacing = Math.sqrt(centerArea / (targetPoints * Math.sqrt(3)/2));

    console.log('Density calculation:', {
      centerArea,
      ringArea,
      pointArea,
      baseSpacing,
      expectedPoints,
      densityMultiplier,
      targetPoints,
      gridSpacing: gridSpacing.toFixed(2),
      outerPoints: outerPoints.length
    });

    const points: Point[] = [];
    const hexHeight = gridSpacing * Math.sqrt(3) / 2;
    
    // Generate initial grid
    let row = -Math.ceil(centerRadius / hexHeight);
    while (row * hexHeight <= centerRadius) {
      const rowOffset = (row % 2) * (gridSpacing / 2);
      const rowWidth = Math.sqrt(Math.pow(centerRadius, 2) - Math.pow(row * hexHeight, 2));
      
      let col = -Math.ceil(rowWidth / gridSpacing);
      while (col * gridSpacing <= rowWidth) {
        const randomOffset = gridSpacing * 0.15;
        const x = col * gridSpacing + rowOffset + (Math.random() - 0.5) * randomOffset;
        const y = row * hexHeight + (Math.random() - 0.5) * randomOffset;
        
        const distFromCenter = Math.sqrt(x * x + y * y);
        if (distFromCenter <= centerRadius) {
          if (!centerHole || distFromCenter > baseSpacing) {
            // Check for overlap with existing points
            let tooClose = false;
            
            // Check against existing internal points
            for (const p of points) {
              const dx = x - p.x;
              const dy = y - p.y;
              const distSq = dx * dx + dy * dy;
              if (distSq < gridSpacing * gridSpacing) {
                tooClose = true;
                break;
              }
            }
            
            // Check against pattern points
            if (!tooClose) {
              for (const p of outerPoints) {
                const dx = x - p.x;
                const dy = y - p.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < baseSpacing * baseSpacing) {
                  tooClose = true;
                  break;
                }
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

    if (centerHole) {
      points.unshift({ x: 0, y: 0 });
    }

    // Trim excess points from edges
    while (points.length > targetPoints + (centerHole ? 1 : 0)) {
      let maxDist = 0;
      let maxIndex = -1;
      for (let i = centerHole ? 1 : 0; i < points.length; i++) {
        const dist = points[i].x * points[i].x + points[i].y * points[i].y;
        if (dist > maxDist) {
          maxDist = dist;
          maxIndex = i;
        }
      }
      if (maxIndex >= 0) {
        points.splice(maxIndex, 1);
      }
    }

    // Allow points slightly beyond center during simulation
    const extendedRadius = centerRadius + (holeRadius / 2);

    // Force simulation
    for (let iter = 0; iter < maxIterations; iter++) {
      let maxMove = 0;
      const forces: Point[] = points.map(() => ({ x: 0, y: 0 }));

      // Calculate forces
      points.forEach((p1, i) => {
        if (centerHole && i === 0) return;

        // Pattern point repulsion first (stronger at close range)
        outerPoints.forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          
          // Stronger repulsion at close range
          if (distSq < baseSpacing * baseSpacing * 4) {
            const dist = Math.sqrt(distSq);
            // Increased power for stronger close-range repulsion
            const forceMagnitude = Math.pow(baseSpacing / dist, 3) * baseSpacing * 2;
            forces[i].x += dx * forceMagnitude / dist;
            forces[i].y += dy * forceMagnitude / dist;
          }
        });

        // Internal repulsion
        points.forEach((p2, j) => {
          if (i === j) return;
          
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          
          const isFromCenterHole = centerHole && j === 0;
          const effectiveSpacing = isFromCenterHole ? baseSpacing : gridSpacing;
          
          if (distSq < effectiveSpacing * effectiveSpacing * 4) {
            const dist = Math.sqrt(distSq);
            const forceMagnitude = Math.pow(effectiveSpacing / dist, 2) * 
              effectiveSpacing * (isFromCenterHole ? 1.5 : 1);
            forces[i].x += dx * forceMagnitude / dist;
            forces[i].y += dy * forceMagnitude / dist;
          }
        });

        // Weaker boundary force
        const distFromCenter = Math.sqrt(p1.x * p1.x + p1.y * p1.y);
        if (distFromCenter > centerRadius) {
          const forceScale = Math.exp(3 * (distFromCenter - centerRadius) / holeRadius);
          const boundaryForce = forceScale * gridSpacing * 0.5; // Reduced boundary force
          forces[i].x -= p1.x * boundaryForce / distFromCenter;
          forces[i].y -= p1.y * boundaryForce / distFromCenter;
        }
      });

      const damping = 0.2 * Math.pow(0.95, iter);

      // Apply forces
      points.forEach((p, i) => {
        if (centerHole && i === 0) return;

        const moveX = forces[i].x * damping;
        const moveY = forces[i].y * damping;
        
        let newX = p.x + moveX;
        let newY = p.y + moveY;
        
        // Relaxed boundary enforcement
        const newDist = Math.sqrt(newX * newX + newY * newY);
        if (newDist > extendedRadius) {
          const scale = extendedRadius / newDist;
          newX *= scale;
          newY *= scale;
        }

        // Check for overlaps
        let canMove = true;
        
        // Check internal point overlaps
        for (let j = 0; j < points.length; j++) {
          if (i === j) continue;
          const dx = newX - points[j].x;
          const dy = newY - points[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < gridSpacing * gridSpacing) {
            canMove = false;
            break;
          }
        }
        
        // Check pattern point overlaps
        if (canMove) {
          for (const patternPoint of outerPoints) {
            const dx = newX - patternPoint.x;
            const dy = newY - patternPoint.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < baseSpacing * baseSpacing) {
              canMove = false;
              break;
            }
          }
        }

        if (canMove) {
          p.x = newX;
          p.y = newY;
          maxMove = Math.max(maxMove, Math.abs(moveX), Math.abs(moveY));
        }
      });

      if (iter % 10 === 0) {
        console.log(`Iteration ${iter}:`, { maxMove });
      }

      if (maxMove < gridSpacing * 0.001) break;
    }

    return points;
  }
}
