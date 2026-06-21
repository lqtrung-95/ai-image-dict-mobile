import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { AppHeader } from '../src/components/app-header';
import { useTheme } from '../src/theme/theme-context';
import { useLocale } from '../src/lib/locale-react-context';
import { spacing, typography } from '../src/theme/theme';

const EFFECTIVE_DATE = 'June 15, 2026';
const CONTACT_EMAIL = 'lqtrung.dev@gmail.com';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();

  const sectionTitle = (title: string) => (
    <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{title}</Text>
  );

  const body = (text: string) => (
    <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>{text}</Text>
  );

  const bullet = (label: string, text: string) => (
    <Text style={[styles.bulletRow, { color: colors.onSurfaceVariant }]}>
      <Text style={{ fontWeight: '700', color: colors.onSurface }}>{label} </Text>
      {text}
    </Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title={t('privacyPolicy.title')} showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 60 }]}>
        <Text style={[typography.label, { color: colors.outline, marginBottom: spacing.md }]}>
          {t('privacyPolicy.lastUpdated')} {EFFECTIVE_DATE}
        </Text>

        {body(t('privacyPolicy.intro'))}

        {sectionTitle(t('privacyPolicy.s1Title'))}
        {bullet(t('privacyPolicy.s1b1Label'), t('privacyPolicy.s1b1'))}
        {bullet(t('privacyPolicy.s1b2Label'), t('privacyPolicy.s1b2'))}
        {bullet(t('privacyPolicy.s1b3Label'), t('privacyPolicy.s1b3'))}
        {bullet(t('privacyPolicy.s1b4Label'), t('privacyPolicy.s1b4'))}

        {sectionTitle(t('privacyPolicy.s2Title'))}
        {body(t('privacyPolicy.s2Body'))}

        {sectionTitle(t('privacyPolicy.s3Title'))}
        {body(t('privacyPolicy.s3Intro'))}
        {bullet(t('privacyPolicy.s3b1Label'), t('privacyPolicy.s3b1'))}
        {bullet(t('privacyPolicy.s3b2Label'), t('privacyPolicy.s3b2'))}
        {bullet(t('privacyPolicy.s3b3Label'), t('privacyPolicy.s3b3'))}
        {body(t('privacyPolicy.s3Outro'))}

        {sectionTitle(t('privacyPolicy.s4Title'))}
        {body(t('privacyPolicy.s4Body'))}

        {sectionTitle(t('privacyPolicy.s5Title'))}
        {body(t('privacyPolicy.s5Body'))}

        {sectionTitle(t('privacyPolicy.s6Title'))}
        {bullet(t('privacyPolicy.s6b1Label'), t('privacyPolicy.s6b1'))}
        {bullet(t('privacyPolicy.s6b2Label'), t('privacyPolicy.s6b2'))}
        {bullet(t('privacyPolicy.s6b3Label'), t('privacyPolicy.s6b3'))}

        {sectionTitle(t('privacyPolicy.s7Title'))}
        {body(t('privacyPolicy.s7Body'))}

        {sectionTitle(t('privacyPolicy.s8Title'))}
        {body(t('privacyPolicy.s8Body'))}

        {sectionTitle(t('privacyPolicy.s9Title'))}
        {body(t('privacyPolicy.s9Body'))}

        {sectionTitle(t('privacyPolicy.s10Title'))}
        {body(`${t('privacyPolicy.s10Body')} ${CONTACT_EMAIL}`)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.containerMargin },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.xs },
  body: { fontSize: 14, lineHeight: 22, marginBottom: spacing.sm },
  bulletRow: { fontSize: 14, lineHeight: 22, marginBottom: spacing.sm },
});
