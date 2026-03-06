import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { BorderRadius, Spacing } from '../src/theme';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'messmanager',
  path: 'auth/callback',
});

export default function LoginScreen() {
  const { theme, isDark } = useTheme();
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) return;
    if (isSignUp && !fullName.trim()) return;

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password, fullName.trim());
      } else {
        await signIn(email.trim(), password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Branding ──────────────────────── */}
          <View style={styles.brandingSection}>
            <View style={[styles.logoContainer, { backgroundColor: theme.primary }]}>
              <Ionicons name="restaurant" size={40} color="#fff" />
            </View>
            <Text style={[styles.appName, { color: theme.text }]}>Mess Manager</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>
              Track meals, split costs, stay organized
            </Text>
          </View>

          {/* ── Google Sign In ─────────────────── */}
          <TouchableOpacity
            style={[styles.googleButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
            activeOpacity={0.7}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color={theme.text} />
            ) : (
              <>
                <View style={styles.googleIconWrap}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={[styles.googleButtonText, { color: theme.text }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* ── Divider ────────────────────────── */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textTertiary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          {/* ── Email Form ─────────────────────── */}
          {isSignUp && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Full Name</Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <Ionicons name="person-outline" size={18} color={theme.textTertiary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.textTertiary}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Ionicons name="mail-outline" size={18} color={theme.textTertiary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Password</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.textTertiary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your password"
                placeholderTextColor={theme.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Submit Button ──────────────────── */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleEmailAuth}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* ── Toggle Sign Up / Sign In ──────── */}
          <Pressable onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleRow}>
            <Text style={[styles.toggleText, { color: theme.textSecondary }]}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <Text style={[styles.toggleLink, { color: theme.primary }]}>
              {isSignUp ? ' Sign In' : ' Sign Up'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },

  // Branding
  brandingSection: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  appName: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { fontSize: 14, fontWeight: '500', marginTop: Spacing.xs, textAlign: 'center' },

  // Google
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  googleIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: { color: '#fff', fontSize: 14, fontWeight: '800' },
  googleButtonText: { fontSize: 15, fontWeight: '600' },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 13, fontWeight: '500' },

  // Inputs
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: Spacing.xs, marginLeft: 2 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    gap: Spacing.sm,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },

  // Submit
  submitButton: {
    paddingVertical: 15,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  toggleText: { fontSize: 14, fontWeight: '500' },
  toggleLink: { fontSize: 14, fontWeight: '700' },
});
