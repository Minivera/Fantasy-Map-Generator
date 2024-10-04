export const UINT8_MAX = 255;
export const UINT16_MAX = 65535;
export const UINT32_MAX = 4294967295;

/**
 * Returns the last item of the given array.
 */
export const last = <T>(array: T[]) => {
  return array[array.length - 1];
};

/**
 * Returns the array cloned with all duplicate elements removed. Does not clone the elements.
 */
export const unique = <T>(array: T[]) => {
  return [...new Set(array)];
};

/**
 * Inserts the element in the given array sorted into ascending order. It will use the comparator to check if
 * the inserted element is smaller than given elements in the array, then select the lowest index to insert it.
 * This should be more performant than sorting an array manually after insertion.
 */
export const insertIntoSorted = <T>(
  array: T[],
  element: T,
  comparator: (val1: T, val2: T) => boolean = (val1, val2) => +val1 < +val2
): T[] => {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    if (comparator(array[mid], element)) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return [...array.slice(0, low), element, ...array.slice(low)];
};
