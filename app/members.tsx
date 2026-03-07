import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActionSheetIOS,
    Alert,
    Modal,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { useData } from '../src/contexts/DataContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { supabase } from '../src/lib/supabase';
import { BorderRadius, Shadow, Spacing } from '../src/theme';

export default function MembersScreen() {
  const { theme } = useTheme();
  const { isManager, mess, user, transferManager, removeMember } = useAuth();
  const { members, refreshMembers } = useData();
  const router = useRouter();

  // Rename modal state
  const [renameModal, setRenameModal] = useState<{ visible: boolean; userId: string; name: string }>({ visible: false, userId: '', name: '' });
  const [newName, setNewName] = useState('');

  const handleShareInvite = async () => {
    if (mess?.inviteCode) {
      await Share.share({
        message: `Join our mess "${mess.name}" on MessManager! Use invite code: ${mess.inviteCode}`,
      });
    }
  };

  const showMemberActions = (memberId: string, memberUserId: string, memberName: string) => {
    const options = ['Rename', 'Make Manager', 'Remove Member', 'Cancel'];
    const destructiveIndex = 2;
    const cancelIndex = 3;

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
          if (buttonIndex === 0) handleRenameMember(memberUserId, memberName);
          if (buttonIndex === 1) handleMakeManager(memberUserId, memberName);
          if (buttonIndex === 2) handleRemoveMember(memberUserId, memberName);
        },
      );
    } else {
      // Android: use Alert with buttons
      Alert.alert(
        memberName,
        'Choose an action',
        [
          {
            text: '✏️ Rename',
            onPress: () => handleRenameMember(memberUserId, memberName),
          },
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

  const handleRenameMember = (memberUserId: string, currentName: string) => {
    setNewName(currentName);
    setRenameModal({ visible: true, userId: memberUserId, name: currentName });
  };

  const submitRename = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase
      .from('users')
      .update({ full_name: newName.trim() })
      .eq('id', renameModal.userId);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setRenameModal({ visible: false, userId: '', name: '' });
    await refreshMembers();
    Alert.alert('Done', `Name updated to "${newName.trim()}"`);
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

      {/* Rename Modal */}
      <Modal visible={renameModal.visible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.xl, paddingBottom: Spacing['4xl'] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Rename Member</Text>
              <TouchableOpacity onPress={() => setRenameModal({ visible: false, userId: '', name: '' })}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: Spacing.sm, color: theme.textSecondary }}>NEW NAME</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderRadius: BorderRadius.md,
                padding: Spacing.md,
                fontSize: 16,
                fontWeight: '600',
                marginBottom: Spacing.xl,
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
              }}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              selectTextOnFocus
            />

            <TouchableOpacity
              onPress={submitRename}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 14,
                borderRadius: BorderRadius.lg,
                backgroundColor: theme.primary,
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Save Name</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
