import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useData } from '../../src/contexts/DataContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { BorderRadius, Shadow, Spacing } from '../../src/theme';

interface SettingsItem {
  id: string;
  icon: string;
  label: string;
  subtitle?: string;
  color: string;
  action: () => void;
  showChevron?: boolean;
  danger?: boolean;
}

export default function MoreScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, mess, isManager, signOut } = useAuth();
  const { members } = useData();
  const router = useRouter();

  const handleShareInvite = async () => {
    if (mess?.inviteCode) {
      await Share.share({
        message: `Join our mess "${mess.name}" on MessManager! Use invite code: ${mess.inviteCode}`,
      });
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const settingsSections: { title: string; items: SettingsItem[] }[] = [
    {
      title: 'Mess',
      items: [
        {
          id: 'members',
          icon: 'people',
          label: 'Members',
          subtitle: `${members.length} members`,
          color: theme.primary,
          action: () => router.push('/members'),
          showChevron: true,
        },
        {
          id: 'invite',
          icon: 'share-social',
          label: 'Share Invite Code',
          subtitle: mess?.inviteCode,
          color: theme.info,
          action: handleShareInvite,
          showChevron: true,
        },
        ...(isManager
          ? [
              {
                id: 'mess-settings',
                icon: 'settings',
                label: 'Mess Settings',
                subtitle: 'Name, meal schedule, cutoff time',
                color: theme.secondary,
                action: () => {},
                showChevron: true,
              },
            ]
          : []),
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'dark-mode',
          icon: isDark ? 'moon' : 'sunny',
          label: isDark ? 'Dark Mode' : 'Light Mode',
          subtitle: 'Toggle appearance',
          color: isDark ? '#8B5CF6' : '#F59E0B',
          action: toggleTheme,
        },
        {
          id: 'notifications',
          icon: 'notifications',
          label: 'Notifications',
          subtitle: 'Manage alerts',
          color: theme.danger,
          action: () => {},
          showChevron: true,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          icon: 'person-circle',
          label: 'Edit Profile',
          subtitle: user?.email,
          color: theme.primary,
          action: () => {},
          showChevron: true,
        },
        {
          id: 'signout',
          icon: 'log-out',
          label: 'Sign Out',
          color: theme.danger,
          action: handleSignOut,
          danger: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.profileAvatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.profileAvatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>{user?.fullName}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: isManager ? theme.primary + '15' : theme.secondary + '15' }]}>
              <Text style={[styles.roleText, { color: isManager ? theme.primary : theme.secondary }]}>
                {isManager ? '👑 Manager' : '👤 Member'}
              </Text>
            </View>
          </View>
        </View>

        {/* Mess Info */}
        <View style={[styles.messInfoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.messInfoRow}>
            <Ionicons name="home" size={20} color={theme.primary} />
            <View style={styles.messInfoContent}>
              <Text style={[styles.messInfoName, { color: theme.text }]}>{mess?.name}</Text>
              <Text style={[styles.messInfoAddress, { color: theme.textSecondary }]}>{mess?.address}</Text>
            </View>
            <View style={[styles.inviteCodeBadge, { backgroundColor: theme.primaryLight + '20' }]}>
              <Text style={[styles.inviteCodeText, { color: theme.primary }]}>{mess?.inviteCode}</Text>
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
              {section.title.toUpperCase()}
            </Text>
            <View style={[styles.settingsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={item.action}
                  activeOpacity={0.6}
                  style={[
                    styles.settingsItem,
                    index < section.items.length - 1 && { borderBottomColor: theme.borderLight, borderBottomWidth: 1 },
                  ]}
                >
                  <View style={[styles.settingsIcon, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <View style={styles.settingsContent}>
                    <Text style={[styles.settingsLabel, { color: item.danger ? theme.danger : theme.text }]}>
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={[styles.settingsSubtitle, { color: theme.textTertiary }]}>
                        {item.subtitle}
                      </Text>
                    )}
                  </View>
                  {item.showChevron && (
                    <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: theme.textTertiary }]}>MessManager</Text>
          <Text style={[styles.appVersion, { color: theme.textTertiary }]}>Version 1.0.0</Text>
        </View>

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.xl },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  profileAvatarText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 22, fontWeight: '700' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full, marginTop: 6 },
  roleText: { fontSize: 12, fontWeight: '600' },
  messInfoCard: { borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.sm },
  messInfoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  messInfoContent: { flex: 1 },
  messInfoName: { fontSize: 16, fontWeight: '600' },
  messInfoAddress: { fontSize: 12, marginTop: 2 },
  inviteCodeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm },
  inviteCodeText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  settingsSection: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: Spacing.sm, marginLeft: 4 },
  settingsCard: { borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', ...Shadow.sm },
  settingsItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  settingsIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingsContent: { flex: 1 },
  settingsLabel: { fontSize: 15, fontWeight: '500' },
  settingsSubtitle: { fontSize: 12, marginTop: 1 },
  appInfo: { alignItems: 'center', marginTop: Spacing.xl },
  appName: { fontSize: 14, fontWeight: '600' },
  appVersion: { fontSize: 12, marginTop: 2 },
});
