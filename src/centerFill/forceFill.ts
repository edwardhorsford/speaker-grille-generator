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
      maxIterations = 150
    } = config;

    if (centerRadius <= 0) return [];

    const spacing = (holeRadius * 2) + minDistance;
    
    console.log('Initial parameters:', {
      centerRadius,
      spacing,
      centerHole,
      outerPointCount: outerPoints.length
    });

    // Calculate areas
    const centerHoleArea = centerHole ? Math.PI * spacing * spacing : 0;
    const totalArea = Math.PI * centerRadius * centerRadius;
    const availableArea = totalArea - centerHoleArea;

    // Calculate density from outer points
    const bufferZonePoints = outerPoints.filter(p => {
      const distSq = p.x * p.x + p.y * p.y;
      return distSq <= bufferRadius * bufferRadius;
    });

    const bufferZoneArea = Math.PI * (bufferRadius * bufferRadius - centerRadius * centerRadius);
    const areaPerPoint = bufferZonePoints.length > 0 
      ? bufferZoneArea / bufferZonePoints.length
      : Math.PI * spacing * spacing;

    // Calculate target points for the available area (excluding center hole point)
    const rawTargetPoints = availableArea / areaPerPoint;
    const targetPoints = Math.floor(rawTargetPoints * 1.1);
    
    console.log('Area calculations:', {
      totalArea,
      centerHoleArea,
      availableArea,
      bufferZoneArea,
      areaPerPoint,
      rawTargetPoints,
      targetPoints
    });

    const points: Point[] = [];
    
    // Add center hole point if needed
    if (centerHole) {
      points.push({ x: 0, y: 0 });
      console.log('Added center hole point');
    }

    // Generate remaining points
    const minR = centerHole ? spacing : 0;
    while (points.length < targetPoints + (centerHole ? 1 : 0)) {
      const r = Math.sqrt(minR * minR + Math.random() * (centerRadius * centerRadius - minR * minR));
      const theta = Math.random() * 2 * Math.PI;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      points.push({ x, y });
    }
    // Generate points on a grid
    // const gridSize = Math.floor(Math.sqrt(targetPoints));
    // for (let i = 0; i < gridSize; i++) {
    //   for (let j = 0; j < gridSize; j++) {
    //     if (centerHole && i === 0 && j === 0) continue; // Skip center hole
        
    //     const x = ((i + 0.5) / gridSize) * 2 * centerRadius - centerRadius;
    //     const y = ((j + 0.5) / gridSize) * 2 * centerRadius - centerRadius;
    //     points.push({ x, y });
    //   }
    // }
    console.log('Points before force direction:', points.length);

    // Apply forces
    for (let iter = 0; iter < maxIterations; iter++) {
      let maxMove = 0;

      points.forEach((p, i) => {
        // Skip center hole point
        if (centerHole && i === 0) return;

        let [fx, fy] = [0, 0];

        // Strong repulsion from center hole point if it exists
        if (centerHole) {
          const dx = p.x - points[0].x;
          const dy = p.y - points[0].y;
          const distSq = dx * dx + dy * dy;
          if (distSq < spacing * spacing * 4) {
            const dist = Math.sqrt(distSq);
            const force = 2 * Math.pow(spacing / dist, 3); // Stronger force
            fx += dx * force;
            fy += dy * force;
          }
        }

        // Repulsion from other points
        points.forEach((p2, j) => {
          if (i === j || (centerHole && j === 0)) return; // Skip self and center hole
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < spacing * spacing * 4) {
            const dist = Math.sqrt(distSq);
            const force = Math.pow(spacing / dist, 3);
            fx += dx * force;
            fy += dy * force;
          }
        });

        // Repulsion from outer points
        outerPoints.forEach(p2 => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;
          
          if (distSq < spacing * spacing * 4) {
            const dist = Math.sqrt(distSq);
            const force = Math.pow(spacing / dist, 3);
            fx += dx * force;
            fy += dy * force;
          }
        });

        // Containment forces
        const distSq = p.x * p.x + p.y * p.y;
        const dist = Math.sqrt(distSq);
        const ratio = dist / centerRadius;

        if (ratio > 0.95) {
          const force = Math.exp(10 * (ratio - 0.95));
          fx -= p.x * force / dist;
          fy -= p.y * force / dist;
        } else if (ratio > 0.7) {
          const force = (ratio - 0.7) * 0.2;
          fx += p.x * force / dist;
          fy += p.y * force / dist;
        }

        // Apply movement
        const damping = 0.05 * Math.exp(-iter / (maxIterations * 0.5));
        const moveX = fx * damping;
        const moveY = fy * damping;
        
        let newX = p.x + moveX;
        let newY = p.y + moveY;
        
        // Enforce boundaries
        const newDist = Math.sqrt(newX * newX + newY * newY);
        if (newDist > centerRadius * 0.99) {
          const scale = (centerRadius * 0.99) / newDist;
          newX *= scale;
          newY *= scale;
        }
        
        // Enforce minimum distance from center hole
        if (centerHole && newDist < spacing) {
          const scale = spacing / newDist;
          newX *= scale;
          newY *= scale;
        }
        
        p.x = newX;
        p.y = newY;

        maxMove = Math.max(maxMove, Math.abs(moveX), Math.abs(moveY));
      });

      if (maxMove < spacing * 0.01) break;
    }

    console.log('Final point count:', points.length);
    return points;
  }
}
