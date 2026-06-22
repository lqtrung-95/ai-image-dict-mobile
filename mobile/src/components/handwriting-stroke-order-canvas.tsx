/**
 * HandwritingStrokeOrderCanvas
 *
 * Enhanced handwriting canvas that validates stroke order against
 * hanzi-writer-data reference paths, beautifies matched strokes by
 * replacing freehand lines with clean SVG paths, and renders an
 * animated stroke-by-stroke visual guide that the user can toggle.
 */
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  Animated,
} from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { useTheme } from '../theme/theme-context';
import { radius, fonts } from '../theme/theme';
import {
  getStrokeData,
  normalizeStrokePath,
  strokeMatches,
  StrokeData,
} from '../lib/hanzi-writer-stroke-order-matching-service';

export interface HandwritingStrokeOrderCanvasHandle {
  clear: () => void;
  undo: () => void;
  strokeCount: () => number;
  /** Number of correctly ordered strokes drawn so far */
  correctStrokeCount: () => number;
}

export type StrokeResult = 'correct' | 'wrong' | null;

interface Props {
  /** Target character to trace */
  guide: string;
  /** Show the solid reference character after user is done */
  revealed?: boolean;
  /** Whether to show the animated stroke-order guide overlay */
  showGuide?: boolean;
  /** Called when stroke count changes */
  onStrokesChange?: (count: number) => void;
  /** Called after each stroke attempt with result */
  onStrokeResult?: (result: StrokeResult, correctSoFar: number, total: number) => void;
  /** Called when all strokes for this character are completed correctly */
  onCharacterComplete?: () => void;
}

