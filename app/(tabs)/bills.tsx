import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Pressable,
    ScrollView,
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
import { PaymentStatus } from '../../src/types';

export default function BillsScreen() {
  const { theme } = useTheme();
  const { members, payments, monthlyStats, expenses, todayMeals } = useData();
  const { isManager } = useAuth();
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const totalBazarCost = expenses.filter((e) => e.category === 'bazar').reduce((sum, e) => sum + e.totalAmount, 0);
  const totalSharedCost = expenses.filter((e) => e.category !== 'bazar').reduce((sum, e) => sum + e.totalAmount, 0);
  const perPersonShared = members.length > 0 ? totalSharedCost / members.length : 0;
  const mealRate = monthlyStats.mealRate;

  // Calculate bill for each member using real meal data
  const memberBills = members.map((member) => {
    const memberMeal = todayMeals.find((m) => m.userId === member.userId);
    const memberMeals = memberMeal
      ? (memberMeal.breakfast === 'on' ? 1 : 0) +
        (memberMeal.lunch === 'on' ? 1 : 0) +
        (memberMeal.dinner === 'on' ? 1 : 0)
      : 0;
    const mealCost = Math.round(memberMeals * mealRate);
    const totalBill = Math.round(mealCost + perPersonShared);
    const deposited = payments
      .filter((p) => p.userId === member.userId)
      .reduce((sum, p) => sum + p.amount, 0);
    const balance = deposited - totalBill;
    const status: PaymentStatus = balance >= 0 ? 'paid' : deposited > 0 ? 'partial' : 'due';

    return {
      ...member,
      memberMeals,
      mealCost,
      sharedCost: Math.round(perPersonShared),
      totalBill,
      deposited,
      balance,
      status,
    };
  });

  const statusColors = {
    paid: theme.success,
    partial: theme.warning,
    due: theme.danger,
  };

  const statusLabels = {
    paid: 'Paid',
    partial: 'Partial',
    due: 'Due',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Monthly Bills</Text>
        <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total Bazar</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                ৳{totalBazarCost.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Meal Rate</Text>
              <Text style={[styles.summaryValue, { color: theme.primary }]}>
                ৳{mealRate.toFixed(1)}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Shared</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>
                ৳{Math.round(perPersonShared).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Member Bills */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Member Bills</Text>
          {isManager && (
            <TouchableOpacity style={[styles.closeMonthBtn, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="lock-closed" size={14} color={theme.primary} />
              <Text style={[styles.closeMonthText, { color: theme.primary }]}>Close Month</Text>
            </TouchableOpacity>
          )}
        </View>

        {memberBills.map((bill) => {
          const isExpanded = expandedMember === bill.id;
          const color = statusColors[bill.status];

          return (
            <Pressable
              key={bill.id}
              onPress={() => setExpandedMember(isExpanded ? null : bill.id)}
              style={[styles.billCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={styles.billHeader}>
                <View style={[styles.billAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={styles.billAvatarText}>{bill.user?.fullName.charAt(0)}</Text>
                </View>
                <View style={styles.billInfo}>
                  <Text style={[styles.billName, { color: theme.text }]}>{bill.user?.fullName}</Text>
                  <Text style={[styles.billMeals, { color: theme.textTertiary }]}>
                    {bill.memberMeals} meals · Room {bill.user?.roomNumber}
                  </Text>
                </View>
                <View style={styles.billRight}>
                  <Text style={[styles.billAmount, { color: theme.text }]}>
                    ৳{bill.totalBill.toLocaleString()}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: color }]} />
                    <Text style={[styles.statusText, { color }]}>{statusLabels[bill.status]}</Text>
                  </View>
                </View>
              </View>

              {isExpanded && (
                <View style={[styles.billDetails, { borderTopColor: theme.borderLight }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Meal Cost</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {bill.memberMeals} × ৳{mealRate.toFixed(1)} = ৳{bill.mealCost.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Shared Costs</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>৳{bill.sharedCost.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.detailRow, styles.detailTotal]}>
                    <Text style={[styles.detailLabel, { color: theme.text, fontWeight: '700' }]}>Total Bill</Text>
                    <Text style={[styles.detailValue, { color: theme.text, fontWeight: '700' }]}>
                      ৳{bill.totalBill.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Deposited</Text>
                    <Text style={[styles.detailValue, { color: theme.success }]}>৳{bill.deposited.toLocaleString()}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>
                      {bill.balance >= 0 ? 'Refund' : 'Due'}
                    </Text>
                    <Text style={[styles.detailValue, { color: bill.balance >= 0 ? theme.success : theme.danger, fontWeight: '800' }]}>
                      ৳{Math.abs(bill.balance).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.expandIndicator}>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={theme.textTertiary}
                />
              </View>
            </Pressable>
          );
        })}

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
  summaryCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.xl, marginBottom: Spacing.xl, ...Shadow.sm },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontWeight: '500' },
  summaryValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  summaryDivider: { width: 1, height: 36 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  closeMonthBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  closeMonthText: { fontSize: 12, fontWeight: '600' },
  billCard: { borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.sm, overflow: 'hidden', ...Shadow.sm },
  billHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  billAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  billAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  billInfo: { flex: 1 },
  billName: { fontSize: 14, fontWeight: '600' },
  billMeals: { fontSize: 11, marginTop: 2 },
  billRight: { alignItems: 'flex-end', gap: 4 },
  billAmount: { fontSize: 16, fontWeight: '800' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  billDetails: { padding: Spacing.md, borderTopWidth: 1, gap: Spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '600' },
  detailTotal: { paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  expandIndicator: { alignItems: 'center', paddingBottom: 6 },
});
