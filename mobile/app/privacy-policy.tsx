import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { AppHeader } from '../src/components/app-header';
import { useTheme } from '../src/theme/theme-context';
import { spacing, typography } from '../src/theme/theme';

const EFFECTIVE_DATE = 'June 15, 2026';
const CONTACT_EMAIL = 'lqtrung.dev@gmail.com';

function Section({ title }: { title: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{title}</Text>;
}

function Body({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.body, { color: colors.onSurfaceVariant }]}>{children}</Text>;
}

function Bullet({ label, children }: { label: string; children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.bulletRow, { color: colors.onSurfaceVariant }]}>
      <Text style={{ fontWeight: '700', color: colors.onSurface }}>{label} </Text>
      {children}
    </Text>
  );
}

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader title="Privacy Policy" showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 60 }]}>
        <Text style={[typography.label, { color: colors.outline, marginBottom: spacing.md }]}>
          Last updated: {EFFECTIVE_DATE}
        </Text>

        <Body>
          Snap Mandarin ("the app", "we", "us") helps you learn Chinese vocabulary by analyzing photos you take. This policy explains what we collect, why, and the choices you have. By using the app you agree to this policy.
        </Body>

        <Section title="Information we collect" />
        <Bullet label="Account information.">Your email address and, optionally, a display name and avatar image, used to create and manage your account.</Bullet>
        <Bullet label="Photos you submit.">When you analyze a photo, the image is sent to our AI processing providers to detect objects and generate vocabulary. Photos used for analysis are processed transiently and are not stored long-term unless you explicitly save the resulting analysis or story to your account.</Bullet>
        <Bullet label="Learning data.">Vocabulary you save, lists, courses you subscribe to, practice sessions, quiz attempts, streaks, and study statistics.</Bullet>
        <Bullet label="Usage and device data.">Basic technical data needed to operate the service (e.g. request counts for rate limiting, error logs, and approximate IP for abuse prevention).</Bullet>

        <Section title="How we use your information" />
        <Body>
          Provide the core features: photo analysis, vocabulary storage, spaced-repetition practice, courses, and stories.{'\n\n'}
          Operate and improve the service: debugging, performance monitoring, and abuse prevention.{'\n\n'}
          Send study reminders if you opt in.
        </Body>

        <Section title="Third-party providers" />
        <Body>
          We rely on the following services, each of which processes only the data needed to perform its function:
        </Body>
        <Bullet label="Supabase">— authentication, database, and file storage.</Bullet>
        <Bullet label="Groq">— routes submitted photos and text to AI models (such as Meta Llama and DeepSeek) to generate vocabulary, translations, and example sentences.</Bullet>
        <Bullet label="Google Cloud TTS">— generates audio pronunciation.</Bullet>
        <Body>
          These providers process data only to perform their function for us and are bound by their own privacy and security terms.
        </Body>

        <Section title="Push notifications" />
        <Body>
          If you enable study reminders, the app schedules local notifications on your device. You can turn them off at any time in the app's settings or your device settings.
        </Body>

        <Section title="Data retention" />
        <Body>
          We keep your account and learning data until you delete it or your account. Photos submitted for analysis are not retained after processing unless you save them.
        </Body>

        <Section title="Your rights" />
        <Bullet label="Export.">You can export all of your data from within the app (Profile → Export Data).</Bullet>
        <Bullet label="Deletion.">You can permanently delete your account and all associated data from within the app (Profile → Delete Account & Data). This cannot be undone.</Bullet>
        <Bullet label="Notifications.">Opt out of reminders at any time.</Bullet>

        <Section title="Children" />
        <Body>
          The app is not directed to children under 13 (or the minimum age required in your country). We do not knowingly collect data from children. If you believe a child has provided us data, contact us and we will delete it.
        </Body>

        <Section title="Security" />
        <Body>
          We use industry-standard measures including encrypted transport (HTTPS) and row-level access controls so that you can only access your own data. No method of transmission or storage is completely secure, but we work to protect your information.
        </Body>

        <Section title="Changes to this policy" />
        <Body>
          We may update this policy from time to time. Material changes will be reflected by the Last updated date above.
        </Body>

        <Section title="Contact" />
        <Body>
          Questions about this policy or your data? Email {CONTACT_EMAIL}
        </Body>
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
