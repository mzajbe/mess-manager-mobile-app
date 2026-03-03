import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../../src/contexts/DataContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { BorderRadius, Shadow, Spacing } from '../../src/theme';

const { width: screenWidth } = Dimensions.get('window');

function ProgressRing({
  progress,
  color,
  bgColor,
  size = 80,
}: {
  progress: number;
  color: string;
  bgColor: string;
  size?: number;
}) {
  // Simple visual progress indicator
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <View style={[styles.progressBg, { borderColor: bgColor, width: size, height: size, borderRadius: size / 2 }]} />
      <View style={styles.progressCenter}>
        <Text style={[styles.progressText, { color }]}>{Math.round(clampedProgress * 100)}%</Text>
      </View>
    </View>
  );
}

function SimpleBarChart({
  data,
  barColor,
  labelColor,
}: {
  data: { label: string; value: number }[];
  barColor: string;
  labelColor: string;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={styles.chartContainer}>
      {data.map((item, index) => (
        <View key={index} style={styles.chartBar}>
          <View style={styles.chartBarWrapper}>
            <View
              style={[
                styles.chartBarFill,
                {
                  height: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: barColor,
                  opacity: 0.7 + (index / data.length) * 0.3,
                },
              ]}
            />
          </View>
          <Text style={[styles.chartLabel, { color: labelColor }]}>{item.label}</Text>
          <Text style={[styles.chartValue, { color: labelColor }]}>৳{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const { theme } = useTheme();
  const { monthlyStats, expenses, members, todayMealCount } = useData();

  const budgetUsed = monthlyStats.myDeposited > 0
    ? monthlyStats.myEstimatedBill / monthlyStats.myDeposited
    : 0;

  // Last 7 days bazar data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const dayExpenses = expenses
      .filter((e) => e.date === dateStr && e.category === 'bazar')
      .reduce((sum, e) => sum + e.totalAmount, 0);
    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
      value: dayExpenses,
    };
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Dashboard</Text>
        <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
          March 2026 Overview
        </Text>

        {/* Budget Overview Card */}
        <View style={[styles.budgetCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.budgetHeader}>
            <View>
              <Text style={[styles.budgetTitle, { color: theme.textSecondary }]}>Your Budget</Text>
              <Text style={[styles.budgetAmount, { color: theme.text }]}>
                ৳{monthlyStats.myEstimatedBill.toLocaleString()}
              </Text>
              <Text style={[styles.budgetSubtext, { color: theme.textTertiary }]}>
                of ৳{monthlyStats.myDeposited.toLocaleString()} deposited
              </Text>
            </View>
            <ProgressRing
              progress={budgetUsed}
              color={budgetUsed > 0.9 ? theme.danger : theme.primary}
              bgColor={theme.borderLight}
            />
          </View>
          <View style={[styles.budgetDivider, { backgroundColor: theme.borderLight }]} />
          <View style={styles.budgetFooter}>
            <View style={styles.budgetFooterItem}>
              <Ionicons name="arrow-up-circle" size={16} color={theme.danger} />
              <Text style={[styles.budgetFooterLabel, { color: theme.textSecondary }]}>Spent</Text>
              <Text style={[styles.budgetFooterValue, { color: theme.text }]}>
                ৳{monthlyStats.myEstimatedBill.toLocaleString()}
              </Text>
            </View>
            <View style={styles.budgetFooterItem}>
              <Ionicons name="arrow-down-circle" size={16} color={theme.success} />
              <Text style={[styles.budgetFooterLabel, { color: theme.textSecondary }]}>Balance</Text>
              <Text style={[styles.budgetFooterValue, { color: theme.success }]}>
                ৳{Math.max(0, monthlyStats.myDeposited - monthlyStats.myEstimatedBill).toLocaleString()}
              </Text>
            </View>
            <View style={styles.budgetFooterItem}>
              <Ionicons name="restaurant" size={16} color={theme.info} />
              <Text style={[styles.budgetFooterLabel, { color: theme.textSecondary }]}>Meal Rate</Text>
              <Text style={[styles.budgetFooterValue, { color: theme.text }]}>
                ৳{monthlyStats.mealRate.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Expense Trend */}
        <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Bazar Trend (Last 7 Days)</Text>
          <SimpleBarChart data={last7Days} barColor={theme.primary} labelColor={theme.textSecondary} />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCardLarge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <LinearGradient
              colors={[theme.primary + '15', theme.primary + '05']}
              style={styles.statCardGradient}
            >
              <Ionicons name="people" size={28} color={theme.primary} />
              <Text style={[styles.statCardValue, { color: theme.text }]}>{members.length}</Text>
              <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Members</Text>
            </LinearGradient>
          </View>
          <View style={[styles.statCardLarge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <LinearGradient
              colors={[theme.secondary + '15', theme.secondary + '05']}
              style={styles.statCardGradient}
            >
              <Ionicons name="cart" size={28} color={theme.secondary} />
              <Text style={[styles.statCardValue, { color: theme.text }]}>
                ৳{monthlyStats.totalBazarCost.toLocaleString()}
              </Text>
              <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Total Bazar</Text>
            </LinearGradient>
          </View>
          <View style={[styles.statCardLarge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <LinearGradient
              colors={[theme.success + '15', theme.success + '05']}
              style={styles.statCardGradient}
            >
              <Ionicons name="restaurant" size={28} color={theme.success} />
              <Text style={[styles.statCardValue, { color: theme.text }]}>{todayMealCount.total}</Text>
              <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Today Meals</Text>
            </LinearGradient>
          </View>
          <View style={[styles.statCardLarge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <LinearGradient
              colors={[theme.info + '15', theme.info + '05']}
              style={styles.statCardGradient}
            >
              <Ionicons name="cash" size={28} color={theme.info} />
              <Text style={[styles.statCardValue, { color: theme.text }]}>
                ৳{monthlyStats.totalSharedCost.toLocaleString()}
              </Text>
              <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>Shared Cost</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Member Meal Leaderboard */}
        <View style={[styles.leaderboardCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>🏆 Member Leaderboard</Text>
          <Text style={[styles.cardSubtitle, { color: theme.textTertiary }]}>Meals eaten this month</Text>
          {members.map((member, index) => {
            const mealCount = 55 + Math.floor(Math.random() * 30); // Demo data
            const maxMeals = 90;
            return (
              <View key={member.id} style={styles.leaderboardItem}>
                <View style={styles.leaderboardRank}>
                  <Text style={[styles.rankText, {
                    color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : theme.textTertiary,
                  }]}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </Text>
                </View>
                <View style={[styles.leaderboardAvatar, { backgroundColor: theme.primary + ((index * 20 + 30).toString(16)) }]}>
                  <Text style={styles.leaderboardAvatarText}>{member.user.fullName.charAt(0)}</Text>
                </View>
                <View style={styles.leaderboardInfo}>
                  <Text style={[styles.leaderboardName, { color: theme.text }]}>{member.user.fullName}</Text>
                  <View style={styles.leaderboardBarBg}>
                    <View style={[styles.leaderboardBarFill, { width: `${(mealCount / maxMeals) * 100}%`, backgroundColor: theme.primary }]} />
                  </View>
                </View>
                <Text style={[styles.leaderboardCount, { color: theme.text }]}>{mealCount}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  pageTitle: { fontSize: 28, fontWeight: '800' },
  pageSubtitle: { fontSize: 14, fontWeight: '500', marginTop: 2, marginBottom: Spacing.xl },
  budgetCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadow.sm },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetTitle: { fontSize: 13, fontWeight: '500' },
  budgetAmount: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  budgetSubtext: { fontSize: 12, marginTop: 2 },
  budgetDivider: { height: 1, marginVertical: Spacing.md },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetFooterItem: { alignItems: 'center', gap: 4 },
  budgetFooterLabel: { fontSize: 11, fontWeight: '500' },
  budgetFooterValue: { fontSize: 14, fontWeight: '700' },
  progressRing: { justifyContent: 'center', alignItems: 'center' },
  progressBg: { position: 'absolute', borderWidth: 6, borderColor: '#eee' },
  progressCenter: { justifyContent: 'center', alignItems: 'center' },
  progressText: { fontSize: 16, fontWeight: '800' },
  chartCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadow.sm },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, marginBottom: Spacing.md },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, marginTop: Spacing.md },
  chartBar: { flex: 1, alignItems: 'center', gap: 4 },
  chartBarWrapper: { height: 80, width: 24, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBarFill: { width: '100%', borderRadius: 6, minHeight: 4 },
  chartLabel: { fontSize: 10, fontWeight: '500' },
  chartValue: { fontSize: 9, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  statCardLarge: { width: (screenWidth - Spacing.lg * 2 - Spacing.md) / 2 - 1, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', ...Shadow.sm },
  statCardGradient: { padding: Spacing.lg, alignItems: 'center', gap: 6 },
  statCardValue: { fontSize: 20, fontWeight: '800' },
  statCardLabel: { fontSize: 12, fontWeight: '500' },
  leaderboardCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, ...Shadow.sm },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm },
  leaderboardRank: { width: 28, alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: '700' },
  leaderboardAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  leaderboardAvatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  leaderboardInfo: { flex: 1, gap: 4 },
  leaderboardName: { fontSize: 13, fontWeight: '600' },
  leaderboardBarBg: { height: 6, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' },
  leaderboardBarFill: { height: '100%', borderRadius: 3 },
  leaderboardCount: { fontSize: 16, fontWeight: '800', width: 40, textAlign: 'right' },
});
