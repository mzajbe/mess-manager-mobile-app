import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActionSheetIOS,
    Alert,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { useData } from '../src/contexts/DataContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { BorderRadius, Shadow, Spacing } from '../src/theme';

export default function MembersScreen() {
  const { theme } = useTheme();
  const { isManager, mess, user, transferManager, removeMember } = useAuth();
  const { members, refreshMembers } = useData();
  const router = useRouter();

  const handleShareInvite = async () => {
    if (mess?.inviteCode) {
      await Share.share({
        message: `Join our mess "${mess.name}" on MessManager! Use invite code: ${mess.inviteCode}`,
      });
    }
  };

  const showMemberActions = (memberId: string, memberUserId: string, memberName: string) => {
    const options = ['Make Manager', 'Remove Member', 'Cancel'];
    const destructiveIndex = 1;
    const cancelIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: destructiveIndex,
          cancelButtonIndex: cancelIndex,
          title: memberName,
          message: 'Choose an action',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) handleMakeManager(memberUserId, memberName);
          if (buttonIndex === 1) handleRemoveMember(memberUserId, memberName);
        },
      );
    } else {
      // Android: use Alert with buttons
      Alert.alert(
        memberName,
        'Choose an action',
        [
          {
            text: '👑 Make Manager',
            onPress: () => handleMakeManager(memberUserId, memberName),
          },
          {
            text: '🗑️ Remove Member',
            style: 'destructive',
            onPress: () => handleRemoveMember(memberUserId, memberName),
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    }
  };

  const handleMakeManager = (memberUserId: string, memberName: string) => {
    Alert.alert(
      'Transfer Manager Role',
      `Are you sure you want to make ${memberName} the manager?\n\nYou will become a regular member.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Transfer',
          onPress: async () => {
            await transferManager(memberUserId, memberName);
            await refreshMembers();
          },
        },
      ],
    );
  };

  const handleRemoveMember = (memberUserId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the mess?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeMember(memberUserId, memberName);
            await refreshMembers();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Members</Text>
        <TouchableOpacity onPress={handleShareInvite} style={styles.backBtn}>
          <Ionicons name="person-add" size={22} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Invite Card */}
        <TouchableOpacity
          onPress={handleShareInvite}
          style={[styles.inviteCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}
        >
          <Ionicons name="link" size={20} color={theme.primary} />
          <View style={styles.inviteContent}>
            <Text style={[styles.inviteTitle, { color: theme.primary }]}>Invite Members</Text>
            <Text style={[styles.inviteSubtitle, { color: theme.textSecondary }]}>
              Share code: <Text style={{ fontWeight: '800' }}>{mess?.inviteCode}</Text>
            </Text>
          </View>
          <Ionicons name="share-outline" size={20} color={theme.primary} />
        </TouchableOpacity>

        {/* Members List */}
        <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
          {members.length} MEMBERS
        </Text>

        {members.map((member) => (
          <View
            key={member.id}
            style={[styles.memberCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={[styles.memberAvatar, { backgroundColor: member.role === 'manager' ? theme.secondary : theme.primary }]}>
              <Text style={styles.memberAvatarText}>{member.user.fullName.charAt(0)}</Text>
            </View>
            <View style={styles.memberInfo}>
              <View style={styles.memberNameRow}>
                <Text style={[styles.memberName, { color: theme.text }]}>{member.user.fullName}</Text>
                {member.role === 'manager' && (
                  <View style={[styles.managerBadge, { backgroundColor: theme.secondary + '15' }]}>
                    <Text style={[styles.managerText, { color: theme.secondary }]}>👑 Manager</Text>
                  </View>
                )}
                {member.userId === user?.id && member.role !== 'manager' && (
                  <View style={[styles.managerBadge, { backgroundColor: theme.primary + '15' }]}>
                    <Text style={[styles.managerText, { color: theme.primary }]}>You</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.memberDetails, { color: theme.textTertiary }]}>
                {member.user.email}
              </Text>
              <Text style={[styles.memberJoined, { color: theme.textTertiary }]}>
                Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            {isManager && member.role !== 'manager' && (
              <TouchableOpacity
                onPress={() => showMemberActions(member.id, member.userId, member.user.fullName)}
                style={styles.removeBtn}
              >
                <Ionicons name="ellipsis-vertical" size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingHorizontal: Spacing.lg },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: Spacing.xl,
  },
  inviteContent: { flex: 1 },
  inviteTitle: { fontSize: 14, fontWeight: '600' },
  inviteSubtitle: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: Spacing.md },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  memberName: { fontSize: 15, fontWeight: '600' },
  managerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  managerText: { fontSize: 10, fontWeight: '600' },
  memberDetails: { fontSize: 12, marginTop: 2 },
  memberJoined: { fontSize: 11, marginTop: 1 },
  removeBtn: { padding: 8 },
});
