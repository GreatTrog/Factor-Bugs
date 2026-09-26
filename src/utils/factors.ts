import type { FactorInfo } from '@/types';
import { NumberType } from '@/types';

export const calculateFactorInfo = (num: number): FactorInfo => {
  if (num < 1 || num > 100) {
    return { number: num, type: NumberType.Composite, pairs: [], stinger: null };
  }

  const pairs: [number, number][] = [];
  let stinger: number | null = null;

  for (let i = 1; i <= Math.sqrt(num); i++) {
    if (num % i === 0) {
      if (i * i === num) {
        stinger = i;
      } else {
        pairs.push([i, num / i]);
      }
    }
  }

  pairs.sort((a, b) => a[0] - b[0]);

  if (stinger !== null) {
    const stingerPairIndex = pairs.findIndex(
      p => p[0] === stinger || p[1] === stinger
    );
    if (stingerPairIndex > -1) pairs.splice(stingerPairIndex, 1);
  }

  let type = NumberType.Composite;
  if (pairs.length === 1 && stinger === null && num !== 1) {
    type = NumberType.Prime;
  } else if (stinger !== null) {
    type = NumberType.Square;
  }

  if (num === 1) {
    type = NumberType.Square;
    stinger = 1;
    pairs.length = 0;
  }

  return { number: num, type, pairs, stinger };
};
