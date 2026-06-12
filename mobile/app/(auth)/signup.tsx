import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth-context';

export default function SignupScreen() {
  const { signup } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) return;
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await signup(email.trim(), password, displayName.trim() || undefined);
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Sign up failed', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>AI词典</Text>
      <Text style={styles.title}>Create your account</Text>

      <TextInput
        style={styles.input}
        placeholder="Display name (optional)"
        placeholderTextColor="#64748b"
        value={displayName}
        onChangeText={setDisplayName}
      />
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
        placeholder="Password (min 8 characters)"
        placeholderTextColor="#64748b"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Creating account…' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>
          Already have an account? <Text style={styles.linkAccent}>Log in</Text>
        </Text>
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 40, textAlign: 'center', color: '#a855f7', fontWeight: 'bold', marginBottom: 8 },
  title: { fontSize: 22, color: '#fff', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16, color: '#fff',
    marginBottom: 12, borderWidth: 1, borderColor: '#334155',
  },
  button: { backgroundColor: '#9333ea', borderRadius: 12, padding: 16, marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
  link: { marginTop: 24, alignSelf: 'center' },
  linkText: { color: '#94a3b8' },
  linkAccent: { color: '#a855f7', fontWeight: '600' },
});
