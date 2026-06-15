import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, NotoSerif_500Medium, NotoSerif_700Bold } from '@expo-google-fonts/noto-serif';
import {
  PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { WorkSans_400Regular, WorkSans_500Medium } from '@expo-google-fonts/work-sans';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from '../src/lib/auth-context';
import { ThemeProvider, useTheme } from '../src/theme/theme-context';
import { DrawerProvider } from '../src/lib/drawer-context';
import { NavDrawer } from '../src/components/nav-drawer';
import { NetworkProvider, useNetwork } from '../src/lib/network-context';
import { OfflineScreen } from '../src/components/offline-screen';
import { configureNotificationHandler, syncReminderOnLaunch } from '../src/lib/notifications-service';
import { ONBOARDING_DONE_KEY } from './onboarding';

SplashScreen.preventAutoHideAsync();
// Configure how reminders display while the app is foregrounded (module scope so
// it runs once before any notification can fire).
configureNotificationHandler();

function RootNavigator() {
  const { loading } = useAuth();
  const { colors } = useTheme();
  const { isOnline } = useNetwork();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Read the onboarding flag once; defer the actual navigation until the
  // navigator below is mounted (see the next effect).
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DONE_KEY).then((val) => {
      setNeedsOnboarding(!val);
      setOnboardingChecked(true);
    });
  }, []);

  // Re-apply any saved daily reminder once on launch (survives reboots/reinstalls).
  useEffect(() => { syncReminderOnLaunch(); }, []);

  const ready = !loading && onboardingChecked;

  // Redirect to onboarding only after everything is ready, so the <Stack>
  // (which declares the route) is already mounted. Navigating while the tree
  // is still swapping caused the loading screen to flash/remount.
  useEffect(() => {
    if (ready && needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [ready, needsOnboarding]);

  return (
    <DrawerProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="analysis-result" options={{ headerShown: false }} />
          <Stack.Screen name="practice-flashcards" options={{ headerShown: false }} />
          <Stack.Screen name="practice-quiz" options={{ headerShown: false }} />
          <Stack.Screen name="practice-games" options={{ headerShown: false }} />
          <Stack.Screen name="practice-handwriting" options={{ headerShown: false }} />
          <Stack.Screen name="lists" options={{ headerShown: false }} />
          <Stack.Screen name="list-detail" options={{ headerShown: false }} />
          <Stack.Screen name="history" options={{ headerShown: false }} />
          <Stack.Screen name="stories" options={{ headerShown: false }} />
          <Stack.Screen name="story-create" options={{ headerShown: false }} />
          <Stack.Screen name="story-detail" options={{ headerShown: false }} />
          <Stack.Screen name="progress" options={{ headerShown: false }} />
          <Stack.Screen name="courses" options={{ headerShown: false }} />
          <Stack.Screen name="course-detail" options={{ headerShown: false }} />
          <Stack.Screen name="import-vocabulary" options={{ headerShown: false }} />
          <Stack.Screen name="notification-settings" options={{ headerShown: false }} />
        </Stack>
        {/* NavDrawer must render after Stack so it sits on top in z-order */}
        <NavDrawer />

        {/* Overlays render on top of the mounted Stack instead of replacing it,
            which avoids unmounting/remounting the navigator (the flash). */}
        {!ready && (
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        {ready && !isOnline && (
          <View style={StyleSheet.absoluteFill}>
            <OfflineScreen />
          </View>
        )}
        {/* Toast must sit above everything else in z-order */}
        <Toast />
      </View>
    </DrawerProvider>
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
        <NetworkProvider>
          <RootNavigator />
        </NetworkProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
