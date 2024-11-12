import { Point } from '../patterns/types';
import { CenterFillGenerator, CenterFillConfig, isWithinCenter } from './types';

export class HexFillGenerator implements CenterFillGenerator {
  generatePoints(config: CenterFillConfig): Point[] {
    const {
      centerRadius,
      minDistance,
      holeRadius,
      centerHole = false,
      densityFactor = 0,
      outerPoints = []
    } = config;

    if (centerRadius <= 0) return [];
    if (densityFactor <= -0.95) {
      return centerHole ? [{ x: 0, y: 0 }] : [];
    }

    // Calculate base spacing
    const baseSpacing = (holeRadius * 2) + minDistance;
    
    // Calculate maximum packing density
    const minHexArea = 2 * Math.sqrt(3) * Math.pow(baseSpacing/2, 2);
    const centerArea = Math.PI * Math.pow(centerRadius, 2);
    const maxPoints = Math.floor(centerArea / minHexArea);
    
    // Adjust density scaling
    // At densityFactor = -1: very sparse
    // At densityFactor = 0:  default density
    // At densityFactor = 1:  maximum (close-packed) density
    const defaultSpacingMultiple = 1.6;  // Reduced from 2.0 to increase default density
    const maxSpacingMultiple = 3.0;      // How sparse it gets at -1
    
    // Prevent exact 1.0 multiplier to avoid floating point issues
    let spacingMultiplier;
    if (densityFactor <= 0) {
        // Scale from maxSpacingMultiple down to defaultSpacingMultiple
        spacingMultiplier = defaultSpacingMultiple + 
            (maxSpacingMultiple - defaultSpacingMultiple) * Math.abs(densityFactor);
    } else {
        // Scale from defaultSpacingMultiple down to just above 1.0
        // Add small epsilon to prevent exact 1.0
        spacingMultiplier = Math.max(
            1.001,  // Minimum multiplier to prevent floating point issues
            defaultSpacingMultiple - 
                (defaultSpacingMultiple - 1.001) * (densityFactor)
        );
    }
    
    const hexSpacing = baseSpacing * spacingMultiplier;
    
    // Hex grid geometry
    const hexWidth = hexSpacing;
    const hexHeight = hexWidth * Math.sqrt(3) / 2;
    
    // Calculate grid dimensions to ensure we cover the circle
    const diagRadius = centerRadius * 1.5; // Extend past circle to ensure coverage
    const numRows = Math.ceil((diagRadius * 2) / hexHeight);
    const numCols = Math.ceil((diagRadius * 2) / hexWidth);
    
    // Calculate starting positions
    const startRow = -Math.floor(numRows / 2);
    const endRow = Math.floor(numRows / 2);
    const startCol = -Math.floor(numCols / 2);
    const endCol = Math.floor(numCols / 2);

    const points: Point[] = [];
    const safeRadius = centerRadius * 0.98; // Small safety margin

    // Generate candidate points
    for (let row = startRow; row <= endRow; row++) {
        const rowOffset = row % 2 === 0 ? 0 : hexWidth / 2;
        
        for (let col = startCol; col <= endCol; col++) {
            const x = col * hexWidth + rowOffset;
            const y = row * hexHeight;
            
            // Skip points outside the safe circle
            if (!isWithinCenter({ x, y }, safeRadius)) {
                continue;
            }
            
            // Skip center point if centerHole is false
            if (!centerHole && Math.abs(x) < hexWidth * 0.1 && Math.abs(y) < hexHeight * 0.1) {
                continue;
            }

            // Check for overlaps with existing center points
            let canAdd = true;
            for (const p of points) {
                const dx = x - p.x;
                const dy = y - p.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < baseSpacing * baseSpacing) {
                    canAdd = false;
                    break;
                }
            }
            
            // Check for overlaps with outer points
            if (canAdd) {
                for (const p of outerPoints) {
                    const dx = x - p.x;
                    const dy = y - p.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < baseSpacing * baseSpacing) {
                        canAdd = false;
                        break;
                    }
                }
            }
            
            if (canAdd) {
                points.push({ x, y });
            }
        }
    }

    // Add center point if requested and no overlaps
    if (centerHole) {
        let canAddCenter = true;
        for (const p of [...points, ...outerPoints]) {
            const distSq = p.x * p.x + p.y * p.y;
            if (distSq < baseSpacing * baseSpacing) {
                canAddCenter = false;
                break;
            }
        }
        if (canAddCenter) {
            points.unshift({ x: 0, y: 0 });
        }
    }

    return points;
  }
}
