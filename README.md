# Body Engineering

Premium gym management application built with React and Supabase.

## Features

- **Owner authentication** — Secure login via Supabase Auth
- **Owner dashboard** — Real-time stats and renewal alerts
- **Member management** — Add, edit, view, and delete members
- **Membership tracking** — Automatic expiry calculation by plan type
- **Renewal alerts** — Expired and expiring membership notifications
- **Attendance tracking** — Check-in and check-out for active members
- **Premium UI** — Red, black, and white responsive design

## Dashboard Metrics

| Card | Description |
|------|-------------|
| Total Members | All registered members |
| Active Members | Members with valid membership |
| Expiring This Week | Memberships ending within 7 days |
| Renewals Due | Expired or expiring within 3 days |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env` and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Run the SQL schema in the Supabase SQL Editor:

```bash
# File: supabase/schema.sql
```

4. Create an owner account in Supabase Auth (Authentication → Users → Add user)

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with your owner credentials.

## Build for production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/        # Auth context provider
├── lib/            # Supabase client & utilities
├── pages/          # Route pages
├── App.jsx         # Router configuration
└── index.css       # Global styles & theme
supabase/
└── schema.sql      # Database schema & RLS policies
```

## Tech Stack

- React 19 + Vite
- Supabase (Auth + PostgreSQL)
- React Router
- Lucide React icons
