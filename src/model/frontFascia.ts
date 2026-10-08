/** Shared openings prevent the fascia, grille and lamps from drifting apart. */
export const grilleOutline = [
  [-0.564, 1.366],
  [0.564, 1.366],
  [0.625, 1.256],
  [0.534, 0.946],
  [-0.534, 0.946],
  [-0.625, 1.256],
];
export const headlampOutline = [
  [0.612, 1.326],
  [0.94, 1.357],
  [1.001, 1.292],
  [1.012, 1.172],
  [0.658, 1.141],
  [0.643, 1.175],
  [0.643, 1.257],
];
export const fasciaOutline = [
  [-0.95, 1.378],
  [0, 1.38],
  [0.95, 1.378],
  [1.025, 1.31],
  [1.036, 1.168],
  [1.021, 0.69],
  [0.93, 0.52],
  [0.83, 0.478],
  [-0.83, 0.478],
  [-0.93, 0.52],
  [-1.021, 0.69],
  [-1.036, 1.168],
  [-1.025, 1.31],
];
export const lampOutline = (side: number) =>
  headlampOutline.map(([u, y]) => [side * u, y]);
export const fasciaOffset = 0.076;
