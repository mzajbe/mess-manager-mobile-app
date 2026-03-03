export type UserRole = 'manager' | 'member';
export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type MealStatus = 'on' | 'off';
export type ExpenseCategory = 'bazar' | 'gas' | 'utility' | 'maid' | 'miscellaneous';
export type PaymentStatus = 'paid' | 'partial' | 'due';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  roomNumber?: string;
  createdAt: string;
}

export interface Mess {
  id: string;
  name: string;
  address?: string;
  inviteCode: string;
  createdBy: string;
  mealSchedule: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  cutoffTime: string; // HH:mm format
  createdAt: string;
}

export interface MessMember {
  id: string;
  messId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
  user?: User;
}

export interface Meal {
  id: string;
  userId: string;
  messId: string;
  date: string; // YYYY-MM-DD
  breakfast: MealStatus;
  lunch: MealStatus;
  dinner: MealStatus;
  guestBreakfast: number;
  guestLunch: number;
  guestDinner: number;
}

export interface Expense {
  id: string;
  messId: string;
  addedBy: string;
  category: ExpenseCategory;
  totalAmount: number;
  description?: string;
  receiptUrl?: string;
  date: string;
  createdAt: string;
  items?: ExpenseItem[];
  addedByUser?: User;
}

export interface ExpenseItem {
  id: string;
  expenseId: string;
  name: string;
  quantity?: number;
  unit?: string;
  price: number;
}

export interface Payment {
  id: string;
  messId: string;
  userId: string;
  amount: number;
  month: string; // YYYY-MM
  note?: string;
  verifiedBy?: string;
  createdAt: string;
  user?: User;
}

export interface MonthlyBill {
  id: string;
  messId: string;
  userId: string;
  month: string; // YYYY-MM
  totalMeals: number;
  mealRate: number;
  mealCost: number;
  sharedCost: number;
  personalExtra: number;
  totalBill: number;
  deposited: number;
  balance: number; // positive = refund, negative = due
  user?: User;
}

export interface Activity {
  id: string;
  messId: string;
  userId: string;
  type: 'bazar_added' | 'member_joined' | 'meal_updated' | 'payment_made' | 'bill_published' | 'announcement';
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: User;
}

export interface MealCount {
  breakfast: number;
  lunch: number;
  dinner: number;
  total: number;
}

export interface MonthlyStats {
  totalBazarCost: number;
  totalMeals: number;
  mealRate: number;
  totalSharedCost: number;
  myMeals: number;
  myEstimatedBill: number;
  myDeposited: number;
}
