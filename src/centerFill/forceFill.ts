import { Point } from '../patterns/types';
import { CenterFillGenerator, CenterFillConfig } from './types';

export class ForceFillGenerator implements CenterFillGenerator {
  generatePoints(config: CenterFillConfig): Point[] {
    const {
      centerRadius,
      minDistance,
      holeRadius,
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

    console.log('Force Fill Configuration:', {
      centerRadius,
      holeRadius,
      baseSpacing,
      outerPoints: outerPoints.length,
    });

    // Density calculation
    const pointArea = Math.PI * Math.pow(baseSpacing / 2, 2);
    const centerArea = Math.PI * centerRadius * centerRadius;
    
    const expectedPoints = Math.ceil(centerArea / pointArea);
    const densityMultiplier = densityFactor <= 0 
      ? 1 + densityFactor
      : 1 + densityFactor;

    const targetPoints = Math.max(1, Math.ceil(expectedPoints * densityMultiplier));
    const gridSpacing = Math.sqrt(centerArea / (targetPoints * Math.sqrt(3)/2));

    // Initial point generation
    const points: Point[] = [];
    const hexHeight = gridSpacing * Math.sqrt(3) / 2;
    
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
            let tooClose = false;
            
            for (const p of points) {
              const dx = x - p.x;
              const dy = y - p.y;
              const distSq = dx * dx + dy * dy;
              if (distSq < gridSpacing * gridSpacing) {
                tooClose = true;
                break;
              }
            }
            
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

    // Trim excess points
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

    // Maximum allowed radius with a small safety margin
    const maxRadius = Math.min(
      centerRadius + holeRadius,
      centerRadius + baseSpacing * 0.45
    );

    // Force simulation
    for (let iter = 0; iter < maxIterations; iter++) {
      let maxMove = 0;
      let maxOverlap = 0;
      const forces: Point[] = points.map(() => ({ x: 0, y: 0 }));

      points.forEach((p1, i) => {
        if (centerHole && i === 0) return;

        // Use consistent repulsion for all points with overlap checking
        const repulsePoint = (p2: Point) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          
          // Track any overlaps we find
          if (distSq < baseSpacing * baseSpacing) {
            maxOverlap = Math.max(maxOverlap, baseSpacing - Math.sqrt(distSq));
          }
          
          if (distSq < baseSpacing * baseSpacing * 4) {
            const dist = Math.sqrt(distSq);
            // Increase force magnitude when points are too close
            const closenessFactor = dist < baseSpacing ? 2 : 1;
            const forceMagnitude = Math.pow(baseSpacing / dist, 2) * baseSpacing * closenessFactor;
            forces[i].x += dx * forceMagnitude / dist;
            forces[i].y += dy * forceMagnitude / dist;
          }
        };

        // Apply same repulsion to both outer and inner points
        outerPoints.forEach(repulsePoint);
        points.forEach((p2, j) => {
          if (i !== j) repulsePoint(p2);
        });
      });

      // Adjust damping based on overlap
      const baseDamping = 0.2 * Math.pow(0.95, iter);
      const damping = maxOverlap > 0 ? baseDamping * 1.5 : baseDamping;

      points.forEach((p, i) => {
        if (centerHole && i === 0) return;

        const moveX = forces[i].x * damping;
        const moveY = forces[i].y * damping;
        
        let newX = p.x + moveX;
        let newY = p.y + moveY;
        
        // Strict boundary enforcement
        const newDist = Math.sqrt(newX * newX + newY * newY);
        if (newDist > maxRadius) {
          const scale = maxRadius / newDist;
          newX *= scale;
          newY *= scale;
        }

        // More thorough overlap checking
        let canMove = true;
        let minSpacing = Number.POSITIVE_INFINITY;
        
        // Check against internal points
        for (let j = 0; j < points.length; j++) {
          if (i === j) continue;
          const dx = newX - points[j].x;
          const dy = newY - points[j].y;
          const distSq = dx * dx + dy * dy;
          minSpacing = Math.min(minSpacing, Math.sqrt(distSq));
          if (distSq < gridSpacing * gridSpacing) {
            canMove = false;
            break;
          }
        }
        
        // Check against outer points with strict spacing
        if (canMove) {
          for (const patternPoint of outerPoints) {
            const dx = newX - patternPoint.x;
            const dy = newY - patternPoint.y;
            const distSq = dx * dx + dy * dy;
            minSpacing = Math.min(minSpacing, Math.sqrt(distSq));
            // Slightly increase the minimum spacing requirement
            if (distSq < baseSpacing * baseSpacing * 1.01) {
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

      if (maxMove < gridSpacing * 0.001 && maxOverlap < 0.001) break;
    }

    // Final overlap check
    let finalOverlaps = 0;
    points.forEach((p1) => {
      outerPoints.forEach((p2) => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < baseSpacing) {
          finalOverlaps++;
        }
      });
    });

    if (finalOverlaps > 0) {
      console.warn(`Found ${finalOverlaps} overlaps with outer points in final configuration`);
    }

    return points;
  }
}
