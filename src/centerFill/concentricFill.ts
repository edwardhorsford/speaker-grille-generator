export class ConcentricFillGenerator implements CenterFillGenerator {
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

    const points: Point[] = [];
    const baseSpacing = (holeRadius * 2) + minDistance;

    // Apply scaling and power functions to the density factor
    const scaledDensityFactor = densityFactor * 0.5;
    const adjustedDensityFactor = scaledDensityFactor < 0
      ? -Math.pow(-scaledDensityFactor, 0.7)
      : Math.pow(scaledDensityFactor, 1.5);

    // Calculate the radial spacing based on the adjusted density factor
    const radialSpacing = baseSpacing * (1 - adjustedDensityFactor);

    // Start with center point if requested
    if (centerHole) {
      let canAddCenter = true;
      for (const p of outerPoints) {
        const distSq = p.x * p.x + p.y * p.y;
        if (distSq < baseSpacing * baseSpacing) {
          canAddCenter = false;
          break;
        }
      }
      if (canAddCenter) {
        points.push({ x: 0, y: 0 });
      }
    }

    // Generate rings starting from the first ring radius
    let currentRadius = centerHole ? minDistance : holeRadius + (minDistance * 2);

    while (currentRadius <= centerRadius) {
      const circumference = 2 * Math.PI * currentRadius;
      const pointsInRing = Math.floor(circumference / radialSpacing);

      if (pointsInRing > 0) {
        const angleStep = (2 * Math.PI) / pointsInRing;

        for (let i = 0; i < pointsInRing; i++) {
          const angle = i * angleStep;
          const x = currentRadius * Math.cos(angle);
          const y = currentRadius * Math.sin(angle);

          // Check for overlaps with outer points
          let canAdd = true;
          for (const p of outerPoints) {
            const dx = x - p.x;
            const dy = y - p.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < baseSpacing * baseSpacing) {
              canAdd = false;
              break;
            }
          }

          if (canAdd) {
            points.push({ x, y });
          }
        }
      }

      // Move to the next ring
      currentRadius += radialSpacing;
    }

    return points;
  }
}
