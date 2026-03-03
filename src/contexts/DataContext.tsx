import React, { createContext, useCallback, useContext, useState } from 'react';
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
    User
} from '../types';

// Demo members
const DEMO_MEMBERS: (MessMember & { user: User })[] = [
  {
    id: 'dm-1',
    messId: 'demo-mess-1',
    userId: 'demo-user-1',
    role: 'manager',
    joinedAt: '2026-01-01',
    user: { id: 'demo-user-1', email: 'zajbe@test.com', fullName: 'Zajbe', phone: '+8801712345678', roomNumber: 'A-101', createdAt: '2026-01-01' },
  },
  {
    id: 'dm-2',
    messId: 'demo-mess-1',
    userId: 'demo-user-2',
    role: 'member',
    joinedAt: '2026-01-05',
    user: { id: 'demo-user-2', email: 'rahim@test.com', fullName: 'Rahim Uddin', phone: '+8801812345678', roomNumber: 'A-102', createdAt: '2026-01-05' },
  },
  {
    id: 'dm-3',
    messId: 'demo-mess-1',
    userId: 'demo-user-3',
    role: 'member',
    joinedAt: '2026-01-10',
    user: { id: 'demo-user-3', email: 'karim@test.com', fullName: 'Karim Ahmed', phone: '+8801912345678', roomNumber: 'B-201', createdAt: '2026-01-10' },
  },
  {
    id: 'dm-4',
    messId: 'demo-mess-1',
    userId: 'demo-user-4',
    role: 'member',
    joinedAt: '2026-01-15',
    user: { id: 'demo-user-4', email: 'fahim@test.com', fullName: 'Fahim Hassan', phone: '+8801612345678', roomNumber: 'B-202', createdAt: '2026-01-15' },
  },
  {
    id: 'dm-5',
    messId: 'demo-mess-1',
    userId: 'demo-user-5',
    role: 'member',
    joinedAt: '2026-02-01',
    user: { id: 'demo-user-5', email: 'tanvir@test.com', fullName: 'Tanvir Islam', phone: '+8801512345678', roomNumber: 'C-301', createdAt: '2026-02-01' },
  },
];

const today = new Date().toISOString().split('T')[0];

const DEMO_MEALS: Meal[] = [
  { id: 'm-1', userId: 'demo-user-1', messId: 'demo-mess-1', date: today, breakfast: 'on', lunch: 'on', dinner: 'on', guestBreakfast: 0, guestLunch: 0, guestDinner: 0 },
  { id: 'm-2', userId: 'demo-user-2', messId: 'demo-mess-1', date: today, breakfast: 'on', lunch: 'on', dinner: 'off', guestBreakfast: 0, guestLunch: 1, guestDinner: 0 },
  { id: 'm-3', userId: 'demo-user-3', messId: 'demo-mess-1', date: today, breakfast: 'off', lunch: 'on', dinner: 'on', guestBreakfast: 0, guestLunch: 0, guestDinner: 0 },
  { id: 'm-4', userId: 'demo-user-4', messId: 'demo-mess-1', date: today, breakfast: 'on', lunch: 'off', dinner: 'on', guestBreakfast: 0, guestLunch: 0, guestDinner: 0 },
  { id: 'm-5', userId: 'demo-user-5', messId: 'demo-mess-1', date: today, breakfast: 'on', lunch: 'on', dinner: 'on', guestBreakfast: 0, guestLunch: 0, guestDinner: 1 },
];

