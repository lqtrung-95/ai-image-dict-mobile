import { useState, type ComponentProps } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createList, VocabularyList } from '../lib/library-service';
import { showError } from '../lib/toast';
import { TextInputModal } from './text-input-modal';
import { useTheme } from '../theme/theme-context';
import { spacing, radius, typography, fonts } from '../theme/theme';
import { Icon } from '../theme/ui-primitives';

interface Props {
  visible: boolean;
  /** The Chinese word being saved, shown in the sheet header for context. */
  wordZh?: string;
  lists: VocabularyList[];
  /** Called with the chosen list id (null = save without a list). */
  onChoose: (listId: string | null) => void;
  onCancel: () => void;
  /** Bubble a freshly-created list back up so the parent can cache it. */
  onListCreated: (list: VocabularyList) => void;
}

// Bottom sheet shown when the user taps "save" on a detected word.
// Lets them save to no list, an existing list, or create a new one inline.
export function SaveToListSheet({ visible, wordZh, lists, onChoose, onCancel, onListCreated }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [creatorOpen, setCreatorOpen] = useState(false);

  const submitNewList = async (name: string) => {
    setCreatorOpen(false);
    try {
      const created = await createList(name, '#2d6a4f');
      onListCreated(created);
      onChoose(created.id);
    } catch {
      showError('Create failed', 'Try again');
    }
  };

  const Row = ({
    icon, label, dotColor, onPress, accent,
  }: { icon?: ComponentProps<typeof MaterialIcons>['name']; label: string; dotColor?: string; onPress: () => void; accent?: boolean }) => (
    <Pressable
      style={[styles.row, { borderBottomColor: colors.outlineVariant }]}
      onPress={onPress}
    >
      {dotColor ? (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      ) : icon ? (
        <Icon name={icon} size={20} color={accent ? colors.primary : colors.onSurfaceVariant} />
      ) : null}
      <Text style={[typography.body, { color: accent ? colors.primary : colors.onSurface, flex: 1 }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Inner press shouldn't close the sheet */}
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          onPress={() => {}}
        >
          <View style={[styles.handle, { backgroundColor: colors.surfaceHighest }]} />
          <Text style={[typography.headline, { color: colors.onSurface, marginBottom: spacing.xs }]}>
            Save word
          </Text>
          {wordZh ? (
            <Text style={{ fontFamily: fonts.hanzi, fontSize: 22, color: colors.primary, marginBottom: spacing.md }}>
              {wordZh}
            </Text>
          ) : null}

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            <Row icon="block" label="No list" onPress={() => onChoose(null)} />
            {lists.map((list) => (
              <Row key={list.id} dotColor={list.color} label={list.name} onPress={() => onChoose(list.id)} />
            ))}
            <Row icon="add" label="New list" accent onPress={() => setCreatorOpen(true)} />
          </ScrollView>
        </Pressable>
      </Pressable>

      <TextInputModal
        visible={creatorOpen}
        title="New List"
        message="Name your list"
        placeholder="e.g. Kitchen words"
        submitLabel="Create"
        onSubmit={submitNewList}
        onCancel={() => setCreatorOpen(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.containerMargin, paddingTop: spacing.md,
  },
  handle: { width: 48, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
