import Alea from 'alea';
import { Range } from '../types/probability.ts';

/**
 * Utility function to check if a random number from the seeded randomizer falls under the given probability.
 */
export const probability = (
  randomizer: ReturnType<typeof Alea>,
  probability: number
) => {
  if (probability >= 1) {
    return true;
  }
  if (probability <= 0) {
    return false;
  }

  return randomizer() < probability;
};

/**
 * Generates a random number between the two limits using the given seeded randomizer.
 */
export const randomRange = (
  randomizer: ReturnType<typeof Alea>,
  min?: number,
  max?: number
): number => {
  if (!max && !min) {
    return randomizer();
  }

  let realMax: number = 0;
  let realMin: number = 0;
  if (!max && min) {
    realMax = min;
    realMin = 0;
  }

  return Math.floor(randomizer() * (realMax - realMin + 1)) + realMin;
};

/**
 * Gets a random number using a range object or a number, with the seed randomizer as the source of the random.
 */
export const getNumberInRange = (
  randomizer: ReturnType<typeof Alea>,
  range: Range
): number => {
  if (typeof range === 'number') {
    return (
      // Double tilde is like math.floor, but it only remove the decimals from the number. Technically faster.
      ~~range + +probability(randomizer, range - ~~range)
    );
  }

  const count = randomRange(randomizer, range.from, range.to);
  if (isNaN(count) || count < 0) {
    return 0;
  }

  return count;
};

/**
 * Returns a randomly chosen index from the probabilities array using the seeded randomizer where the probability
 * of that index appearing is based on the probability value.
 */
export const getIndexFromProbabilityArray = (
  randomizer: ReturnType<typeof Alea>,
  probabilities: { probability: number }[]
): number => {
  const probArray: number[] = [];
  probabilities.forEach((prob, index) => {
    for (let i = 0; i < prob.probability; i++) {
      probArray.push(index);
    }
  });

  return probArray[Math.floor(randomizer() * probArray.length)];
};
