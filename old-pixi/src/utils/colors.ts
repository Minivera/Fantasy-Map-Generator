export const randomDistinguishableColor = (number: number) => {
  const hue = number * 137.508; // use golden angle approximation
  return `hsl(${hue},50%,75%)`;
};

export const hslToHex = (color: string): number => {
  const sep = color.indexOf(',') > -1 ? ',' : ' ';
  const extracted = color.substring(4).split(')')[0].split(sep);

  const h = Number(extracted[0]);
  const s = Number(extracted[1].substring(0, extracted[1].length - 1));
  const l = Number(extracted[2].substring(0, extracted[2].length - 1));

  const hDecimal = l / 100;
  const a = (s * Math.min(hDecimal, 1 - hDecimal)) / 100;
  const convert = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = hDecimal - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);

    // Convert to Hex and prefix with "0" if required
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return Number.parseInt(`0x${convert(0)}${convert(8)}${convert(4)}`, 16);
};
