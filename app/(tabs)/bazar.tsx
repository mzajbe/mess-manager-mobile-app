import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../../src/contexts/DataContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { BorderRadius, Shadow, Spacing } from '../../src/theme';
import { Expense, ExpenseCategory } from '../../src/types';

const CATEGORY_CONFIG: Record<ExpenseCategory, { icon: string; color: string; label: string }> = {
  bazar: { icon: 'cart', color: '#22C55E', label: 'Bazar' },
  gas: { icon: 'flame', color: '#F59E0B', label: 'Gas' },
  utility: { icon: 'flash', color: '#3B82F6', label: 'Utility' },
  maid: { icon: 'person', color: '#A855F7', label: 'Maid' },
  miscellaneous: { icon: 'ellipsis-horizontal', color: '#78716C', label: 'Misc' },
};

function ExpenseCard({ expense, theme }: { expense: Expense; theme: any }) {
  const config = CATEGORY_CONFIG[expense.category];
  const router = useRouter();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/expense-detail', params: { id: expense.id } })}
      style={[styles.expenseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={[styles.expenseCategoryIcon, { backgroundColor: config.color + '15' }]}>
        <Ionicons name={config.icon as any} size={20} color={config.color} />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={[styles.expenseDesc, { color: theme.text }]} numberOfLines={1}>
          {expense.description || config.label}
        </Text>
        <Text style={[styles.expenseMeta, { color: theme.textTertiary }]}>
          {expense.addedByUser?.fullName} · {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        {expense.items && expense.items.length > 0 && (
          <Text style={[styles.expenseItems, { color: theme.textSecondary }]}>
            {expense.items.length} items
          </Text>
        )}
      </View>
      <View style={styles.expenseRight}>
        <Text style={[styles.expenseAmount, { color: theme.text }]}>
          ৳{expense.totalAmount.toLocaleString()}
        </Text>
        <View style={[styles.categoryBadge, { backgroundColor: config.color + '15' }]}>
          <Text style={[styles.categoryBadgeText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function BazarScreen() {
  const { theme } = useTheme();
  const { expenses, monthlyStats } = useData();
  const router = useRouter();

  const totalThisMonth = expenses.reduce((sum, e) => sum + e.totalAmount, 0);

  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Bazar & Expenses</Text>
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
            March 2026
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/add-bazar')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Total Card */}
        <View style={[styles.totalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total Expenses</Text>
          <Text style={[styles.totalAmount, { color: theme.text }]}>
            ৳{totalThisMonth.toLocaleString()}
          </Text>
          <View style={styles.categoryBreakdown}>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const amount = categoryTotals[key] || 0;
              if (amount === 0) return null;
              return (
                <View key={key} style={styles.categoryItem}>
                  <View style={[styles.categoryDot, { backgroundColor: config.color }]} />
                  <Text style={[styles.categoryName, { color: theme.textSecondary }]}>{config.label}</Text>
                  <Text style={[styles.categoryAmount, { color: theme.text }]}>৳{amount.toLocaleString()}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Expense List */}
        <Text style={[styles.listTitle, { color: theme.text }]}>All Expenses</Text>
        {expenses.map((expense) => (
          <ExpenseCard key={expense.id} expense={expense} theme={theme} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  pageTitle: { fontSize: 28, fontWeight: '800' },
  pageSubtitle: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.md,
  },
  scrollContent: { paddingHorizontal: Spacing.lg },
  totalCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  totalLabel: { fontSize: 13, fontWeight: '500' },
  totalAmount: { fontSize: 32, fontWeight: '800', marginTop: 4, marginBottom: Spacing.md },
  categoryBreakdown: { gap: Spacing.sm },
  categoryItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryName: { fontSize: 13, fontWeight: '500', flex: 1 },
  categoryAmount: { fontSize: 14, fontWeight: '700' },
  listTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.md },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  expenseCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: { flex: 1 },
  expenseDesc: { fontSize: 14, fontWeight: '600' },
  expenseMeta: { fontSize: 11, marginTop: 2 },
  expenseItems: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  expenseRight: { alignItems: 'flex-end', gap: 4 },
  expenseAmount: { fontSize: 16, fontWeight: '800' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  categoryBadgeText: { fontSize: 10, fontWeight: '600' },
});
