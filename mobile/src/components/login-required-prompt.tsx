import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

// Shown in place of protected content when the user is not logged in.
// Public-first UX: browsing stays open, important flows prompt for login.
export function LoginRequiredPrompt({ message }: { message: string }) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔒</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(auth)/login')}
      >
        <Text style={styles.buttonText}>Log In / Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0f172a', justifyContent: 'center',
    alignItems: 'center', padding: 32,
  },
  emoji: { fontSize: 40, marginBottom: 16 },
  message: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#9333ea', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