const DEMO_EXPENSES: Expense[] = [
  {
    id: 'e-1', messId: 'demo-mess-1', addedBy: 'demo-user-2', category: 'bazar', totalAmount: 1250,
    description: 'Daily bazar - rice, fish, vegetables', date: today, createdAt: new Date().toISOString(),
    addedByUser: DEMO_MEMBERS[1].user,
    items: [
      { id: 'ei-1', expenseId: 'e-1', name: 'Rice', quantity: 5, unit: 'kg', price: 350 },
      { id: 'ei-2', expenseId: 'e-1', name: 'Rui Fish', quantity: 1.5, unit: 'kg', price: 450 },
      { id: 'ei-3', expenseId: 'e-1', name: 'Vegetables', quantity: 1, unit: 'lot', price: 250 },
      { id: 'ei-4', expenseId: 'e-1', name: 'Oil & Spices', quantity: 1, unit: 'lot', price: 200 },
    ],
  },
  {
    id: 'e-2', messId: 'demo-mess-1', addedBy: 'demo-user-3', category: 'bazar', totalAmount: 980,
    description: 'Evening bazar - chicken, potatoes', date: '2026-03-02', createdAt: '2026-03-02T16:30:00Z',
    addedByUser: DEMO_MEMBERS[2].user,
    items: [
      { id: 'ei-5', expenseId: 'e-2', name: 'Chicken', quantity: 2, unit: 'kg', price: 600 },
      { id: 'ei-6', expenseId: 'e-2', name: 'Potatoes', quantity: 3, unit: 'kg', price: 180 },
      { id: 'ei-7', expenseId: 'e-2', name: 'Onion & Garlic', quantity: 1, unit: 'kg', price: 200 },
    ],
  },
  {
    id: 'e-3', messId: 'demo-mess-1', addedBy: 'demo-user-1', category: 'gas', totalAmount: 1200,
    description: 'Monthly gas bill', date: '2026-03-01', createdAt: '2026-03-01T10:00:00Z',
    addedByUser: DEMO_MEMBERS[0].user,
  },
  {
    id: 'e-4', messId: 'demo-mess-1', addedBy: 'demo-user-1', category: 'utility', totalAmount: 2500,
    description: 'Electricity + Water bill', date: '2026-03-01', createdAt: '2026-03-01T10:30:00Z',
    addedByUser: DEMO_MEMBERS[0].user,
  },
];

const DEMO_PAYMENTS: Payment[] = [
  { id: 'p-1', messId: 'demo-mess-1', userId: 'demo-user-1', amount: 5000, month: '2026-03', createdAt: '2026-03-01T12:00:00Z', user: DEMO_MEMBERS[0].user },
  { id: 'p-2', messId: 'demo-mess-1', userId: 'demo-user-2', amount: 5000, month: '2026-03', createdAt: '2026-03-01T14:00:00Z', user: DEMO_MEMBERS[1].user },
  { id: 'p-3', messId: 'demo-mess-1', userId: 'demo-user-3', amount: 3000, month: '2026-03', createdAt: '2026-03-02T10:00:00Z', user: DEMO_MEMBERS[2].user },
];

