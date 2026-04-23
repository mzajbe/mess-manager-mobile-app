import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// SecureStore has a ~2048 byte limit per value.
// Supabase session tokens exceed this, so we chunk large values.
const CHUNK_SIZE = 1800;

const LargeSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }

    // Try reading as a single value first (for small values)
    const value = await SecureStore.getItemAsync(key);
    if (value) {
      // Check if it's a chunked indicator
      if (value.startsWith('__chunked__:')) {
        const chunkCount = parseInt(value.split(':')[1], 10);
        const chunks: string[] = [];
        for (let i = 0; i < chunkCount; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
          if (chunk === null) return null; // Data corrupted
          chunks.push(chunk);
        }
        return chunks.join('');
      }
      return value;
    }
    return null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }

    // First, clean up any existing chunks
    await LargeSecureStoreAdapter._removeChunks(key);

    if (value.length <= CHUNK_SIZE) {
      // Small enough to store directly
      await SecureStore.setItemAsync(key, value);
    } else {
      // Split into chunks
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE));
      }
      // Store indicator
      await SecureStore.setItemAsync(key, `__chunked__:${chunks.length}`);
      // Store chunks
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
      }
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }

    await LargeSecureStoreAdapter._removeChunks(key);
    await SecureStore.deleteItemAsync(key);
  },

  _removeChunks: async (key: string): Promise<void> => {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value && value.startsWith('__chunked__:')) {
        const chunkCount = parseInt(value.split(':')[1], 10);
        for (let i = 0; i < chunkCount; i++) {
          await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials not found. Please create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: LargeSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
