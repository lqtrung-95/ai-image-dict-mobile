/**
 * Loads stroke order data from hanzi-writer-data and provides utilities
 * for normalizing paths to canvas coordinates and matching user strokes.
 *
 * hanzi-writer-data uses a 1024×1024 coordinate system with Y-axis flipped
 * (origin at bottom-left). We normalize to a [0, canvasSize] range with
 * standard top-left origin.
 */

// hanzi-writer-data has no TS types — use require per its README
// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadCharData = (char: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(`hanzi-writer-data/${char}`);
  } catch {
    return null;
  }
};

const HW_SIZE = 1024; // hanzi-writer-data native coordinate space

export interface StrokeData {
  /** SVG path strings in hanzi-writer-data's 1024×1024 flipped-Y space */
  rawPaths: string[];
  /** Precomputed direction vectors (dx, dy) normalised to [-1,1] for matching */
  directions: { dx: number; dy: number }[];
}

/** Returns stroke data for a single CJK character, or null if not in the dataset. */
export function getStrokeData(char: string): StrokeData | null {
  const data = loadCharData(char);
  if (!data?.strokes?.length) return null;

  const rawPaths: string[] = data.strokes;
  const directions = rawPaths.map((path) => computeStrokeDirection(path));
  return { rawPaths, directions };
}

/**
 * Normalises a hanzi-writer path point to canvas coordinates.
 * HW Y-axis is flipped: y_canvas = canvasSize - (y_hw / HW_SIZE) * canvasSize
 */
export function normalizePoint(
  hwX: number,
  hwY: number,
  canvasSize: number
): { x: number; y: number } {
  return {
    x: (hwX / HW_SIZE) * canvasSize,
    y: canvasSize - (hwY / HW_SIZE) * canvasSize,
  };
}

/**
 * Converts a hanzi-writer SVG path string to a react-native-svg compatible
 * path string scaled to the given canvas size.
 */
export function normalizeStrokePath(hwPath: string, canvasSize: number): string {
  // Replace all coordinate pairs in the path. SVG path commands: M, L, Q, C, Z
  return hwPath.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) => {
    const n = normalizePoint(parseFloat(x), parseFloat(y), canvasSize);
    return `${n.x.toFixed(1)} ${n.y.toFixed(1)}`;
  });
}

/**
 * Extracts the primary direction of an SVG path (start → end vector, normalised).
 * Used for loose stroke-order matching against user's freehand stroke.
 */
function computeStrokeDirection(path: string): { dx: number; dy: number } {
  const coords = path.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g) ?? [];
  if (coords.length < 2) return { dx: 0, dy: 0 };

  const parse = (s: string) => s.split(/\s+/).map(Number);
  const [sx, sy] = parse(coords[0]!);
  const [ex, ey] = parse(coords[coords.length - 1]!);

  const dx = ex - sx;
  const dy = ey - sy; // still in HW space (flipped Y), consistent for comparison
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { dx: dx / len, dy: dy / len };
}

/**
 * Returns true when the user's freehand stroke direction is close enough to
 * the reference stroke direction (dot-product ≥ threshold).
 *
 * Also checks that the stroke starts in roughly the correct quadrant of the canvas.
 */
export function strokeMatches(
  userPoints: { x: number; y: number }[],
  referenceDirection: { dx: number; dy: number },
  refPath: string,
  canvasSize: number,
  dotThreshold = 0.45
): boolean {
  if (userPoints.length < 2) return false;

  // User stroke direction
  const start = userPoints[0];
  const end = userPoints[userPoints.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const userDir = { dx: dx / len, dy: dy / len };

  // The reference uses flipped Y; flip user dy to match HW space for dot product
  const dot = userDir.dx * referenceDirection.dx + (-userDir.dy) * referenceDirection.dy;

  if (dot < dotThreshold) return false;

  // Loose start-position check: user's start should be in the same half of canvas
  // as the reference stroke's first point
  const coords = refPath.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g) ?? [];
  if (coords.length > 0) {
    const [rx, ry] = coords[0]!.split(/\s+/).map(Number);
    const refNorm = normalizePoint(rx, ry, canvasSize);
    const quadrantOk =
      Math.abs(start.x - refNorm.x) < canvasSize * 0.45 &&
      Math.abs(start.y - refNorm.y) < canvasSize * 0.45;
    if (!quadrantOk) return false;
  }

  return true;
}