const DEMO_ACTIVITIES: Activity[] = [
  { id: 'a-1', messId: 'demo-mess-1', userId: 'demo-user-2', type: 'bazar_added', title: 'Bazar added', description: 'Rahim added bazar: ৳1,250', createdAt: new Date().toISOString(), user: DEMO_MEMBERS[1].user },
  { id: 'a-2', messId: 'demo-mess-1', userId: 'demo-user-3', type: 'payment_made', title: 'Payment received', description: 'Karim deposited ৳3,000', createdAt: '2026-03-02T10:00:00Z', user: DEMO_MEMBERS[2].user },
  { id: 'a-3', messId: 'demo-mess-1', userId: 'demo-user-3', type: 'bazar_added', title: 'Bazar added', description: 'Karim added bazar: ৳980', createdAt: '2026-03-02T16:30:00Z', user: DEMO_MEMBERS[2].user },
  { id: 'a-4', messId: 'demo-mess-1', userId: 'demo-user-5', type: 'member_joined', title: 'New member', description: 'Tanvir Islam joined the mess', createdAt: '2026-02-01T12:00:00Z', user: DEMO_MEMBERS[4].user },
  { id: 'a-5', messId: 'demo-mess-1', userId: 'demo-user-1', type: 'announcement', title: 'Announcement', description: 'Please deposit this month\'s advance by March 5th', createdAt: '2026-03-01T08:00:00Z', user: DEMO_MEMBERS[0].user },
];

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
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>(DEMO_MEALS);
  const [expenses, setExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [payments, setPayments] = useState<Payment[]>(DEMO_PAYMENTS);
  const [activities, setActivities] = useState<Activity[]>(DEMO_ACTIVITIES);
  const [extraMealsMap, setExtraMealsMap] = useState<Record<string, number>>({});
  const [isLoading] = useState(false);

  const addExtraMeals = useCallback((userId: string, count: number) => {
    setExtraMealsMap((prev) => ({
      ...prev,
      [userId]: (prev[userId] || 0) + count,
    }));
  }, []);

  const getExtraMeals = useCallback((userId: string): number => {
    return extraMealsMap[userId] || 0;
  }, [extraMealsMap]);

  const myTodayMeal = meals.find((m) => m.userId === 'demo-user-1' && m.date === today) || null;

  const todayMeals = meals.filter((m) => m.date === today);

  const todayMealCount: MealCount = {
    breakfast: todayMeals.filter((m) => m.breakfast === 'on').length + todayMeals.reduce((sum, m) => sum + m.guestBreakfast, 0),
    lunch: todayMeals.filter((m) => m.lunch === 'on').length + todayMeals.reduce((sum, m) => sum + m.guestLunch, 0),
    dinner: todayMeals.filter((m) => m.dinner === 'on').length + todayMeals.reduce((sum, m) => sum + m.guestDinner, 0),
    total: 0,
  };
  todayMealCount.total = todayMealCount.breakfast + todayMealCount.lunch + todayMealCount.dinner;

  const toggleMeal = useCallback((mealType: MealType) => {
    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.userId === 'demo-user-1' && meal.date === today) {
          return { ...meal, [mealType]: meal[mealType] === 'on' ? 'off' : 'on' };
        }
        return meal;
      })
    );
  }, []);

  const toggleMemberMeal = useCallback((userId: string, mealType: MealType) => {
    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.userId === userId && meal.date === today) {
          return { ...meal, [mealType]: meal[mealType] === 'on' ? 'off' : 'on' };
        }
        return meal;
      })
    );
  }, []);

  const getMemberMeal = useCallback((userId: string): Meal | null => {
    return meals.find((m) => m.userId === userId && m.date === today) || null;
  }, [meals]);

  const updateGuestMeal = useCallback((mealType: MealType, count: number) => {
    const guestKey = `guest${mealType.charAt(0).toUpperCase() + mealType.slice(1)}` as keyof Meal;
    setMeals((prev) =>
      prev.map((meal) => {
        if (meal.userId === 'demo-user-1' && meal.date === today) {
          return { ...meal, [guestKey]: Math.max(0, count) };
        }
        return meal;
      })
    );
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>, items?: Omit<ExpenseItem, 'id' | 'expenseId'>[]) => {
    const newId = `e-${Date.now()}`;
    const newExpense: Expense = {
      ...expense,
      id: newId,
      createdAt: new Date().toISOString(),
      items: items?.map((item, i) => ({ ...item, id: `ei-${Date.now()}-${i}`, expenseId: newId })),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    setActivities((prev) => [{
      id: `a-${Date.now()}`,
      messId: expense.messId,
      userId: expense.addedBy,
      type: 'bazar_added',
      title: 'Bazar added',
      description: `New ${expense.category}: ৳${expense.totalAmount.toLocaleString()}`,
      createdAt: new Date().toISOString(),
      user: expense.addedByUser,
    }, ...prev]);
  }, []);

  const addPayment = useCallback((amount: number, userId: string, month: string) => {
    const member = DEMO_MEMBERS.find((m) => m.userId === userId);
    const newPayment: Payment = {
      id: `p-${Date.now()}`,
      messId: 'demo-mess-1',
      userId,
      amount,
      month,
      createdAt: new Date().toISOString(),
      user: member?.user,
    };
    setPayments((prev) => [newPayment, ...prev]);
  }, []);

  // Simple monthly stats calculation
  const totalBazarCost = expenses
    .filter((e) => e.category === 'bazar')
    .reduce((sum, e) => sum + e.totalAmount, 0);
  const totalSharedCost = expenses
    .filter((e) => e.category !== 'bazar')
    .reduce((sum, e) => sum + e.totalAmount, 0);
  const totalMeals = todayMealCount.total * 30; // Estimate
  const mealRate = totalMeals > 0 ? totalBazarCost / totalMeals : 0;
  const myMeals = myTodayMeal
    ? (myTodayMeal.breakfast === 'on' ? 1 : 0) +
      (myTodayMeal.lunch === 'on' ? 1 : 0) +
      (myTodayMeal.dinner === 'on' ? 1 : 0)
    : 0;
  const myDeposited = payments
    .filter((p) => p.userId === 'demo-user-1')
    .reduce((sum, p) => sum + p.amount, 0);

  const monthlyStats: MonthlyStats = {
    totalBazarCost,
    totalMeals: totalMeals || 1,
    mealRate: Math.round(mealRate * 100) / 100,
    totalSharedCost,
    myMeals: myMeals * 28, // Estimate for month
    myEstimatedBill: Math.round((myMeals * 28 * mealRate) + (totalSharedCost / DEMO_MEMBERS.length)),
    myDeposited,
  };

  return (
    <DataContext.Provider
      value={{
        members: DEMO_MEMBERS,
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
