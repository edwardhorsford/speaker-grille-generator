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
  // Calculate initial spacing and effective radius for patterns when center is excluded
  const effectiveConfig = {
    ...baseConfig,
    // If there's a center exclusion, ensure it's respected in pattern generation
    innerRadius: baseConfig.centerExclusion || 0
  };

  if (pattern === 'concentric') {
    return {
      ...effectiveConfig,
      concentricSpacing: concentricSpacing || 
        ConcentricPattern.getOptimalSpacing(baseConfig.holeRadius, baseConfig.minClearance)
    };
  } else {
    return {
      ...effectiveConfig,
      divergenceAngle: divergenceAngle || 137.5,
      spacing: spacing || baseConfig.holeRadius * 2,
      // Adjust numPoints based on available area when there's center exclusion
      numPoints: numPoints || (baseConfig.centerExclusion 
        ? Math.floor(2000 * (1 - Math.pow(baseConfig.centerExclusion / baseConfig.radius, 2)))
        : 2000)
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
