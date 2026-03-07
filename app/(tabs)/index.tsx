import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { useData } from '../../src/contexts/DataContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { BorderRadius, Colors, Shadow, Spacing } from '../../src/theme';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ── My Meal Toggle Card ──────────────────────────────────────────────
function MealToggleCard({
  label,
  icon,
  isOn,
  guestCount,
  onToggle,
  theme,
}: {
  label: string;
  icon: string;
  isOn: boolean;
  guestCount: number;
  onToggle: () => void;
  theme: typeof Colors.light;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.mealCard,
        {
          backgroundColor: isOn ? theme.primary + '12' : theme.surfaceElevated,
          borderColor: isOn ? theme.primary + '40' : theme.border,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View style={[styles.mealIconContainer, { backgroundColor: isOn ? theme.primary : theme.textTertiary + '30' }]}>
        <Text style={styles.mealEmoji}>{icon}</Text>
      </View>
      <Text style={[styles.mealLabel, { color: theme.text }]}>{label}</Text>
      <View style={[styles.mealStatusBadge, { backgroundColor: isOn ? theme.success + '20' : theme.danger + '20' }]}>
        <View style={[styles.mealStatusDot, { backgroundColor: isOn ? theme.success : theme.danger }]} />
        <Text style={[styles.mealStatusText, { color: isOn ? theme.success : theme.danger }]}>
          {isOn ? 'ON' : 'OFF'}
        </Text>
      </View>
      {guestCount > 0 && (
        <View style={[styles.guestBadge, { backgroundColor: theme.secondary }]}>
          <Text style={styles.guestBadgeText}>+{guestCount} guest</Text>
        </View>
      )}
    </Pressable>
  );
}

// ── Deposit Modal ────────────────────────────────────────────────────
function DepositModal({
  visible,
  onClose,
  theme,
  members,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  theme: typeof Colors.light;
  members: any[];
  onSubmit: (userId: string, amount: number) => void;
}) {
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    if (!selectedMember || !amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please select a member and enter amount');
      return;
    }
    onSubmit(selectedMember, parseFloat(amount));
    setSelectedMember('');
    setAmount('');
    onClose();
    Alert.alert('✅ Success', `Deposit of ৳${parseFloat(amount).toLocaleString()} recorded`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Deposit</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>SELECT MEMBER</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
            {members.map((member) => (
              <TouchableOpacity
                key={member.userId}
                onPress={() => setSelectedMember(member.userId)}
                style={[
                  styles.memberChip,
                  {
                    backgroundColor: selectedMember === member.userId ? theme.primary + '15' : theme.surfaceElevated,
                    borderColor: selectedMember === member.userId ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={[styles.memberChipAvatar, { backgroundColor: selectedMember === member.userId ? theme.primary : theme.textTertiary }]}>
                  <Text style={styles.memberChipAvatarText}>{member.user.fullName.charAt(0)}</Text>
                </View>
                <Text style={[styles.memberChipName, { color: selectedMember === member.userId ? theme.primary : theme.text }]}>
                  {member.user.fullName.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>AMOUNT (৳)</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
            placeholder="Enter amount"
            placeholderTextColor={theme.textTertiary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.modalSubmitText}>Record Deposit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Home Screen ─────────────────────────────────────────────────
export default function HomeScreen() {
  const { theme } = useTheme();
  const { user, mess, isManager, hasMess, createMess, joinMess } = useAuth();
  const {
    myTodayMeal, todayMealCount, toggleMeal,
    toggleMemberMeal, getMemberMeal,
    addExtraMeals, getExtraMeals,
    expenses, monthlyStats, activities,
    members, payments, addPayment,
  } = useData();
  const router = useRouter();

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [extraMealModal, setExtraMealModal] = useState<{ visible: boolean; userId: string; userName: string }>({ visible: false, userId: '', userName: '' });
  const [extraMealCount, setExtraMealCount] = useState('');

  // Create / Join Mess state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [messName, setMessName] = useState('');
  const [messAddress, setMessAddress] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // My personal stats
  const myTotalMeals = monthlyStats.myMeals;
  const myDeposited = monthlyStats.myDeposited;
  const myCost = monthlyStats.myEstimatedBill;
  const myBalance = myDeposited - myCost;

  const handleCreateMess = async () => {
    if (!messName.trim()) {
      Alert.alert('Error', 'Please enter a mess name');
      return;
    }
    setIsCreating(true);
    try {
      await createMess(messName.trim(), messAddress.trim() || undefined);
      setShowCreateModal(false);
      setMessName('');
      setMessAddress('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMess = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }
    setIsCreating(true);
    try {
      await joinMess(inviteCode.trim());
      setShowJoinModal(false);
      setInviteCode('');
    } finally {
      setIsCreating(false);
    }
  };

  // ── No Mess State ──────────────────────────────────────
  if (!hasMess) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={[styles.scrollContent, { justifyContent: 'center', flex: 1 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                {getGreeting()} 👋
              </Text>
              <Text style={[styles.userName, { color: theme.text }]}>
                {user?.fullName || 'User'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.avatarContainer, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/more')}
            >
              <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
            </TouchableOpacity>
          </View>

          {/* Welcome Card */}
          <LinearGradient
            colors={theme.gradient.hero as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.messCard, { alignItems: 'center', paddingVertical: Spacing['3xl'] }]}
          >
            <Text style={{ fontSize: 48 }}>🏠</Text>
            <Text style={[styles.messName, { textAlign: 'center', marginTop: Spacing.md }]}>
              Welcome to MessManager
            </Text>
            <Text style={[styles.messDate, { textAlign: 'center', marginTop: Spacing.xs }]}>
              Create a mess or join one to get started
            </Text>
          </LinearGradient>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.7}
              onPress={() => setShowCreateModal(true)}
            >
              <LinearGradient colors={['#22C55E20', '#22C55E08']} style={styles.actionGradient}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#22C55E20' }]}>
                  <Ionicons name="add-circle" size={22} color="#22C55E" />
                </View>
                <Text style={[styles.actionLabel, { color: theme.text }]}>Create Mess</Text>
                <Text style={[styles.actionSub, { color: theme.textTertiary }]}>Start as manager</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.7}
              onPress={() => setShowJoinModal(true)}
            >
              <LinearGradient colors={['#3B82F620', '#3B82F608']} style={styles.actionGradient}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#3B82F620' }]}>
                  <Ionicons name="enter" size={22} color="#3B82F6" />
                </View>
                <Text style={[styles.actionLabel, { color: theme.text }]}>Join Mess</Text>
                <Text style={[styles.actionSub, { color: theme.textTertiary }]}>With invite code</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Create Mess Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Create a Mess</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>MESS NAME</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                placeholder="e.g. Hall-3 Mess"
                placeholderTextColor={theme.textTertiary}
                value={messName}
                onChangeText={setMessName}
                autoFocus
              />

              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>ADDRESS (OPTIONAL)</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                placeholder="e.g. Room 205, Hall-3"
                placeholderTextColor={theme.textTertiary}
                value={messAddress}
                onChangeText={setMessAddress}
              />

              <TouchableOpacity
                onPress={handleCreateMess}
                disabled={isCreating}
                style={[styles.modalSubmitBtn, { backgroundColor: theme.primary, opacity: isCreating ? 0.6 : 1 }]}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.modalSubmitText}>{isCreating ? 'Creating...' : 'Create Mess'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Join Mess Modal */}
        <Modal visible={showJoinModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Join a Mess</Text>
                <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>INVITE CODE</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text, textAlign: 'center', letterSpacing: 4, fontSize: 22 }]}
                placeholder="ABC123"
                placeholderTextColor={theme.textTertiary}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                autoFocus
                maxLength={6}
              />

              <TouchableOpacity
                onPress={handleJoinMess}
                disabled={isCreating}
                style={[styles.modalSubmitBtn, { backgroundColor: '#3B82F6', opacity: isCreating ? 0.6 : 1 }]}
              >
                <Ionicons name="enter" size={20} color="#fff" />
                <Text style={styles.modalSubmitText}>{isCreating ? 'Joining...' : 'Join Mess'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header ────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {getGreeting()} 👋
            </Text>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.fullName || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.avatarContainer, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/more')}
          >
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Mess Card with My Stats ────────── */}
        <LinearGradient
          colors={theme.gradient.hero as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.messCard}
        >
          <View style={styles.messCardTop}>
            <View>
              <Text style={styles.messName}>{mess?.name || 'Your Mess'}</Text>
              <Text style={styles.messDate}>{getFormattedDate()}</Text>
            </View>
          </View>
          <View style={styles.myStatsGrid}>
            <View style={styles.myStatItem}>
              <Text style={styles.myStatValue}>{myTotalMeals}</Text>
              <Text style={styles.myStatLabel}>My Meals</Text>
            </View>
            <View style={styles.myStatDivider} />
            <View style={styles.myStatItem}>
              <Text style={styles.myStatValue}>৳{myDeposited.toLocaleString()}</Text>
              <Text style={styles.myStatLabel}>Deposited</Text>
            </View>
            <View style={styles.myStatDivider} />
            <View style={styles.myStatItem}>
              <Text style={styles.myStatValue}>৳{myCost.toLocaleString()}</Text>
              <Text style={styles.myStatLabel}>My Cost</Text>
            </View>
            <View style={styles.myStatDivider} />
            <View style={styles.myStatItem}>
              <Text style={[styles.myStatValue, { color: myBalance >= 0 ? '#A7F3D0' : '#FCA5A5' }]}>
                {myBalance >= 0 ? '+' : ''}৳{myBalance.toLocaleString()}
              </Text>
              <Text style={styles.myStatLabel}>Balance</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── My Meals Toggle ───────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My Meals Today</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Cutoff: {mess?.cutoffTime || '10:00 PM'}
          </Text>
        </View>

        <View style={styles.mealsGrid}>
          <MealToggleCard
            label="Breakfast"
            icon="🌅"
            isOn={myTodayMeal?.breakfast === 'on'}
            guestCount={myTodayMeal?.guestBreakfast || 0}
            onToggle={() => toggleMeal('breakfast')}
            theme={theme}
          />
          <MealToggleCard
            label="Lunch"
            icon="☀️"
            isOn={myTodayMeal?.lunch === 'on'}
            guestCount={myTodayMeal?.guestLunch || 0}
            onToggle={() => toggleMeal('lunch')}
            theme={theme}
          />
          <MealToggleCard
            label="Dinner"
            icon="🌙"
            isOn={myTodayMeal?.dinner === 'on'}
            guestCount={myTodayMeal?.guestDinner || 0}
            onToggle={() => toggleMeal('dinner')}
            theme={theme}
          />
        </View>

        {/* ── Quick Actions (Manager Only) ──── */}
        {isManager && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                activeOpacity={0.7}
                onPress={() => router.push('/add-bazar')}
              >
                <LinearGradient
                  colors={['#22C55E20', '#22C55E08']}
                  style={styles.actionGradient}
                >
                  <View style={[styles.actionIconCircle, { backgroundColor: '#22C55E20' }]}>
                    <Ionicons name="cart" size={22} color="#22C55E" />
                  </View>
                  <Text style={[styles.actionLabel, { color: theme.text }]}>Add Cost</Text>
                  <Text style={[styles.actionSub, { color: theme.textTertiary }]}>Daily expense</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                activeOpacity={0.7}
                onPress={() => setShowDepositModal(true)}
              >
                <LinearGradient
                  colors={['#3B82F620', '#3B82F608']}
                  style={styles.actionGradient}
                >
                  <View style={[styles.actionIconCircle, { backgroundColor: '#3B82F620' }]}>
                    <Ionicons name="wallet" size={22} color="#3B82F6" />
                  </View>
                  <Text style={[styles.actionLabel, { color: theme.text }]}>Add Deposit</Text>
                  <Text style={[styles.actionSub, { color: theme.textTertiary }]}>Member deposit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Member Meals (Manager Only) ──── */}
        {isManager && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Member Meals</Text>
              <View style={styles.mealCountSummary}>
                <View style={[styles.mealCountBadge, { backgroundColor: theme.primary + '15' }]}>
                  <Ionicons name="restaurant" size={12} color={theme.primary} />
                  <Text style={[styles.mealCountText, { color: theme.primary }]}>
                    {todayMealCount.total} total
                  </Text>
                </View>
              </View>
            </View>

            {/* Meal Type Headers */}
            <View style={[styles.memberMealHeader, { borderBottomColor: theme.border }]}>
              <View style={styles.memberMealNameCol}>
                <Text style={[styles.memberMealHeaderText, { color: theme.textTertiary }]}>Member</Text>
              </View>
              <View style={styles.memberMealToggleCol}>
                <Text style={[styles.memberMealHeaderText, { color: theme.textTertiary }]}>🌅</Text>
              </View>
              <View style={styles.memberMealToggleCol}>
                <Text style={[styles.memberMealHeaderText, { color: theme.textTertiary }]}>☀️</Text>
              </View>
              <View style={styles.memberMealToggleCol}>
                <Text style={[styles.memberMealHeaderText, { color: theme.textTertiary }]}>🌙</Text>
              </View>
              <View style={styles.memberMealToggleCol}>
                <Text style={[styles.memberMealHeaderText, { color: theme.textTertiary }]}>Extra</Text>
              </View>
            </View>

            <View style={[styles.memberMealCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {members.map((member, index) => {
                const memberMeal = getMemberMeal(member.userId);
                const extraCount = getExtraMeals(member.userId);
                const mealCount =
                  (memberMeal?.breakfast === 'on' ? 1 : 0) +
                  (memberMeal?.lunch === 'on' ? 1 : 0) +
                  (memberMeal?.dinner === 'on' ? 1 : 0);
                const totalWithExtra = mealCount + extraCount;

                return (
                  <View
                    key={member.id}
                    style={[
                      styles.memberMealRow,
                      index < members.length - 1 && { borderBottomColor: theme.borderLight, borderBottomWidth: 1 },
                    ]}
                  >
                    {/* Member Info */}
                    <View style={styles.memberMealNameCol}>
                      <View style={[styles.memberMealAvatar, { backgroundColor: theme.primary + (index * 15 + 40).toString(16) }]}>
                        <Text style={styles.memberMealAvatarText}>{member.user.fullName.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={[styles.memberMealName, { color: theme.text }]} numberOfLines={1}>
                          {member.user.fullName.split(' ')[0]}
                        </Text>
                        <Text style={[styles.memberMealSub, { color: theme.textTertiary }]}>
                          {totalWithExtra} meal{totalWithExtra !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>

                    {/* Breakfast Toggle */}
                    <View style={styles.memberMealToggleCol}>
                      <Pressable
                        onPress={() => toggleMemberMeal(member.userId, 'breakfast')}
                        style={({ pressed }) => [
                          styles.miniToggle,
                          {
                            backgroundColor: memberMeal?.breakfast === 'on' ? theme.success + '20' : theme.surfaceElevated,
                            borderColor: memberMeal?.breakfast === 'on' ? theme.success + '50' : theme.border,
                            transform: [{ scale: pressed ? 0.9 : 1 }],
                          },
                        ]}
                      >
                        <Ionicons
                          name={memberMeal?.breakfast === 'on' ? 'checkmark' : 'close'}
                          size={14}
                          color={memberMeal?.breakfast === 'on' ? theme.success : theme.textTertiary}
                        />
                      </Pressable>
                    </View>

                    {/* Lunch Toggle */}
                    <View style={styles.memberMealToggleCol}>
                      <Pressable
                        onPress={() => toggleMemberMeal(member.userId, 'lunch')}
                        style={({ pressed }) => [
                          styles.miniToggle,
                          {
                            backgroundColor: memberMeal?.lunch === 'on' ? theme.success + '20' : theme.surfaceElevated,
                            borderColor: memberMeal?.lunch === 'on' ? theme.success + '50' : theme.border,
                            transform: [{ scale: pressed ? 0.9 : 1 }],
                          },
                        ]}
                      >
                        <Ionicons
                          name={memberMeal?.lunch === 'on' ? 'checkmark' : 'close'}
                          size={14}
                          color={memberMeal?.lunch === 'on' ? theme.success : theme.textTertiary}
                        />
                      </Pressable>
                    </View>

                    {/* Dinner Toggle */}
                    <View style={styles.memberMealToggleCol}>
                      <Pressable
                        onPress={() => toggleMemberMeal(member.userId, 'dinner')}
                        style={({ pressed }) => [
                          styles.miniToggle,
                          {
                            backgroundColor: memberMeal?.dinner === 'on' ? theme.success + '20' : theme.surfaceElevated,
                            borderColor: memberMeal?.dinner === 'on' ? theme.success + '50' : theme.border,
                            transform: [{ scale: pressed ? 0.9 : 1 }],
                          },
                        ]}
                      >
                        <Ionicons
                          name={memberMeal?.dinner === 'on' ? 'checkmark' : 'close'}
                          size={14}
                          color={memberMeal?.dinner === 'on' ? theme.success : theme.textTertiary}
                        />
                      </Pressable>
                    </View>

                    {/* Extra Meals Button */}
                    <View style={styles.memberMealToggleCol}>
                      <Pressable
                        onPress={() => {
                          setExtraMealModal({ visible: true, userId: member.userId, userName: member.user.fullName });
                          setExtraMealCount('');
                        }}
                        style={({ pressed }) => [
                          styles.miniToggle,
                          {
                            backgroundColor: extraCount > 0 ? '#A855F720' : theme.surfaceElevated,
                            borderColor: extraCount > 0 ? '#A855F750' : theme.border,
                            transform: [{ scale: pressed ? 0.9 : 1 }],
                          },
                        ]}
                      >
                        {extraCount > 0 ? (
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#A855F7' }}>{extraCount}</Text>
                        ) : (
                          <Ionicons name="add" size={14} color={theme.textTertiary} />
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Meal Summary Bar */}
            <View style={[styles.mealSummaryBar, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <View style={styles.mealSummaryItem}>
                <Text style={styles.mealSummaryEmoji}>🌅</Text>
                <Text style={[styles.mealSummaryCount, { color: theme.text }]}>{todayMealCount.breakfast}</Text>
              </View>
              <View style={[styles.mealSummaryDot, { backgroundColor: theme.border }]} />
              <View style={styles.mealSummaryItem}>
                <Text style={styles.mealSummaryEmoji}>☀️</Text>
                <Text style={[styles.mealSummaryCount, { color: theme.text }]}>{todayMealCount.lunch}</Text>
              </View>
              <View style={[styles.mealSummaryDot, { backgroundColor: theme.border }]} />
              <View style={styles.mealSummaryItem}>
                <Text style={styles.mealSummaryEmoji}>🌙</Text>
                <Text style={[styles.mealSummaryCount, { color: theme.text }]}>{todayMealCount.dinner}</Text>
              </View>
              <View style={[styles.mealSummaryDot, { backgroundColor: theme.border }]} />
              <View style={styles.mealSummaryItem}>
                <Ionicons name="restaurant" size={14} color={theme.primary} />
                <Text style={[styles.mealSummaryCount, { color: theme.primary, fontWeight: '800' }]}>
                  {todayMealCount.total}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── Recent Activity ──────────────── */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
        </View>

        <View style={[styles.activityCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {activities.slice(0, 5).map((activity, index) => (
            <View
              key={activity.id}
              style={[
                styles.activityItem,
                index < 4 && { borderBottomColor: theme.borderLight, borderBottomWidth: 1 },
              ]}
            >
              <View style={[styles.activityIcon, {
                backgroundColor:
                  activity.type === 'bazar_added' ? theme.successLight :
                  activity.type === 'payment_made' ? theme.infoLight :
                  activity.type === 'member_joined' ? theme.primaryLight + '30' :
                  activity.type === 'meal_updated' ? theme.secondary + '15' :
                  theme.warningLight,
              }]}>
                <Ionicons
                  name={
                    activity.type === 'bazar_added' ? 'cart' :
                    activity.type === 'payment_made' ? 'cash' :
                    activity.type === 'member_joined' ? 'person-add' :
                    activity.type === 'meal_updated' ? 'restaurant' :
                    'megaphone'
                  }
                  size={16}
                  color={
                    activity.type === 'bazar_added' ? theme.success :
                    activity.type === 'payment_made' ? theme.info :
                    activity.type === 'member_joined' ? theme.primary :
                    activity.type === 'meal_updated' ? theme.secondary :
                    theme.warning
                  }
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.text }]}>{activity.description}</Text>
                <Text style={[styles.activityTime, { color: theme.textTertiary }]}>
                  {new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' · '}
                  {activity.user?.fullName}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>

      {/* Deposit Modal */}
      <DepositModal
        visible={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        theme={theme}
        members={members}
        onSubmit={(userId, amount) => addPayment(amount, userId, '2026-03')}
      />

      {/* Extra Meals Modal */}
      <Modal visible={extraMealModal.visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Extra Meals</Text>
              <TouchableOpacity onPress={() => setExtraMealModal({ visible: false, userId: '', userName: '' })}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.extraMealTarget, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <View style={[styles.extraMealAvatar, { backgroundColor: '#A855F7' }]}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
              <View>
                <Text style={[styles.extraMealName, { color: theme.text }]}>{extraMealModal.userName}</Text>
                <Text style={[styles.extraMealCurrent, { color: theme.textTertiary }]}>
                  Current extra: {getExtraMeals(extraMealModal.userId)} meals
                </Text>
              </View>
            </View>

            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>NUMBER OF MEALS TO ADD</Text>
            <TextInput
              style={[styles.modalInput, styles.extraMealInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. 5"
              placeholderTextColor={theme.textTertiary}
              keyboardType="number-pad"
              value={extraMealCount}
              onChangeText={setExtraMealCount}
              autoFocus
            />

            <View style={styles.extraMealPresets}>
              {[1, 2, 3, 5, 10].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setExtraMealCount(String(n))}
                  style={[
                    styles.presetChip,
                    {
                      backgroundColor: extraMealCount === String(n) ? '#A855F715' : theme.surfaceElevated,
                      borderColor: extraMealCount === String(n) ? '#A855F7' : theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.presetText, { color: extraMealCount === String(n) ? '#A855F7' : theme.textSecondary }]}>
                    +{n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                const count = parseInt(extraMealCount);
                if (!count || count <= 0) {
                  Alert.alert('Error', 'Please enter a valid meal count');
                  return;
                }
                addExtraMeals(extraMealModal.userId, count);
                setExtraMealModal({ visible: false, userId: '', userName: '' });
                setExtraMealCount('');
                Alert.alert('✅ Done', `${count} extra meal${count > 1 ? 's' : ''} added for ${extraMealModal.userName}`);
              }}
              style={[styles.modalSubmitBtn, { backgroundColor: '#A855F7' }]}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.modalSubmitText}>Add Meals</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  headerLeft: {},
  greeting: { fontSize: 14, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '700', marginTop: 2 },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Mess Card
  messCard: { borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.xl, ...Shadow.lg },
  messCardTop: { marginBottom: Spacing.lg },
  messName: { color: '#fff', fontSize: 22, fontWeight: '700' },
  messDate: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  myStatsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  myStatItem: { flex: 1, alignItems: 'center' },
  myStatValue: { color: '#fff', fontSize: 16, fontWeight: '800' },
  myStatLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '500', marginTop: 3 },
  myStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, marginTop: Spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionSubtitle: { fontSize: 12, fontWeight: '500' },

  // Meal Toggles
  mealsGrid: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  mealCard: { flex: 1, alignItems: 'center', padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1.5, gap: Spacing.sm },
  mealIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  mealEmoji: { fontSize: 20 },
  mealLabel: { fontSize: 13, fontWeight: '600' },
  mealStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, gap: 4 },
  mealStatusDot: { width: 6, height: 6, borderRadius: 3 },
  mealStatusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  guestBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  guestBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },

  // Quick Actions
  actionsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  actionCard: { flex: 1, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', ...Shadow.sm },
  actionGradient: { padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm },
  actionIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '700' },
  actionSub: { fontSize: 11 },

  // Member Meals
  mealCountSummary: { flexDirection: 'row', gap: Spacing.sm },
  mealCountBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  mealCountText: { fontSize: 12, fontWeight: '700' },
  memberMealHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: Spacing.sm, borderBottomWidth: 1, marginBottom: 0 },
  memberMealNameCol: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  memberMealToggleCol: { width: 48, alignItems: 'center' },
  memberMealHeaderText: { fontSize: 11, fontWeight: '600' },
  memberMealCard: { borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', ...Shadow.sm },
  memberMealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  memberMealAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  memberMealAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  memberMealName: { fontSize: 13, fontWeight: '600', maxWidth: 90 },
  memberMealSub: { fontSize: 10, marginTop: 1 },
  miniToggle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Meal Summary Bar
  mealSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  mealSummaryItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mealSummaryEmoji: { fontSize: 14 },
  mealSummaryCount: { fontSize: 14, fontWeight: '700' },
  mealSummaryDot: { width: 3, height: 3, borderRadius: 2 },

  // Activity
  activityCard: { borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden' },
  activityItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  activityIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 13, fontWeight: '500' },
  activityTime: { fontSize: 11, marginTop: 2 },

  // Deposit Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, paddingBottom: Spacing['4xl'] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: Spacing.sm },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    marginRight: Spacing.sm,
  },
  memberChipAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  memberChipAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  memberChipName: { fontSize: 13, fontWeight: '600' },
  modalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xl,
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  modalSubmitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Extra Meals Modal
  extraMealTarget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  extraMealAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  extraMealName: { fontSize: 16, fontWeight: '600' },
  extraMealCurrent: { fontSize: 12, marginTop: 2 },
  extraMealInput: { fontSize: 28, textAlign: 'center', fontWeight: '800' },
  extraMealPresets: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  presetText: { fontSize: 14, fontWeight: '700' },
});
