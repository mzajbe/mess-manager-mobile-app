-- Create custom types (enums)
CREATE TYPE user_role AS ENUM ('manager', 'member');
CREATE TYPE meal_status AS ENUM ('on', 'off');
CREATE TYPE expense_category AS ENUM ('bazar', 'gas', 'utility', 'maid', 'miscellaneous');
CREATE TYPE payment_status AS ENUM ('paid', 'partial', 'due');
CREATE TYPE activity_type AS ENUM ('bazar_added', 'member_joined', 'meal_updated', 'payment_made', 'bill_published', 'announcement');

-- 1. USERS Table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  room_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. MESS Table
CREATE TABLE public.mess (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  meal_schedule JSONB DEFAULT '{"breakfast": true, "lunch": true, "dinner": true}'::jsonb,
  cutoff_time TEXT DEFAULT '22:00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mess ENABLE ROW LEVEL SECURITY;

-- 3. MESS_MEMBERS Table
CREATE TABLE public.mess_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.mess(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role user_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mess_id, user_id)
);

-- Enable RLS
ALTER TABLE public.mess_members ENABLE ROW LEVEL SECURITY;

-- 4. MEALS Table
CREATE TABLE public.meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  mess_id UUID REFERENCES public.mess(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  breakfast meal_status DEFAULT 'on',
  lunch meal_status DEFAULT 'on',
  dinner meal_status DEFAULT 'on',
  guest_breakfast INTEGER DEFAULT 0,
  guest_lunch INTEGER DEFAULT 0,
  guest_dinner INTEGER DEFAULT 0,
  UNIQUE(user_id, mess_id, date)
);

-- Enable RLS
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- 5. EXPENSES Table
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.mess(id) ON DELETE CASCADE NOT NULL,
  added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category expense_category NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  receipt_url TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 6. EXPENSE_ITEMS Table
CREATE TABLE public.expense_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC(10, 2),
  unit TEXT,
  price NUMERIC(10, 2) NOT NULL
);

-- Enable RLS
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

-- 7. PAYMENTS Table
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.mess(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  note TEXT,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 8. MONTHLY_BILLS Table
CREATE TABLE public.monthly_bills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.mess(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL, -- Format: YYYY-MM
  total_meals NUMERIC(10, 2) NOT NULL,
  meal_rate NUMERIC(10, 2) NOT NULL,
  meal_cost NUMERIC(10, 2) NOT NULL,
  shared_cost NUMERIC(10, 2) NOT NULL,
  personal_extra NUMERIC(10, 2) DEFAULT 0,
  total_bill NUMERIC(10, 2) NOT NULL,
  deposited NUMERIC(10, 2) DEFAULT 0,
  balance NUMERIC(10, 2) NOT NULL,
  UNIQUE(mess_id, user_id, month)
);

-- Enable RLS
ALTER TABLE public.monthly_bills ENABLE ROW LEVEL SECURITY;

-- 9. ACTIVITIES Table
CREATE TABLE public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.mess(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 10. MESSAGES Table
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES public.mess(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- SUPER BASIC RLS POLICIES FOR ALL TABLES
-- (In production, you would restrict these further based on mess_members, 
-- but for MVP this ensures authenticated users can use the app)
-- =========================================================================

-- USERS: Anyone can read profiles, users can update their own
CREATE POLICY "Users can read all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- MESS: Users can see all messes, creators/managers can update
CREATE POLICY "Users can read all messes" ON public.mess FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create mess" ON public.mess FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Creators can update mess" ON public.mess FOR UPDATE USING (auth.uid() = created_by);

-- MESS_MEMBERS: Users can read all, anyone can insert (for joining via invite code)
CREATE POLICY "Users can read all members" ON public.mess_members FOR SELECT USING (true);
CREATE POLICY "Users can join mess" ON public.mess_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete own membership or managers can delete" ON public.mess_members FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Managers can update members" ON public.mess_members FOR UPDATE USING (auth.role() = 'authenticated');

-- MEALS
CREATE POLICY "Users can read all meals" ON public.meals FOR SELECT USING (true);
CREATE POLICY "Users can insert meals" ON public.meals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own meals" ON public.meals FOR UPDATE USING (auth.role() = 'authenticated');

-- EXPENSES & ITEMS
CREATE POLICY "Users can read all expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Users can insert expenses" ON public.expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can read all expense items" ON public.expense_items FOR SELECT USING (true);
CREATE POLICY "Users can insert expense items" ON public.expense_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- PAYMENTS & BILLS
CREATE POLICY "Users can read all payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Users can insert payments" ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can read all bills" ON public.monthly_bills FOR SELECT USING (true);
CREATE POLICY "Users can insert bills" ON public.monthly_bills FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ACTIVITIES & MESSAGES
CREATE POLICY "Users can read all activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Users can insert activities" ON public.activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can read all messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- =========================================================================
-- TRIGGERS TO HANDLE AUTOMATIC USER CREATION FROM AUTH
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
