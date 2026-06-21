import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { AppHeader } from '../src/components/app-header';
import { useTheme } from '../src/theme/theme-context';
import { useLocale } from '../src/lib/locale-react-context';
import { useAuth } from '../src/lib/auth-context';
import { apiFetch } from '../src/lib/api-client';
import { spacing, radius, typography, fonts } from '../src/theme/theme';
import { showToast } from '../src/lib/toast';

type FeedbackType = 'general' | 'feature' | 'bug';

export default function FeedbackScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { user } = useAuth();
  const router = useRouter();

  const TYPES: { value: FeedbackType; icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; desc: string }[] = [
    { value: 'general', icon: 'chat-bubble-outline', label: t('feedback.typeGeneralLabel'), desc: t('feedback.typeGeneralDesc') },
    { value: 'feature', icon: 'lightbulb-outline', label: t('feedback.typeFeatureLabel'), desc: t('feedback.typeFeatureDesc') },
    { value: 'bug', icon: 'bug-report', label: t('feedback.typeBugLabel'), desc: t('feedback.typeBugDesc') },
  ];

  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (message.trim().length < 5) {
      showToast(t('feedback.validationMin'));
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ type, message, email }),
      });
      if (!res.ok) throw new Error();
      showToast(t('feedback.successToast'));
      router.back();
    } catch {
      showToast(t('feedback.errorToast'));
    } finally {
      setLoading(false);
    }
  };

  const selected = TYPES.find((tp) => tp.value === type)!;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader title={t('feedback.title')} showBack />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Header card */}
          <View style={[styles.headerCard, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '30' }]}>
            <MaterialIcons name="volunteer-activism" size={28} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.label, { color: colors.primary, fontSize: 14 }]}>{t('feedback.tagline')}</Text>
              <Text style={[typography.body, { color: colors.onSurfaceVariant, fontSize: 13, marginTop: 2 }]}>
                {t('feedback.thankYou')}
              </Text>
            </View>
          </View>

          {/* Type selector */}
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{t('feedback.topic')}</Text>
          <View style={styles.typeRow}>
            {TYPES.map((tp) => {
              const active = type === tp.value;
              return (
                <Pressable
                  key={tp.value}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor: active ? colors.primarySoft : colors.surface,
                      borderColor: active ? colors.primary : colors.outlineVariant,
                      borderWidth: active ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => setType(tp.value)}
                >
                  <MaterialIcons name={tp.icon} size={22} color={active ? colors.primary : colors.outline} />
                  <Text style={[typography.label, { fontSize: 13, color: active ? colors.primary : colors.onSurface, marginTop: 4 }]}>
                    {tp.label}
                  </Text>
                  <Text style={[typography.body, { fontSize: 11, color: active ? colors.primary : colors.outline, opacity: 0.8, textAlign: 'center', marginTop: 2 }]}>
                    {tp.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Message */}
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
            {selected.value === 'bug' ? t('feedback.messageLabelBug') : selected.value === 'feature' ? t('feedback.messageLabelFeature') : t('feedback.messageLabelGeneral')}
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
            <TextInput
              style={[styles.messageInput, { color: colors.onSurface, fontFamily: fonts.body }]}
              placeholder={
                selected.value === 'bug'
                  ? t('feedback.placeholderBug')
                  : selected.value === 'feature'
                  ? t('feedback.placeholderFeature')
                  : t('feedback.placeholderGeneral')
              }
              placeholderTextColor={colors.outline}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
            <Text style={[styles.charCount, { color: message.length > 500 ? colors.error : colors.outline }]}>
              {message.length}/500
            </Text>
          </View>

          {/* Email */}
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{t('feedback.replyEmail')} <Text style={{ fontWeight: '400', textTransform: 'none' }}>{t('feedback.replyEmailOptional')}</Text></Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.outlineVariant, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md }]}>
            <MaterialIcons name="mail-outline" size={18} color={colors.outline} style={{ marginRight: spacing.sm }} />
            <TextInput
              style={[{ flex: 1, color: colors.onSurface, fontFamily: fonts.body, fontSize: 15, paddingVertical: 14 }]}
              placeholder="your@email.com"
              placeholderTextColor={colors.outline}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <>
                <MaterialIcons name="send" size={18} color={colors.onPrimary} />
                <Text style={[typography.label, { color: colors.onPrimary, fontSize: 15 }]}>{t('feedback.send')}</Text>
              </>
            )}
          </Pressable>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.containerMargin, paddingBottom: 60, gap: spacing.xs },
  headerCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radius.lg, padding: spacing.md, borderWidth: 1,
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.label, fontSize: 11, letterSpacing: 0.8,
    textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.sm,
  },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeCard: {
    flex: 1, borderRadius: radius.lg, padding: spacing.sm,
    alignItems: 'center', paddingVertical: spacing.md,
  },
  inputWrap: {
    borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden',
  },
  messageInput: {
    fontSize: 15, minHeight: 120,
    padding: spacing.md, paddingTop: spacing.md,
  },
  charCount: {
    fontFamily: fonts.label, fontSize: 11,
    textAlign: 'right', paddingRight: spacing.sm, paddingBottom: spacing.xs,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderRadius: radius.lg,
    paddingVertical: 16, marginTop: spacing.lg,
  },
});
