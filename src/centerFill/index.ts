import { Point } from '../patterns/types';
import { CenterFillConfig } from './types';
import { AdaptiveForceFillGenerator } from './adaptiveForceFill';

export type { CenterFillConfig } from './types';
export { isWithinCenter } from './types';

/**
 * Generates points for the center area of the pattern
 */
export function generateCenterPoints(config: CenterFillConfig): Point[] {
  const generator = new AdaptiveForceFillGenerator();
  return generator.generatePoints(config);
}
