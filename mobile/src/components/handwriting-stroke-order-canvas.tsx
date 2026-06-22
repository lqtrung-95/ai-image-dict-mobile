/**
 * HandwritingStrokeOrderCanvas
 *
 * Validates stroke order against hanzi-writer-data reference paths,
 * beautifies matched strokes with clean SVG paths, and shows an animated
 * visual guide for the next expected stroke (togglable).
 *
 * After 3 consecutive wrong strokes the next expected stroke is highlighted
 * prominently as a hint.
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
  fetchStrokeData,
  normalizeStrokePath,
  strokeMatches,
  StrokeData,
} from '../lib/hanzi-writer-stroke-order-matching-service';

export interface HandwritingStrokeOrderCanvasHandle {
  clear: () => void;
  undo: () => void;
  strokeCount: () => number;
  correctStrokeCount: () => number;
}

export type StrokeResult = 'correct' | 'wrong' | null;

interface Props {
  guide: string;
  revealed?: boolean;
  showGuide?: boolean;
  onStrokesChange?: (count: number) => void;
  onStrokeResult?: (result: StrokeResult, correctSoFar: number, total: number) => void;
  onCharacterComplete?: () => void;
}

function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const { x, y } = points[0]!;
    return `M ${x} ${y} L ${x + 0.1} ${y + 0.1}`;
  }
  return points.reduce(
    (acc, p, i) => acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`),
    ''
  );
}

interface DrawnStroke {
  path: string;
  correct: boolean;
}

const HINT_AFTER_WRONG = 3; // show strong hint after this many consecutive wrong strokes

export const HandwritingStrokeOrderCanvas = forwardRef<
  HandwritingStrokeOrderCanvasHandle,
  Props
>(
  ({ guide, revealed = false, showGuide = false, onStrokesChange, onStrokeResult, onCharacterComplete }, ref) => {
    const { colors } = useTheme();
    const [size, setSize] = useState(0);
    const [strokeData, setStrokeData] = useState<StrokeData | null>(null);
    const [normPaths, setNormPaths] = useState<string[]>([]);
    const [drawn, setDrawn] = useState<DrawnStroke[]>([]);
    const [current, setCurrent] = useState<{ x: number; y: number }[]>([]);
    // Emit stroke count via effect to avoid setState-in-render violations
    useEffect(() => { onStrokesChange?.(drawn.length); }, [drawn.length]); // eslint-disable-line react-hooks/exhaustive-deps
    const currentRef = useRef<{ x: number; y: number }[]>([]);
    const correctCountRef = useRef(0);
    const consecutiveWrongRef = useRef(0);
    const [showHint, setShowHint] = useState(false);

    // Flash overlay
    const flashOpacity = useRef(new Animated.Value(0)).current;
    const [flashColor, setFlashColor] = useState('transparent');

    // Guide pulse animation for the next expected stroke
    const guidePulse = useRef(new Animated.Value(0.4)).current;

    // Fetch stroke data when character changes
    useEffect(() => {
      setStrokeData(null);
      setNormPaths([]);
      setDrawn([]);
      setShowHint(false);
      correctCountRef.current = 0;
      consecutiveWrongRef.current = 0;
      setCurrent([]);
      currentRef.current = [];
      let cancelled = false;
      fetchStrokeData(guide).then((data) => {
        if (!cancelled) setStrokeData(data);
      });
      return () => { cancelled = true; };
    }, [guide]);

    useEffect(() => {
      if (!strokeData || size === 0) return;
      setNormPaths(strokeData.rawPaths.map((p) => normalizeStrokePath(p, size)));
    }, [strokeData, size]);

    // Pulsing animation for the next-stroke guide/hint
    useEffect(() => {
      if ((!showGuide && !showHint) || normPaths.length === 0) return;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(guidePulse, { toValue: 0.85, duration: 600, useNativeDriver: false }),
          Animated.timing(guidePulse, { toValue: 0.30, duration: 600, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, [showGuide, showHint, normPaths.length, guidePulse]);

    const triggerFlash = useCallback((color: string) => {
      setFlashColor(color);
      flashOpacity.setValue(0.35);
      Animated.timing(flashOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }, [flashOpacity]);

    const panResponder = useMemo(() =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          currentRef.current = [{ x: locationX, y: locationY }];
          setCurrent([...currentRef.current]);
        },
        onPanResponderMove: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          currentRef.current = [...currentRef.current, { x: locationX, y: locationY }];
          setCurrent([...currentRef.current]);
        },
        onPanResponderRelease: () => {
          const pts = currentRef.current;
          currentRef.current = [];
          setCurrent([]);
          if (pts.length === 0) return;

          const expectedIdx = correctCountRef.current;

          // Fallback: no stroke data → accept everything as freehand
          if (!strokeData || expectedIdx >= strokeData.rawPaths.length) {
            const path = pointsToPath(pts);
            if (path) setDrawn((prev) => [...prev, { path, correct: true }]);
            return;
          }

          const refPath = strokeData.rawPaths[expectedIdx]!;
          const refDir = strokeData.directions[expectedIdx]!;
          const isMatch = strokeMatches(pts, refDir, refPath, size);

          if (isMatch) {
            const beautified = normPaths[expectedIdx] ?? pointsToPath(pts);
            correctCountRef.current += 1;
            consecutiveWrongRef.current = 0;
            setShowHint(false);
            triggerFlash(colors.primary);

            setDrawn((prev) => [...prev, { path: beautified, correct: true }]);

            const total = strokeData.rawPaths.length;
            onStrokeResult?.('correct', correctCountRef.current, total);
            if (correctCountRef.current >= total) onCharacterComplete?.();
          } else {
            consecutiveWrongRef.current += 1;
            if (consecutiveWrongRef.current >= HINT_AFTER_WRONG) setShowHint(true);

            triggerFlash(colors.error);
            onStrokeResult?.('wrong', correctCountRef.current, strokeData.rawPaths.length);

            // Show wrong stroke in red briefly — clear it after 800ms
            const path = pointsToPath(pts);
            if (path) {
              setDrawn((prev) => [...prev, { path, correct: false }]);
              setTimeout(() => {
                setDrawn((prev) => prev.filter((s) => s.correct));
              }, 800);
            }
          }
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [strokeData, normPaths, size, colors]
    );

    useImperativeHandle(ref, () => ({
      clear: () => {
        currentRef.current = [];
        setCurrent([]);
        setDrawn([]);
        correctCountRef.current = 0;
        consecutiveWrongRef.current = 0;
        setShowHint(false);
      },
      undo: () => {
        setDrawn((prev) => {
          const last = prev[prev.length - 1];
          if (last?.correct) correctCountRef.current = Math.max(0, correctCountRef.current - 1);
          return prev.slice(0, -1);
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

    const totalStrokes = strokeData?.rawPaths.length ?? 0;
    // Index of the next stroke to draw
    const nextStrokePath = normPaths[correctCountRef.current];
    const showNextStrokeGuide = (showGuide || showHint) && !!nextStrokePath;

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
              style={[styles.guideChar, {
                fontSize: size * 0.7,
                lineHeight: size,
                width: size,
                color: revealed ? colors.primary : colors.outlineVariant,
                opacity: revealed ? 0.55 : 0.18,
              }]}
            >
              {guide}
            </Text>
          )}

          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
            {grid}

            {/* Correctly drawn strokes (beautified reference paths) */}
            {drawn.filter(s => s.correct).map((s, i) => (
              <Path key={`ok-${i}`} d={s.path} stroke={colors.primary} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}

            {/* Wrong strokes shown in red (auto-cleared after 800ms) */}
            {drawn.filter(s => !s.correct).map((s, i) => (
              <Path key={`err-${i}`} d={s.path} stroke={colors.error} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.6} />
            ))}

            {/* Active stroke being drawn */}
            {current.length > 0 && (
              <Path d={pointsToPath(current)} stroke={colors.onSurface} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            )}

            {/* Next expected stroke guide — pulsing opacity */}
            {showNextStrokeGuide && (
              <Path
                d={nextStrokePath}
                stroke={showHint ? colors.error : colors.primary}
                strokeWidth={showHint ? 12 : 10}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={0.5}
                strokeDasharray="16 10"
              />
            )}
          </Svg>

          {/* Flash feedback overlay */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: flashColor, opacity: flashOpacity, borderRadius: radius.lg }]}
          />
        </View>

        {/* Stroke progress badge */}
        {totalStrokes > 0 && (
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
