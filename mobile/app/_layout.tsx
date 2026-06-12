import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/lib/auth-context';

// Public-first navigation: tabs are always accessible.
// Login is presented as a modal only when a protected action requires it.
function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  const darkHeader = {
    headerShown: true,
    headerStyle: { backgroundColor: '#0f172a' },
    headerTintColor: '#fff',
    headerShadowVisible: false,
  } as const;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
      <Stack.Screen name="practice-flashcards" options={{ ...darkHeader, title: 'Flashcards' }} />
      <Stack.Screen name="practice-quiz" options={{ ...darkHeader, title: 'Quiz' }} />
      <Stack.Screen name="practice-games" options={{ ...darkHeader, title: 'Games' }} />
      <Stack.Screen name="lists" options={{ ...darkHeader, title: 'Lists' }} />
      <Stack.Screen name="list-detail" options={{ ...darkHeader, title: 'List' }} />
      <Stack.Screen name="history" options={{ ...darkHeader, title: 'History' }} />
      <Stack.Screen name="stories" options={{ ...darkHeader, title: 'Stories' }} />
      <Stack.Screen name="story-create" options={{ ...darkHeader, title: 'New Story' }} />
      <Stack.Screen name="story-detail" options={{ ...darkHeader, title: 'Story' }} />
      <Stack.Screen name="progress" options={{ ...darkHeader, title: 'Progress' }} />
      <Stack.Screen name="courses" options={{ ...darkHeader, title: 'Community Courses' }} />
      <Stack.Screen name="course-detail" options={{ ...darkHeader, title: 'Course' }} />
      <Stack.Screen name="import-vocabulary" options={{ ...darkHeader, title: 'Import Words' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
