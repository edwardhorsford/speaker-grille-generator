import type { CenterFillConfig, CenterFillAlgorithm } from './types';
import { ForceFillGenerator } from './forceFill';
import { AdaptiveForceFillGenerator } from './adaptiveForceFill';
import { PoissonFillGenerator } from './poissonFill';
import { HexFillGenerator } from './hexFill';
import { ConcentricFillGenerator } from './concentricFill';

const forceGenerator = new ForceFillGenerator();
const adaptiveForceGenerator = new AdaptiveForceFillGenerator();
const poissonGenerator = new PoissonFillGenerator();
const hexGenerator = new HexFillGenerator();
const concentricGenerator = new ConcentricFillGenerator();

export type { CenterFillConfig, CenterFillAlgorithm } from './types';


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
      case 'adaptiveForce':
        console.log('Using adaptive force generator');
        const adaptiveForcePoints = adaptiveForceGenerator.generatePoints(restConfig);
        console.log(`Adaptive force generator produced ${adaptiveForcePoints.length} points`);
        return adaptiveForcePoints;
      case 'poisson':
        console.log('Using poisson generator');
        const poissonPoints = poissonGenerator.generatePoints(restConfig);
        console.log(`Poisson generator produced ${poissonPoints.length} points`);
        return poissonPoints;
      case 'hex':
        console.log('Using hex generator');
        const hexPoints = hexGenerator.generatePoints(restConfig);
        console.log(`Hex generator produced ${hexPoints.length} points`);
        return hexPoints;
      case 'concentric':
        console.log('Using concentric generator');
        const concentricPoints = concentricGenerator.generatePoints(restConfig);
        console.log(`Concentric generator produced ${concentricPoints.length} points`);
        return concentricPoints;
      default:
        throw new Error(`Unknown center fill algorithm: ${algorithm}`);
    }
  })();

  console.log('Returning points:', points);
  return points;
}
