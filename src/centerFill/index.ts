import type { CenterFillConfig, CenterFillAlgorithm } from './types';
import { ForceFillGenerator } from './forceFill';
import { PoissonFillGenerator } from './poissonFill';

const forceGenerator = new ForceFillGenerator();
const poissonGenerator = new PoissonFillGenerator();

export type { CenterFillConfig, CenterFillAlgorithm };

export function generateCenterPoints(config: CenterFillConfig & { algorithm: CenterFillAlgorithm }) {
  console.log('generateCenterPoints called with config:', config);
  
  const { algorithm, ...restConfig } = config;
  
  const points = (() => {
    switch (algorithm) {
      case 'force':
        console.log('Using force generator');
        const forcePoints = forceGenerator.generatePoints(restConfig);
        console.log(`Force generator produced ${forcePoints.length} points`);
        return forcePoints;
      case 'poisson':
        console.log('Using poisson generator');
        const poissonPoints = poissonGenerator.generatePoints(restConfig);
        console.log(`Poisson generator produced ${poissonPoints.length} points`);
        return poissonPoints;
      default:
        throw new Error(`Unknown center fill algorithm: ${algorithm}`);
    }
  })();

  console.log('Returning points:', points);
  return points;
}
