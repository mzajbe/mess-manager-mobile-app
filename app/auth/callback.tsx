import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/contexts/ThemeContext';
import { supabase } from '../../src/lib/supabase';

export default function AuthCallbackScreen() {
  const { theme } = useTheme();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the URL that opened this screen
        let url = '';
        if (Platform.OS === 'web') {
          url = window.location.href;
        } else {
          const initialUrl = await Linking.getInitialURL();
          url = initialUrl || '';
        }
        
        if (url) {
          const parsedUrl = new URL(url);
          // Tokens can be in hash fragment or query params
          const hashParams = parsedUrl.hash ? parsedUrl.hash.substring(1) : '';
          const searchParams = parsedUrl.search ? parsedUrl.search.substring(1) : '';
          const params = new URLSearchParams(hashParams || searchParams);
          
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
      } finally {
        // Navigate to root - auth state will determine which screen shows
        router.replace('/');
      }
    };

    handleCallback();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.text, { color: theme.textSecondary }]}>
        Completing sign in...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
});
