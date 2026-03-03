import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { useData } from '../src/contexts/DataContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { BorderRadius, Shadow, Spacing } from '../src/theme';
import { ExpenseCategory } from '../src/types';

const CATEGORIES: { key: ExpenseCategory; label: string; icon: string; color: string }[] = [
  { key: 'bazar', label: 'Bazar', icon: 'cart', color: '#22C55E' },
  { key: 'gas', label: 'Gas', icon: 'flame', color: '#F59E0B' },
  { key: 'utility', label: 'Utility', icon: 'flash', color: '#3B82F6' },
  { key: 'maid', label: 'Maid', icon: 'person', color: '#A855F7' },
  { key: 'miscellaneous', label: 'Misc', icon: 'ellipsis-horizontal', color: '#78716C' },
];

interface ItemEntry {
  name: string;
  quantity: string;
  unit: string;
  price: string;
}

export default function AddBazarScreen() {
  const { theme } = useTheme();
  const { user, mess } = useAuth();
  const { addExpense } = useData();
  const router = useRouter();

  const [category, setCategory] = useState<ExpenseCategory>('bazar');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ItemEntry[]>([
    { name: '', quantity: '', unit: 'kg', price: '' },
  ]);

  const runningTotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  const addItem = () => {
    setItems([...items, { name: '', quantity: '', unit: 'kg', price: '' }]);
  };

  const updateItem = (index: number, field: keyof ItemEntry, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (runningTotal <= 0) {
      Alert.alert('Error', 'Please add at least one item with a price');
      return;
    }

    const validItems = items.filter((item) => item.name && parseFloat(item.price) > 0);

    addExpense(
      {
        messId: mess?.id || '',
        addedBy: user?.id || '',
        category,
        totalAmount: runningTotal,
        description: description || `${CATEGORIES.find((c) => c.key === category)?.label} expense`,
        date: new Date().toISOString().split('T')[0],
        addedByUser: user || undefined,
      },
      validItems.map((item) => ({
        name: item.name,
        quantity: parseFloat(item.quantity) || undefined,
        unit: item.unit || undefined,
        price: parseFloat(item.price) || 0,
      }))
    );

    Alert.alert('✅ Success!', `Expense of ৳${runningTotal.toLocaleString()} added`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Add Expense</Text>
          <TouchableOpacity onPress={handleSubmit} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Category Selector */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: category === cat.key ? cat.color + '15' : theme.surfaceElevated,
                    borderColor: category === cat.key ? cat.color : theme.border,
                  },
                ]}
              >
                <Ionicons name={cat.icon as any} size={16} color={category === cat.key ? cat.color : theme.textTertiary} />
                <Text style={[styles.categoryChipText, { color: category === cat.key ? cat.color : theme.textSecondary }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Description */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="e.g., Daily bazar - rice, vegetables"
            placeholderTextColor={theme.textTertiary}
            value={description}
            onChangeText={setDescription}
          />

          {/* Items */}
          <View style={styles.itemsHeader}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>ITEMS</Text>
            <TouchableOpacity onPress={addItem} style={[styles.addItemBtn, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="add" size={16} color={theme.primary} />
              <Text style={[styles.addItemText, { color: theme.primary }]}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={index} style={[styles.itemRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.itemInputs}>
                <TextInput
                  style={[styles.itemInput, styles.itemName, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Item name"
                  placeholderTextColor={theme.textTertiary}
                  value={item.name}
                  onChangeText={(v) => updateItem(index, 'name', v)}
                />
                <View style={styles.itemQtyRow}>
                  <TextInput
                    style={[styles.itemInput, styles.itemQty, { borderColor: theme.border, color: theme.text }]}
                    placeholder="Qty"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="decimal-pad"
                    value={item.quantity}
                    onChangeText={(v) => updateItem(index, 'quantity', v)}
                  />
                  <TextInput
                    style={[styles.itemInput, styles.itemUnit, { borderColor: theme.border, color: theme.text }]}
                    placeholder="Unit"
                    placeholderTextColor={theme.textTertiary}
                    value={item.unit}
                    onChangeText={(v) => updateItem(index, 'unit', v)}
                  />
                  <TextInput
                    style={[styles.itemInput, styles.itemPrice, { borderColor: theme.border, color: theme.text }]}
                    placeholder="৳ Price"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="decimal-pad"
                    value={item.price}
                    onChangeText={(v) => updateItem(index, 'price', v)}
                  />
                </View>
              </View>
              {items.length > 1 && (
                <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Running Total Footer */}
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <View>
            <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>Total</Text>
            <Text style={[styles.footerTotal, { color: theme.primary }]}>
              ৳{runningTotal.toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: runningTotal > 0 ? 1 : 0.5 }]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitBtnText}>Save Expense</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  scrollContent: { paddingHorizontal: Spacing.lg },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  categoryScroll: { marginBottom: Spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    marginRight: Spacing.sm,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
  },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  addItemText: { fontSize: 12, fontWeight: '600' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  itemInputs: { flex: 1, gap: Spacing.sm },
  itemInput: { borderWidth: 1, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 8, fontSize: 14 },
  itemName: {},
  itemQtyRow: { flexDirection: 'row', gap: Spacing.sm },
  itemQty: { flex: 1 },
  itemUnit: { flex: 1 },
  itemPrice: { flex: 1.5 },
  removeBtn: { padding: 8 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderTopWidth: 1,
    ...Shadow.md,
  },
  footerLabel: { fontSize: 12, fontWeight: '500' },
  footerTotal: { fontSize: 24, fontWeight: '800' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
