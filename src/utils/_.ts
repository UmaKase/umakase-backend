import { Log } from "@utils/Log";

const logger = new Log();

// Random integer number generator
export const randomInt = (min: number, max: number, excludes?: number[]) => {
  if (min > max || (excludes?.length || 0) > max) {
    logger.error("Random function error: ", { min, max, excludes });
    return randomInt(min, max, []);
  }
  const random = Math.floor(Math.random() * (max - min + 1)) + min;
  if (excludes) {
    if (excludes.includes(random)) {
      return randomInt(min, max, excludes);
    } else {
      return random;
    }
  }
  return random;
};

/**
 * Return {times} of random number from min to max
 */
export const randomMultiple = (min: number, max: number, times: number): number[] => {
  const result: number[] = [];
  for (let i = 0; i < times; i++) {
    result.push(randomInt(min, max));
  }
  return result;
};
