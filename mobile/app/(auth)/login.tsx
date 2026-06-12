import { useState } from 'react';
import {
  Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
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
      Alert.alert('Login failed', err instanceof Error ? err.message : 'Please try again');
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
      Alert.alert('Google sign-in failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity style={styles.closeButton} onPress={dismissAfterLogin}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.logo}>AI词典</Text>
      <Text style={styles.title}>Welcome back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#64748b"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Logging in…' : 'Log In'}</Text>
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.googleButton, submitting && styles.buttonDisabled]}
        onPress={handleGoogle}
        disabled={submitting}
      >
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <Link href="/(auth)/signup" style={styles.link}>
        <Text style={styles.linkText}>
          No account? <Text style={styles.linkAccent}>Sign up</Text>
        </Text>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 24 },
  closeButton: { position: 'absolute', top: 24, right: 24, padding: 8, zIndex: 1 },
  closeText: { color: '#94a3b8', fontSize: 20 },
  logo: { fontSize: 40, textAlign: 'center', color: '#a855f7', fontWeight: 'bold', marginBottom: 8 },
  title: { fontSize: 22, color: '#fff', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16, color: '#fff',
    marginBottom: 12, borderWidth: 1, borderColor: '#334155',
  },
  button: { backgroundColor: '#9333ea', borderRadius: 12, padding: 16, marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  dividerText: { color: '#64748b', marginHorizontal: 12 },
  googleButton: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
  },
  googleButtonText: { color: '#1f2937', textAlign: 'center', fontWeight: '600', fontSize: 16 },
  link: { marginTop: 24, alignSelf: 'center' },
  linkText: { color: '#94a3b8' },
  linkAccent: { color: '#a855f7', fontWeight: '600' },
});
