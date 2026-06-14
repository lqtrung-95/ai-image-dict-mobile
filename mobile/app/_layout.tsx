import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, NotoSerif_500Medium, NotoSerif_700Bold } from '@expo-google-fonts/noto-serif';
import {
  PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { WorkSans_400Regular, WorkSans_500Medium } from '@expo-google-fonts/work-sans';
import { AuthProvider, useAuth } from '../src/lib/auth-context';
import { ThemeProvider, useTheme } from '../src/theme/theme-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const header = {
    headerShown: true,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.onSurface,
    headerShadowVisible: false,
  } as const;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
      <Stack.Screen name="analysis-result" options={{ headerShown: false }} />
      <Stack.Screen name="practice-flashcards" options={{ ...header, title: 'Flashcards' }} />
      <Stack.Screen name="practice-quiz" options={{ ...header, title: 'Quiz' }} />
      <Stack.Screen name="practice-games" options={{ ...header, title: 'Games' }} />
      <Stack.Screen name="lists" options={{ ...header, title: 'Lists' }} />
      <Stack.Screen name="list-detail" options={{ ...header, title: 'List' }} />
      <Stack.Screen name="history" options={{ ...header, title: 'History' }} />
      <Stack.Screen name="stories" options={{ ...header, title: 'Stories' }} />
      <Stack.Screen name="story-create" options={{ ...header, title: 'New Story' }} />
      <Stack.Screen name="story-detail" options={{ ...header, title: 'Story' }} />
      <Stack.Screen name="progress" options={{ ...header, title: 'Progress' }} />
      <Stack.Screen name="courses" options={{ ...header, title: 'Community Courses' }} />
      <Stack.Screen name="course-detail" options={{ ...header, title: 'Course' }} />
      <Stack.Screen name="import-vocabulary" options={{ ...header, title: 'Import Words' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSerif_500Medium,
    NotoSerif_700Bold,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    WorkSans_400Regular,
    WorkSans_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
