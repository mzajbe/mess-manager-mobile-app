import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import {
    Activity,
    Expense,
    ExpenseItem,
    Meal,
    MealCount,
    MealType,
    MessMember,
    MonthlyBill,
    MonthlyStats,
    Payment,
    User,
} from '../types';
import { useAuth } from './AuthContext';

const today = new Date().toISOString().split('T')[0];
const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

interface DataContextType {
  // Members
  members: (MessMember & { user: User })[];
  // Meals
  todayMeals: Meal[];
  myTodayMeal: Meal | null;
  todayMealCount: MealCount;
  toggleMeal: (mealType: MealType) => void;
  toggleMemberMeal: (userId: string, mealType: MealType) => void;
  updateGuestMeal: (mealType: MealType, count: number) => void;
  getMemberMeal: (userId: string) => Meal | null;
  // Extra meals
  addExtraMeals: (userId: string, count: number) => void;
  getExtraMeals: (userId: string) => number;
  extraMealsMap: Record<string, number>;
  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>, items?: Omit<ExpenseItem, 'id' | 'expenseId'>[]) => void;
  // Payments
  payments: Payment[];
  addPayment: (amount: number, userId: string, month: string) => void;
  // Bills
  monthlyBills: MonthlyBill[];
  // Activities
  activities: Activity[];
  // Stats
  monthlyStats: MonthlyStats;
  // Loading
  isLoading: boolean;
  // Refresh
  refreshMembers: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, mess } = useAuth();
  const messId = mess?.id;
  const userId = user?.id;

  const [members, setMembers] = useState<(MessMember & { user: User })[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [extraMealsMap, setExtraMealsMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // ── Fetch Members ──────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    if (!messId) return;
    const { data, error } = await supabase
      .from('mess_members')
      .select('*, user:users(*)')
      .eq('mess_id', messId);

    if (error) {
      console.error('Error fetching members:', error.message);
      return;
    }

    const mapped = (data || []).map((m: any) => ({
      id: m.id,
      messId: m.mess_id,
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      user: {
        id: m.user.id,
        email: m.user.email,
        fullName: m.user.full_name,
        phone: m.user.phone,
        avatarUrl: m.user.avatar_url,
        roomNumber: m.user.room_number,
        createdAt: m.user.created_at,
      },
    }));
    setMembers(mapped);
  }, [messId]);

  // ── Fetch Today's Meals ────────────────────────────────────
  const fetchMeals = useCallback(async () => {
    if (!messId) return;
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('mess_id', messId)
      .eq('date', today);

    if (error) {
      console.error('Error fetching meals:', error.message);
      return;
    }

    const mapped = (data || []).map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      messId: m.mess_id,
      date: m.date,
      breakfast: m.breakfast,
      lunch: m.lunch,
      dinner: m.dinner,
      guestBreakfast: m.guest_breakfast,
      guestLunch: m.guest_lunch,
      guestDinner: m.guest_dinner,
    }));
    setMeals(mapped);
  }, [messId]);

  // ── Fetch Expenses ─────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    if (!messId) return;
    const { data, error } = await supabase
      .from('expenses')
      .select('*, items:expense_items(*), addedByUser:users!added_by(*)')
      .eq('mess_id', messId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error.message);
      return;
    }

    const mapped = (data || []).map((e: any) => ({
      id: e.id,
      messId: e.mess_id,
      addedBy: e.added_by,
      category: e.category,
      totalAmount: Number(e.total_amount),
      description: e.description,
      receiptUrl: e.receipt_url,
      date: e.date,
      createdAt: e.created_at,
      items: (e.items || []).map((item: any) => ({
        id: item.id,
        expenseId: item.expense_id,
        name: item.name,
        quantity: item.quantity ? Number(item.quantity) : undefined,
        unit: item.unit,
        price: Number(item.price),
      })),
      addedByUser: e.addedByUser ? {
        id: e.addedByUser.id,
        email: e.addedByUser.email,
        fullName: e.addedByUser.full_name,
        phone: e.addedByUser.phone,
        avatarUrl: e.addedByUser.avatar_url,
        roomNumber: e.addedByUser.room_number,
        createdAt: e.addedByUser.created_at,
      } : undefined,
    }));
    setExpenses(mapped);
  }, [messId]);

  // ── Fetch Payments ─────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    if (!messId) return;
    const { data, error } = await supabase
      .from('payments')
      .select('*, user:users!user_id(*)')
      .eq('mess_id', messId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error.message);
      return;
    }

    const mapped = (data || []).map((p: any) => ({
      id: p.id,
      messId: p.mess_id,
      userId: p.user_id,
      amount: Number(p.amount),
      month: p.month,
      note: p.note,
      verifiedBy: p.verified_by,
      createdAt: p.created_at,
      user: p.user ? {
        id: p.user.id,
        email: p.user.email,
        fullName: p.user.full_name,
        phone: p.user.phone,
        avatarUrl: p.user.avatar_url,
        roomNumber: p.user.room_number,
        createdAt: p.user.created_at,
      } : undefined,
    }));
    setPayments(mapped);
  }, [messId]);

  // ── Fetch Activities ───────────────────────────────────────
  const fetchActivities = useCallback(async () => {
    if (!messId) return;
    const { data, error } = await supabase
      .from('activities')
      .select('*, user:users!user_id(*)')
      .eq('mess_id', messId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching activities:', error.message);
      return;
    }

    const mapped = (data || []).map((a: any) => ({
      id: a.id,
      messId: a.mess_id,
      userId: a.user_id,
      type: a.type,
      title: a.title,
      description: a.description,
      metadata: a.metadata,
      createdAt: a.created_at,
      user: a.user ? {
        id: a.user.id,
        email: a.user.email,
        fullName: a.user.full_name,
        phone: a.user.phone,
        avatarUrl: a.user.avatar_url,
        roomNumber: a.user.room_number,
        createdAt: a.user.created_at,
      } : undefined,
    }));
    setActivities(mapped);
  }, [messId]);

  // ── Load all data when mess changes ────────────────────────
  useEffect(() => {
    if (!messId) {
      setMembers([]);
      setMeals([]);
      setExpenses([]);
      setPayments([]);
      setActivities([]);
      return;
    }

    setIsLoading(true);
    Promise.all([
      fetchMembers(),
      fetchMeals(),
      fetchExpenses(),
      fetchPayments(),
      fetchActivities(),
    ]).finally(() => setIsLoading(false));
  }, [messId, fetchMembers, fetchMeals, fetchExpenses, fetchPayments, fetchActivities]);

  // ── Derived data ───────────────────────────────────────────
  const todayMeals = meals.filter((m) => m.date === today);
  const myTodayMeal = todayMeals.find((m) => m.userId === userId) || null;

  const todayMealCount: MealCount = {
    breakfast: todayMeals.filter((m) => m.breakfast === 'on').length +
      todayMeals.reduce((sum, m) => sum + m.guestBreakfast, 0),
    lunch: todayMeals.filter((m) => m.lunch === 'on').length +
      todayMeals.reduce((sum, m) => sum + m.guestLunch, 0),
    dinner: todayMeals.filter((m) => m.dinner === 'on').length +
      todayMeals.reduce((sum, m) => sum + m.guestDinner, 0),
    total: 0,
  };
  todayMealCount.total = todayMealCount.breakfast + todayMealCount.lunch + todayMealCount.dinner;

  // ── Toggle own meal ────────────────────────────────────────
  const toggleMeal = useCallback(async (mealType: MealType) => {
    if (!userId || !messId) return;

    const existing = meals.find((m) => m.userId === userId && m.date === today);
    const newValue = existing?.[mealType] === 'on' ? 'off' : 'on';

    // Optimistic update
    if (existing) {
      setMeals((prev) =>
        prev.map((m) =>
          m.userId === userId && m.date === today
            ? { ...m, [mealType]: newValue }
            : m
        )
      );
    } else {
      const newMeal: Meal = {
        id: 'temp-' + Date.now(),
        userId,
        messId,
        date: today,
        breakfast: 'off',
        lunch: 'off',
        dinner: 'off',
        guestBreakfast: 0,
        guestLunch: 0,
        guestDinner: 0,
        [mealType]: newValue,
      };
      setMeals((prev) => [...prev, newMeal]);
    }

    // Upsert to Supabase
    const { error } = await supabase
      .from('meals')
      .upsert(
        {
          user_id: userId,
          mess_id: messId,
          date: today,
          [mealType]: newValue,
        },
        { onConflict: 'user_id,mess_id,date' }
      );

    if (error) {
      console.error('Error toggling meal:', error.message);
      await fetchMeals(); // Revert to server state
    }
  }, [userId, messId, meals, fetchMeals]);

  // ── Toggle member meal (manager) ───────────────────────────
  const toggleMemberMeal = useCallback(async (targetUserId: string, mealType: MealType) => {
    if (!messId) return;

    const existing = meals.find((m) => m.userId === targetUserId && m.date === today);
    const newValue = existing?.[mealType] === 'on' ? 'off' : 'on';

    // Optimistic update
    if (existing) {
      setMeals((prev) =>
        prev.map((m) =>
          m.userId === targetUserId && m.date === today
            ? { ...m, [mealType]: newValue }
            : m
        )
      );
    } else {
      const newMeal: Meal = {
        id: 'temp-' + Date.now(),
        userId: targetUserId,
        messId,
        date: today,
        breakfast: 'off',
        lunch: 'off',
        dinner: 'off',
        guestBreakfast: 0,
        guestLunch: 0,
        guestDinner: 0,
        [mealType]: newValue,
      };
      setMeals((prev) => [...prev, newMeal]);
    }

    const { error } = await supabase
      .from('meals')
      .upsert(
        {
          user_id: targetUserId,
          mess_id: messId,
          date: today,
          [mealType]: newValue,
        },
        { onConflict: 'user_id,mess_id,date' }
      );

    if (error) {
      console.error('Error toggling member meal:', error.message);
      await fetchMeals();
    }
  }, [messId, meals, fetchMeals]);

  // ── Update guest meal count ────────────────────────────────
  const updateGuestMeal = useCallback(async (mealType: MealType, count: number) => {
    if (!userId || !messId) return;

    const guestKey = `guest_${mealType}`;
    const localGuestKey = `guest${mealType.charAt(0).toUpperCase() + mealType.slice(1)}` as keyof Meal;

    // Optimistic update
    setMeals((prev) =>
      prev.map((m) =>
        m.userId === userId && m.date === today
          ? { ...m, [localGuestKey]: Math.max(0, count) }
          : m
      )
    );

    const { error } = await supabase
      .from('meals')
      .upsert(
        {
          user_id: userId,
          mess_id: messId,
          date: today,
          [guestKey]: Math.max(0, count),
        },
        { onConflict: 'user_id,mess_id,date' }
      );

    if (error) {
      console.error('Error updating guest meal:', error.message);
      await fetchMeals();
    }
  }, [userId, messId, fetchMeals]);

  const getMemberMeal = useCallback((targetUserId: string): Meal | null => {
    return meals.find((m) => m.userId === targetUserId && m.date === today) || null;
  }, [meals]);

  // ── Extra meals (local tracking) ───────────────────────────
  const addExtraMeals = useCallback((targetUserId: string, count: number) => {
    setExtraMealsMap((prev) => ({
      ...prev,
      [targetUserId]: (prev[targetUserId] || 0) + count,
    }));
  }, []);

  const getExtraMeals = useCallback((targetUserId: string): number => {
    return extraMealsMap[targetUserId] || 0;
  }, [extraMealsMap]);

  // ── Add expense ────────────────────────────────────────────
  const addExpense = useCallback(async (
    expense: Omit<Expense, 'id' | 'createdAt'>,
    items?: Omit<ExpenseItem, 'id' | 'expenseId'>[]
  ) => {
    if (!messId || !userId) return;

    try {
      const { data: newExpense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          mess_id: expense.messId || messId,
          added_by: expense.addedBy || userId,
          category: expense.category,
          total_amount: expense.totalAmount,
          description: expense.description,
          date: expense.date,
        })
        .select()
        .single();

      if (expenseError || !newExpense) {
        Alert.alert('Error', expenseError?.message || 'Failed to add expense');
        return;
      }

      // Add expense items
      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from('expense_items')
          .insert(
            items.map((item) => ({
              expense_id: newExpense.id,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              price: item.price,
            }))
          );

        if (itemsError) {
          console.error('Error adding expense items:', itemsError.message);
        }
      }

      // Add activity
      await supabase.from('activities').insert({
        mess_id: messId,
        user_id: userId,
        type: 'bazar_added',
        title: 'Expense added',
        description: `New ${expense.category}: ৳${expense.totalAmount.toLocaleString()}`,
      });

      // Refresh
      await fetchExpenses();
      await fetchActivities();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add expense');
    }
  }, [messId, userId, fetchExpenses, fetchActivities]);

  // ── Add payment ────────────────────────────────────────────
  const addPayment = useCallback(async (amount: number, targetUserId: string, month: string) => {
    if (!messId || !userId) return;

    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          mess_id: messId,
          user_id: targetUserId,
          amount,
          month,
        });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Find member name for activity
      const member = members.find((m) => m.userId === targetUserId);
      const memberName = member?.user.fullName || 'Member';

      // Add activity
      await supabase.from('activities').insert({
        mess_id: messId,
        user_id: targetUserId,
        type: 'payment_made',
        title: 'Payment received',
        description: `${memberName} deposited ৳${amount.toLocaleString()}`,
      });

      // Refresh
      await fetchPayments();
      await fetchActivities();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add payment');
    }
  }, [messId, userId, members, fetchPayments, fetchActivities]);

  // ── Monthly Stats ──────────────────────────────────────────
  const totalBazarCost = expenses
    .filter((e) => e.category === 'bazar')
    .reduce((sum, e) => sum + e.totalAmount, 0);
  const totalSharedCost = expenses
    .filter((e) => e.category !== 'bazar')
    .reduce((sum, e) => sum + e.totalAmount, 0);
  const totalMeals = todayMealCount.total;
  const mealRate = totalMeals > 0 ? totalBazarCost / Math.max(totalMeals, 1) : 0;
  const myMeals = myTodayMeal
    ? (myTodayMeal.breakfast === 'on' ? 1 : 0) +
      (myTodayMeal.lunch === 'on' ? 1 : 0) +
      (myTodayMeal.dinner === 'on' ? 1 : 0)
    : 0;
  const myDeposited = payments
    .filter((p) => p.userId === userId)
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyStats: MonthlyStats = {
    totalBazarCost,
    totalMeals: totalMeals || 0,
    mealRate: Math.round(mealRate * 100) / 100,
    totalSharedCost,
    myMeals,
    myEstimatedBill: Math.round(
      (myMeals * mealRate) + (members.length > 0 ? totalSharedCost / members.length : 0)
    ),
    myDeposited,
  };

  return (
    <DataContext.Provider
      value={{
        members,
        todayMeals,
        myTodayMeal,
        todayMealCount,
        toggleMeal,
        toggleMemberMeal,
        updateGuestMeal,
        getMemberMeal,
        addExtraMeals,
        getExtraMeals,
        extraMealsMap,
        expenses,
        addExpense,
        payments,
        addPayment,
        monthlyBills: [],
        activities,
        monthlyStats,
        isLoading,
        refreshMembers: fetchMembers,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