function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const { x, y } = points[0];
    return `M ${x} ${y} L ${x + 0.1} ${y + 0.1}`;
  }
  return points.reduce(
    (acc, p, i) => acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`),
    ''
  );
}

/** A completed stroke: either freehand (wrong) or beautified (reference path). */
interface DrawnStroke {
  path: string;
  correct: boolean;
}

const GUIDE_STROKE_DURATION = 600; // ms per stroke in guide animation
const GUIDE_STROKE_PAUSE = 300;    // ms pause between strokes

export const HandwritingStrokeOrderCanvas = forwardRef<
  HandwritingStrokeOrderCanvasHandle,
  Props
>(
  (
    {
      guide,
      revealed = false,
      showGuide = false,
      onStrokesChange,
      onStrokeResult,
      onCharacterComplete,
    },
    ref
  ) => {
    const { colors } = useTheme();
    const [size, setSize] = useState(0);

    // Stroke order reference data for the current character
    const [strokeData, setStrokeData] = useState<StrokeData | null>(null);
    // Normalised reference paths (scaled to canvas size)
    const [normPaths, setNormPaths] = useState<string[]>([]);

    // Drawing state
    const [drawn, setDrawn] = useState<DrawnStroke[]>([]);
    const [current, setCurrent] = useState<{ x: number; y: number }[]>([]);
    const currentRef = useRef<{ x: number; y: number }[]>([]);
    const correctCountRef = useRef(0);

    // Flash feedback overlay
    const flashOpacity = useRef(new Animated.Value(0)).current;
    const [flashColor, setFlashColor] = useState('transparent');

    // Guide animation state
    const [guideStrokeIndex, setGuideStrokeIndex] = useState(0);
    const [guideProgress, setGuideProgress] = useState(0); // 0→1 for current stroke
    const guideAnimRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const guideProgressAnim = useRef(new Animated.Value(0)).current;

    // Load stroke data when character or canvas size changes
    useEffect(() => {
      const data = getStrokeData(guide);
      setStrokeData(data);
      setDrawn([]);
      correctCountRef.current = 0;
      setCurrent([]);
      currentRef.current = [];
    }, [guide]);

    useEffect(() => {
      if (!strokeData || size === 0) return;
      setNormPaths(strokeData.rawPaths.map((p) => normalizeStrokePath(p, size)));
    }, [strokeData, size]);

    // Reset guide animation when guide or showGuide changes
    useEffect(() => {
      if (guideAnimRef.current) clearTimeout(guideAnimRef.current);
      setGuideStrokeIndex(0);
      guideProgressAnim.setValue(0);
    }, [guide, showGuide]);

    // Animate guide strokes in a loop
    useEffect(() => {
      if (!showGuide || normPaths.length === 0 || size === 0) return;

      let strokeIdx = 0;
      let cancelled = false;

      const animateNext = () => {
        if (cancelled) return;
        guideProgressAnim.setValue(0);
        setGuideStrokeIndex(strokeIdx);

        Animated.timing(guideProgressAnim, {
          toValue: 1,
          duration: GUIDE_STROKE_DURATION,
          useNativeDriver: false,
        }).start(() => {
          if (cancelled) return;
          strokeIdx = (strokeIdx + 1) % normPaths.length;
          guideAnimRef.current = setTimeout(animateNext, GUIDE_STROKE_PAUSE);
        });
      };

      animateNext();
      return () => {
        cancelled = true;
        if (guideAnimRef.current) clearTimeout(guideAnimRef.current);
        guideProgressAnim.stopAnimation();
      };
    }, [showGuide, normPaths, size]);

    const triggerFlash = useCallback(
      (color: string) => {
        setFlashColor(color);
        flashOpacity.setValue(0.35);
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      },
      [flashOpacity]
    );

    const panResponder = useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onMoveShouldSetPanResponder: () => true,
          onPanResponderGrant: (e) => {
            const { locationX, locationY } = e.nativeEvent;
            currentRef.current = [{ x: locationX, y: locationY }];
            setCurrent(currentRef.current);
          },
          onPanResponderMove: (e) => {
            const { locationX, locationY } = e.nativeEvent;
            currentRef.current = [...currentRef.current, { x: locationX, y: locationY }];
            setCurrent(currentRef.current);
          },
          onPanResponderRelease: () => {
            const pts = currentRef.current;
            currentRef.current = [];
            setCurrent([]);

            if (pts.length === 0) return;

            const expectedIdx = correctCountRef.current;

            // No stroke data means we fall back to freehand-only mode
            if (!strokeData || expectedIdx >= strokeData.rawPaths.length) {
              const path = pointsToPath(pts);
              if (path) {
                setDrawn((prev) => {
                  const next = [...prev, { path, correct: true }];
                  onStrokesChange?.(next.length);
                  return next;
                });
              }
              return;
            }

            const refPath = strokeData.rawPaths[expectedIdx];
            const refDir = strokeData.directions[expectedIdx];
            const isMatch = strokeMatches(pts, refDir, refPath, size);

            if (isMatch) {
              // Beautify: replace freehand with clean reference path
              const beautified = normPaths[expectedIdx] ?? pointsToPath(pts);
              correctCountRef.current += 1;
              triggerFlash(colors.primary);

              setDrawn((prev) => {
                const next = [...prev, { path: beautified, correct: true }];
                onStrokesChange?.(next.length);
                return next;
              });

              const total = strokeData.rawPaths.length;
              onStrokeResult?.('correct', correctCountRef.current, total);

              if (correctCountRef.current >= total) {
                onCharacterComplete?.();
              }
            } else {
              // Wrong stroke: show red freehand stroke briefly
              const path = pointsToPath(pts);
              triggerFlash(colors.error);
              onStrokeResult?.('wrong', correctCountRef.current, strokeData.rawPaths.length);

              if (path) {
                setDrawn((prev) => {
                  const next = [...prev, { path, correct: false }];
                  onStrokesChange?.(next.length);
                  return next;
                });
              }
            }
          },
        }),
      // Stable: handlers use refs/callbacks that don't change identity
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [strokeData, normPaths, size, colors]
    );

    useImperativeHandle(ref, () => ({
      clear: () => {
        currentRef.current = [];
        setCurrent([]);
        setDrawn([]);
        correctCountRef.current = 0;
        onStrokesChange?.(0);
      },
      undo: () => {
        setDrawn((prev) => {
          const next = prev.slice(0, -1);
          // Rewind correct count if last stroke was correct
          if (prev[prev.length - 1]?.correct) {
            correctCountRef.current = Math.max(0, correctCountRef.current - 1);
          }
          onStrokesChange?.(next.length);
          return next;
        });
      },
      strokeCount: () => drawn.length,
      correctStrokeCount: () => correctCountRef.current,
    }));

    const onLayout = (e: LayoutChangeEvent) => setSize(e.nativeEvent.layout.width);

    const grid = size > 0 && (
      <>
        <Line x1={size / 2} y1={0} x2={size / 2} y2={size} stroke={colors.outlineVariant} strokeWidth={1} strokeDasharray="6 6" />
        <Line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke={colors.outlineVariant} strokeWidth={1} strokeDasharray="6 6" />
        <Line x1={0} y1={0} x2={size} y2={size} stroke={colors.outlineVariant} strokeWidth={1} strokeDasharray="6 6" />
        <Line x1={size} y1={0} x2={0} y2={size} stroke={colors.outlineVariant} strokeWidth={1} strokeDasharray="6 6" />
      </>
    );

    // Stroke counter badge (e.g. "3 / 8")
    const totalStrokes = strokeData?.rawPaths.length ?? 0;
    const showCounter = totalStrokes > 0;

    return (
      <View style={{ width: '100%', aspectRatio: 1 }}>
        <View
          style={[styles.canvas, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
          onLayout={onLayout}
          {...panResponder.panHandlers}
        >
          {/* Faint / revealed reference character */}
          {size > 0 && (
            <Text
              pointerEvents="none"
              style={[
                styles.guideChar,
                {
                  fontSize: size * 0.7,
                  lineHeight: size,
                  width: size,
                  color: revealed ? colors.primary : colors.outlineVariant,
                  opacity: revealed ? 0.55 : 0.18,
                },
              ]}
            >
              {guide}
            </Text>
          )}

          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
            {grid}

            {/* Ghost reference strokes already completed (very faint) */}
            {normPaths.slice(0, correctCountRef.current).map((p, i) => (
              <Path key={`ref-${i}`} d={p} stroke={colors.primary} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.08} />
            ))}

            {/* Drawn strokes — correct ones use reference path (beautified) */}
            {drawn.map((s, i) => (
              <Path
                key={`drawn-${i}`}
                d={s.path}
                stroke={s.correct ? colors.primary : colors.error}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={s.correct ? 1 : 0.5}
              />
            ))}

            {/* Active stroke being drawn */}
            {current.length > 0 && (
              <Path d={pointsToPath(current)} stroke={colors.onSurface} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            )}

            {/* Animated guide stroke overlay */}
            {showGuide && normPaths[guideStrokeIndex] && (
              <Path
                d={normPaths[guideStrokeIndex]}
                stroke={colors.primary}
                strokeWidth={10}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={0.55}
                strokeDasharray="20 8"
              />
            )}
          </Svg>

          {/* Flash feedback overlay */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: flashColor, opacity: flashOpacity, borderRadius: radius.lg },
            ]}
          />
        </View>

        {/* Stroke order badge */}
        {showCounter && (
          <View style={[styles.badge, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Text style={[styles.badgeText, { color: colors.onSurfaceVariant }]}>
              {correctCountRef.current} / {totalStrokes}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

HandwritingStrokeOrderCanvas.displayName = 'HandwritingStrokeOrderCanvas';

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  guideChar: {
    position: 'absolute',
    textAlign: 'center',
    fontFamily: fonts.hanzi,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
