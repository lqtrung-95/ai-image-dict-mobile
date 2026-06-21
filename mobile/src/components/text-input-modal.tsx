import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../theme/theme-context';
import { spacing, radius, typography, fonts } from '../theme/theme';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  keyboardType?: 'default' | 'number-pad' | 'url';
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

// Cross-platform replacement for iOS-only Alert.prompt.
export function TextInputModal({
  visible, title, message, placeholder, initialValue = '',
  keyboardType = 'default', submitLabel = 'Save', cancelLabel = 'Cancel', onSubmit, onCancel,
}: Props) {
  const { colors } = useTheme();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[typography.heading, { color: colors.onSurface }]}>{title}</Text>
          {message ? <Text style={[typography.body, { color: colors.onSurfaceVariant, marginTop: 4 }]}>{message}</Text> : null}
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.onSurface, borderColor: colors.outlineVariant, fontFamily: fonts.body }]}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.outline}
            keyboardType={keyboardType}
            autoFocus
            onSubmitEditing={() => value.trim() && onSubmit(value.trim())}
          />
          <View style={styles.actions}>
            <Pressable onPress={onCancel}>
              <Text style={[typography.label, { color: colors.onSurfaceVariant, fontSize: 14 }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.submit, { backgroundColor: colors.primaryContainer }, !value.trim() && { opacity: 0.5 }]}
              onPress={() => onSubmit(value.trim())}
              disabled={!value.trim()}
            >
              <Text style={[typography.label, { color: colors.onPrimaryContainer, fontSize: 14 }]}>{submitLabel}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', padding: spacing.lg },
  card: { borderRadius: radius.lg, padding: spacing.lg },
  input: { borderRadius: radius.md, padding: spacing.md, borderWidth: 1, marginTop: spacing.md, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.lg },
  submit: { borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: spacing.lg },
});
