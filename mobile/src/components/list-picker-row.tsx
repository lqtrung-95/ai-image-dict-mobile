import { useEffect, useState } from 'react';
import { ScrollView, Text, Pressable, View, Alert } from 'react-native';
import { fetchLists, createList, VocabularyList } from '../lib/library-service';
import { TextInputModal } from './text-input-modal';
import { useTheme } from '../theme/theme-context';
import { useLocale } from '../lib/locale-react-context';
import { spacing, radius, typography } from '../theme/theme';
import { Eyebrow } from '../theme/ui-primitives';

interface Props {
  selectedListId: string | null;
  onSelect: (listId: string | null) => void;
}

// Horizontal chip row to pick a target list when saving words.
export function ListPickerRow({ selectedListId, onSelect }: Props) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [creatorOpen, setCreatorOpen] = useState(false);

  useEffect(() => {
    fetchLists().then(setLists).catch(() => {});
  }, []);

  const submitNewList = async (name: string) => {
    setCreatorOpen(false);
    try {
      const created = await createList(name, '#2d6a4f');
      setLists((prev) => [created, ...prev]);
      onSelect(created.id);
    } catch {
      Alert.alert(t('listPicker.createFailed'), t('listPicker.createFailedBody'));
    }
  };

  const chip = (active: boolean) => ({
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    backgroundColor: active ? colors.primarySoft : colors.surface,
    borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 1, borderColor: active ? colors.primary : colors.outlineVariant,
  });

  return (
    <View>
      <Eyebrow style={{ marginBottom: spacing.sm }}>{t('listPicker.saveToList')}</Eyebrow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingBottom: 4 }}>
        <Pressable style={chip(selectedListId === null)} onPress={() => onSelect(null)}>
          <Text style={[typography.pinyin, { color: colors.onSurfaceVariant }]}>{t('listPicker.noList')}</Text>
        </Pressable>
        {lists.map((list) => (
          <Pressable key={list.id} style={chip(selectedListId === list.id)} onPress={() => onSelect(list.id)}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: list.color }} />
            <Text style={[typography.pinyin, { color: colors.onSurface }]}>{list.name}</Text>
          </Pressable>
        ))}
        <Pressable style={chip(false)} onPress={() => setCreatorOpen(true)}>
          <Text style={[typography.pinyin, { color: colors.primary }]}>{t('listPicker.newList')}</Text>
        </Pressable>
      </ScrollView>

      <TextInputModal
        visible={creatorOpen}
        title={t('listPicker.newListTitle')}
        message={t('listPicker.newListMessage')}
        placeholder={t('listPicker.newListPlaceholder')}
        submitLabel={t('lists.createList')}
        cancelLabel={t('listPicker.cancel')}
        onSubmit={submitNewList}
        onCancel={() => setCreatorOpen(false)}
      />
    </View>
  );
}
