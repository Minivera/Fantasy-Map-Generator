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

const getTypedArray = (maxValue: number) => {
  console.assert(
    Number.isInteger(maxValue) && maxValue >= 0 && maxValue <= UINT32_MAX,
    `Array maxValue must be an integer between 0 and ${UINT32_MAX}, got ${maxValue}`
  );

  if (maxValue <= UINT8_MAX) {
    return Uint8Array;
  }
  if (maxValue <= UINT16_MAX) {
    return Uint16Array;
  }
  if (maxValue <= UINT32_MAX) {
    return Uint32Array;
  }

  return Uint32Array;
};

/**
 * Create a new typed number Array from the JavaScript standard library, such as the Uint32Array type. Optionally
 * populates the array with the from value.
 */
export const createTypedArray = ({
  maxValue,
  length,
  from,
}: {
  maxValue: number;
  length?: number;
  from?: Iterable<number>;
}) => {
  const TypedArray = getTypedArray(maxValue);
  if (!from) {
    return new TypedArray(length || 0);
  }

  return TypedArray.from(from);
};
