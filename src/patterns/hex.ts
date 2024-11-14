import { Point, HexPatternConfig, PatternGenerator } from './types';

export class HexPattern implements PatternGenerator {
  generatePoints(config: HexPatternConfig): Point[] {
    const {
      radius,
      holeRadius,
      centerHole = false,
      getSpacing,
      innerRadius = 0,
      spacing
    } = config;

    const points: Point[] = [];
    
    // Get effective spacing at a point
    const getEffectiveSpacing = (x: number, y: number) => {
        return 2 * (getSpacing ? getSpacing(x, y, spacing) : spacing);
    };

    // Hex grid geometry (at current point)
    const getHexGeometry = (x: number, y: number) => {
        const hexSpacing = getEffectiveSpacing(x, y);
        return {
            width: hexSpacing,
            height: hexSpacing * Math.sqrt(3) / 2
        };
    };

    // Calculate initial grid dimensions
    const { width: initialHexWidth, height: initialHexHeight } = getHexGeometry(0, 0);
    
    // Calculate grid dimensions to ensure we cover the circle
    const diagRadius = radius * 1.5; // Extend past circle to ensure coverage
    const numRows = Math.ceil((diagRadius * 2) / initialHexHeight);
    const numCols = Math.ceil((diagRadius * 2) / initialHexWidth);
    
    // Calculate starting positions
    const startRow = -Math.floor(numRows / 2);
    const endRow = Math.floor(numRows / 2);
    const startCol = -Math.floor(numCols / 2);
    const endCol = Math.floor(numCols / 2);

    // Add center point if requested
    if (centerHole) {
        points.push({ x: 0, y: 0 });
    }

    // Generate points
    for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
            // Get hex geometry at current approximate position
            const approxX = col * initialHexWidth;
            const approxY = row * initialHexHeight;
            const { width: hexWidth, height: hexHeight } = getHexGeometry(approxX, approxY);
            
            // Calculate actual position
            const rowOffset = row % 2 === 0 ? 0 : hexWidth / 2;
            const x = col * hexWidth + rowOffset;
            const y = row * hexHeight;
            
            // Skip points too close to center
            if (Math.sqrt(x * x + y * y) < innerRadius) {
                continue;
            }

            // Skip points outside the radius (with some margin for hole size)
            const effectiveRadius = radius - holeRadius;
            if (x * x + y * y > effectiveRadius * effectiveRadius) {
                continue;
            }
            
            // Skip center point if centerHole is false
            if (!centerHole && Math.abs(x) < hexWidth * 0.1 && Math.abs(y) < hexHeight * 0.1) {
                continue;
            }

            points.push({ x, y });
        }
    }

    return points;
  }
}
