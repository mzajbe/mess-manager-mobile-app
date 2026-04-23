import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Mess, MessMember, User } from '../types';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  mess: Mess | null;
  membership: MessMember | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  hasMess: boolean;
  isManager: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  createMess: (name: string, address?: string) => Promise<void>;
  joinMess: (inviteCode: string) => Promise<void>;
  refreshMess: () => Promise<void>;
  transferManager: (newManagerUserId: string, newManagerName: string) => Promise<void>;
  removeMember: (targetUserId: string, memberName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mess, setMess] = useState<Mess | null>(null);
  const [membership, setMembership] = useState<MessMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from our users table (auto-creates if missing)
  const fetchUserProfile = useCallback(async (authUserId: string, authEmail?: string, authName?: string, authAvatar?: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (error) {
      console.log('fetchUserProfile error:', error.message, error.code);
    }

    if (data) {
      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        phone: data.phone,
        avatarUrl: data.avatar_url,
        roomNumber: data.room_number,
        createdAt: data.created_at,
      };
    }

    // Profile doesn't exist — create it from auth data
    if (authEmail) {
      console.log('Creating missing user profile for:', authEmail);
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .upsert({
          id: authUserId,
          email: authEmail,
          full_name: authName || 'User',
          avatar_url: authAvatar || null,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user profile:', createError.message);
        return null;
      }

      if (newProfile) {
        return {
          id: newProfile.id,
          email: newProfile.email,
          fullName: newProfile.full_name,
          phone: newProfile.phone,
          avatarUrl: newProfile.avatar_url,
          roomNumber: newProfile.room_number,
          createdAt: newProfile.created_at,
        };
      }
    }

    return null;
  }, []);

  // Fetch the user's mess and membership
  const fetchMessData = useCallback(async (userId: string) => {
    // Get membership
    const { data: memberData, error: memberError } = await supabase
      .from('mess_members')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (memberError || !memberData) {
      setMess(null);
      setMembership(null);
      return;
    }

    const currentMembership: MessMember = {
      id: memberData.id,
      messId: memberData.mess_id,
      userId: memberData.user_id,
      role: memberData.role,
      joinedAt: memberData.joined_at,
    };
    setMembership(currentMembership);

    // Get mess details
    const { data: messData, error: messError } = await supabase
      .from('mess')
      .select('*')
      .eq('id', memberData.mess_id)
      .single();

    if (messError || !messData) {
      setMess(null);
      return;
    }

    setMess({
      id: messData.id,
      name: messData.name,
      address: messData.address,
      inviteCode: messData.invite_code,
      createdBy: messData.created_by,
      mealSchedule: messData.meal_schedule || { breakfast: true, lunch: true, dinner: true },
      cutoffTime: messData.cutoff_time || '22:00',
      createdAt: messData.created_at,
    });
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Session found' : 'No session');
      if (session?.user) {
        const meta = session.user.user_metadata;
        const profile = await fetchUserProfile(
          session.user.id,
          session.user.email,
          meta?.full_name || meta?.name,
          meta?.avatar_url
        );
        console.log('Profile loaded:', profile ? profile.fullName : 'null');
        setUser(profile);
        if (profile) {
          await fetchMessData(profile.id);
        }
      }
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          const meta = session.user.user_metadata;
          const profile = await fetchUserProfile(
            session.user.id,
            session.user.email,
            meta?.full_name || meta?.name,
            meta?.avatar_url
          );
          console.log('Profile after sign in:', profile ? profile.fullName : 'null');
          setUser(profile);
          if (profile) {
            await fetchMessData(profile.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setMess(null);
          setMembership(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, fetchMessData]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('Sign In Failed', error.message);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) {
        Alert.alert('Sign Up Failed', error.message);
        return;
      }
      Alert.alert('Success', 'Account created! Please check your email to verify your account.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: 'messmanager',
        path: 'auth/callback',
      });

      console.log('Redirect URI:', redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      // On Web, Supabase automatically handles the redirection and URL parsing natively.
      if (Platform.OS === 'web') {
        if (error) Alert.alert('Error', error.message);
        return;
      }

      if (error || !data.url) {
        Alert.alert('Error', error?.message || 'Failed to start Google sign in');
        return;
      }

      // Open browser for Google OAuth (Mobile Only)
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        // Extract tokens from the redirect URL
        const url = new URL(result.url);
        // Tokens can be in hash fragment or query params
        const params = new URLSearchParams(
          url.hash ? url.hash.substring(1) : url.search.substring(1)
        );
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            Alert.alert('Error', sessionError.message);
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Google sign in failed');
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    }
    setUser(null);
    setMess(null);
    setMembership(null);
  }, []);

  const createMess = useCallback(async (name: string, address?: string) => {
    if (!user) return;

    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create the mess (don't use .select() — RLS SELECT requires membership which doesn't exist yet)
      const { error: messError } = await supabase
        .from('mess')
        .insert({
          name,
          address,
          invite_code: inviteCode,
          created_by: user.id,
        });

      if (messError) {
        Alert.alert('Error', messError.message);
        return;
      }

      // Find the mess we just created by invite code
      const { data: createdMess, error: findError } = await supabase
        .from('mess')
        .select('id')
        .eq('invite_code', inviteCode)
        .eq('created_by', user.id)
        .single();

      if (findError || !createdMess) {
        Alert.alert('Error', 'Mess created but could not find it. Try joining with code: ' + inviteCode);
        return;
      }

      // Add creator as manager
      const { error: memberError } = await supabase
        .from('mess_members')
        .insert({
          mess_id: createdMess.id,
          user_id: user.id,
          role: 'manager',
        });

      if (memberError) {
        Alert.alert('Error', memberError.message);
        return;
      }

      // Add activity
      await supabase.from('activities').insert({
        mess_id: createdMess.id,
        user_id: user.id,
        type: 'announcement',
        title: 'Mess Created',
        description: `${user.fullName} created the mess "${name}"`,
      });

      // Refresh state from server (user is now a member, so SELECT policies work)
      await fetchMessData(user.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred');
    }
  }, [user, fetchMessData]);

  const joinMess = useCallback(async (inviteCode: string) => {
    if (!user) return;

    try {
      // Find mess by invite code
      const { data: messData, error: messError } = await supabase
        .from('mess')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (messError || !messData) {
        Alert.alert('Error', 'Invalid invite code. Please check and try again.');
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('mess_members')
        .select('id')
        .eq('mess_id', messData.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        Alert.alert('Info', 'You are already a member of this mess.');
        await fetchMessData(user.id);
        return;
      }

      // Join as member
      const { error: joinError } = await supabase
        .from('mess_members')
        .insert({
          mess_id: messData.id,
          user_id: user.id,
          role: 'member',
        });

      if (joinError) {
        Alert.alert('Error', joinError.message);
        return;
      }

      // Add activity
      await supabase.from('activities').insert({
        mess_id: messData.id,
        user_id: user.id,
        type: 'member_joined',
        title: 'New Member',
        description: `${user.fullName} joined the mess`,
      });

      await fetchMessData(user.id);
      Alert.alert('Success', `You have joined "${messData.name}"!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred');
    }
  }, [user, fetchMessData]);

  const refreshMess = useCallback(async () => {
    if (user) {
      await fetchMessData(user.id);
    }
  }, [user, fetchMessData]);

  const transferManager = useCallback(async (newManagerUserId: string, newManagerName: string) => {
    if (!user || !mess) return;

    try {
      // Demote current manager to member
      const { error: demoteError } = await supabase
        .from('mess_members')
        .update({ role: 'member' })
        .eq('mess_id', mess.id)
        .eq('user_id', user.id);

      if (demoteError) {
        Alert.alert('Error', demoteError.message);
        return;
      }

      // Promote target to manager
      const { error: promoteError } = await supabase
        .from('mess_members')
        .update({ role: 'manager' })
        .eq('mess_id', mess.id)
        .eq('user_id', newManagerUserId);

      if (promoteError) {
        // Rollback: re-promote self
        await supabase
          .from('mess_members')
          .update({ role: 'manager' })
          .eq('mess_id', mess.id)
          .eq('user_id', user.id);
        Alert.alert('Error', promoteError.message);
        return;
      }

      // Log activity
      await supabase.from('activities').insert({
        mess_id: mess.id,
        user_id: user.id,
        type: 'announcement',
        title: 'Manager Changed',
        description: `${user.fullName} transferred manager role to ${newManagerName}`,
      });

      // Refresh local state
      await fetchMessData(user.id);
      Alert.alert('Success', `${newManagerName} is now the manager!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to transfer manager role');
    }
  }, [user, mess, fetchMessData]);

  const removeMember = useCallback(async (targetUserId: string, memberName: string) => {
    if (!user || !mess) return;

    try {
      const { error } = await supabase
        .from('mess_members')
        .delete()
        .eq('mess_id', mess.id)
        .eq('user_id', targetUserId);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Log activity
      await supabase.from('activities').insert({
        mess_id: mess.id,
        user_id: user.id,
        type: 'announcement',
        title: 'Member Removed',
        description: `${memberName} was removed from the mess`,
      });

      Alert.alert('Done', `${memberName} has been removed.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to remove member');
    }
  }, [user, mess]);

  return (
    <AuthContext.Provider
      value={{
        user,
        mess,
        membership,
        isLoading,
        isLoggedIn: !!user,
        hasMess: !!mess,
        isManager: membership?.role === 'manager',
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        createMess,
        joinMess,
        refreshMess,
        transferManager,
        removeMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
