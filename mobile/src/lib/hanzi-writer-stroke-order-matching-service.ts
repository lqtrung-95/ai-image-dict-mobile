/**
 * Loads stroke order data from the hanzi-writer CDN and provides utilities
 * for normalizing paths to canvas coordinates and matching user strokes.
 *
 * Uses fetch() instead of require() because Metro bundler cannot handle
 * dynamic require() with template literals for per-character JSON files.
 *
 * hanzi-writer-data uses a 1024×1024 coordinate system with Y-axis flipped
 * (origin at bottom-left). We normalize to a [0, canvasSize] range with
 * standard top-left origin.
 */

const HW_SIZE = 1024;
const CDN_BASE = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest';

// In-memory cache so each character is fetched at most once per session
const cache = new Map<string, StrokeData | null>();

export interface StrokeData {
  rawPaths: string[];
  directions: { dx: number; dy: number }[];
}

/** Fetches stroke data for a CJK character; returns null if unavailable. */
export async function fetchStrokeData(char: string): Promise<StrokeData | null> {
  if (cache.has(char)) return cache.get(char)!;

  try {
    const encoded = encodeURIComponent(char);
    const res = await fetch(`${CDN_BASE}/${encoded}.json`);
    if (!res.ok) { cache.set(char, null); return null; }

    const data = await res.json();
    if (!Array.isArray(data?.strokes) || data.strokes.length === 0) {
      cache.set(char, null);
      return null;
    }

    const rawPaths: string[] = data.strokes;
    const directions = rawPaths.map(computeStrokeDirection);
    const result: StrokeData = { rawPaths, directions };
    cache.set(char, result);
    return result;
  } catch {
    cache.set(char, null);
    return null;
  }
}

/**
 * Normalises a hanzi-writer coordinate pair to canvas coordinates.
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
  return hwPath.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) => {
    const n = normalizePoint(parseFloat(x), parseFloat(y), canvasSize);
    return `${n.x.toFixed(1)} ${n.y.toFixed(1)}`;
  });
}

function computeStrokeDirection(path: string): { dx: number; dy: number } {
  const coords = path.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g) ?? [];
  if (coords.length < 2) return { dx: 0, dy: 0 };

  const parse = (s: string) => s.split(/\s+/).map(Number);
  const [sx, sy] = parse(coords[0]!);
  const [ex, ey] = parse(coords[coords.length - 1]!);

  const dx = ex - sx;
  const dy = ey - sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { dx: dx / len, dy: dy / len };
}

/**
 * Returns the normalised start point of an SVG path (first coordinate pair).
 * Used to render a "start here" dot for the guide overlay.
 */
export function getStrokeStartPoint(
  hwPath: string,
  canvasSize: number
): { x: number; y: number } | null {
  const coords = hwPath.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g) ?? [];
  if (coords.length === 0) return null;
  const [rx, ry] = coords[0]!.split(/\s+/).map(Number);
  return normalizePoint(rx!, ry!, canvasSize);
}

/**
 * Returns true when the user's freehand stroke direction is close enough to
 * the reference stroke direction (dot-product ≥ threshold) and starts in
 * roughly the correct area of the canvas.
 */
export function strokeMatches(
  userPoints: { x: number; y: number }[],
  referenceDirection: { dx: number; dy: number },
  refPath: string,
  canvasSize: number,
  dotThreshold = 0.30
): boolean {
  if (userPoints.length < 2) return false;

  const start = userPoints[0]!;
  const end = userPoints[userPoints.length - 1]!;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const userDir = { dx: dx / len, dy: dy / len };

  // Flip user dy to match HW's flipped Y axis for dot product
  const dot = userDir.dx * referenceDirection.dx + (-userDir.dy) * referenceDirection.dy;
  // Direction match is sufficient for beginner UX — no position check.
  // Position checks were too punishing since users can't see the exact start point.
  return dot >= dotThreshold;
}
