# 🍽️ MessManager — Feature Plan & UI/UX Direction

## Project Overview
A mobile app for managing a shared mess (dining group). Members can track meals, expenses, dues, and communicate — all from their phones. Built with **React Native (Expo SDK 54)** + **Supabase (PostgreSQL)**.

---

## 📋 Core Features

### 1. Authentication & User Management
| Feature | Details |
|---|---|
| **Sign Up / Login** | Email + password via Supabase Auth. Optional: phone OTP login |
| **Roles** | **Manager** (admin) and **Member** (regular). Manager can promote/demote |
| **Profile** | Name, photo, phone, room number, join date |
| **Mess Creation / Joining** | Manager creates a mess → gets invite code. Members join via code |

### 2. Meal Tracking (The Core)
| Feature | Details |
|---|---|
| **Daily Meal Toggle** | Each member turns ON/OFF meals for Breakfast / Lunch / Dinner |
| **Advance Meal Plan** | Set meals for the next 1-7 days ahead of time |
| **Meal Cutoff Time** | Manager sets a deadline (e.g., 10 PM for next day). After cutoff, meals auto-lock |
| **Guest Meals** | Members can add guest meals (counted separately) |
| **Meal Count Dashboard** | Real-time count of today's meals for the cook/manager |

### 3. Expense & Bazar (Grocery) Management
| Feature | Details |
|---|---|
| **Bazar Entry** | Whoever shops logs: items, quantity, price, receipt photo |
| **Shared Expenses** | Gas, maid, utilities, Wi-Fi — split equally |
| **Extra Personal Expense** | E.g., eggs, special items — charged to individual |
| **Expense Categories** | Bazar, Gas, Utility, Maid, Miscellaneous |
| **Receipt Photo Upload** | Attach photos of receipts for transparency |

### 4. Monthly Billing & Cost Calculation
| Feature | Details |
|---|---|
| **Meal Rate Calculation** | `Total Bazar Cost ÷ Total Meals = Per Meal Rate` |
| **Individual Bill** | `(Member's Meals × Meal Rate) + Shared Costs + Personal Extras` |
| **Auto-generated Monthly Summary** | Breakdown per member with detailed itemization |
| **Bill History** | View past months' bills |

### 5. Payments & Dues
| Feature | Details |
|---|---|
| **Monthly Deposit** | Members deposit a fixed amount at month start |
| **Payment Tracking** | Manager marks deposits as received |
| **Balance / Due** | Shows each member: deposited, spent, balance/due |
| **Payment Reminders** | Push notification to remind members with pending dues |

### 6. Notifications
| Feature | Details |
|---|---|
| **Meal Cutoff Reminder** | "Set your meals for tomorrow before 10 PM!" |
| **Bazar Update** | "Rahim just added today's bazar: ৳1,200" |
| **Bill Published** | "March bill is ready. Check your summary!" |
| **Payment Reminder** | "You have ৳500 due. Please deposit." |
| **Announcements** | Manager can send custom announcements |

### 7. Reports & Analytics
| Feature | Details |
|---|---|
| **Monthly Expense Chart** | Bar/line chart showing daily bazar costs |
| **Meal Trend** | How many meals per day over the month |
| **Member Comparison** | Who ate the most, who spent the most on bazar |
| **Cost Per Meal Trend** | Track meal rate across months |

### 8. Mess Settings & Admin
| Feature | Details |
|---|---|
| **Mess Profile** | Mess name, address, number of members |
| **Meal Schedule** | Enable/disable breakfast/lunch/dinner per mess |
| **Cutoff Time Config** | Set meal toggle deadline |
| **Member Management** | Add, remove, change roles |
| **Month Close** | Manager closes the month → triggers final bill calculation |

---

## 🎁 Nice-to-Have Features (Phase 2)

| Feature | Details |
|---|---|
| **Bazar Schedule / Rotation** | Auto-assign who does grocery shopping each day |
| **Menu Planner** | Plan what's cooking each day |
| **Chat / Messaging** | Simple in-app group chat for mess members |
| **Expense Approval** | Members can dispute/flag an expense |
| **Export to PDF** | Export monthly bill as PDF for sharing |
| **Multi-language** | Bangla + English support |
| **Dark Mode** | Full dark mode support |

---

## 🎨 UI/UX Design Direction

### Design Philosophy: **"Clean, Warm & Trustworthy"**
A mess app deals with **money and food** — two sensitive topics. The design must feel **transparent, organized, and welcoming**.

