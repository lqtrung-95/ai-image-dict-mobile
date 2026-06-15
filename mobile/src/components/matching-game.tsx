import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import { notifySuccess, notifyError } from '../lib/haptics-service';
import type { VocabularyItem } from '../lib/vocabulary-service';
import { useTheme } from '../theme/theme-context';
import { spacing, radius, typography, fonts } from '../theme/theme';

interface Tile {
  key: string;
  wordId: string;
  label: string;
  side: 'zh' | 'en';
}

const PAIRS_PER_ROUND = 5;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Match each 汉字 tile to its English meaning. Correct pairs lock green.
export function MatchingGame({ pool, onFinished }: { pool: VocabularyItem[]; onFinished: () => void }) {
  const { colors } = useTheme();
  const [zhTiles, setZhTiles] = useState<Tile[]>([]);
  const [enTiles, setEnTiles] = useState<Tile[]>([]);
  const [selectedZh, setSelectedZh] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);

  useEffect(() => {
    const words = shuffle(pool).slice(0, PAIRS_PER_ROUND);
    setZhTiles(shuffle(words.map((w) => ({ key: `zh-${w.id}`, wordId: w.id, label: w.wordZh, side: 'zh' as const }))));
    setEnTiles(shuffle(words.map((w) => ({ key: `en-${w.id}`, wordId: w.id, label: w.wordEn, side: 'en' as const }))));
    setMatched(new Set());
    setSelectedZh(null);
  }, [pool]);

  const handleZh = (tile: Tile) => {
    if (matched.has(tile.wordId)) return;
    speakChinese(tile.label);
    setSelectedZh(tile.wordId);
  };

  const handleEn = (tile: Tile) => {
    if (matched.has(tile.wordId) || selectedZh === null) return;
    if (tile.wordId === selectedZh) {
      notifySuccess();
      const next = new Set(matched).add(tile.wordId);
      setMatched(next);
      setSelectedZh(null);
      if (next.size === Math.min(PAIRS_PER_ROUND, pool.length)) {
        setTimeout(onFinished, 600);
      }
    } else {
      // flash wrong, then clear selection
      notifyError();
      setWrong(tile.wordId);
      setTimeout(() => {
        setWrong(null);
        setSelectedZh(null);
      }, 500);
    }
  };

  const tileStyle = (tile: Tile, isSelected: boolean): ViewStyle => {
    if (matched.has(tile.wordId)) return { backgroundColor: colors.primarySoft, borderColor: colors.primary };
    if (tile.side === 'en' && wrong === tile.wordId) return { backgroundColor: colors.errorContainer, borderColor: colors.error };
    if (isSelected) return { backgroundColor: colors.surface, borderColor: colors.primary };
    return { backgroundColor: colors.surface, borderColor: colors.outlineVariant };
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={[typography.label, { fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: spacing.md }]}>
        Matched {matched.size} / {Math.min(PAIRS_PER_ROUND, pool.length)}
      </Text>
      <View style={styles.grid}>
        {zhTiles.map((zhTile, i) => {
          const enTile = enTiles[i];
          return (
            <View key={zhTile.key} style={styles.row}>
              <Pressable
                style={[styles.tileBase, { flex: 1 }, tileStyle(zhTile, selectedZh === zhTile.wordId)]}
                onPress={() => handleZh(zhTile)}
                disabled={matched.has(zhTile.wordId)}
              >
                <Text style={{ fontFamily: fonts.hanzi, fontSize: 24, color: colors.onSurface, textAlign: 'center' }}>{zhTile.label}</Text>
              </Pressable>
              {enTile && (
                <Pressable
                  style={[styles.tileBase, { flex: 1 }, tileStyle(enTile, false)]}
                  onPress={() => handleEn(enTile)}
                  disabled={matched.has(enTile.wordId)}
                >
                  <Text style={[typography.body, { color: colors.onSurface, textAlign: 'center' }]}>{enTile.label}</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  tileBase: { borderRadius: radius.md, padding: spacing.md, minHeight: 64, justifyContent: 'center', borderWidth: 1.5 },
});
