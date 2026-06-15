import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { useTheme } from '../theme/theme-context';
import { radius, fonts } from '../theme/theme';

export interface HandwritingCanvasHandle {
  clear: () => void;
  undo: () => void;
  /** Number of strokes drawn so far (one per pen-down → pen-up). */
  strokeCount: () => number;
}

interface HandwritingCanvasProps {
  /** Target character shown as a faint guide to trace over. */
  guide: string;
  /** Reveal the solid character (after the user finishes tracing). */
  revealed?: boolean;
  /** Notify parent when the stroke count changes (e.g. to enable "Reveal"). */
  onStrokesChange?: (count: number) => void;
}

// A point is "x,y"; a stroke is the SVG path data for one continuous pen-down.
function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    // A dot — draw a tiny segment so it renders
    const { x, y } = points[0];
    return `M ${x} ${y} L ${x + 0.1} ${y + 0.1}`;
  }
  return points.reduce((acc, p, i) => acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '');
}

/**
 * Freehand tracing surface. Renders the target hanzi faintly behind a grid,
 * captures finger strokes via PanResponder, and draws them with react-native-svg.
 * Stroke order/accuracy isn't auto-graded — the user self-assesses after revealing,
 * which mirrors how handwriting SRS apps (e.g. Skritter) work.
 */
export const HandwritingCanvas = forwardRef<HandwritingCanvasHandle, HandwritingCanvasProps>(
  ({ guide, revealed = false, onStrokesChange }, ref) => {
    const { colors } = useTheme();
    const [size, setSize] = useState(0);
    const [strokes, setStrokes] = useState<string[]>([]);
    const [current, setCurrent] = useState<{ x: number; y: number }[]>([]);
    const currentRef = useRef<{ x: number; y: number }[]>([]);

    // Emit stroke count after render, not during setStrokes updater (avoids setState-in-render warning).
    useEffect(() => { onStrokesChange?.(strokes.length); }, [strokes.length]);

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
            const path = pointsToPath(currentRef.current);
            currentRef.current = [];
            setCurrent([]);
            if (path) {
              setStrokes((prev) => [...prev, path]);
            }
          },
        }),
      // panResponder is created once; handlers use refs/setters that are stable
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    useImperativeHandle(ref, () => ({
      clear: () => {
        currentRef.current = [];
        setCurrent([]);
        setStrokes([]);
      },
      undo: () => {
        setStrokes((prev) => prev.slice(0, -1));
      },
      strokeCount: () => strokes.length,
    }));

    const onLayout = (e: LayoutChangeEvent) => setSize(e.nativeEvent.layout.width);

    // Guide grid lines (rice-grid 米字格): center cross + diagonals
    const grid = size > 0 && (
      <>
        <Line x1={size / 2} y1={0} x2={size / 2} y2={size} stroke={colors.outlineVariant} strokeWidth={1} strokeDasharray="6 6" />
        <Line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke={colors.outlineVariant} strokeWidth={1} strokeDasharray="6 6" />
        <Line x1={0} y1={0} x2={size} y2={size} stroke={colors.outlineVariant} strokeWidth={1} strokeDasharray="6 6" />
        <Line x1={size} y1={0} x2={0} y2={size} stroke={colors.outlineVariant} strokeWidth={1} strokeDasharray="6 6" />
      </>
    );

    return (
      <View
        style={[styles.canvas, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        {/* Faint (or solid, once revealed) character to trace over */}
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
                opacity: revealed ? 0.55 : 0.25,
              },
            ]}
          >
            {guide}
          </Text>
        )}

        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
          {grid}
          {strokes.map((d, i) => (
            <Path key={i} d={d} stroke={colors.onSurface} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
          {current.length > 0 && (
            <Path d={pointsToPath(current)} stroke={colors.onSurface} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          )}
        </Svg>
      </View>
    );
  }
);

HandwritingCanvas.displayName = 'HandwritingCanvas';

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
});
