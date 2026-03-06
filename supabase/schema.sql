-- ============================================================
-- Mess Manager - Supabase Database Schema
-- Run this in your Supabase SQL Editor to create all tables
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  room_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Mess ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mess (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  meal_schedule JSONB DEFAULT '{"breakfast": true, "lunch": true, "dinner": true}'::jsonb,
  cutoff_time TEXT DEFAULT '22:00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mess_invite_code ON mess(invite_code);

-- ── Mess Members ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mess_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES mess(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('manager', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (mess_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mess_members_mess_id ON mess_members(mess_id);
CREATE INDEX IF NOT EXISTS idx_mess_members_user_id ON mess_members(user_id);

-- ── Meals ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mess_id UUID REFERENCES mess(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  breakfast TEXT DEFAULT 'off' CHECK (breakfast IN ('on', 'off')),
  lunch TEXT DEFAULT 'off' CHECK (lunch IN ('on', 'off')),
  dinner TEXT DEFAULT 'off' CHECK (dinner IN ('on', 'off')),
  guest_breakfast INT DEFAULT 0,
  guest_lunch INT DEFAULT 0,
  guest_dinner INT DEFAULT 0,
  UNIQUE (user_id, mess_id, date)
);

CREATE INDEX IF NOT EXISTS idx_meals_mess_date ON meals(mess_id, date);
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);

-- ── Expenses ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES mess(id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id),
  category TEXT NOT NULL CHECK (category IN ('bazar', 'gas', 'utility', 'maid', 'miscellaneous')),
  total_amount NUMERIC NOT NULL,
  description TEXT,
  receipt_url TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_mess_id ON expenses(mess_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(mess_id, date);

-- ── Expense Items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  price NUMERIC NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expense_items_expense_id ON expense_items(expense_id);

-- ── Payments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES mess(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  amount NUMERIC NOT NULL,
  month TEXT NOT NULL,
  note TEXT,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_mess_id ON payments(mess_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- ── Activities ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES mess(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('bazar_added', 'member_joined', 'meal_updated', 'payment_made', 'bill_published', 'announcement')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_mess_id ON activities(mess_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mess ENABLE ROW LEVEL SECURITY;
ALTER TABLE mess_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's mess IDs (bypasses RLS to prevent recursion)
CREATE OR REPLACE FUNCTION public.get_my_mess_ids()
RETURNS SETOF UUID AS $$
  SELECT mess_id FROM mess_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Users Policies ───────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view mess members profiles"
  ON users FOR SELECT
  USING (
    id IN (
      SELECT mm.user_id FROM mess_members mm
      WHERE mm.mess_id IN (SELECT public.get_my_mess_ids())
    )
  );

-- ── Mess Policies ────────────────────────────────────────────
CREATE POLICY "Members can view their mess"
  ON mess FOR SELECT
  USING (
    id IN (SELECT public.get_my_mess_ids())
  );

CREATE POLICY "Anyone can create a mess"
  ON mess FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Manager can update mess"
  ON mess FOR UPDATE
  USING (
    id IN (
      SELECT mess_id FROM mess_members
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- ── Mess Members Policies ────────────────────────────────────
CREATE POLICY "Members can view mess members"
  ON mess_members FOR SELECT
  USING (
    mess_id IN (SELECT public.get_my_mess_ids())
  );

CREATE POLICY "Users can join a mess"
  ON mess_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Manager can remove members"
  ON mess_members FOR DELETE
  USING (
    mess_id IN (SELECT public.get_my_mess_ids())
    AND EXISTS (
      SELECT 1 FROM mess_members
      WHERE mess_id = mess_members.mess_id
        AND user_id = auth.uid()
        AND role = 'manager'
    )
  );

CREATE POLICY "Manager can update member roles"
  ON mess_members FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (
      mess_id IN (SELECT public.get_my_mess_ids())
      AND EXISTS (
        SELECT 1 FROM mess_members
        WHERE mess_id = mess_members.mess_id
          AND user_id = auth.uid()
          AND role = 'manager'
      )
    )
  );

-- ── Meals Policies ───────────────────────────────────────────
CREATE POLICY "Members can view meals in their mess"
  ON meals FOR SELECT
  USING (
    mess_id IN (SELECT mess_id FROM mess_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can manage own meals"
  ON meals FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    mess_id IN (SELECT mess_id FROM mess_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can update own meals"
  ON meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Manager can manage all meals"
  ON meals FOR ALL
  USING (
    mess_id IN (
      SELECT mess_id FROM mess_members
      WHERE user_id = auth.uid() AND role = 'manager'
    )
  );

-- ── Expenses Policies ────────────────────────────────────────
CREATE POLICY "Members can view expenses in their mess"
  ON expenses FOR SELECT
  USING (
    mess_id IN (SELECT mess_id FROM mess_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can add expenses"
  ON expenses FOR INSERT
  WITH CHECK (
    auth.uid() = added_by AND
    mess_id IN (SELECT mess_id FROM mess_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can update own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = added_by);

-- ── Expense Items Policies ───────────────────────────────────
CREATE POLICY "Members can view expense items"
  ON expense_items FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM expenses
      WHERE mess_id IN (SELECT mess_id FROM mess_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Members can add expense items"
  ON expense_items FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM expenses WHERE added_by = auth.uid()
    )
  );

-- ── Payments Policies ────────────────────────────────────────
CREATE POLICY "Members can view payments in their mess"
  ON payments FOR SELECT
  USING (
    mess_id IN (SELECT mess_id FROM mess_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can add payments"
  ON payments FOR INSERT
  WITH CHECK (
    mess_id IN (SELECT mess_id FROM mess_members WHERE user_id = auth.uid())
  );

-- ── Activities Policies ──────────────────────────────────────
CREATE POLICY "Members can view activities in their mess"
  ON activities FOR SELECT
  USING (
    mess_id IN (SELECT mess_id FROM mess_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can add activities"
  ON activities FOR INSERT
  WITH CHECK (
    mess_id IN (SELECT mess_id FROM mess_members WHERE user_id = auth.uid())
  );
