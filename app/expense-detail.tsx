import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../src/contexts/DataContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { BorderRadius, Shadow, Spacing } from '../src/theme';

export default function ExpenseDetailScreen() {
  const { theme } = useTheme();
  const { expenses } = useData();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const expense = expenses.find((e) => e.id === id);

  if (!expense) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>Expense not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColors: Record<string, string> = {
    bazar: '#22C55E',
    gas: '#F59E0B',
    utility: '#3B82F6',
    maid: '#A855F7',
    miscellaneous: '#78716C',
  };

  const color = categoryColors[expense.category] || theme.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Expense Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Amount Card */}
        <View style={[styles.amountCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.categoryBadge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.categoryText, { color }]}>
              {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
            </Text>
          </View>
          <Text style={[styles.amount, { color: theme.text }]}>
            ৳{expense.totalAmount.toLocaleString()}
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {expense.description}
          </Text>
          <View style={[styles.metaRow, { borderTopColor: theme.borderLight }]}>
            <View style={styles.metaItem}>
              <Ionicons name="person" size={14} color={theme.textTertiary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {expense.addedByUser?.fullName}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={14} color={theme.textTertiary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {new Date(expense.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Breakdown */}
        {expense.items && expense.items.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Items ({expense.items.length})</Text>
            <View style={[styles.itemsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {expense.items.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.itemRow,
                    index < expense.items!.length - 1 && { borderBottomColor: theme.borderLight, borderBottomWidth: 1 },
                  ]}
                >
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                    {item.quantity && (
                      <Text style={[styles.itemQty, { color: theme.textTertiary }]}>
                        {item.quantity} {item.unit}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.itemPrice, { color: theme.text }]}>
                    ৳{item.price.toLocaleString()}
                  </Text>
                </View>
              ))}
              <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total</Text>
                <Text style={[styles.totalValue, { color: theme.primary }]}>
                  ৳{expense.totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: Spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16 },
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
  amountCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  categoryBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: BorderRadius.full, marginBottom: Spacing.md },
  categoryText: { fontSize: 13, fontWeight: '600' },
  amount: { fontSize: 40, fontWeight: '800' },
  description: { fontSize: 14, marginTop: Spacing.sm, textAlign: 'center' },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.md },
  itemsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemQty: { fontSize: 12, marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '700' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 14, fontWeight: '600' },
  totalValue: { fontSize: 16, fontWeight: '800' },
});
