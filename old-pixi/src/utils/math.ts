import * as d3 from 'd3-random';

/**
 * Rounds the given value to the nearest decimal, based on the decimal parameter.
 */
export const roundNumber = (val: number, decimal = 0) => {
  const multiplier = Math.pow(10, decimal);
  return Math.round(val * multiplier) / multiplier;
};

/**
 * Clamps the value between the min and maximum value
 */
export const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Normalizes a random number by normal or gaussian distribution.
 */
export const gauss = (
  expected = 100,
  deviation = 30,
  min = 0,
  max = 300,
  round = 0
) => {
  return roundNumber(
    clamp(d3.randomNormal(expected, deviation)(), min, max),
    round
  );
};

/**
 * Limits the given value between 0 and 100.
 */
export const limitTo100 = (value: number): number => {
  return clamp(value, 0, 100);
};

/**
 * Normalizes the given number by limiting it between the min and max value so it won't overflow either way.
 */
export const normalize = (val: number, min: number, max: number) => {
  return clamp((val - min) / (max - min), 0, 1);
};
