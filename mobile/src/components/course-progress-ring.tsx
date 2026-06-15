import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/theme-context';
import { fonts } from '../theme/theme';

interface Props {
  learned: number;
  total: number;
  size?: number;
}

// Circular progress indicator for a course: shows learned/total in the center
// with a jade arc sweeping clockwise proportional to completion.
export function CourseProgressRing({ learned, total, size = 76 }: Props) {
  const { colors } = useTheme();
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(1, learned / total) : 0;
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={colors.surfaceContainerHigh} strokeWidth={stroke} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontFamily: fonts.headlineSemi, fontSize: 17, color: colors.onSurface }}>{learned}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.outline }}>/{total}</Text>
      </View>
    </View>
  );
}
