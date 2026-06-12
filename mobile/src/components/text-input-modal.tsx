import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  keyboardType?: 'default' | 'number-pad' | 'url';
  submitLabel?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

// Cross-platform replacement for iOS-only Alert.prompt.
// Used for display name, daily goal target, and new list name.
export function TextInputModal({
  visible, title, message, placeholder, initialValue = '',
  keyboardType = 'default', submitLabel = 'Save', onSubmit, onCancel,
}: Props) {
  const [value, setValue] = useState(initialValue);

  // Reset the field each time the modal opens
  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor="#64748b"
            keyboardType={keyboardType}
            autoFocus
            onSubmitEditing={() => value.trim() && onSubmit(value.trim())}
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, !value.trim() && styles.disabled]}
              onPress={() => onSubmit(value.trim())}
              disabled={!value.trim()}
            >
              <Text style={styles.submitText}>{submitLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  message: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  input: {
    backgroundColor: '#0f172a', borderRadius: 10, padding: 14, color: '#fff',
    borderWidth: 1, borderColor: '#334155', marginTop: 14, marginBottom: 18,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20 },
  cancelText: { color: '#94a3b8', fontSize: 15 },
  submitButton: { backgroundColor: '#9333ea', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 22 },
  submitText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
