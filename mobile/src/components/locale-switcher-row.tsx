import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { useLocale } from '../lib/locale-react-context';
import { SupportedLocale, SUPPORTED_LOCALES } from '../lib/i18n-localization-service';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
};

export function LocaleSwitcherRow() {
  const { colors } = useTheme();
  const { locale, setLocale, t } = useLocale();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{t('settings.language')}</Text>
      <View style={styles.options}>
        {SUPPORTED_LOCALES.map((code) => (
          <TouchableOpacity
            key={code}
            onPress={() => setLocale(code)}
            style={[
              styles.option,
              { borderColor: colors.border, backgroundColor: colors.surface },
              locale === code && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.optionText,
                { color: colors.textSecondary },
                locale === code && { color: '#ffffff', fontWeight: '700' },
              ]}
            >
              {LOCALE_LABELS[code]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
  },
});
