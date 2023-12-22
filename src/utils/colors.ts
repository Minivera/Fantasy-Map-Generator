export const randomDistinguishableColor = (number: number) => {
  const hue = number * 137.508; // use golden angle approximation
  return `hsl(${hue},50%,75%)`;
};
