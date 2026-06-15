import { useState } from 'react';
import { Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';
import { showError } from '../../src/lib/toast';
import { useTheme } from '../../src/theme/theme-context';
import { spacing, radius, typography, fonts } from '../../src/theme/theme';
import { Icon } from '../../src/theme/ui-primitives';

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dismissAfterLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      dismissAfterLogin();
    } catch (err) {
      showError('Login failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      await loginWithGoogle();
      dismissAfterLogin();
    } catch (err) {
      showError('Google sign-in failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, color: colors.onSurface, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.outlineVariant, fontFamily: fonts.body, fontSize: 15 };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: spacing.lg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={styles.close} onPress={dismissAfterLogin}>
        <Icon name="close" size={24} color={colors.outline} />
      </Pressable>

      <Text style={{ fontFamily: fonts.hanzi, fontSize: 44, textAlign: 'center', color: colors.primary }}>词典</Text>
      <Text style={[typography.headline, { color: colors.onSurface, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl }]}>Welcome back</Text>

      <TextInput style={inputStyle} placeholder="Email" placeholderTextColor={colors.outline} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={inputStyle} placeholder="Password" placeholderTextColor={colors.outline} secureTextEntry value={password} onChangeText={setPassword} />

      <Pressable style={[styles.primary, { backgroundColor: colors.primaryContainer }, submitting && { opacity: 0.6 }]} onPress={handleLogin} disabled={submitting}>
        <Text style={[typography.label, { fontSize: 15, color: colors.onPrimaryContainer }]}>{submitting ? 'Logging in…' : 'Log In'}</Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
        <Text style={[typography.label, { fontSize: 12, color: colors.outline, marginHorizontal: spacing.md }]}>or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
      </View>

      <Pressable style={[styles.google, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }, submitting && { opacity: 0.6 }]} onPress={handleGoogle} disabled={submitting}>
        <Text style={[typography.label, { fontSize: 15, color: colors.onSurface }]}>Continue with Google</Text>
      </Pressable>

      <Link href="/(auth)/signup" style={{ marginTop: spacing.lg, alignSelf: 'center' }}>
        <Text style={[typography.body, { color: colors.onSurfaceVariant }]}>
          No account? <Text style={{ color: colors.primary, fontFamily: fonts.label }}>Sign up</Text>
        </Text>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  close: { position: 'absolute', top: 24, right: 24, padding: spacing.sm, zIndex: 1 },
  primary: { borderRadius: radius.pill, padding: spacing.md, marginTop: spacing.sm, alignItems: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  google: { borderRadius: radius.pill, padding: spacing.md, borderWidth: 1, alignItems: 'center' },
});
