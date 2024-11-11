import { PatternType, PatternGenerator, BasePatternConfig, SpiralPatternConfig, ConcentricPatternConfig } from './types';
import { PhyllotaxisPattern } from './phyllotaxis';
import { FermatPattern } from './fermat';
import { ConcentricPattern } from './concentric';

/**
 * Creates pattern configuration based on shared and pattern-specific parameters,
 * ensuring proper handling of center exclusion
 */
export function createPatternConfig(
  pattern: PatternType,
  baseConfig: BasePatternConfig,
  divergenceAngle?: number,
  spacing?: number,
  numPoints?: number,
  concentricSpacing?: number,
): SpiralPatternConfig | ConcentricPatternConfig {
  const effectiveConfig = {
    ...baseConfig,
    innerRadius: baseConfig.centerExclusion || 0
  };

  if (pattern === 'concentric') {
    return {
      ...effectiveConfig,
      concentricSpacing: concentricSpacing || 
        ConcentricPattern.getOptimalSpacing(baseConfig.holeRadius, baseConfig.minClearance)
    };
  } else {
    // Calculate base number of points based on area and spacing
    const baseNumPoints = Math.ceil(Math.PI * Math.pow(baseConfig.radius, 2) / 
      (Math.pow(spacing || baseConfig.holeRadius * 2, 2)));
    
    // Adjust point count based on pattern type
    const patternMultiplier = pattern === 'fermat' ? 6 : 1;
    const adjustedNumPoints = Math.ceil(baseNumPoints * patternMultiplier);

    return {
      ...effectiveConfig,
      divergenceAngle: divergenceAngle || 137.5,
      spacing: spacing || baseConfig.holeRadius * 2,
      numPoints: numPoints || adjustedNumPoints
    };
  }
}

/**
 * Gets the appropriate pattern generator instance
 */
export function getPatternGenerator(pattern: PatternType): PatternGenerator {
  switch (pattern) {
    case 'phyllotaxis':
      return new PhyllotaxisPattern();
    case 'fermat':
      return new FermatPattern();
    case 'concentric':
      return new ConcentricPattern();
    default:
      throw new Error(`Unknown pattern type: ${pattern}`);
  }
}
