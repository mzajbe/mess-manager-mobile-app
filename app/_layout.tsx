import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { DataProvider } from '../src/contexts/DataContext';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';

function RootLayoutContent() {
  const { theme, isDark } = useTheme();
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!isLoggedIn) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="login" />
          <Stack.Screen name="auth" />
        </Stack>
        {segments[0] !== 'login' && segments[0] !== 'auth' && (
          <Redirect href="/login" />
        )}
      </>
    );
  }

  // Authenticated — show the main app
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="add-bazar"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="expense-detail"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="members"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <RootLayoutContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
