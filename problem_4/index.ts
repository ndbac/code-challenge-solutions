/**
 * Approach 1: Using mathematical formula
 * Time: O(1), Space: O(1)
 *
 * Easiest solution, calculate the result directly using maths.
 */
const sumToNFormula = (n: number): number => {
  if (n <= 0) return 0;
  return (n * (n + 1)) / 2;
};

/**
 * Approach 2: Using bitwise
 * Time: O(n), Space: O(1)
 *
 * Not efficient, but COOL since it uses bitwise operations.
 */
const sumToNBinary = (n: number): number => {
  if (n <= 0) {
    return 0;
  }

  let sum = 0;

  for (let i = 1; i <= n; i++) {
    let a = sum;
    let b = i;

    while (b !== 0) {
      const leftShift = (a & b) << 1;
      a = a ^ b;
      b = leftShift;
    }

    sum = a;
  }

  return sum;
};

/**
 * Approach 3: Using dynamic programming + cache
 * Time: O(n), Space: O(n)
 *
 * Not efficient, but a good showcase of DP & cache.
 */
const memCache = new Map<number, number>();
const sumToNDPCache = (n: number): number => {
  if (n <= 0) {
    return 0;
  }
  if (n === 1) {
    return 1;
  }

  if (memCache.has(n)) {
    return memCache.get(n)!;
  }

  const result = n + sumToNDPCache(n - 1);
  memCache.set(n, result);
  return result;
};
