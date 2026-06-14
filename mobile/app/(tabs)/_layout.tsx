import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../src/components/custom-tab-bar';

// Tab order places "capture" in the middle so the custom tab bar can render
// it as a raised center action button (the app's primary feature).
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="vocabulary" options={{ title: 'Library' }} />
      <Tabs.Screen name="capture" options={{ title: 'Capture' }} />
      <Tabs.Screen name="practice" options={{ title: 'Practice' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