### Color Palette
| Role | Color | Hex |
|---|---|---|
| **Primary** | Deep Teal | `#0D9488` |
| **Primary Light** | Mint | `#5EEAD4` |
| **Secondary** | Warm Amber | `#F59E0B` |
| **Background (Light)** | Warm White | `#FAFAF9` |
| **Background (Dark)** | Charcoal | `#1C1917` |
| **Surface Card** | Soft White | `#FFFFFF` with subtle shadow |
| **Text Primary** | Near Black | `#1C1917` |
| **Text Secondary** | Warm Gray | `#78716C` |
| **Success** | Green | `#22C55E` |
| **Danger** | Rose | `#F43F5E` |

> This teal + amber combo feels **modern, fresh, and premium** — not generic like plain blue.

### Typography
- **Headings**: `Inter` or `Poppins` (bold, 600-700 weight)
- **Body**: `Inter` (regular, 400 weight)
- **Numbers / Money**: `JetBrains Mono` or `Space Mono` (monospace for financial data)

### Key UI Patterns

#### 🏠 Home Screen
- **Greeting card** at top: "Good evening, Zajbe 👋" with today's date
- **Today's Meal Status**: 3 meal cards (Breakfast ✅, Lunch ✅, Dinner ❌) — big tap targets with toggle animation
- **Quick Stats Row**: Total meals today, today's bazar cost, your monthly spend so far
- **Recent Activity Feed**: Last 5 actions (bazar added, member joined, etc.)

#### 📊 Dashboard Screen
- **Monthly summary card** with circular progress (budget spent vs deposited)
- **Animated bar chart** for daily expenses
- **Member leaderboard** — fun visual showing meal counts

#### 🛒 Bazar Entry Screen
- **Clean form** with auto-suggestions for common items
- **Camera button** for receipt photo
- **Running total** at bottom that updates as items are added
- **Success animation** (confetti or checkmark) on submission

#### 💰 Bills Screen
- **Card per member** showing: meals eaten, amount owed, payment status
- **Color-coded badges**: Paid (green), Partial (amber), Due (rose)
- **Expandable breakdown** — tap to see itemized bill

#### ⚙️ Settings
- **Grouped list** with icons (iOS-style settings)
- **Danger zone** at bottom for leaving mess, deleting account

### Micro-Interactions & Polish
| Element | Animation |
|---|---|
| **Meal Toggle** | Smooth spring animation with haptic feedback |
| **Tab Navigation** | Animated icon + label transitions |
| **Pull to Refresh** | Custom animated loader (spinning plate/spoon) |
| **Number Changes** | Count-up animation when stats update |
| **Card Expansion** | Smooth height transition with shared element animation |
| **Skeleton Loading** | Shimmer loading placeholders |

### Navigation Structure (Bottom Tabs)
```
🏠 Home    📊 Dashboard    🛒 Bazar    💰 Bills    ⚙️ More
```

### Glassmorphism & Depth
- **Frosted glass header** on scroll
- **Subtle card shadows** (not flat, not heavy — just enough depth)
- **Gradient accents** on key CTAs (teal → mint gradient buttons)

---

## 🗄️ Database (Supabase + PostgreSQL)

### Key Tables
| Table | Purpose |
|---|---|
| `users` | Auth + profile data |
| `messes` | Mess info + invite code |
| `mess_members` | User ↔ Mess relationship + role |
| `meals` | Daily meal on/off per user |
| `expenses` | Bazar and shared expenses |
| `expense_items` | Individual items within an expense |
| `payments` | Deposits by members |
| `monthly_bills` | Computed monthly summaries |
| `notifications` | In-app notification log |

### Supabase Features to Use
- **Auth**: Email/password + optional phone OTP
- **Realtime**: Live meal count updates, expense feed
- **Storage**: Receipt photo uploads
- **Row Level Security (RLS)**: Members can only see their own mess data
- **Edge Functions**: Monthly bill calculation, push notifications

---

## 🚀 Suggested Development Phases

### Phase 1 — MVP (Core Loop)
1. Auth (sign up, login, create/join mess)
2. Meal tracking (toggle on/off, view count)
3. Bazar entry (add expenses with items)
4. Monthly bill calculation
5. Basic member management

### Phase 2 — Polish & Engagement
6. Payment tracking & dues
7. Push notifications
8. Reports & charts
9. Receipt photo upload
10. Dark mode

### Phase 3 — Delight
11. Bazar rotation schedule
12. Menu planner
13. In-app chat
14. PDF export
15. Bangla language support

---

> [!IMPORTANT]
> This is a discussion document. Please review and let me know:
> 1. **Which features do you want in Phase 1 (MVP)?**
> 2. **Any features you want to add or remove?**
> 3. **Do you like the teal + amber color direction, or prefer something different?**
> 4. **How many members are typically in your mess?** (affects some design decisions)
> 5. **Do you need multi-mess support** (one user in multiple messes) **or single mess only?**
