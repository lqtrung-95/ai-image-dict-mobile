import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import type { VocabularyItem } from '../lib/vocabulary-service';

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
      const next = new Set(matched).add(tile.wordId);
      setMatched(next);
      setSelectedZh(null);
      if (next.size === Math.min(PAIRS_PER_ROUND, pool.length)) {
        setTimeout(onFinished, 600);
      }
    } else {
      // flash wrong, then clear selection
      setWrong(tile.wordId);
      setTimeout(() => {
        setWrong(null);
        setSelectedZh(null);
      }, 500);
    }
  };

  const tileStyle = (tile: Tile, isSelected: boolean) => {
    if (matched.has(tile.wordId)) return styles.matched;
    if (tile.side === 'en' && wrong === tile.wordId) return styles.wrong;
    if (isSelected) return styles.selected;
    return styles.tile;
  };

  return (
    <View style={styles.board}>
      <Text style={styles.progress}>
        Matched {matched.size} / {Math.min(PAIRS_PER_ROUND, pool.length)}
      </Text>
      <View style={styles.columns}>
        <View style={styles.column}>
          {zhTiles.map((tile) => (
            <TouchableOpacity
              key={tile.key}
              style={[styles.tileBase, tileStyle(tile, selectedZh === tile.wordId)]}
              onPress={() => handleZh(tile)}
              disabled={matched.has(tile.wordId)}
            >
              <Text style={styles.zhText}>{tile.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.column}>
          {enTiles.map((tile) => (
            <TouchableOpacity
              key={tile.key}
              style={[styles.tileBase, tileStyle(tile, false)]}
              onPress={() => handleEn(tile)}
              disabled={matched.has(tile.wordId)}
            >
              <Text style={styles.enText}>{tile.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: { flex: 1 },
  progress: { color: '#94a3b8', fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  columns: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, gap: 12 },
  tileBase: {
    borderRadius: 12, padding: 16, minHeight: 64, justifyContent: 'center', borderWidth: 1.5,
  },
  tile: { backgroundColor: '#1e293b', borderColor: '#334155' },
  selected: { backgroundColor: '#1e293b', borderColor: '#a855f7' },
  matched: { backgroundColor: '#16a34a33', borderColor: '#16a34a' },
  wrong: { backgroundColor: '#dc262633', borderColor: '#dc2626' },
  zhText: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  enText: { color: '#e2e8f0', fontSize: 15, textAlign: 'center' },
});
