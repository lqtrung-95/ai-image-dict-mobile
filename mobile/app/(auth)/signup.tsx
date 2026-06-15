import { useState } from 'react';
import { Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { showError } from '../../src/lib/toast';
import { useTheme } from '../../src/theme/theme-context';
import { spacing, radius, typography, fonts } from '../../src/theme/theme';

export default function SignupScreen() {
  const { signup } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) return;
    if (password.length < 8) {
      showError('Weak password', 'Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      const hasSession = await signup(email.trim(), password, displayName.trim() || undefined);
      if (hasSession) {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)');
      } else {
        Alert.alert(
          'Confirm your email',
          `We sent a confirmation link to ${email.trim()}. Tap it, then come back and log in.`,
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (err) {
      showError('Sign up failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, color: colors.onSurface, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.outlineVariant, fontFamily: fonts.body, fontSize: 15 };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.lg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={{ fontFamily: fonts.hanzi, fontSize: 44, textAlign: 'center', color: colors.primary }}>词典</Text>
      <Text style={[typography.headline, { color: colors.onSurface, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl }]}>Create your account</Text>

      <TextInput style={inputStyle} placeholder="Display name (optional)" placeholderTextColor={colors.outline} value={displayName} onChangeText={setDisplayName} />
      <TextInput style={inputStyle} placeholder="Email" placeholderTextColor={colors.outline} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={inputStyle} placeholder="Password (min 8 characters)" placeholderTextColor={colors.outline} secureTextEntry value={password} onChangeText={setPassword} />

      <Pressable style={[styles.primary, { backgroundColor: colors.primaryContainer }, submitting && { opacity: 0.6 }]} onPress={handleSignup} disabled={submitting}>
        <Text style={[typography.label, { fontSize: 15, color: colors.onPrimaryContainer }]}>{submitting ? 'Creating account…' : 'Sign Up'}</Text>
      </Pressable>

      <Link href="/(auth)/login" style={{ marginTop: spacing.lg, alignSelf: 'center' }}>
        <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
          Already have an account? <Text style={{ color: colors.primary, fontFamily: fonts.label }}>Log in</Text>
        </Text>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  primary: { borderRadius: radius.pill, padding: spacing.md, marginTop: spacing.sm, alignItems: 'center' },
});
