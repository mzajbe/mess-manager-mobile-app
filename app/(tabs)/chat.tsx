import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { supabase } from '../../src/lib/supabase';
import { Shadow, Spacing } from '../../src/theme';
import type { Message, User } from '../../src/types';

export default function ChatScreen() {
  const { theme } = useTheme();
  const { user, mess } = useAuth();
  const messId = mess?.id;
  const userId = user?.id;

  const [messages, setMessages] = useState<(Message & { user?: User })[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // ── Fetch messages ──────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!messId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*, user:users(id, email, full_name, avatar_url)')
      .eq('mess_id', messId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.error('Error fetching messages:', error.message);
      return;
    }

    const mapped = (data || []).map((m: any) => ({
      id: m.id,
      messId: m.mess_id,
      userId: m.user_id,
      text: m.text,
      createdAt: m.created_at,
      user: m.user
        ? {
            id: m.user.id,
            email: m.user.email,
            fullName: m.user.full_name,
            avatarUrl: m.user.avatar_url,
            createdAt: '',
          }
        : undefined,
    }));
    setMessages(mapped);
  }, [messId]);

  // ── Load + subscribe ────────────────────────────────────────
  useEffect(() => {
    if (!messId) return;
    fetchMessages();

    const channel = supabase
      .channel(`chat-${messId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `mess_id=eq.${messId}` },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messId, fetchMessages]);

  // ── Auto-scroll on new messages ─────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // ── Send message ────────────────────────────────────────────
  const handleSend = async () => {
    if (!text.trim() || !messId || !userId || sending) return;
    setSending(true);
    const trimmed = text.trim();
    setText('');

    // Optimistic update — show message instantly
    const tempId = 'temp-' + Date.now();
    const optimisticMsg: Message & { user?: User } = {
      id: tempId,
      messId,
      userId,
      text: trimmed,
      createdAt: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email, fullName: user.fullName, avatarUrl: user.avatarUrl, createdAt: '' } : undefined,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { error } = await supabase.from('messages').insert({
      mess_id: messId,
      user_id: userId,
      text: trimmed,
    });

    if (error) {
      console.error('Error sending message:', error.message);
      setText(trimmed);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
    setSending(false);
  };

  // ── Date helpers ────────────────────────────────────────────
  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = today.getTime() - msgDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // ── Check if we should show a date separator ────────────────
  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    const curr = new Date(messages[index].createdAt).toDateString();
    const prev = new Date(messages[index - 1].createdAt).toDateString();
    return curr !== prev;
  };

  // ── Render message ──────────────────────────────────────────
  const renderMessage = ({ item, index }: { item: Message & { user?: User }; index: number }) => {
    const isMe = item.userId === userId;
    const showDate = shouldShowDate(index);
    // Show sender name if it's a different sender from the previous message
    const showName =
      !isMe &&
      (index === 0 ||
        messages[index - 1].userId !== item.userId ||
        shouldShowDate(index));

    return (
      <>
        {showDate && (
          <View style={styles.dateSeparator}>
            <View style={[styles.dateLine, { backgroundColor: theme.borderLight }]} />
            <Text style={[styles.dateText, { color: theme.textTertiary, backgroundColor: theme.background }]}>
              {getDateLabel(item.createdAt)}
            </Text>
            <View style={[styles.dateLine, { backgroundColor: theme.borderLight }]} />
          </View>
        )}
        <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
          {!isMe && (
            <View style={[styles.msgAvatar, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[styles.msgAvatarText, { color: theme.primary }]}>
                {item.user?.fullName?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          <View style={{ maxWidth: '75%' }}>
            {showName && (
              <Text style={[styles.senderName, { color: theme.primary }]}>
                {item.user?.fullName || 'Unknown'}
              </Text>
            )}
            <View
              style={[
                styles.messageBubble,
                isMe
                  ? [styles.bubbleMe, { backgroundColor: theme.primary }]
                  : [styles.bubbleOther, { backgroundColor: theme.surface, borderColor: theme.border }],
              ]}
            >
              <Text style={[styles.messageText, { color: isMe ? '#fff' : theme.text }]}>
                {item.text}
              </Text>
              <Text style={[styles.messageTime, { color: isMe ? 'rgba(255,255,255,0.65)' : theme.textTertiary }]}>
                {getTime(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={[styles.headerIcon, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons name="chatbubbles" size={20} color={theme.primary} />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {mess?.name || 'Mess'} Chat
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textTertiary }]}>
            {messages.length} messages
          </Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={64} color={theme.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>No messages yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textTertiary }]}>
                Start the conversation!
              </Text>
            </View>
          }
        />

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            style={[
              styles.sendBtn,
              { backgroundColor: text.trim() ? theme.primary : theme.primary + '30' },
            ]}
          >
            <Ionicons name="send" size={18} color={text.trim() ? '#fff' : theme.textTertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 1 },

  // Messages
  messagesList: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6, gap: 8 },
  messageRowMe: { justifyContent: 'flex-end' },

  msgAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  msgAvatarText: { fontSize: 12, fontWeight: '700' },

  senderName: { fontSize: 11, fontWeight: '600', marginBottom: 2, marginLeft: 4 },

  messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, maxWidth: '100%' },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4, borderWidth: 1 },

  messageText: { fontSize: 15, lineHeight: 20 },
  messageTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },

  // Date separator
  dateSeparator: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  dateLine: { flex: 1, height: 1 },
  dateText: { fontSize: 11, fontWeight: '600', paddingHorizontal: Spacing.sm },

  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 120, gap: Spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14 },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
});
