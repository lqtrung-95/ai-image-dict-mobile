import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { speakChinese } from '../lib/tts-speech-service';
import { VocabularyItem, setWordLearned, deleteWord } from '../lib/vocabulary-service';
import { useTheme } from '../theme/theme-context';
import { spacing, radius, typography, fonts, makeShadow } from '../theme/theme';
import { Icon } from '../theme/ui-primitives';

interface Props {
  item: VocabularyItem;
  onDeleted: (id: string) => void;
  onLearnedChanged: (id: string, isLearned: boolean) => void;
}

// One vocabulary row: rice-grid char + meaning, tap to expand for actions.
export function VocabularyWordCard({ item, onDeleted, onLearnedChanged }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleLearned = async () => {
    setBusy(true);
    try {
      await setWordLearned(item.id, !item.isLearned);
      onLearnedChanged(item.id, !item.isLearned);
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete word', `Remove "${item.wordZh}" from your vocabulary?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteWord(item.id); onDeleted(item.id); }
          catch (err) { Alert.alert('Delete failed', err instanceof Error ? err.message : 'Try again'); }
        },
      },
    ]);
  };

  return (
    <Pressable
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceContainerHigh, ...makeShadow(colors, 'card') }]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.row}>
        <View style={[styles.charBox, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
          <View style={[styles.gridV, { backgroundColor: colors.outlineVariant }]} />
          <View style={[styles.gridH, { backgroundColor: colors.outlineVariant }]} />
          <Text style={[styles.charZh, { color: colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>{item.wordZh}</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={[typography.pinyin, { color: colors.onSurfaceVariant }]}>{item.wordPinyin}</Text>
          <Text style={{ fontFamily: fonts.headlineSemi, fontSize: 16, color: colors.onSurface, marginTop: 2 }}>{item.wordEn}</Text>
          <View style={styles.badges}>
            {item.hskLevel != null && (
              <View style={[styles.chip, { backgroundColor: colors.primarySoft }]}>
                <Text style={[typography.label, { color: colors.primary }]}>HSK {item.hskLevel}</Text>
              </View>
            )}
            {item.isLearned && (
              <View style={[styles.chip, { backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
                <Icon name="check-circle" size={12} color={colors.primary} />
                <Text style={[typography.label, { color: colors.primary }]}>Learned</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable style={[styles.iconBtn, { backgroundColor: colors.surfaceContainer }]} onPress={() => speakChinese(item.wordZh)}>
          <Icon name="volume-up" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {expanded && (
        <View style={[styles.actions, { borderTopColor: colors.surfaceContainerHigh }]}>
          {item.exampleSentence ? (
            <Text style={[typography.body, { color: colors.onSurfaceVariant, fontStyle: 'italic', marginBottom: spacing.sm }]}>{item.exampleSentence}</Text>
          ) : null}
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionBtn, { borderColor: item.isLearned ? colors.primary : colors.outlineVariant }]}
              onPress={toggleLearned}
              disabled={busy}
            >
              <Text style={[typography.label, { fontSize: 13, color: colors.onSurface }]}>
                {item.isLearned ? 'Mark unlearned' : 'Mark learned'}
              </Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, { borderColor: colors.error }]} onPress={confirmDelete}>
              <Text style={[typography.label, { fontSize: 13, color: colors.error }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  charBox: { width: 64, height: 64, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  gridV: { position: 'absolute', width: 1, height: '100%', opacity: 0.4 },
  gridH: { position: 'absolute', height: 1, width: '100%', opacity: 0.4 },
  charZh: { fontFamily: fonts.hanzi, fontSize: 30, paddingHorizontal: 4 },
  badges: { flexDirection: 'row', gap: 6, marginTop: spacing.xs },
  chip: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  actions: { marginTop: spacing.md, borderTopWidth: 1, paddingTop: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, borderWidth: 1.5, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
});
